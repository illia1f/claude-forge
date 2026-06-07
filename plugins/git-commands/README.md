# git-commands

Git workflow skills for Claude Code.

## Skills

### /commit

Create a git commit from current changes.

- Follows project commit rules (CLAUDE.md, commitlint config, `.gitmessage`, CONTRIBUTING.md); falls back to Conventional Commits
- Respects pre-staged changes; asks before staging anything
- Warns on main/master and offers to create a branch
- Excludes files that look like secrets and reports them
- Offers to split unrelated changes into separate commits
- Handles hook formatters, abnormal git states (merge, rebase, cherry-pick, bisect, detached HEAD), and missing git identity

### /gen-pr

Generate a pull request title and description from the commits on the current branch.

- Auto-detects the base branch (`origin/HEAD`, falling back to `main`/`master`)
- Follows the project PR template (`.github/PULL_REQUEST_TEMPLATE`, CONTRIBUTING.md, CLAUDE.md); falls back to a best-practice structure
- Drafts from the diff **and** the conversation context (the "why")
- Prints the markdown to the screen and offers to save it to a `.md` file
- Does not open the PR — it produces the text only

### /clean-up

Remove local branches marked `[gone]` (their upstream was deleted on the remote) and any worktrees attached to them.

- Shows a single deletion plan and asks for one confirmation
- Removes attached worktrees first, then deletes the branches
- Skips the current branch, `main`/`master`, and branches with unmerged commits (reported for explicit opt-in)
- Never force-deletes branches or discards dirty worktrees

## Installation

From the claude-forge marketplace:

```bash
/plugin marketplace add illia1f/claude-forge
/plugin install git-commands@claude-forge
```

### Local Development

```bash
claude --plugin-dir ./plugins/git-commands
```

