---
name: new-pr
description: Open a GitHub pull request from the current branch, end to end — local prep through `gh pr create`. Use when the user asks to open/create/submit/raise a pull request or invokes /new-pr. Requires the gh CLI; pairs with the git-commands plugin (commit, gen-pr) and degrades gracefully without it.
---

# New PR

Open a GitHub pull request from the current branch by reusing `git-commands` for the local work and `gh` for the GitHub call. Work through the five phases in order. The skill is **adaptive** — inspect state and only do what's needed. Load `references/gh-edge-cases.md` only when a gate or detection sends you there.

## Phase 1 — Preflight (hard gates)

Run in order. Each is a **hard stop** with an actionable message — do not work around a failed gate.

1. **`gh` installed** — probe `gh --version`. Missing? Stop with the OS-appropriate install command and the `! <command>` session hint so the user can run it inline:
   - Windows: `! winget install --id GitHub.cli`
   - macOS: `! brew install gh`
   - Linux: `! sudo apt install gh` (or the distro equivalent)

   Do **not** install it automatically and do **not** fall back to a browser flow.
2. **`gh` authenticated** — `gh auth status`. Not logged in? Stop and point to `gh auth login` (offer the `! gh auth login` session hint).
3. **GitHub repo** — inside a git repo with a github.com remote (`git remote get-url origin`). If `origin` is missing but exactly **one** other remote exists and it's on github.com, use it everywhere `origin` appears below and say so. No GitHub remote at all, or `origin` on a non-GitHub host (GitLab, Bitbucket, self-hosted)? Hard-stop — this skill only opens PRs on GitHub. A **fork** whose `origin` is on github.com but whose PR targets an upstream repo passes this gate; load `references/gh-edge-cases.md` for the fork/cross-repo flow.
4. **Resolve the base branch** — same robust resolution `gen-pr` uses. Never hardcode `main`:
   ```
   git symbolic-ref --short refs/remotes/origin/HEAD   # e.g. origin/main -> main
   ```
   1. Strip the remote prefix → `main`.
   2. Missing? Run `git remote set-head origin --auto`, retry.
   3. Still unresolved? Fall back to `main`/`master` (whichever exists) and **state the assumption**.

   **Fork PRs:** if this is a fork scenario (an `upstream` remote exists, or `origin` is a fork — `gh repo view --json isFork`), the base lives in the *upstream* repo, not `origin`. Resolve it from the upstream's default (`git symbolic-ref --short refs/remotes/upstream/HEAD`, or `gh repo view <upstream> --json defaultBranchRef`) and confirm the target **now**, before Phase 2 — the diff range and the description draft depend on it. Ask via the `AskUserQuestion` tool (not free-text):
   - **Q:** "This clone is a fork — where should the PR go?"
   - **Options:**
     - `<upstream>, base <upstream-base>` — the usual contribute-back flow (recommended).
     - `<origin>, base <origin-default>` — open the PR inside the fork itself.

   See `references/gh-edge-cases.md`.

## Phase 2 — State detection (adaptive)

Inspect, then act on each, in this order — the existing-PR check runs first so the user is never walked through a commit for a PR that won't be created. **Nothing here is outward-facing** — the push is deferred to the Phase 5 confirmed bundle.

1. **Resolve the branch** — `git branch --show-current`. Empty output means detached HEAD → load `references/gh-edge-cases.md` and stop.
2. **Existing PR** — `gh pr list --head <branch> --state open` (fork: the cross-repo form in `references/gh-edge-cases.md`). Works whether or not the branch is pushed. If one exists, don't build toward a duplicate — report it, ask via the `AskUserQuestion` tool (not free-text), then **stop (skip Phases 3–5)**:
   - **Q:** "PR #<n> already exists for this branch — what now?"
   - **Options:**
     - `Update it` — offer **only when there's something to send** (uncommitted changes and/or local commits the remote branch lacks). Commit via `git-commands:commit` if needed, confirm the push the same way Phase 5 does, push, report the PR URL.
     - `Open in browser` — `gh pr view --web`.
     - `Show status` — print its state and URL.

   Details in `references/gh-edge-cases.md`.
3. **Uncommitted changes** (`git status --porcelain` non-empty) → ask via the `AskUserQuestion` tool (not free-text):
   - **Q:** "Uncommitted changes present — commit them before opening the PR?"
   - **Options:**
     - `Commit` — invoke `git-commands:commit`, then continue (recommended).
     - `Skip` — leave them; warn they won't be in the PR and continue.
4. **Nothing to PR** — if `<branch>` equals `<base>` (see `references/gh-edge-cases.md`), or `git log <base>..HEAD` is empty, there may be nothing to open a PR for — but the base could also be misresolved (Phase 1 is a best guess). Before stopping, confirm via the `AskUserQuestion` tool (not free-text):
   - **Q:** "No commits between `<base>` and `<branch>` — is `<base>` the right base?"
   - **Options:**
     - `Yes, stop` — `<base>` is correct; there's genuinely nothing to PR.
     - `Use a different base` — then ask which (offer detected long-lived branches; *Other* covers a custom name) and rerun this Phase 2 check against it.

   A base the user confirms or supplies here counts as **resolved cleanly** — don't re-ask it in Phase 3.

