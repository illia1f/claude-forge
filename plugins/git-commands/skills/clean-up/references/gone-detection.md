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
- A branch with **no bracket** has no upstream at all — it is _not_ gone, just local-only. Do not delete it; it was never tracking a remote.
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

For each gone branch, find a record whose `branch refs/heads/<name>` matches. That worktree must be removed **before** the branch can be deleted (a branch can't be deleted while checked out in a worktree).

The main worktree (the primary repo dir) is never removable — if a gone branch is the main checkout, treat it as current/protected and skip.

## Classifying merge state

Two questions, two commands — and **squash/rebase merges make them disagree**. The trap: don't classify on patch-equivalence alone and then delete with `-d`; the two won't match, and the plan will promise deletions that `-d` refuses.

- **Reachability** — `git branch --merged <base>` lists branches whose **tip is an ancestor** of `<base>`. `git branch -d` uses the same test, so anything listed deletes cleanly with `-d`.
- **Patch-equivalence** — `git cherry <base> <branch>` prefixes each branch commit `-` (equivalent patch already in `<base>`) or `+` (not in `<base>`). A squash/rebase merge writes a **new** commit in `<base>` with the same changes and discards the original — so the tip is no longer an ancestor (fails reachability) even though its content is fully in `<base>` (passes patch-equivalence).

```
git branch --merged main        # reachable-merged branches
git cherry main <branch>        # per-commit: '-' = patch in main, '+' = not in main
```

**Classify each gone branch by running these checks in order and stopping at the first that proves "merged":**

1. **Reachable-merged** — branch is listed by `git branch --merged <base>`.
   Class: merged. Delete with `git branch -d`.

2. **Squash/rebase-merged, per-commit** — `git cherry <base> <branch>` shows **every** line prefixed `-`.
   Class: squash/rebase-merged (content in base, tip orphaned). Delete with `git branch -D`.

3. **Squash-merged, combined-diff probe** — reach this only if step 2 showed any `+` (the multi-commit-squash false negative). Collapse the branch's whole contribution into one synthetic commit and patch-compare _that_ against the base:

   ```
   mb=$(git merge-base <base> <branch>)
   probe=$(git commit-tree "<branch>^{tree}" -p "$mb" -m squash-probe)
   git cherry <base> "$probe"        # single line: '-' => branch's combined diff is in base
   ```

   `git commit-tree` writes only a dangling commit object (no branch, no ref; later garbage-collected) — it changes no branch or working tree.
   `-` → squash/rebase-merged; delete with `git branch -D`. `+` → fall through to step 4.

4. **Unmerged** — nothing above proved it; the branch has changes not provably in `<base>`. Skip and report; offer the explicit `git branch -D <branch>` opt-in.

| Proven by                                | Class                        | Delete with              |
| ---------------------------------------- | ---------------------------- | ------------------------ |
| step 1 (`--merged`)                      | merged (reachable)           | `git branch -d`          |
| step 2 (per-commit `git cherry` all `-`) | squash/rebase-merged         | `git branch -D`          |
| step 3 (combined-diff probe `-`)         | squash-merged (multi-commit) | `git branch -D`          |
| nothing (step 3 `+`)                     | unmerged                     | skip; report `-D` opt-in |

**Why still conservative:** every `-D` is backed by a patch-id match — proof the change is in `<base>` — never by the assumption "it's gone, so probably squashed." Step 3's probe matches only when the base's squash commit equals the branch's net diff against the merge-base; if `<base>` advanced with overlapping edits before the squash, the probe shows `+` and the branch falls **safely** into the unmerged bucket. Bias always toward leaving a safe branch behind (cost: a manual delete) over force-deleting unmerged work (cost: lost commits).

## Edge cases

- **Nothing gone** — report "no gone branches" and stop.
- **Detached HEAD** — `git branch --show-current` is empty; no current branch to protect, but still skip `main`/`master`. Proceed normally otherwise.
- **Gone branch is the current branch** — never delete the checked-out branch. Tell the user to switch away first (`git switch main`) if they want it gone.
- **Dirty worktree** — `git worktree remove` refuses without `--force`. Skip and warn; do not force-discard uncommitted work.
