# Conventional Commits (fallback format)

## Format

```
type(scope): subject

body

footer
```

Subject line is mandatory; body and footer only when needed.

## Types

| Type     | Use for                                                                         |
| -------- | ------------------------------------------------------------------------------- |
| feat     | new user-facing capability                                                      |
| fix      | bug fix                                                                         |
| docs     | documentation only                                                              |
| refactor | code restructuring, no behavior change                                          |
| perf     | performance improvement                                                         |
| test     | adding or fixing tests                                                          |
| build    | build system or dependency changes                                              |
| ci       | CI configuration                                                                |
| chore    | maintenance not covered above                                                   |
| style    | formatting only (what a formatter would change), no logic change                |
| revert   | reverting a previous commit — body identifies it: `This reverts commit <hash>.` |

## Rules

- Subject ≤ 50 chars (Git display convention, not a spec rule — go a few chars over rather than lose clarity), imperative mood ("add", not "added" or "adds"), lowercase after the colon (house style), no trailing period
- Scope is optional — the touched area (`feat(auth): ...`); skip it when it adds nothing
- Body only when the why is not obvious from the subject; wrap at 72 chars; explain **why**, not what — the diff already shows what
- Breaking change: add `!` after type/scope; a `BREAKING CHANGE: <description>` footer with migration details is required only when `!` is absent, optional otherwise
- Footers: issue references (`Closes #123`, `Refs #456`), separated from the subject or body by a blank line

## Examples

```
feat(commit): add secret scanning gate
```

```
fix(parser): handle CRLF line endings in diff output

Windows checkouts produce CRLF; the regex anchored on \n only,
so the last line of each hunk was dropped.
```

```
refactor!: drop support for config v1

BREAKING CHANGE: config files must be migrated to the v2 schema
before upgrading.
```
