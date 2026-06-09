---
name: ideate
description: Run comprehensive codebase ideation across all analysis types (security, UI/UX, performance, code quality, documentation, code improvements) and merge all findings into .claude/forge/ideation/ideation.json. Invoked with /ideation:ideate.
disable-model-invocation: true
---

# Comprehensive Ideation

Spawn the domain agents in parallel, then merge their shards into `.claude/forge/ideation/ideation.json` here in the main conversation. Agents each write only their own shard file — they never touch the merged file, so parallel runs can't clobber each other. Schema, shard names, and the merge rule live in [references/schema.md](references/schema.md).

## Phase 1 — Project index

1. Check for the index: `cat .claude/forge/ideation/project_index.json 2>/dev/null`.
2. Missing → run `mkdir -p .claude/forge/ideation`, then spawn the `ideation:project-analyzer` agent via the Task tool and wait for it to finish.
3. Stale → if its `analyzedAt` is clearly older than the last significant git activity (compare with `git log -1 --format=%cI`), re-run `ideation:project-analyzer` first.
4. Scope gate: read the index's `type` — if the project clearly has no UI (`cli`, `library`, `api`), skip `ui-ux-ideator` below and say so in one sentence; don't ask the user.

## Phase 2 — Spawn agents in parallel

Spawn all applicable agents via the Task tool **in a single message** (one call per agent):

| Agent                                | Shard file                  | ID prefix |
| ------------------------------------ | --------------------------- | --------- |
| `ideation:security-ideator`          | `findings-security.json`    | `sec-`    |
| `ideation:ui-ux-ideator`             | `findings-ui-ux.json`       | `ux-`     |
| `ideation:performance-ideator`       | `findings-performance.json` | `perf-`   |
| `ideation:code-quality-ideator`      | `findings-code-quality.json`| `cq-`     |
| `ideation:documentation-ideator`     | `findings-documentation.json`| `doc-`   |
| `ideation:code-improvements-ideator` | `findings-improvements.json`| `ci-`     |

Subagents see none of this conversation, so each Task prompt must spell out context loading and output. Use exactly this prompt, substituting `<shard>` and `<prefix>` from the table:

> Read `.claude/forge/ideation/project_index.json` for project context; if it is missing, say so and analyze the codebase by direct inspection. Read `.claude/forge/ideation/ideation.json` and skip any finding whose `type` + `title` already exists there; continue ID numbering from the highest existing `<prefix>` number. Then run your full analysis and write your findings ONLY to `.claude/forge/ideation/<shard>`. Never modify `.claude/forge/ideation/ideation.json`.

If an agent fails, report which one and continue with the rest — merge whatever shards exist and note the missing analysis types in the summary.

## Phase 3 — Merge

Load [references/schema.md](references/schema.md) and merge every `findings-*.json` shard present in `.claude/forge/ideation/` into `.claude/forge/ideation/ideation.json` following its merge procedure: initialize the file if missing, keep the existing entry on a `type` + `title` duplicate (preserving its user-edited `status`), continue IDs from the highest existing number per prefix, recompute `summary`, update `lastUpdated`, then delete the merged shards.

## Phase 4 — Summarize

Display totals by type, effort, and impact plus 3-5 high-impact highlights. Prefer:

```bash
jq '.summary' .claude/forge/ideation/ideation.json
```

If jq is unavailable, read `.claude/forge/ideation/ideation.json` and summarize directly. End by noting any skipped (no UI) or failed agents.

## Individual Commands

To run a single analysis type instead: `/ideation:security`, `/ideation:ui-ux`, `/ideation:performance`, `/ideation:code-quality`, `/ideation:docs`, `/ideation:improvements`.
