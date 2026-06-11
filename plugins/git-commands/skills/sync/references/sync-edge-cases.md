# Sync edge cases

Load this file only when SKILL.md points here. Each section: how to detect, what to tell the user, what to do.

## Detached HEAD

**Detect:** `git branch --show-current` prints nothing.

**Explain:** there is no branch to sync — HEAD points at a commit, not a branch. Rebasing or merging here would build history no branch references.

**Do:** stop. Suggest `git switch <branch>` (or `git switch -c <new-branch>` to keep work made while detached), then re-run `/sync`.

## Rebase or merge already in progress

**Detect:** `rebase-merge` or `rebase-apply` exists (rebase), `MERGE_HEAD` (merge), or `CHERRY_PICK_HEAD` (cherry-pick). Resolve each with `git rev-parse --git-path <name>` (always succeeds — it only prints the path) and test existence with `Test-Path`/`test -e` — don't rely on `git status` text parsing.

**Explain:** an operation is mid-flight; stacking a sync on top corrupts state or compounds conflicts.

**Do:** stop. Point at the finish/abort pair for what's in progress (`git rebase --continue` / `--abort`, `git merge --continue` / `--abort`, or `git cherry-pick --continue` / `--abort`). Don't run either yourself — the in-flight operation isn't this skill's to decide.

## No remote / fetch fails

**Detect:** `git remote get-url origin` errors (no remote), or `git fetch origin` fails (auth, network, deleted remote).

**Do:** continue against local refs — `<sync-ref>` becomes local `<target>` — and warn that the sync may be against stale data. Carry the warning into the Phase 3 plan and the Phase 5 report. In Phase 5, skip the push offer if there's no remote at all.

## Target doesn't exist

**Detect:** both `git rev-parse --verify refs/remotes/origin/<target>` and `git rev-parse --verify refs/heads/<target>` fail.

**Likely causes:** typo in the argument, or the branch only exists on a different remote.

**Do:** stop. Show close matches from `git branch -a --list "*<target>*"` if any, otherwise list local branches, and ask which branch to sync with.

## Currently on the target branch

**Detect:** `git branch --show-current` equals `<target>`.

**Explain:** syncing a branch with itself is meaningless; what the user probably wants is to update it from its upstream.

**Do:** if the branch has an upstream and is strictly behind, offer `git merge --ff-only @{upstream}` via `AskUserQuestion` (`Fast-forward` / `Cancel`) — not `git pull`, which would fetch after the user already decided about fetching in Phase 1. If it has diverged from upstream, report that and stop — rewriting the base branch is out of scope for this skill.

## Own upstream is ahead (divergence guard)

**Detect:** after the fetch, `git rev-list --count HEAD..@{upstream}` > 0 for the *current* branch's own upstream (not the target).

**Why a hard stop:** the fetch just refreshed the remote-tracking ref, so a post-rebase `git push --force-with-lease` would pass the lease check and **overwrite those commits on the remote**. The lease only protects against changes you haven't fetched.

**Do:** stop. Tell the user someone (or another machine) pushed N commits to `<upstream>` that aren't local; integrate them first — `git pull` (merge) or `git pull --rebase` on this branch — then re-run `/sync`.

## Stash pop conflicts

**Detect:** `git stash pop` reports conflicts after the sync.

**Reassure:** on conflict, `pop` does **not** drop the stash entry — the changes exist both as conflict markers in the tree and in the stash. Nothing is lost.

**Do:** leave the stash entry alone (`git stash list` shows `sync: auto-stash`). List the conflicted files. Offer to resolve the conflicts in place; once resolved and confirmed applied, finish with `git stash drop`. If the user declines, leave both the conflict markers and the stash entry in place and say so. Don't suggest a discard-and-retry recipe: `git checkout -- .` fails on unmerged paths, and untracked files the pop already restored would collide with a second `pop`. Never run `git stash drop` until the changes are confirmed applied.

## Shallow clone

**Detect:** `git rev-parse --is-shallow-repository` prints `true`.

**Why it matters:** rebase and merge-base computations can fail or misbehave without full history (`fatal: refusing to merge unrelated histories`, wrong fork point).

**Do:** warn in the plan. If the rebase/merge fails with a history-related error, suggest `git fetch --unshallow` (or `--deepen=<n>`) and retry — ask before fetching, it can be a large download.
