# Road to Legendary 6

A public GitHub Pages tracker for getting Terra (Hunter Founder) from where they are now to **Legendary Rank 6** in Warframe (3,135,000 mastery XP).

The page shows:

- **Overview** - progress toward L6, how much XP is left in the list, quick wins.
- **Gear** - every unmastered item with its image, mastery XP, MR requirement and a farming tip. Prime items list each part, the relics it drops from and its rarity.
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

If you add a **new** item or node, regenerate `data/items.json` (images, parts, relics, drops) from the community [WFCD warframe-items](https://github.com/WFCD/warframe-items) dataset:

```sh
npm pack @wfcd/items@latest
mkdir -p /tmp/wfcd && tar xzf wfcd-items-*.tgz -C /tmp/wfcd
python3 tools/build_data.py /tmp/wfcd/package
```

Re-running it also refreshes relic tables and vault status after a Prime Access / vault rotation.

## Deploying

`.github/workflows/pages.yml` publishes the repo root to GitHub Pages on every push to `main` (or this working branch). In the repo settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once.

Run locally with `python3 -m http.server` and open http://localhost:8000.

Not affiliated with Digital Extremes. Images via warframestat.us / the Warframe Wiki.
