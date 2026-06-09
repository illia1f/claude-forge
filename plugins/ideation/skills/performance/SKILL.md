---
name: performance
description: Run a whole-codebase performance ideation audit (bundle size, runtime, data fetching, caching, assets) via the performance-ideator agent and merge findings into .claude/forge/ideation/ideation.json. Use when the user invokes /ideation:performance or asks for a broad performance review or optimization ideas for the project. Not for ad-hoc questions about specific code.
---

# Performance Ideation

Spawn the agent, merge its shard, show the results. Categories and analysis details live in the `ideation:performance-ideator` agent; the findings schema and merge rule live in `${CLAUDE_PLUGIN_ROOT}/skills/ideate/references/schema.md`.

## Phase 1 — Project index

1. Check for the index: `cat .claude/forge/ideation/project_index.json 2>/dev/null`.
2. Missing → run `mkdir -p .claude/forge/ideation`, then spawn the `ideation:project-analyzer` agent via the Task tool and wait for it to finish.
3. Stale → if its `analyzedAt` is clearly older than the last significant git activity (compare with `git log -1 --format=%cI`), re-run `ideation:project-analyzer` first.

## Phase 2 — Spawn the agent

Spawn `ideation:performance-ideator` via the Task tool. The subagent sees none of this conversation, so the prompt must spell out context loading and output — use exactly:

> Read `.claude/forge/ideation/project_index.json` for project context; if it is missing, say so and analyze the codebase by direct inspection. Read `.claude/forge/ideation/ideation.json` and skip any finding whose `type` + `title` already exists there; continue ID numbering from the highest existing `perf-` number. Then run your full performance analysis and write your findings ONLY to `.claude/forge/ideation/findings-performance.json`. Never modify `.claude/forge/ideation/ideation.json`.

## Phase 3 — Merge

Load `${CLAUDE_PLUGIN_ROOT}/skills/ideate/references/schema.md` and merge `.claude/forge/ideation/findings-performance.json` into `.claude/forge/ideation/ideation.json` following its merge procedure. If the agent failed or wrote no shard, report that and stop — leave `.claude/forge/ideation/ideation.json` untouched.

## Phase 4 — Display

Prefer:

```bash
jq '[.ideas[] | select(.type=="performance")]' .claude/forge/ideation/ideation.json
```

If jq is unavailable, read `.claude/forge/ideation/ideation.json` and summarize the `performance` entries directly. Present a short summary with counts by category and the expected improvements.
