---
name: clean-up
description: Remove local git branches marked [gone] (their upstream was deleted on the remote) and any worktrees attached to them. Shows a single deletion plan and asks for one confirmation. Skips the current branch, main/master, and genuinely unmerged branches (reported for explicit opt-in). Force-deletes only branches whose content is already in the base (squash/rebase-merged). Use when the user asks to clean up gone/stale branches or invokes /clean-up.
---

# Clean up gone branches

Remove local branches whose upstream is `[gone]`, plus their attached worktrees. One plan, one confirmation. Use `-D` only when content is provably already in base — never to discard real work. Five phases, in order.

## Phase 1 — Gather

Ask before fetching, then act on the answer.

1. **Ask via the `AskUserQuestion` tool — not free-text `y/n`.** A structured gate blocks the turn until the user decides; free text is a soft gate agents skip past.
   - **Q:** "Run `git fetch --prune` to refresh the `[gone]` markers before cleanup?"
   - **Options:**
     - `Fetch & prune` — reaches the remote, may surface more gone branches (recommended).
     - `Skip fetch` — use current local data; `[gone]` list may be stale.

   Why gate: it reaches the network and mutates the list Phase 2 classifies — not a free read.

2. **Act:**
   - `Fetch & prune` → pre-check `git remote get-url origin`; then run `git fetch --prune`. No remote, or fetch fails (auth/network)? Continue as if `Skip fetch` was chosen and warn — see "No remote / fetch fails" in `references/gone-detection.md`.
   - `Skip fetch` → continue, warn the list may be stale.

Then gather state (read-only):

```
git branch -vv                                      # tracking info + [gone] markers (parsed Phase 2)
git worktree list --porcelain
git branch --show-current
git symbolic-ref --short refs/remotes/origin/HEAD   # default branch -> base for merge checks
```

**Resolve `<base>` once** — every merge check is relative to it:

1. `git symbolic-ref --short refs/remotes/origin/HEAD` gives e.g. `origin/main`; strip the remote prefix → `main`.
2. Missing? Run `git remote set-head origin --auto` (a safe, metadata-only write — announce it: "re-pointing origin/HEAD"), retry.
3. Still unresolved? Fall back to `main`/`master` (whichever exists) and **state the assumed base in the plan**.

Don't hardcode `main` — the repo may default to `develop`/`trunk`, and the wrong base mislabels every branch.

Run the Phase 2 merge/cherry/probe checks against **`origin/<base>`** (just refreshed by the fetch), not local `<base>` — a local base that's behind the remote misreports merged branches as unmerged. Fall back to local `<base>` only when no remote ref exists (`git rev-parse --verify refs/remotes/origin/<base>` fails).

## Phase 2 — Identify

Load `references/gone-detection.md` for the exact `git branch -vv` parse format and worktree matching.

1. **Gone branches** — `git branch -vv` lines reading `[<upstream>: gone]`.
2. **Match worktrees** — cross-reference each gone branch against `git worktree list`.
3. **Classify each branch** — first set aside protected/current (zero git calls), then run the ordered checks in gone-detection.md against `origin/<base>`, stopping at the first that proves "merged":
   - **Protected / current** — the current branch, `<base>`, or `main`/`master`. Never delete. Classify these **first**, before the expensive cherry/probe checks.
   - **Merged (reachable)** — listed by `git branch --merged origin/<base>`; tip is an ancestor. Delete with `git branch -d`.
   - **Squash/rebase-merged** — not reachable, but content is provably patch-present in base (per-commit `git cherry` all `-`, or the combined-diff probe in gone-detection.md). The merge orphaned the tip, so `-d` refuses though nothing is lost — the usual reason an upstream goes `[gone]`. Delete with `git branch -D`.
   - **Unmerged** — no check proves content is in base; real work would be lost. Skip and report.

## Phase 3 — Build plan

Assemble one plan, two separated parts:

- **Will delete** — beside each branch, its worktree (if any, removed first) and the delete mode, so the user sees *why* a force is used:
  - merged (reachable): `git branch -d`
  - merged by content (squash/rebase, confirmed in `<base>`): `git branch -D`
- **Will skip** — genuinely unmerged branches (commits not in `<base>`), the current branch, `<base>`/`main`/`master`. Each with its reason.

Never put the current branch or `<base>`/`main`/`master` in the delete list, even if marked gone.

## Phase 4 — Confirm once

Nothing safe to delete? Report and stop — don't ask.

Otherwise show the full Phase 3 plan, then ask **one** confirmation via the `AskUserQuestion` tool (this is the destructive step — gate stronger, not weaker):

- **Q:** "Proceed with the deletions above?" (plan shown in the preceding message)
- **Options:**
  - `Delete` — remove the listed branches and worktrees (recommended).
  - `Cancel` — make no changes.

One confirmation covers the whole plan — **no** per-branch prompts. On `Cancel`, change nothing.

## Phase 5 — Execute

After the user confirms:

1. **Worktrees first** — `git worktree remove <path>` for each. A dirty worktree makes `remove` refuse, so **skip it and warn**, then skip its branch too (checked out there). Never `--force` a dirty worktree.
2. **Merged (reachable)** — `git branch -d <name>`. `-d` is the safety net: it refuses anything not reachable, so a misclassification fails loudly instead of losing work silently.
3. **Squash/rebase-merged** — `git branch -D <name>`. Safe to force *only because Phase 2 proved every commit is patch-present in base*; `-d` refuses solely for the orphaned tip. **Never `-D` a branch that didn't pass that check.**
4. **Unmerged** — leave in place. Report it and show the opt-in (`git branch -D <name>`).
5. **Report** — final summary:

   ```
   ## Cleanup report

   Deleted (N)
   - <branch>  — merged, -d
   - <branch>  — squash/rebase-merged, -D
   Worktrees removed (N)
   - <path>  (branch <branch>)
   Skipped (N)
   - <branch>  — unmerged: K commits not in <base>; opt in with `git branch -D <branch>`
   - <branch>  — current branch
   - <branch>  — protected (main/master)
   - <path>  — dirty worktree, not removed
   ```

   Rules: one line per branch/worktree, each carries its reason. Omit zero-count sections. End with an explicit `git branch -D <branch>` opt-in line for each skipped unmerged branch.
