---
name: sync
description: Update the current branch with its base branch (auto-detected) or a branch passed as an argument — rebase when clean, merge when it conflicts. Gates before stashing a dirty tree and before any push (--force-with-lease after a rebase), and hard-stops when the branch's own upstream has commits you don't have. Use when the user asks to sync/update/rebase the current branch with main/base/another branch or invokes /sync.
---

# Sync branch with base

Bring the current branch up to date with `<target>` — the argument if one was passed (`/sync develop`), otherwise the auto-detected base. Strategy is conflict-driven: rebase when it completes cleanly (linear history, conflicts resolved per replayed commit), merge when it doesn't (one merge commit, conflicts resolved once). One plan and one confirmation for the sync itself; fetch and push are gated separately. Five phases, in order.

## Phase 1 — Gather & resolve target

**Resolve `<target>` once:**

1. **Argument passed** → that branch is the target; strip a known remote prefix first (`/sync origin/develop` → target `develop` — the `<sync-ref>` step below picks the remote ref itself). Skip base detection.
2. **No argument** → detect the base: `git symbolic-ref --short refs/remotes/origin/HEAD` gives e.g. `origin/main`; strip the remote prefix → `main`. Missing? Fall back to `main`/`master` (whichever exists) for now — `git remote set-head origin --auto` would repair it but contacts the remote, so it waits for fetch consent below. Neither exists? List local branches and ask. Don't hardcode `main` — the repo may default to `develop`/`trunk`.

**Fetch — ask first via the `AskUserQuestion` tool, not free-text:**

- **Q:** "Run `git fetch origin` to get the latest `<target>` before syncing?"
- **Options:**
  - `Fetch` — sync against the remote's current state (recommended).
  - `Skip fetch` — sync against local data; the target may be stale.

On `Fetch`: pre-check `git remote get-url origin`, then `git fetch origin`. If base detection fell back above, also run `git remote set-head origin --auto` (re-points origin/HEAD — announce it) and re-resolve `<target>`; if it differs from the assumed base, say so in the plan. No remote, or fetch fails (auth/network)? Continue as if `Skip fetch` was chosen and warn — see "No remote / fetch fails" in `references/sync-edge-cases.md`.

**Resolve `<sync-ref>`** — the ref actually rebased onto / merged in: `origin/<target>` when `git rev-parse --verify refs/remotes/origin/<target>` succeeds, local `<target>` otherwise. Neither exists? Stop — see "Target doesn't exist" in `references/sync-edge-cases.md`.

Then gather state (read-only):

```
git branch --show-current
git status --porcelain
git rev-list --left-right --count <sync-ref>...HEAD   # behind<TAB>ahead
git log <sync-ref>..HEAD --merges --oneline            # merge commits on the branch
git rev-list --count HEAD..@{upstream}                 # own-upstream divergence (ignore error if no upstream)
```

## Phase 2 — Edge gates

Run before planning — a gate may stop the whole run. Each gate passes, stops with an explanation, or carries a caveat into the Phase 3 plan. Details for every stop case live in `references/sync-edge-cases.md`.

1. **Detached HEAD** — `git branch --show-current` empty → explain and stop.
2. **Operation in progress** — resolve `rebase-merge`, `rebase-apply`, `MERGE_HEAD`, and `CHERRY_PICK_HEAD` with `git rev-parse --git-path <name>`, then test each resolved path for existence (`Test-Path` / `test -e`) — `rev-parse --git-path` only *prints* the path and always succeeds, so its exit code proves nothing. Use `--git-path`, not a literal `.git/` prefix — that breaks in linked worktrees. Any path exists → an operation is already underway; explain and stop. Never stack a sync on top.
3. **On the target itself** — current branch equals `<target>` → there's nothing to rebase onto its own base; offer a fast-forward update from its upstream (`git merge --ff-only @{upstream}` — no fetch; that decision was already made above) instead, then stop.
4. **Already up to date** — behind-count is 0 → report ("up to date with `<sync-ref>`, N commits ahead") and stop. Don't ask.
5. **Own upstream is ahead** — `HEAD..@{upstream}` non-empty → the branch's own remote has commits you don't have (a teammate or another machine pushed). **Hard stop.** A rebase here followed by `--force-with-lease` would *succeed* (the fetch refreshed the lease ref) and silently discard those commits. Tell the user to integrate their upstream first (`git pull` on this branch), then re-run `/sync`.
6. **Shallow clone** — `git rev-parse --is-shallow-repository` prints `true` → carry a caveat into the plan; rebase/merge-base computations can misbehave without full history. If Phase 4 later fails with a history-related error, see "Shallow clone" in `references/sync-edge-cases.md`.

