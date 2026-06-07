---
name: commit
description: Create a git commit from current changes. Follows project commit rules when found (CLAUDE.md, commitlint config, .gitmessage, CONTRIBUTING.md), Conventional Commits otherwise. Use when the user asks to commit changes or invokes /commit. Handles staging decisions, secret detection, protected branch warnings, and offers to split unrelated changes.
---

# Commit

Create a git commit from the current changes. Work through the five phases in order. Load a reference file only when its trigger fires — the happy path needs none of them.

## Reference load triggers

| Reference | Load when |
|---|---|
| `references/security.md` | Any candidate file or diff line matches the suspicion patterns in Phase 3, gate 5 |
| `references/conventional-commits.md` | Phase 2 finds no project convention |
| `references/commit-edge-cases.md` | Git state abnormal (Phase 3, gates 2–3) or a hook fails or modifies files in Phase 5 |
| `references/grouping-heuristics.md` | Phase 4 detects changes in unrelated areas |

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

First hit wins:

1. **Project rules** — commit guidance in CLAUDE.md, `commitlint.config.*`, `.gitmessage`, CONTRIBUTING.md.
2. **Inferred from history** — if `git log --oneline -10` shows a consistent message pattern (e.g. every subject is `type: subject`, or every subject starts with a capitalized imperative verb), adopt it.
3. **Fallback** — load `references/conventional-commits.md` and use Conventional Commits.

## Phase 3 — Safety gates

Run in order. Each gate passes, stops with an explanation, or asks the user. A user choice at one gate (e.g. "commit anyway" at gate 4) never skips the remaining gates.

1. **Nothing to commit** — status empty → report "nothing to commit", stop.
2. **Abnormal state** — load `references/commit-edge-cases.md` and handle per its guidance: `.git/MERGE_HEAD`, `.git/CHERRY_PICK_HEAD`, or `.git/BISECT_LOG` exists, or rebase in progress → explain the state, stop; detached HEAD → warn, offer to create a branch, proceed only if the user insists.
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
