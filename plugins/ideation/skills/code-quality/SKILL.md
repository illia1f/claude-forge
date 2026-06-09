---
name: code-quality
description: Run a whole-codebase code quality ideation audit (complexity, duplication, error handling, type safety, dead code) via the code-quality-ideator agent and merge findings into .claude/ideation.json. Use when the user invokes /ideation:code-quality or asks for a broad maintainability or code-smell review of the project. Not for ad-hoc questions about specific code.
---

# Code Quality Ideation

Spawn the agent, merge its shard, show the results. Categories and analysis details live in the `ideation:code-quality-ideator` agent; the findings schema and merge rule live in `${CLAUDE_PLUGIN_ROOT}/skills/ideate/references/schema.md`.

## Phase 1 — Project index

1. Check for the index: `cat .claude/ideation/project_index.json 2>/dev/null`.
2. Missing → run `mkdir -p .claude/ideation`, then spawn the `ideation:project-analyzer` agent via the Task tool and wait for it to finish.
3. Stale → if its `analyzedAt` is clearly older than the last significant git activity (compare with `git log -1 --format=%cI`), re-run `ideation:project-analyzer` first.

## Phase 2 — Spawn the agent

Spawn `ideation:code-quality-ideator` via the Task tool. The subagent sees none of this conversation, so the prompt must spell out context loading and output — use exactly:

> Read `.claude/ideation/project_index.json` for project context; if it is missing, say so and analyze the codebase by direct inspection. Read `.claude/ideation.json` and skip any finding whose `type` + `title` already exists there; continue ID numbering from the highest existing `cq-` number. Then run your full code quality analysis and write your findings ONLY to `.claude/ideation/findings-code-quality.json`. Never modify `.claude/ideation.json`.

## Phase 3 — Merge

Load `${CLAUDE_PLUGIN_ROOT}/skills/ideate/references/schema.md` and merge `.claude/ideation/findings-code-quality.json` into `.claude/ideation.json` following its merge procedure. If the agent failed or wrote no shard, report that and stop — leave `.claude/ideation.json` untouched.

## Phase 4 — Display

Prefer:

```bash
jq '[.ideas[] | select(.type=="code_quality")]' .claude/ideation.json
```

If jq is unavailable, read `.claude/ideation.json` and summarize the `code_quality` entries directly. Present a short summary with counts by category and the top refactoring opportunities.
