---
name: gen-pr
description: Generate a terse, why-over-what pull request title and description in markdown from the commits on the current branch. Follows the project PR template when found (.github/PULL_REQUEST_TEMPLATE, CONTRIBUTING.md, CLAUDE.md), best-practice structure otherwise. Displays the markdown and offers to save it to a .md file. Use when the user asks to write/generate a PR description or invokes /gen-pr. Does not open the PR.
---

# Generate PR

Work through the five phases in order. Load a reference only when a phase says to — the happy path needs none.

## Phase 1 — Gather

First resolve the base branch, then describe the branch against it.

Resolve the base once:
```
git symbolic-ref --short refs/remotes/origin/HEAD   # e.g. origin/main -> main
```
1. Strip the remote prefix → `main`.
2. Missing? Run `git remote set-head origin --auto` (a safe, metadata-only write — announce it: "re-pointing origin/HEAD"), retry.
3. Still unresolved? Load `references/pr-edge-cases.md` ("Base branch can't be resolved"): fall back to `main`/`master` (whichever exists), else list local branches and ask. Don't hardcode `main` — the repo may default to `develop`/`trunk`. If you fell back here, treat the base as **assumed** and flag it in Phase 4.

If a calling skill (e.g. `new-pr`) supplies an already-confirmed base, use it as-is — skip the resolution above and the assumed-base caveat.

Then run in parallel (read-only):
```
git branch --show-current
git log <base>..HEAD --oneline
git diff <base>...HEAD --stat --patch   # file overview + the actual change content
git status --porcelain
```
Draft from the patch, not just the stat — the stat names the files, the hunks show the behavior. On a very large diff, lean on the stat overview, commit subjects, and the key hunks rather than every line.

## Phase 2 — Edge gates

Run these **before** discovering conventions or drafting — a gate may stop the whole run, and there's no point formatting a PR that can't exist. Each gate passes, stops with an explanation, or carries a caveat into Phase 4.

1. **Detached HEAD** — if `git branch --show-current` is empty, load `references/pr-edge-cases.md`, explain, and stop.
2. **Still on base branch** — if the current branch equals `<base>`, warn there is no feature branch to describe; confirm the base with the user before continuing (see "Still on the base branch" in `references/pr-edge-cases.md`). This must run before the no-commits gate — on the base branch, `<base>..HEAD` is always empty, and this gate gives the better diagnosis.
3. **No commits vs base** — if `git log <base>..HEAD` is empty, there's nothing to describe; report and stop.
4. **Uncommitted changes** — if `git status --porcelain` is non-empty, carry a caveat into Phase 4 (those changes aren't committed and won't be in the PR until they are). Don't block. See "Uncommitted changes present" in `references/pr-edge-cases.md`.

## Phase 3 — Convention discovery

First hit wins. A project template outranks generic best practice. This governs the **body** only — templates never include the title.

1. **PR template** — `.github/PULL_REQUEST_TEMPLATE.md`, `.github/pull_request_template.md`, `docs/PULL_REQUEST_TEMPLATE.md`, or any file under `.github/PULL_REQUEST_TEMPLATE/`. On hit: read it and follow its sections and checkboxes exactly.
2. **Project docs** — PR guidance in CONTRIBUTING.md (root, `docs/`, `.github/`) or CLAUDE.md.
3. **Fallback** — load `references/pr-best-practices.md` and use the standard structure.

## Phase 4 — Draft + display

1. Draft the **title** and **body**:
   - **Title** — one imperative line, no trailing period, aim for ≤70 characters. If the `git log` subjects follow Conventional Commits (`type(scope): subject`), match that style; otherwise write a concise summary of what the branch does. A PR template never contains the title — always generate it here.
   - **Body** — from the diff **and the conversation context**: the diff shows what changed, the conversation shows why. Format per the Phase 3 convention, then apply the terse style on top. If the conversation gives no "why", describe only what changed — never invent motivation, test results, or linked issues. Leave a clearly marked placeholder (e.g. `<!-- TODO: link issue -->`) when the convention asks for something you can't determine.
   - **Caveats** — if the base was assumed (Phase 1 step 3) or there are uncommitted changes (Phase 2 gate 4), hold each as a short note for step 2 — **never inside the body**: these are session notes for the author, and a body pasted or piped to GitHub would publish them to reviewers. Skip when neither applies.

   **Precedence** — the Phase 3 convention wins on any conflict: required sections, checkboxes, headings, length caps. The terse style governs verbosity, not format — it never drops a section the convention requires.

   **Terse style** — why over what, no fluff:
   - Bullets over prose, one line per change; omit a section rather than padding it.
   - Lead with intent and impact — the diff and file list already show the mechanics.
   - **Never include:** "this PR does X" filler; `I`/`we`/`now`/`currently`; emoji unless the project requires it; restated diff stats or file lists.
2. Display the title and body as **two separate, clearly-labeled parts** — GitHub treats them as distinct fields, so don't merge them into one block where the title reads as body:
   - First print the title on its own line, labeled, e.g. `**Title:** feat(upload): add retry to the upload client`.
   - Then print the body in its own fenced block so the user can copy it verbatim into the description field.
   - After the body block, print any step 1 caveats as separate `> Note:` lines — outside the fence, so they never travel with the copied body.

## Phase 5 — Offer save

1. Ask via the `AskUserQuestion` tool (not free-text):
   - **Q:** "Save this PR description to a file?"
   - **Options:**
     - `Save` — write to `PR_DESCRIPTION.md` at the repo root (recommended).
     - `Don't save` — leave it on screen only.
2. On `Save`, write the file with the title as a top-level `# ` heading followed by the body, so the file carries both fields — caveat notes stay on screen, never in the file — then report where it landed (confirm the path first if the user wants a different one).
3. On `Don't save`, stop — the markdown is already on screen.
