I want to create a plugin git-commands that is going to have 3 base commnads for beginning:

1. commmit - Create a git commit following the project rules, if there is none, then follow conventional commits rules.
2. gen-pr - Generates the pr title, desc and so on showing it on the screen in markdown format following the project rules or otherwise best practices and asking if a user want it to save it to the file .md
3. clean-up - Cleans up all git branches marked as [gone] (branches that have been deleted on the remote but still exist locally), including removing associated worktrees.
