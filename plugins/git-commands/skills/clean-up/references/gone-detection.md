# Detecting gone branches and their worktrees

Loaded from Phase 2. Covers parsing `git branch -vv`, matching worktrees, and classifying merge state.

## Parsing `git branch -vv`

Each line looks like:

```
  feature/old   1a2b3c4 [origin/feature/old: gone] Add the old thing
* main          9z8y7x6 [origin/main] Latest on main
  spike         5d6e7f8 Local-only spike (no upstream)
+ wt-branch     3c4d5e6 [origin/wt-branch: gone] Worked in a worktree
```

- A leading `*` marks the **current** branch; `+` marks a branch checked out in **another worktree**.
- The bracket holds tracking info. **Gone** branches read `[<upstream>: gone]`. Match the literal `: gone]` suffix.
- A branch with **no bracket** has no upstream at all — it is *not* gone, just local-only. Do not delete it; it was never tracking a remote.
- `[<upstream>: ahead N, behind M]` is a live upstream — not gone.

## Matching worktrees

`git worktree list --porcelain` emits records like:

```
worktree /path/to/main-checkout
HEAD 9z8y7x6...
branch refs/heads/main

worktree /path/to/wt-branch-dir
HEAD 3c4d5e6...
branch refs/heads/wt-branch
```

For each gone branch, look for a record whose `branch refs/heads/<name>` matches. That worktree must be removed **before** the branch can be deleted (a branch checked out in a worktree can't be deleted while it's checked out).

The main worktree (the primary repo dir) is never removable — if a gone branch is somehow the main checkout, treat it as the current/protected case and skip.

## Classifying merge state

Classification drives the *plan/preview* only — the actual `git branch -d` in Phase 5 is the backstop, since it refuses to delete unmerged commits.

To preview whether a branch is merged into the base (e.g. `main`):

```
git branch --merged main        # lists branches fully merged into main
```

A gone branch appearing here is **safe**. A gone branch absent from it is **unmerged** — its commits aren't on `main`. Put it in the skip list with reason "unmerged commits"; the user can opt into `git branch -D <name>`.

Note: "merged" is relative to the branch you check against. A branch may be unmerged into `main` but its work already landed via squash-merge on the remote (which is *why* the upstream is gone). Don't auto-force on that assumption — report it and let the user decide.

## Edge cases

- **Nothing gone** → report "no gone branches" and stop.
- **Detached HEAD** → `git branch --show-current` is empty; no current branch to protect, but still skip `main`/`master`. Proceed normally otherwise.
- **Gone branch is the current branch** → never delete the checked-out branch. Tell the user to switch away first (`git switch main`) if they want it gone.
- **Dirty worktree** → `git worktree remove` refuses without `--force`. Skip and warn; do not force-discard uncommitted work.
