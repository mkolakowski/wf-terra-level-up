# Road to Legendary 6

**Live site: https://mkolakowski.github.io/wf-terra-level-up/**

A public GitHub Pages tracker for getting Terra (Hunter Founder) from where they are now to **Legendary Rank 6** in Warframe (3,135,000 mastery XP).

The page shows:

- **Overview** - progress toward L6, how much XP is left in the list, quick wins.
- **Gear** - every masterable item in the game, split into To master / Mastered / All. Unmastered items show their image, mastery XP, MR requirement and a farming tip; prime items list each part, the relics it drops from and its rarity. Anything can be added to the list, ticked off or removed right on the page - those changes save in that browser only.
- **Star Chart** - incomplete nodes with mission type, faction and level.
- **Prime Parts** - every prime part still needed, relics + rarity, ducat value, warframe.market link, and total resources/credits to build everything.
- **Relic Planner** - the same parts grouped by relic, so you can see which relics cover several parts.
- **Mastered** - a log of what's been finished.

## Updating

All progress lives in [`data/tracker.json`](data/tracker.json):

- Mark an item mastered: add `"done": "YYYY-MM-DD"` to its entry. It moves to the Mastered tab.
- Update a rank: change `"rank"`; set `"owned": true` once it's built (hides the parts list).
- Mark a node done: add `"done": "YYYY-MM-DD"` to the node.
- Set current mastery: `player.currentXP` (and optionally `player.currentRankLabel`, e.g. `"Legendary 3"`).
- `player.chartMode` labels the star chart (`"Steel Path"` adds +100 to enemy levels).
- `"effort"` (0-4) on an item overrides where it sits in the "Fastest route" plan.

`data/items.json` holds every masterable item in the game (around 820, including amp prisms and both primary and secondary kitgun chambers). Items in `tracker.json` are the to-master list; every other item counts as already mastered.

When new gear comes out, or you add a node, regenerate `data/items.json` (images, parts, relics, drops) from the community [WFCD warframe-items](https://github.com/WFCD/warframe-items) dataset:

```sh
npm pack @wfcd/items@latest
mkdir -p /tmp/wfcd && tar xzf wfcd-items-*.tgz -C /tmp/wfcd
python3 tools/build_data.py /tmp/wfcd/package
```

Re-running it also refreshes relic tables and vault status after a Prime Access / vault rotation.

## Versioning & changelog

Every push must bump [`VERSION`](VERSION) (`MAJOR.MINOR.PATCH`) and add a matching `## vX.Y.Z - YYYY-MM-DD` entry at the top of [`CHANGELOG.md`](CHANGELOG.md):

- **MINOR** - features / site or code changes
- **PATCH** - fixes and progress/data updates
- **MAJOR** - redesigns or a new goal

Each entry starts with an `Author: <name>` line, and every commit message starts with the version (e.g. `v1.4.0: Add relic planner filters`).

The deploy workflow runs `tools/check_changelog.py` first and won't publish without it. The version shows in the site header and the Changelog tab renders `CHANGELOG.md`.

## Deploying

`.github/workflows/pages.yml` publishes the repo root to GitHub Pages at https://mkolakowski.github.io/wf-terra-level-up/ on every push to `main` (or this working branch). In the repo settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once.

Run locally with `python3 -m http.server` and open http://localhost:8000.

Not affiliated with Digital Extremes. Images via warframestat.us / the Warframe Wiki.
