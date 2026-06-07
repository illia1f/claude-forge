Plugin git-commands. Spec: docs/superpowers/specs/2026-06-07-git-commands-plugin-design.md

1. [x] commit - Create a git commit following the project rules, if there is none, then follow conventional commits rules. (shipped in v1)
2. [ ] gen-pr - Generates the pr title, desc and so on showing it on the screen in markdown format following the project rules or otherwise best practices and asking if a user want it to save it to the file .md
3. [ ] clean-up - Cleans up all git branches marked as [gone] (branches that have been deleted on the remote but still exist locally), including removing associated worktrees.
