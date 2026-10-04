import type { Case } from "@/game/types";
import { PAPER } from "./c1-paper";
import { GOLD } from "./c2-gold";
import { ZERO } from "./c3-zero";
import { SILK } from "./c4-silk";
import { MONSOON } from "./c5-monsoon";
import { EXCHANGE } from "./c6-exchange";
import { STEAM } from "./c7-steam";
import { RIGHTS } from "./c8-rights";

/** The eight v1 cases, in order. */
export const CASES: Case[] = [PAPER, GOLD, ZERO, SILK, MONSOON, EXCHANGE, STEAM, RIGHTS];
