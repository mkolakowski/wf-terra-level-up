# Changelog

Every change to this repo gets a new version and an entry here - site changes and progress updates alike.
Newest first. Each section is `## vX.Y.Z - YYYY-MM-DD` and must match the `VERSION` file.

Versioning (`MAJOR.MINOR.PATCH`):
- **MINOR** - new features or site/code changes (e.g. a new view or tab).
- **PATCH** - fixes, data/progress updates (something mastered, XP updated, new screenshots).
- **MAJOR** - a big redesign or a new goal.

The deploy workflow fails if a push changes anything without bumping `VERSION` and adding a matching entry here.

## v1.3.0 - 2026-10-04

- Added this changelog, a version number (`VERSION`, shown in the site header and a new Changelog tab), and a deploy check that requires every push to bump the version and log the change.

## v1.2.0 - 2026-10-04

- Star chart: added a "By priority" view (open nodes that unlock others first, then quickest missions, locked nodes right after their unlocker).
- Gear tab: cards in the same row are now the same height.

## v1.1.0 - 2026-10-04

- Entered current mastery: 3,069,712 XP (Legendary 5) - 65,288 XP to Legendary 6.
- Overview: added a "Fastest route to Legendary 6" plan with a running XP total.
- Star chart: added Steel Path nodes for Mars, Deimos, Ceres, Jupiter, Europa, Saturn, Uranus, Sedna and Eris (85 nodes total).

## v1.0.0 - 2026-10-04

- Initial tracker: 40 unmastered items, Neptune and Pluto nodes, prime parts and relics, relic planner, resource totals, tips, GitHub Pages deploy.
