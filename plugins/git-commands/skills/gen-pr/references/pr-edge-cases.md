# gen-pr edge cases

Loaded from Phase 1 (base resolution) or Phase 3 (gates) when the repository state is unusual.

## Base branch can't be resolved

`git symbolic-ref --short refs/remotes/origin/HEAD` fails when there is no remote, no `origin/HEAD` ref, or a detached remote head.

1. Try `main`, then `master` as the base (`git rev-parse --verify <name>` to confirm it exists).
2. If neither exists, list local branches (`git branch`) and ask the user which branch to diff against.
3. `origin/HEAD` can also be stale — if the user says the default branch is something else, trust them. Re-point it with `git remote set-head origin -a` only if the user asks; don't do it silently.

## Detached HEAD

`git branch --show-current` prints nothing. There is no branch name to base a PR on.

- Explain that the working tree is on a detached HEAD (show `git rev-parse --short HEAD`).
- A PR needs a branch. Tell the user to create one: `git switch -c <name>`.
- Stop. Don't generate a description for a commit range that has no branch.

## Still on the base branch

The current branch equals the resolved base (e.g. on `main`). There are no branch-unique commits to describe.

- Confirm the base with the user — they may have intended a different base.
- If they really are on the base with local commits, the PR would be base-against-itself (empty). Suggest moving the commits to a feature branch first.

## Uncommitted changes present

`git status --porcelain` is non-empty.

- Those changes are **not** part of the commit range and won't appear in the PR until committed.
- Note this in the generated output (a short line under the summary, or a `<!-- uncommitted: ... -->` marker). Don't block — the user may be drafting the description before the final commit.
