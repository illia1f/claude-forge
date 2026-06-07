---
name: commit
description: Create a git commit from current changes. Follows project commit rules when found (commitlint/commitizen configs, commit-msg hooks, CLAUDE.md, CONTRIBUTING.md, project docs), Conventional Commits otherwise. Use when the user asks to commit changes or invokes /commit. Handles staging decisions, secret detection, protected branch warnings, and offers to split unrelated changes.
---

# Commit

Create a git commit from the current changes. Work through the five phases in order. Load a reference file only when a phase says to — the happy path needs none of them.

## Phase 1 — Gather

Run all five commands in parallel (read-only):

```
git status --porcelain
git diff --staged
git diff
git log --oneline -10
git branch --show-current
```

## Phase 2 — Convention discovery

First hit wins. Tool configs outrank prose docs — a message that violates the commit-msg hook fails no matter what the docs say.

1. **Tool configs** (machine-enforced) — `commitlint.config.*`, `.commitlintrc*`, commitizen (`.czrc`, `.cz.toml`), `.gitmessage`, `.husky/commit-msg`, gitlint or commit-msg hooks in `.pre-commit-config.yaml`. On hit: read it for the exact allowed types, scopes, and length limits.
2. **Project docs** — commit guidance in CLAUDE.md, CONTRIBUTING.md (root, `docs/`, `.github/`), COMMIT_CONVENTION.md, DEVELOPMENT.md.
3. **Doc search** — only if 1–2 miss and `docs/` or `.github/` exists: one case-insensitive grep for `commit message|commit convention|conventional commits` (filenames only) across those dirs; on a hit, read just the matching section.
4. **Inferred from history** — if `git log --oneline -10` shows a consistent message pattern (e.g. every subject is `type: subject`, or every subject starts with a capitalized imperative verb), adopt it.
5. **Fallback** — load `references/conventional-commits.md` and use Conventional Commits.

## Phase 3 — Safety gates

Run in order. Each gate passes, stops with an explanation, or asks the user. A user choice at one gate (e.g. "commit anyway" at gate 4) never skips the remaining gates.

1. **Nothing to commit** — status empty → report "nothing to commit", stop.
2. **Abnormal state** — `.git/MERGE_HEAD`, `.git/CHERRY_PICK_HEAD`, or `.git/BISECT_LOG` exists, rebase in progress, or detached HEAD → load `references/commit-edge-cases.md` and follow its guidance.
3. **No identity** — `git config user.name` or `git config user.email` empty → load `references/commit-edge-cases.md`, show the fix, stop.
4. **Protected branch** — branch is `main` or `master` → warn, offer: create a new branch (suggest a name derived from the changes) or commit anyway. The user decides; no hard block.
5. **Secrets scan** — check candidate filenames and diff content for secret-like signals: env files (`.env*`), key/certificate files (`*.pem`, `*.key`, `*.p12`, and similar), SSH keys (`id_rsa*`, `id_ed25519*`), credential-named files, and diff lines assigning long literal values to names like `key`, `token`, `secret`, `password`. The full pattern list lives in `references/security.md`. On any hit: load it and follow its protocol — exclude the file, commit the rest, report.

## Phase 4 — Staging decision

- **Something already staged** → the staged set is the commit unit. Never silently add to it.
- **Nothing staged** → ask the user: stage all changes, or pick specific files.
- **Either way**, if the candidate changes span unrelated areas → load `references/grouping-heuristics.md`, build and propose a split plan. The user approves the split, edits it, or collapses to one commit.

## Phase 5 — Message + commit

1. Draft the message from the diff **and the conversation context** — the diff shows what changed; the conversation shows why. Format per the Phase 2 convention.
2. Commit (use a here-string/heredoc for multi-line messages).
3. **Hook modified files** (formatter): re-stage exactly the files that were in the commit, retry once. If files change again → stop, load `references/commit-edge-cases.md`.
4. **Hook failed**: load `references/commit-edge-cases.md`, show the error, fix the root cause. Never use `--no-verify`.
5. Verify: run `git log -1 --stat` and show the user exactly what was committed.
