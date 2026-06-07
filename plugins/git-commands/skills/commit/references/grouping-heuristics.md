# Grouping Heuristics

## Detection signals

Treat changes as potentially unrelated when **two or more** of these fire:

1. **Different top-level directories** that do not ship together (e.g. `plugins/a/` and `docs/`); monorepo packages count as different areas
2. **Different change natures** — feat + fix + docs + config mixed in one diff
3. **No shared identifiers** — the diffs do not reference each other's functions, types, or files
4. **Generated noise alongside source** — lockfiles or build output mixed with source changes (group generated files with the source change that caused them, never as their own commit)

One logical change touching many files (a rename, an API change rippling through callers) is **one** group — shared identifiers, single cause.

## Building the split plan

1. Group files by cause: what single change explains this set?
2. Prefer fewer, larger groups: a group earns its own commit only if it could be reverted or cherry-picked independently **and** its message says something the other groups' messages don't. When in doubt, fold the group into its nearest relative.
3. Merge groups of the same nature: several unrelated docs tweaks become one `docs:` commit, several config touches one `chore:` commit — even when the files don't reference each other.
4. Order groups by dependency: a fix the feature relies on commits before the feature.
5. Draft per group: file list + commit message in the Phase 2 convention. Two to four groups is the normal outcome; more than five suggests over-splitting.

## Presenting the plan

Show a table and ask:

| #   | Commit message                           | Files                                       |
| --- | ---------------------------------------- | ------------------------------------------- |
| 1   | fix(auth): handle expired session tokens | src/auth/middleware.ts, src/auth/session.ts |
| 2   | docs: fix README typos                   | README.md                                   |

Options: approve the split, edit the groups, or collapse to a single commit. The user decides — never split silently.

## Executing an approved split

For each group in order:

1. Before each group after the first, clear residual staging: `git restore --staged .`
2. Stage the group: `git add <group files>`
3. Commit with the group's message
4. Verify with `git log -1 --stat`, then continue to the next group

If the user had pre-staged a subset and approved a split of it, preserve their file selection within the groups — do not pull unstaged files into the split. Files excluded by the Phase 3 security gate are already de-staged — never re-include them when building groups.

If a hook fails mid-split: stop, do not attempt the remaining groups, and report which groups committed and which files remain unstaged. Load `references/commit-edge-cases.md` for hook diagnosis. Never silently abandon a partial split.
