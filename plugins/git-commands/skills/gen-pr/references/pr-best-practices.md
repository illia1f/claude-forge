# PR best-practice structure

Loaded when Phase 2 finds no project PR template or convention. Use this as the fallback shape. Keep every section grounded in the actual diff and conversation — omit a section rather than padding it.

## Title

- One line, imperative, no trailing period.
- If the branch's commits use Conventional Commits, match it: `type(scope): summary`.
- Otherwise: a concise summary of the change, e.g. `Add retry logic to the upload client`.
- Keep it under ~70 characters so it isn't truncated in lists.

## Body

```markdown
## Summary

1–3 sentences: what this PR does and why. The "why" comes from the
conversation, not just the diff.

## Changes

- Bullet the meaningful changes, grouped by area when there are several.
- Describe behavior, not file names — reviewers can read the file list.

## Testing

- How the change was verified (commands run, manual steps, new tests).
- If not yet tested, say so explicitly rather than implying it was.

## Notes

- Anything reviewers need: trade-offs, follow-ups, breaking changes,
  migration steps, screenshots for UI work. Omit if there's nothing.
```

## Principles

- **Grounded:** every claim traceable to a commit, a diff hunk, or the conversation. No invented test results or issue links.
- **Scaled:** a one-commit PR gets a short Summary and maybe Changes; a large PR earns the full structure. Don't force empty sections.
- **Reviewer-first:** lead with intent and impact. The diff already shows the mechanics.
- **Placeholders are honest:** when the template needs something you can't determine (issue number, screenshot), leave a visible `<!-- TODO: ... -->` marker instead of guessing.