## Phase 3 — Plan & confirm once

Pick the intended strategy:

- Merge commits on the branch (Phase 1 `--merges` list non-empty) → **straight merge**; rebasing would flatten or badly replay them. Say so in the plan.
- Otherwise → **try rebase, fall back to merge on conflict**.

Show one plan: current branch, `<sync-ref>`, behind/ahead counts, the strategy, and — if `git status --porcelain` is non-empty — the dirty files and the note that they'll be stashed and restored. Then ask **one** confirmation via the `AskUserQuestion` tool:

- **Q:** "Sync `<branch>` with `<sync-ref>` as planned?"
- **Options (dirty tree):**
  - `Stash & sync` — stash the listed changes, sync, restore them after (recommended).
  - `Cancel` — make no changes.
- **Options (clean tree):** `Sync` (recommended) / `Cancel`.

The user may instead ask via free-text to commit the dirty files first — handle that, then continue with a clean tree. On `Cancel`, change nothing.

## Phase 4 — Execute

1. **Stash** (only if confirmed dirty): `git stash push -u -m "sync: auto-stash"`. `-u` includes untracked files — they can collide with incoming ones too.
2. **Rebase attempt** (skip when Phase 3 chose straight merge): `git rebase <sync-ref>`.
   - Completes → record "rebased", go to step 4.
   - Stops on conflict (unmerged paths, rebase left in progress) → `git rebase --abort` (full restore, guaranteed), then fall through to merge. Never resolve conflicts mid-rebase — the fallback exists so conflicts are resolved once, not per replayed commit.
   - Fails any other way (hook failure, unrelated histories — often before the rebase even starts) → don't fall through to merge. Run `git rebase --abort` only if a rebase is actually in progress (re-run the gate-2 check; aborting a rebase that never started errors). Restore the stash, report the error, stop. History-related error in a shallow clone? See "Shallow clone" in `references/sync-edge-cases.md`.
3. **Merge**: `git merge <sync-ref>`.
   - Completes → record "merged", go to step 4.
   - Conflicts → **assist, don't abandon**:
     a. `git status --porcelain` → list conflicted files.
     b. For each, read the conflict markers plus enough surrounding code to understand both sides, and draft a resolution. Combine both changes when they're independent; when they genuinely compete, say which side you propose and why.
     c. Present all proposed resolutions, then gate via `AskUserQuestion`: `Apply resolutions` / `Cancel sync`. The user can adjust individual files via free-text before approving.
     d. On approve: write the resolved files, `git add` them, `git commit --no-edit` to complete the merge.
     e. On cancel: `git merge --abort`, restore the stash (step 5), report — repo back exactly as before.
4. **Record the result** — strategy used and commit count incorporated, for the Phase 5 report.
5. **Restore stash** (if step 1 ran): `git stash pop`. Pop conflicts? Leave the stash entry intact — `pop` keeps it on conflict, nothing is lost — report the conflicted files and the entry name. Never drop a stash that didn't apply cleanly.

## Phase 5 — Offer push + report

If the branch has an upstream (`git rev-parse --abbrev-ref @{upstream}` → `<upstream>`) and now differs from it, ask via the `AskUserQuestion` tool:

- **Q:** "Push the synced branch to `<upstream>`?"
- **Options:**
  - `Push` — `git push` after a merge; `git push --force-with-lease` after a rebase (history was rewritten; the lease aborts if the remote moved since the fetch) (recommended).
  - `Leave local` — sync stays local; note that after a rebase a later plain `git push` will be rejected until forced.

Never plain `--force`. No upstream? Skip the question and note it in the report.

Finish with a summary:

```
## Sync report

Branch <branch> ← <sync-ref>
- Strategy: rebased | merged | merged (conflicts resolved: N files)
- Incorporated: N commits
- Stash: restored | left intact (pop conflict: <files>)
- Push: pushed | pushed (--force-with-lease) | left local | no upstream
```

Omit lines that don't apply. If anything was skipped or assumed (stale data after `Skip fetch`, assumed base), say so here.
