# new-pr edge cases

Loaded from a Phase 1 gate or a Phase 2/5 detection when the environment or repository state is unusual. The happy path never needs this file.

## `gh` not installed

`gh --version` fails or the binary isn't found.

- Hard-stop. Show the OS-appropriate install command with the `! ` session-hint prefix so the user can run it inline:
  - Windows: `! winget install --id GitHub.cli`
  - macOS: `! brew install gh`
  - Linux: `! sudo apt install gh` (or `dnf`/`pacman`/`zypper` per distro)
- Do **not** install it yourself, and do **not** fall back to a browser-based PR flow. The skill is `gh`-only by design.

## `gh` not authenticated

`gh auth status` reports no logged-in account (or exits non-zero).

- Hard-stop. Tell the user to authenticate: `gh auth login` (offer the `! gh auth login` session hint).
- After they log in, re-run the skill. Don't try to script the login — it's interactive.

## No GitHub remote / forks / cross-repo

Phase 1 gate 3 hard-stops only when there's no usable GitHub remote. A fork passes the gate (its `origin` *is* on github.com) and is handled here.

- **No `origin`, but exactly one other remote on github.com** → use that remote everywhere `origin` appears and say so. Don't guess between multiple candidates — ask.
- **No GitHub remote at all** → stop; there's nothing to open a PR against. Tell the user to add one (`git remote add origin <url>`).
- **`origin` on a non-GitHub host** (GitLab, Bitbucket, self-hosted) → stop; this skill only drives GitHub via `gh`.
- **Fork workflow** — `origin` is the user's fork on github.com; the PR usually targets the upstream repo. This is supported, but the base lives in *upstream*, not `origin`, so resolve it early:
  - **In Phase 1 (before the diff range or the description draft):** resolve the base from the upstream's default branch — `git symbolic-ref --short refs/remotes/upstream/HEAD` if an `upstream` remote exists, else `gh repo view <upstream> --json defaultBranchRef`. Confirm the target via the Phase 1 `AskUserQuestion` (upstream vs. the fork itself) **now**; the Phase 2 `git log <base>..HEAD` range and the gen-pr draft both depend on it. Don't defer this to Phase 5 — by then the draft would already be built against the wrong base.
  - **In Phase 2:** the existing-PR check must look in the *target* repo: `gh pr list --repo <upstream> --head <fork-owner>:<branch> --state open`. The plain `gh pr list --head <branch>` form only sees the fork and would miss an open upstream PR.
  - **In Phase 5:** push goes to the fork (`origin`); `gh pr create --repo <upstream> --head <fork-owner>:<branch> --base <upstream-base>` names the source and target. `gh` can also prompt for "Where should we push?" when remotes are ambiguous.

## Detached HEAD

`git branch --show-current` prints nothing — there's no branch name to open a PR from.

- Explain the working tree is on a detached HEAD (show `git rev-parse --short HEAD`).
- A PR needs a branch. Tell the user to create one: `git switch -c <name>`.
- Stop. Don't push or create a PR for a detached commit range.

## Still on the base branch

The current branch equals the resolved base (e.g. on `main`).

- There are no branch-unique commits — the PR would be base-against-itself (empty).
- Confirm the base with the user; they may have intended a different base.
- If they really have local commits on the base, suggest moving them to a feature branch first (`git switch -c <name>`), then re-run.

## Unusual base branch

Targeting the repo's default branch (`main`) is the normal, expected case — the Phase 5 confirmation question already names the base; don't add a warning for it.

Flag the base in the confirmation question only when it's **unusual**:

- `<base>` is *not* the repo's default branch — legitimate for stacked PRs and release flows, but worth a second look.
- `<base>` looks like a feature branch (e.g. `feat/...`, `fix/...`) — likely a mistake unless the user is stacking deliberately.

## A PR already exists for the branch

Phase 2 checks proactively with `gh pr list --head <branch> --state open` (fork: `gh pr list --repo <upstream> --head <fork-owner>:<branch> --state open`); Phase 5 is a race backstop if `gh pr create` still errors with "a pull request for branch ... already exists".

- Don't treat it as a failure and don't try to create a duplicate.
- Report the existing PR (number + URL via `gh pr view <branch> --json url,number,state`).
- Ask via the `AskUserQuestion` tool (not free-text). Offer `Update it` **only when there's something to send** — `git status --porcelain` non-empty and/or `git log origin/<branch>..HEAD` non-empty. Otherwise offer just open-in-browser / show-status. Let the user decide — don't pick for them.
- **Update flow** (on `Update it`): commit uncommitted work via `git-commands:commit` (or the SKILL's Fallback) if the user wants it included, then show `git push origin <branch>` and confirm before running — the push is outward-facing, same rule as Phase 5. Report the PR URL when done. The PR's title and body are GitHub-side state — don't regenerate or overwrite them here.

## Push rejected

The Phase 5 `git push -u origin <branch>` is rejected (non-fast-forward — the remote branch has commits the local one doesn't).

- The PR was **not** created (push runs first in the Phase 5 bundle).
- Diagnose before acting: `git log --oneline HEAD..origin/<branch>` shows what the remote has that local lacks.
- If the local branch was **intentionally rewritten** (rebase, amend) and the remote copy is just the stale pre-rewrite version — every remote-only commit has a rewritten equivalent locally — ask via the `AskUserQuestion` tool (not free-text):
  - `Force-with-lease` — `git push --force-with-lease origin <branch>`; refuses if the remote moved since the last fetch. Then continue Phase 5.
  - `Stop` — leave the push for the user to reconcile.
- If the remote-only commits may be **someone else's work** (shared branch, unrecognized commits), don't offer a force-push at all — stop and let the user reconcile (`git pull --rebase`, or investigate the divergence).
- Never plain `--force`.
- The force-with-lease path continues Phase 5 directly. If you stopped instead and the user reconciled manually, re-run the skill — it resumes cleanly.
