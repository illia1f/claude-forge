# Commit Edge Cases

State files live in the repo's git dir — resolve them with `git rev-parse --git-path <name>`, never a literal `.git/<name>` (in linked worktrees `.git` is a file and state lives under the common dir).

## Mid-merge (`MERGE_HEAD` exists — `git rev-parse --git-path MERGE_HEAD`)

Do not create a normal commit. Tell the user they are mid-merge. Options: resolve conflicts, then `git commit` completes the merge (keep the default merge message); or `git merge --abort`.

## Mid-rebase (`rebase-merge/` or `rebase-apply/` dir exists — via `--git-path`)

Stop. Options: resolve conflicts then `git rebase --continue`, or `git rebase --abort`. Note: `rebase-apply/` is also used by `git am` — if `rebase-apply/head-name` is absent, this is likely a `git am` session; offer `git am --abort` instead.

## Mid-cherry-pick (`CHERRY_PICK_HEAD` exists) / mid-bisect (`BISECT_LOG` exists)

Cherry-pick: stop; resolve conflicts then `git cherry-pick --continue`, or `git cherry-pick --abort`. Bisect: a commit is rarely what the user wants mid-bisect — suggest `git stash` for temporary changes, or finish with `git bisect reset` first.

## Detached HEAD (`git branch --show-current` returns empty)

Warn: commits made here are easy to lose on the next checkout. Offer `git switch -c <branch>` first. If the user wants the commit anyway, proceed, show the resulting SHA, and immediately prompt them to run `git switch -c <name> <sha>` so the commit lands on a branch before anything else happens.

## No identity

```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

(drop `--global` to set per-repo only). Stop until set — git refuses to commit without it.

## Empty repository (no commits yet)

`git log` fails — expected, not an error. Skip history-based convention inference; use project rules or the conventional-commits fallback. Suggest `chore: initial commit` unless the content implies something more specific.

## Hook modified files (formatters via husky, lint-staged, pre-commit)

If the commit appears to fail but `git status` shows modified files that were part of the commit: a formatter rewrote them. Re-stage exactly those files (`git add <those files>`), retry the commit once. If files change again on retry, stop and show the user which files keep changing.

## Hook failed

Show the hook's error output. Fix the root cause (lint error, failing test, message format rejection). Never use `--no-verify`; never disable or edit the hook to get past it.

## GPG signing failure (`gpg failed to sign the data`)

Common causes: expired key, gpg-agent not running, wrong `user.signingkey`. Show diagnostics: `git config user.signingkey` and `gpg --list-secret-keys`. If `git config gpg.format` is `ssh`, verify `user.signingkey` points to a valid SSH key instead. Do not disable signing (`-c commit.gpgsign=false`) unless the user explicitly asks.

## CRLF warnings (Windows)

`LF will be replaced by CRLF` is informational, not an error. Do not treat it as a failure and do not change `core.autocrlf` unprompted.

## Race: files changed between gather and commit

If `git status` at commit time differs from the Phase 1 snapshot, re-run Phase 1 and re-check the drafted message against the new diff — if it no longer fits, re-draft before committing.
