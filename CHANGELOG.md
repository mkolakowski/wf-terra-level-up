# Changelog

Every change to this repo gets a new version and an entry here - site changes and progress updates alike.
Newest first. Each section is `## vX.Y.Z - YYYY-MM-DD` and must match the `VERSION` file.

Versioning (`MAJOR.MINOR.PATCH`):
- **MINOR** - new features or site/code changes (e.g. a new view or tab).
- **PATCH** - fixes, data/progress updates (something mastered, XP updated, new screenshots).
- **MAJOR** - a big redesign or a new goal.

Every entry starts with an `Author: <name>` line, and every commit message starts with the version (`v1.4.0: ...`).

The deploy workflow fails if a push changes anything without bumping `VERSION`, adding a matching entry with an author here, and leading each commit message with the version.

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