## Phase 3 — PR options

Ask **before** drafting the description, so a base change here costs nothing. One `AskUserQuestion` call (not free-text):

1. **Draft or ready?**
   - `Ready for review` — open normally (recommended).
   - `Draft` — open as a draft (`--draft`).
2. **Base branch** — "Open against `<base>`?" Include this question **only when there's a real choice**: the Phase 1 resolution fell back to an assumption, or other long-lived remote branches exist (`develop`, `release/*`, the `main`/`master` sibling). Options: `<base>` (recommended) plus those candidates — the user can always type another via *Other*. If `<base>` resolved cleanly and no candidates exist, skip this question (AskUserQuestion needs ≥2 real options — never pad with a placeholder); Phase 5 shows the base again before anything runs.

**If the base changes here**, rerun the Phase 2 checks against the new base (`git log <new-base>..HEAD`, existing-PR) before continuing.

## Phase 4 — Description (reuse)

Run `git-commands:gen-pr`, but execute it **only up to and including its "Draft + display" phase** and **stop before its final save-to-file offer**. (Don't enumerate gen-pr's intermediate phases here — follow whatever order gen-pr itself defines; the point is to halt at the displayed markdown, not run its save question.) Capture the **title** and **body** it displays verbatim (do not re-derive the title), then return here. The captured markdown feeds straight to `gh` — body only; any caveat notes gen-pr prints outside the body block stay on screen and never reach GitHub.

Pass the Phase 3-confirmed base into gen-pr's Gather step so it doesn't re-resolve a different one — this matters for fork PRs, where the base is the upstream's.

If `git-commands` is unavailable, see **Fallback** below.

## Phase 5 — Confirmation gate → push + create

Everything before this point was local. The push and the PR creation are the outward-facing actions — **both happen here, behind one confirmation**.

1. Show the exact commands that will run:
   ```
   git push -u origin <branch>        # only if the branch is unpushed or has new commits
   gh pr create --base <base> --head <branch> --title <title> --body-file <tempfile> [--draft]
   ```
   The body goes in a temp file (`--body-file`) so multi-line markdown survives intact. "Unpushed or has new commits" = the branch has no upstream (`git rev-parse --abbrev-ref <branch>@{upstream}` fails) or `git log origin/<branch>..HEAD` is non-empty. Fork flow: use the `--repo <upstream> --head <owner>:<branch>` form from `references/gh-edge-cases.md`.
2. **Confirm before running** via the `AskUserQuestion` tool (not free-text) — this is the only outward-facing step; it publishes commits and opens a PR others can see. If `<base>` is **not** the repo's default branch, call that out in the question — an unusual target deserves a second look (`references/gh-edge-cases.md`). (Targeting the default branch is the normal case; don't warn about it.)
   - **Q:** "Push `<branch>` and open this PR against `<base>`?"
   - **Options:**
     - `Push & create` — push if needed, then create (recommended).
     - `Cancel` — stop; nothing pushed or created.
3. On confirm: push the branch if it's unpushed or has new commits (report what was pushed), then run `gh pr create`. If the push is **rejected**, do not create the PR — load `references/gh-edge-cases.md`; it decides whether the run can continue (a confirmed force-with-lease after an intentional rewrite) or must stop.
4. Report the returned PR URL.
5. **Existing PR (race backstop)** — Phase 2 already checks, but if `gh pr create` still errors that a PR exists, don't error out: report it and ask via the `AskUserQuestion` tool whether to open (`gh pr view --web`) or show its status. Details in `references/gh-edge-cases.md`.

## Fallback — git-commands absent

`new-pr` has a soft dependency on `git-commands`. If a `git-commands` skill can't be invoked, degrade gracefully — the PR still gets opened — but **don't silently drop its safety net**.

- **Phase 2 commit** — committing is the risky part to fall back on; `git-commands:commit` provides a secret scan, staged-set respect, unrelated-change splitting, identity checks, and hook handling. So:
  1. Ask via the `AskUserQuestion` tool (not free-text):
     - **Q:** "`git-commands` isn't installed — how should the commit happen?"
     - **Options:**
       - `Install git-commands` — the user runs `/plugin install git-commands@claude-forge` (one command, restores the safe path), then re-runs `new-pr` (recommended).
       - `Commit manually` — the user commits themselves, then re-runs `new-pr`.
       - `Inline commit` — proceed with the guarded fallback below.
  2. **On `Inline commit` only**, do a *guarded* inline commit, never a blind one: respect any already-staged set (don't auto-add to it), run at least a basic **secret scan** (env/key/cert files, `id_rsa*`, and diff lines assigning long literals to `key`/`token`/`secret`/`password`) and exclude + report anything risky, write a Conventional-Commits-style message from the diff + conversation, and **never** use `--no-verify`. Warn explicitly that splitting and full convention checks are unavailable.
- **Phase 4 description** — lower risk (text only): draft a minimal title and body inline from the diff + conversation context.

Either way, note that installing `git-commands` unlocks the full convention-aware behavior (`/plugin install git-commands@claude-forge`).
