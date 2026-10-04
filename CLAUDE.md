# Repo rules

- **Every commit must bump `VERSION` and add a matching entry to `CHANGELOG.md`.** Use a new `## vX.Y.Z - YYYY-MM-DD` section at the top of the changelog:
  - MINOR for features / site or code changes, PATCH for fixes and data/progress updates, MAJOR for redesigns or a new goal.
  - The first line under the heading must be `Author: <name>` (for Claude-made changes: `Author: Claude Code (requested by @<github user>)`).
  - **Commit messages must start with the version**, e.g. `v1.4.0: Add relic planner filters`.
  - The deploy workflow (`tools/check_changelog.py`) fails without any of these.
- Progress lives in `data/tracker.json`: mark mastered gear/nodes with `"done": "YYYY-MM-DD"`, update `player.currentXP`, and bump `lastUpdated`.
- After adding new items or nodes, regenerate `data/items.json` with `tools/build_data.py` (see README).
