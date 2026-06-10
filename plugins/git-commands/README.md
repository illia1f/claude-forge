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

### /sync

Update the current branch with its base branch — or any branch you name.

- Auto-detects the base branch (`origin/HEAD`, falling back to `main`/`master`); `/sync <branch>` syncs with that branch instead
- Conflict-driven strategy: tries a clean rebase first (linear history); falls back to a single merge when the rebase conflicts, so conflicts are resolved once — not per replayed commit
- Branches that already contain merge commits go straight to merge (rebasing would flatten them)
- Assists conflict resolution: analyzes each conflicted file, proposes resolutions, applies them only after your approval
- Asks before fetching, before stashing a dirty tree (restored afterwards), and before pushing — `--force-with-lease` after a rebase, never plain `--force`
- Hard-stops when your branch's own upstream has commits you don't have locally — the one case where a force-push would silently overwrite a teammate's work

**When to use it:**

- Your PR shows *"This branch is out-of-date with the base branch"* or has conflicts with base
- A teammate merged something to `main` that you need underneath your feature branch
- A long-running branch has drifted and you want it current before continuing work
- Right before `/gen-pr` or `/new-pr`, so the PR diff is against the latest base
- You work against a non-default base (e.g. a release or develop branch): `/sync develop`

**How to use it:**

```bash
/sync            # sync with the auto-detected base (usually origin/main)
/sync develop    # sync with develop instead
/sync release/2.4
```

A typical run: confirm the fetch → review one plan (target, ahead/behind, strategy, files to stash) → confirm once → get a sync report — then optionally push.

### /clean-up

Remove local branches marked `[gone]` (their upstream was deleted on the remote) and any worktrees attached to them.

- Shows a single deletion plan and asks for one confirmation
- Removes attached worktrees first, then deletes the branches
- Skips the current branch, `main`/`master`, and genuinely unmerged branches (reported for explicit opt-in)
- Force-deletes only branches whose content is provably in the base (squash/rebase-merged); never discards dirty worktrees or unmerged work

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

