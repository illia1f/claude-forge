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

## Roadmap

- `gen-pr` — generate PR title and description following project rules
- `clean-up` — remove branches marked [gone] and their worktrees

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

