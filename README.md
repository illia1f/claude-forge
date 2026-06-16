# Claude Forge

A personal collection of handy plugins for Claude Code.

## Installation

```bash
# Add the marketplace
/plugin marketplace add illia1f/claude-forge

# Install a plugin
/plugin install <plugin-name>@claude-forge
```

## Plugins

### [ideation](./plugins/ideation)

Multi-agent codebase ideation framework. Analyzes projects for improvements across security, UI/UX, performance, code quality, documentation, and code patterns — run every domain at once with `/ideation:ideate`, or one at a time (e.g. `/ideation:security`).

### [git-commands](./plugins/git-commands)

Git workflow skills: create commits following project rules or Conventional Commits (`/commit`), generate PR descriptions (`/gen-pr`), sync the current branch with its base — rebasing when clean, merging otherwise (`/sync`), and clean up gone branches and their worktrees (`/clean-up`).

### [gh-commands](./plugins/gh-commands)

GitHub workflow skills via the [gh](https://cli.github.com/) CLI: open a pull request end to end (`/new-pr`). Pairs with git-commands for the commit and PR description; degrades gracefully without it.

## Disclaimer

This is an unofficial, personal collection - not affiliated with Anthropic.

## License

[MIT](./LICENSE)
