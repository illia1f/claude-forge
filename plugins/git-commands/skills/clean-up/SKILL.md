---
name: clean-up
description: Remove local git branches marked [gone] (their upstream was deleted on the remote) and any worktrees attached to them. Shows a single deletion plan and asks for one confirmation. Skips the current branch, main/master, and branches with unmerged commits (reported for explicit opt-in). Never force-deletes. Use when the user asks to clean up gone/stale branches or invokes /clean-up.
---

# Clean up gone branches

Remove local branches whose remote-tracking upstream is gone, plus the worktrees attached to them. One plan, one confirmation, no forced deletes. Work through the five phases in order.

## Phase 1 — Gather

`git fetch --prune` reaches the network and can surface more `[gone]` branches, so **ask before running it**:

> "Run `git fetch --prune` to refresh the `[gone]` markers? It reaches the remote and may surface more gone branches. (y/n)"

```
git fetch --prune        # only on yes
```

If the user declines, continue with current data and warn that the `[gone]` list may be stale.

Then gather repo state (all read-only):

```
git branch -vv                   # tracking info, incl. [gone] markers (parsed in Phase 2)
git worktree list --porcelain
git branch --show-current
```

## Phase 2 — Identify

Load `references/gone-detection.md` for the exact `git branch -vv` parse format and worktree matching.

1. **Find `[gone]` branches** — lines from `git branch -vv` whose tracking info reads `[<upstream>: gone]`.
2. **Match worktrees** — cross-reference each gone branch against `git worktree list` for an attached worktree.
3. **Classify each branch:**
   - **Safe** — merged into the base or another branch.
   - **Unmerged** — has commits not reachable from any other ref.
   - **Protected / current** — the current branch, or `main`/`master`. Never delete.

## Phase 3 — Build plan

Assemble one plan with two clearly separated parts:

- **Will delete:** each safe gone branch, and beside it any worktree that will be removed first.
- **Will skip:** unmerged branches (reason: unmerged commits), the current branch, and `main`/`master` — each with its reason.

Never put the current branch or `main`/`master` in the delete list, even if marked gone.

## Phase 4 — Confirm once

Show the full plan and ask for a single confirmation. Do not prompt per branch. If nothing is safe to delete, report that and stop.

## Phase 5 — Execute

After the user confirms:

1. **Worktrees first** — `git worktree remove <path>` for each attached worktree. If a worktree has uncommitted changes, `git worktree remove` refuses — **skip it and warn**, then skip its branch too (the branch is checked out there). Never pass `--force` to discard a dirty worktree.
2. **Delete safe branches** — `git branch -d <name>`. The `-d` form is the safety net: it refuses anything not merged, so a misclassification fails loudly instead of losing work.
3. **Leave unmerged branches** in place. Report them and show the explicit opt-in (`git branch -D <name>`) so the user can force-delete deliberately.
4. **Report** — list what was deleted, what was skipped, and why for each skip.
