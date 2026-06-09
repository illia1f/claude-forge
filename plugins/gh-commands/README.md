# gh-commands

GitHub workflow skills for Claude Code, driven by the [`gh`](https://cli.github.com/) CLI.

`gh-commands` owns anything that talks to GitHub; local git operations and drafting live in the companion [`git-commands`](../git-commands) plugin.

## Skills

### /new-pr

Open a GitHub pull request from the current branch, end to end.

- **Preflight gates** — hard-stops on missing `gh`, missing auth, or no GitHub remote, each with an actionable fix
- Auto-detects the base branch (`origin/HEAD`, falling back to `main`/`master`)
- **Adaptive** — commits uncommitted work only when needed; defers the branch push into the final confirmed action
- Reuses `git-commands` for the commit (`/commit`) and the PR title/body (`/gen-pr`) — one source of truth, no duplicated logic
- Asks draft-vs-ready — and the base, when there's a real alternative — **before** drafting, so nothing has to be regenerated
- One confirmation gates the only outward-facing step — pushing the branch **and** running `gh pr create`
- Detects an existing PR for the branch up front and offers to update or view it instead of duplicating
- Handles forks (cross-repo PRs), detached HEAD, and rejected pushes via a lazily-loaded edge-case reference

## Recommended companion

`new-pr` has a **soft dependency** on `git-commands`: it invokes `git-commands:commit` and `git-commands:gen-pr` by name for convention-aware commits and PR descriptions. Install both for the full experience:

```bash
/plugin install git-commands@claude-forge
```

Without `git-commands`, `new-pr` degrades gracefully — it falls back to a minimal inline commit and a minimal inline title/body drafted from the diff and conversation, and still opens the PR.

## Installation

From the claude-forge marketplace:

```bash
/plugin marketplace add illia1f/claude-forge
/plugin install gh-commands@claude-forge
```

### Local Development

```bash
claude --plugin-dir ./plugins/gh-commands
```
