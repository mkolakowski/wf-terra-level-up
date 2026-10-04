# Changelog

Every change to this repo gets a new version and an entry here - site changes and progress updates alike.
Newest first. Each section is `## vX.Y.Z - YYYY-MM-DD` and must match the `VERSION` file.

Versioning (`MAJOR.MINOR.PATCH`):
- **MINOR** - new features or site/code changes (e.g. a new view or tab).
- **PATCH** - fixes, data/progress updates (something mastered, XP updated, new screenshots).
- **MAJOR** - a big redesign or a new goal.

Every entry starts with an `Author: <name>` line, and every commit message starts with the version (`v1.4.0: ...`).

The deploy workflow fails if a push changes anything without bumping `VERSION`, adding a matching entry with an author here, and leading each commit message with the version.

## v1.5.2 - 2026-10-04

Author: Claude Code (requested by @mkolakowski)

- README: added the live site URL (https://mkolakowski.github.io/wf-terra-level-up/).

## v1.5.1 - 2026-10-04

Author: Claude Code (requested by @mkolakowski)

- Progress: Kelashin (Neptune, Steel Path) mastered.

## v1.5.0 - 2026-10-04

Author: Claude Code (requested by @tbeaty91)

- Every masterable item in Warframe is now in the data (824 items, including amp prisms and primary + secondary kitguns). Items not on the to-master list count as already mastered.
- Gear tab: **To master / Mastered / All items** views, a **Companions** filter, and amps / Archwings / Necramechs under Arch / K-Drive / Amps.
- Gear tab: an **Add any item to your list** picker, plus **Mark mastered**, **Add to my list** and **Undo / Remove** buttons on every card. These save in your browser only - the published list doesn't change. A reset button clears them.
- Overview estimates the XP left after items ticked off in this browser. The Mastered tab shows those items too.
- `tools/build_data.py` now builds every masterable item, and writes `data/items.json` compact.

## v1.4.0 - 2026-10-04

Author: Claude Code (requested by @mkolakowski)

- Commit messages now lead with the version number (e.g. `v1.4.0: ...`).
- Every changelog entry now names its author, shown on the site's Changelog tab; earlier entries were backfilled.
- The deploy check enforces both.

## v1.3.0 - 2026-10-04

Author: Claude Code (requested by @mkolakowski)

- Added this changelog, a version number (`VERSION`, shown in the site header and a new Changelog tab), and a deploy check that requires every push to bump the version and log the change.

## v1.2.0 - 2026-10-04

Author: Claude Code (requested by @mkolakowski)

- Star chart: added a "By priority" view (open nodes that unlock others first, then quickest missions, locked nodes right after their unlocker).
- Gear tab: cards in the same row are now the same height.

## v1.1.0 - 2026-10-04

Author: Claude Code (requested by @mkolakowski)

- Entered current mastery: 3,069,712 XP (Legendary 5) - 65,288 XP to Legendary 6.
- Overview: added a "Fastest route to Legendary 6" plan with a running XP total.
- Star chart: added Steel Path nodes for Mars, Deimos, Ceres, Jupiter, Europa, Saturn, Uranus, Sedna and Eris (85 nodes total).

## v1.0.0 - 2026-10-04

Author: Claude Code (requested by @mkolakowski)

- Initial tracker: 40 unmastered items, Neptune and Pluto nodes, prime parts and relics, relic planner, resource totals, tips, GitHub Pages deploy.
