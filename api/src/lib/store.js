// Azure Table Storage for the daily totals. Needs the app setting ANALYTICS_STORAGE (a storage
// account connection string). Without it the API quietly does nothing, so deploying is safe
// before the storage account exists.
"use strict";

const { TableClient } = require("@azure/data-tables");

const TABLE = "arcadestats";
let client = null;
let ready = null;

function table() {
  const conn = process.env.ANALYTICS_STORAGE;
  if (!conn) return null;
  if (!client) {
    // Plain http is only allowed for the local storage emulator (Azurite) used in testing.
    const local = /TableEndpoint=http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(conn);
    client = TableClient.fromConnectionString(conn, TABLE, local ? { allowInsecureConnection: true } : {});
    ready = client.createTable().catch((e) => { if (e.statusCode !== 409) throw e; });
  }
  return client;
}

/** Adds `amount` to `field` on row (partition, rowKey), with optimistic concurrency and retries. */
async function increment(partitionKey, rowKey, field, amount) {
  const t = table();
  if (!t) return false;
  await ready;
  for (let attempt = 0; attempt < 25; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 5 + Math.random() * 20 * Math.min(attempt, 8)));
    try {
      const row = await t.getEntity(partitionKey, rowKey);
      const next = { partitionKey, rowKey, [field]: Number(row[field] || 0) + amount };
      await t.updateEntity(next, "Merge", { etag: row.etag });
      return true;
    } catch (e) {
      if (e.statusCode === 404) {
        try {
          await t.createEntity({ partitionKey, rowKey, [field]: amount });
          return true;
        } catch (e2) {
          if (e2.statusCode !== 409) throw e2; // someone else created it first: retry as an update
        }
      } else if (e.statusCode !== 412) {
        throw e; // 412 = changed under us: retry
      }
    }
  }
  return false;
}

/** All rows from `fromDay` (inclusive, "YYYY-MM-DD") on. */
async function rowsSince(fromDay) {
  const t = table();
  if (!t) return null;
  await ready;
  const out = [];
  const safe = fromDay.replace(/[^0-9-]/g, "");
  for await (const r of t.listEntities({ queryOptions: { filter: `PartitionKey ge '${safe}'` } })) out.push(r);
  return out;
}

module.exports = { increment, rowsSince };
