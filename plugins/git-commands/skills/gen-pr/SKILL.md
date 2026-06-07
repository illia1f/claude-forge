---
name: gen-pr
description: Generate a pull request title and description in markdown from the commits on the current branch. Follows the project PR template when found (.github/PULL_REQUEST_TEMPLATE, CONTRIBUTING.md, CLAUDE.md), best-practice structure otherwise. Displays the markdown and offers to save it to a .md file. Use when the user asks to write/generate a PR description or invokes /gen-pr. Does not open the PR.
---

# Generate PR

Work through the five phases in order. Load a reference only when a phase says to — the happy path needs none.

## Phase 1 — Gather

First resolve the base branch, then describe the branch against it.

Resolve the base (first that works):
```
git symbolic-ref --short refs/remotes/origin/HEAD   # e.g. origin/main -> main
```
If that fails, fall back to `main`, then `master`, then ask the user.

Then run in parallel (read-only):
```
git branch --show-current
git log <base>..HEAD --oneline
git diff <base>...HEAD --stat
git status --porcelain
```

## Phase 2 — Convention discovery

First hit wins. A project template outranks generic best practice.

1. **PR template** — `.github/PULL_REQUEST_TEMPLATE.md`, `.github/pull_request_template.md`, `docs/PULL_REQUEST_TEMPLATE.md`, or any file under `.github/PULL_REQUEST_TEMPLATE/`. On hit: read it and follow its sections and checkboxes exactly.
2. **Project docs** — PR guidance in CONTRIBUTING.md (root, `docs/`, `.github/`) or CLAUDE.md.
3. **Fallback** — load `references/pr-best-practices.md` and use the standard structure.

**Title:** if the `git log` subjects follow Conventional Commits (`type(scope): subject`), match that style for the title. Otherwise write a concise imperative summary of what the branch does.

## Phase 3 — Edge gates

Run in order. Each gate passes, stops with an explanation, or notes a caveat.

1. **No commits vs base** — `git log <base>..HEAD` empty → nothing to describe; report and stop.
2. **Still on base branch** — current branch equals `<base>` → warn there is no feature branch to describe; confirm the base with the user before continuing.
3. **Detached HEAD** — `git branch --show-current` empty → load `references/pr-edge-cases.md`, explain, stop.
4. **Uncommitted changes** — `git status --porcelain` non-empty → note in the output that those changes are not committed and won't be in the PR until committed. Don't block.

## Phase 4 — Draft + display

1. Draft the title and body from the diff **and the conversation context** — the diff shows what changed; the conversation shows why. Format per the Phase 2 convention.
2. Fill template sections from real content; never invent testing steps or linked issues that aren't supported by the diff or conversation. Leave a clearly marked placeholder (e.g. `<!-- TODO: link issue -->`) when the template asks for something you can't determine.
3. Print the complete markdown to the screen inside a fenced block so the user can copy it verbatim.

## Phase 5 — Offer save

1. Ask whether to save the markdown to a file. Suggest a default of `PR_DESCRIPTION.md` at the repo root.
2. If the user accepts, confirm the path, then write the file and report where it landed.
3. If the user declines, stop — the markdown is already on screen.
