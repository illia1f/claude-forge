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

Run every check below against **`origin/<base>`**, not local `<base>` — the common flow (squash-merge on GitHub, run /clean-up without pulling) leaves the squash commit in `origin/<base>` but not local `<base>`, so checking the local ref misreports merged branches as unmerged. `origin/<base>` was just refreshed by `git fetch --prune`. Fall back to local `<base>` only when no remote ref exists (`git rev-parse --verify refs/remotes/origin/<base>` fails).

Two questions, two commands — and **squash/rebase merges make them disagree**. The trap: don't classify on patch-equivalence alone and then delete with `-d`; the two won't match, and the plan will promise deletions that `-d` refuses.

- **Reachability** — `git branch --merged origin/<base>` lists branches whose **tip is an ancestor** of `origin/<base>`. `git branch -d` runs the same ancestor test, so anything listed deletes cleanly with `-d`.
- **Patch-equivalence** — `git cherry origin/<base> <branch>` prefixes each branch commit `-` (equivalent patch already in the base) or `+` (not in the base). A squash/rebase merge writes a **new** commit in the base with the same changes and discards the original — so the tip is no longer an ancestor (fails reachability) even though its content is fully in the base (passes patch-equivalence).

```
git branch --merged origin/main        # reachable-merged branches
git cherry origin/main <branch>        # per-commit: '-' = patch in base, '+' = not in base
```

**Classify each gone branch by running these checks in order and stopping at the first that proves "merged":**

1. **Reachable-merged** — branch is listed by `git branch --merged origin/<base>`.
   Class: merged. Delete with `git branch -d`.

2. **Squash/rebase-merged, per-commit** — `git cherry origin/<base> <branch>` shows **every** line prefixed `-`.
   Class: squash/rebase-merged (content in base, tip orphaned). Delete with `git branch -D`.

3. **Squash-merged, combined-diff probe** — reach this only if step 2 showed any `+` (the multi-commit-squash false negative). Collapse the branch's whole contribution into one synthetic commit and patch-compare _that_ against the base. Adapt the variable syntax to the active shell:

   ```bash
   # bash
   mb=$(git merge-base origin/<base> <branch>)
   probe=$(git commit-tree "<branch>^{tree}" -p "$mb" -m squash-probe)
   git cherry origin/<base> "$probe"   # single line: '-' => branch's combined diff is in base
   ```

   ```powershell
   # PowerShell
   $mb = git merge-base origin/<base> <branch>
   $probe = git commit-tree "<branch>^{tree}" -p $mb -m squash-probe
   git cherry origin/<base> $probe     # single line: '-' => branch's combined diff is in base
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

**Why still conservative:** every `-D` is backed by a patch-id match — the patch landed in `<base>`'s history — never by the assumption "it's gone, so probably squashed." Step 3's probe matches only when the base's squash commit equals the branch's net diff against the merge-base; if `<base>` advanced with overlapping edits before the squash, the probe shows `+` and the branch falls **safely** into the unmerged bucket. Bias always toward leaving a safe branch behind (cost: a manual delete) over force-deleting unmerged work (cost: lost commits).

## Edge cases

- **Nothing gone** — report "no gone branches" and stop.
- **No remote / fetch fails** — cheap pre-check: `git remote get-url origin`. If there is no remote, or `git fetch --prune` fails (auth, network), continue as if `Skip fetch` was chosen and warn the `[gone]` list may be stale. With no `origin/<base>` ref, classify against local `<base>`.
- **Prunable/missing worktree** — directory deleted manually: `git worktree list --porcelain` shows `prunable`, and `git worktree remove` errors on it. Run `git worktree prune` instead, then delete the branch.
- **Detached HEAD** — `git branch --show-current` is empty; no current branch to protect, but still skip `main`/`master`. Proceed normally otherwise.
- **Gone branch is the current branch** — never delete the checked-out branch. Tell the user to switch away first (`git switch main`) if they want it gone.
- **Dirty worktree** — `git worktree remove` refuses without `--force`. Skip and warn; do not force-discard uncommitted work.
