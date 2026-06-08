---
name: commit
description: Create a git commit from current changes. Follows project commit rules when found (commitlint/commitizen configs, commit-msg hooks, CLAUDE.md, CONTRIBUTING.md, project docs), Conventional Commits otherwise. Drafts terse, why-over-what messages, deferring to the project's commit convention on any conflict. Use when the user asks to commit changes or invokes /commit. Handles staging decisions, secret detection, protected branch warnings, and offers to split unrelated changes.
---

# Commit

Create a git commit from current changes. Work through five phases in order.

## Phase 1 — Gather

Run all five in parallel (read-only):

```
git status --porcelain
git diff --staged
git diff
git log --oneline -10
git branch --show-current
```

## Phase 2 — Convention discovery

First hit wins. Tool configs outrank prose docs — a message that violates the commit-msg hook fails whatever the docs say.

1. **Tool configs** (machine-enforced) — `commitlint.config.*`, `.commitlintrc*`, commitizen (`.czrc`, `.cz.toml`), `.gitmessage`, `.husky/commit-msg`, gitlint or commit-msg hooks in `.pre-commit-config.yaml`. On a hit, read for exact allowed types, scopes, length limits.
2. **Project docs** — commit guidance in CLAUDE.md, CONTRIBUTING.md (root, `docs/`, `.github/`), COMMIT_CONVENTION.md, DEVELOPMENT.md.
3. **Doc search** — only if 1–2 miss and `docs/` or `.github/` exists: one case-insensitive grep for `commit message|commit convention|conventional commits` (filenames only) across those dirs; on a hit, read just the matching section.
4. **Inferred from history** — if `git log --oneline -10` shows a consistent pattern (every subject `type: subject`, or every subject a capitalized imperative verb), adopt it.
5. **Fallback** — load `references/conventional-commits.md`, use Conventional Commits.

## Phase 3 — Safety gates

Run in order. Each gate passes, stops with an explanation, or asks. A user choice at one gate (e.g. "commit anyway" at gate 4) never skips later gates.

1. **Nothing to commit** — if status is empty, report "nothing to commit" and stop.
2. **Abnormal state** — if `.git/MERGE_HEAD`, `.git/CHERRY_PICK_HEAD`, or `.git/BISECT_LOG` exists, a rebase is in progress, or HEAD is detached, load `references/commit-edge-cases.md` and follow it.
3. **No identity** — if `git config user.name` or `git config user.email` is empty, load `references/commit-edge-cases.md`, show the fix, and stop.
4. **Protected branch** — on `main` or `master`, ask via the `AskUserQuestion` tool (not free-text); no hard block, the user decides:
   - **Q:** "On `<branch>` — commit here or move to a new branch first?"
   - **Options:**
     - `New branch` — create a branch (suggest a name from the changes), then commit there (recommended).
     - `Commit anyway` — commit directly on `<branch>`.
5. **Secrets scan** — check candidate filenames + diff content for secret signals: env files (`.env*`), key/cert files (`*.pem`, `*.key`, `*.p12`, and similar), SSH keys (`id_rsa*`, `id_ed25519*`), credential-named files, diff lines assigning long literals to names like `key`, `token`, `secret`, `password`. Full list in `references/security.md`. On any hit, load it and follow its protocol (exclude file, commit rest, report).

## Phase 4 — Staging decision

- **Something staged**: the staged set is the commit unit. Never silently add to it.
- **Nothing staged**: ask via the `AskUserQuestion` tool (not free-text):
  - **Q:** "Nothing staged — what goes into this commit?"
  - **Options:**
    - `Stage all` — stage every change, commit as one (recommended).
    - `Pick files` — choose specific files to stage.
- **Either way**, if candidate changes span unrelated areas, load `references/grouping-heuristics.md` and propose a split plan. User approves, edits, or collapses to one commit.

## Phase 5 — Message + commit

1. Draft the message from the diff **and the conversation context** — the diff shows what changed; the conversation shows why. Format per the Phase 2 convention, then apply the terse style on top.

   **Precedence** — the Phase 2 convention wins on any conflict: allowed types, scopes, length caps, capitalization, required sections, mandatory body. The terse style governs verbosity, not format — it never drops a section the convention requires. Apply it whenever it doesn't contradict the convention.

   **Terse style** — why over what, no fluff. Formatting follows the Phase 2 convention (or `references/conventional-commits.md` on fallback); these add only what it doesn't cover:
   - **Always include a body** for breaking changes, security fixes, data migrations, and reverts — never subject-only; future debuggers need the context.
   - **Never include:** "this commit does X"; `I`/`we`/`now`/`currently` (the diff says what); emoji unless the project requires it; restating the filename when the scope already covers it.

2. Commit (use a here-string/heredoc for multi-line messages).
3. **Hook modified files** (formatter): re-stage exactly the files that were in the commit, retry once. If files change again, stop and load `references/commit-edge-cases.md`.
4. **Hook failed**: load `references/commit-edge-cases.md`, show the error, fix the root cause. Never use `--no-verify`.
5. Verify: run `git log -1 --stat`.
6. **Summary** — close with a brief recap so the user sees the result at a glance:

   ```
   ## Committed
   <subject line>
   <short-sha> on <branch> · N files, +X/-Y
   ```

   One subject line, one stats line. Add a `Skipped:` line only if the secrets scan (gate 5) or a split left files out — name them and why. No commit body echo (`git log` already showed it).
