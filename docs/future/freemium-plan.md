# Freemium model: notes for later

Status (October 2026): ideas only, nothing built. Decisions are tracked in GitHub issues (see the
README in this folder).

## Recommended shape: learning stays free, pay for adult tools and extras

Kids' learning products do best when practice is never rationed ("3 games a day" frustrates kids
and puts off parents and schools). Charge for what helps adults or adds extras.

| | Free | Family Premium | Classroom (later) |
|---|---|---|---|
| Games | All games, all grades | Same | Same |
| Questions | Core library (e.g. 18 per grade per subject) | Full library (48+ per grade) and new content first | Full library |
| Page Quest | Starter books | Every book, new books monthly | Every book |
| Progress | This device only | Cloud save across devices; parent dashboard of progress by NC standard across all games | Teacher dashboard, class codes, assign standards |
| Writer's Desk | Local saves | Cloud saves and a family "published" shelf | Class anthology shelf |
| Extras | — | Cosmetics (rover colors, hero outfits) | — |
| Price (ballpark, check competitors) | $0 | about $5–10 a month or $40–80 a year | Per class or school license |

Cloud save and the dashboard are the natural paid features because they fix real gaps: today
everything lives in one browser (Safari can delete it after 7 days without a visit) and parents
can't see progress.

## Must-handle issues before charging

1. **Trademarks.** "SpiderBen10" mixes Spider-Man (Marvel/Disney) and Ben 10 (Cartoon Network);
   fine as a kid's gamer tag on a family project, risky on a paid product. "Plants vs Undead" is
   close to Plants vs. Zombies (EA/PopCap), and a crypto game "Plant vs Undead" exists. Rebrand
   before charging; see [brand-and-domains.md](brand-and-domains.md). Nathan stays credited as
   creator.
2. **COPPA (children under 13).** Accounts need verifiable parent consent, minimal data, a privacy
   policy, no ad tracking. Pattern: the parent owns and pays for the account; kids get nicknames,
   no email.
3. **Schools.** FERPA, a district data privacy agreement, accessibility. Phase 3.
4. **Business.** Nathan is a minor: a parent-owned LLC owns the product. Terms of service, privacy
   policy, sales tax (Stripe can handle it).
5. **Hosting.** Azure Static Web Apps Free is meant for hobby projects; move to Standard (roughly
   $9 a month per app, check current pricing) for a paid product.

## Technical changes

Today the arcade is a static site with everything in browser storage. Freemium needs:

- **Accounts:** parent sign-in (email or Microsoft/Google), using Static Web Apps' built-in auth.
- **Backend:** Azure Functions inside the same Static Web App, plus Table Storage for saves,
  progress and entitlements.
- **Payments:** Stripe Checkout; a webhook marks the account premium.
- **Gating:** premium questions and books served by the backend after sign-in. Anything in the
  JavaScript bundle can be downloaded, so hiding content in the UI is only soft gating.

## Phases

1. **Validate:** share with a few families and a teacher; privacy-friendly analytics (counts only);
   a "Premium updates" waitlist; pick the brand.
2. **Accounts, cloud save, parent dashboard:** useful even before charging; the base for the rest.
3. **Payments and premium content.**
4. **Classroom tier:** teacher dashboard, class codes, district paperwork.
