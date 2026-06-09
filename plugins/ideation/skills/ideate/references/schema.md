# Ideation findings — schema and merge procedure

Single source of truth for the findings format. Agents write shards under `.claude/ideation/`; the invoking skill (in the main conversation) merges them into `.claude/ideation.json`. Agents never touch the merged file — parallel agents writing one file lose each other's work.

## Types, prefixes, shards

| Type                | ID prefix | Shard file (in `.claude/ideation/`) | Agent                       |
| ------------------- | --------- | ----------------------------------- | --------------------------- |
| `security`          | `sec-`    | `findings-security.json`            | `security-ideator`          |
| `ui_ux`             | `ux-`     | `findings-ui-ux.json`               | `ui-ux-ideator`             |
| `performance`       | `perf-`   | `findings-performance.json`         | `performance-ideator`       |
| `code_quality`      | `cq-`     | `findings-code-quality.json`        | `code-quality-ideator`      |
| `documentation`     | `doc-`    | `findings-documentation.json`       | `documentation-ideator`     |
| `code_improvements` | `ci-`     | `findings-improvements.json`        | `code-improvements-ideator` |

## Idea object

Required fields:

```json
{
  "id": "sec-001",
  "type": "security",
  "title": "Fix SQL injection in user search",
  "description": "searchUsers() builds SQL via string concatenation with user input",
  "rationale": "Why this matters",
  "category": "input_validation",
  "affectedFiles": ["src/api/users.ts"],
  "effort": "trivial|small|medium|large|complex",
  "impact": "low|medium|high",
  "status": "new",
  "createdAt": "<ISO 8601 timestamp>"
}
```

`status` is user-owned after creation (`new` → e.g. `accepted`, `in_progress`, `done`, `rejected`); agents always write `new`, and the merge must never overwrite an existing entry's `status`.

Type-specific optional fields:

| Type                | Extra fields                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `security`          | `severity` (critical/high/medium/low), `vulnerability` (CWE), `currentRisk`, `remediation`, `references` |
| `ui_ux`             | `wcagCriteria`, `currentState`, `proposedState`, `implementation`                              |
| `performance`       | `currentPerformance`, `expectedImprovement`, `implementation`, `metrics`, `currentSize`, `expectedSize` |
| `code_quality`      | `codeSmell`, `currentState`, `proposedRefactor` or `proposedFix`                               |
| `documentation`     | `currentState`, `proposedContent`, `audience`                                                  |
| `code_improvements` | `buildsUpon`, `existingPatterns`, `implementation`                                             |

## Shard format

Each agent writes ONLY its own shard — an object with a single `ideas` array containing ideas of one type:

```json
{ "ideas": [] }
```

## Merged file — `.claude/ideation.json`

```json
{
  "lastUpdated": "<ISO 8601 timestamp>",
  "ideas": [],
  "summary": {
    "total": 24,
    "byType": { "security": 5, "ui_ux": 4, "performance": 3, "code_quality": 6, "documentation": 3, "code_improvements": 3 },
    "byEffort": { "trivial": 4, "small": 8, "medium": 7, "large": 4, "complex": 1 },
    "byImpact": { "low": 3, "medium": 12, "high": 9 }
  }
}
```

## Merge procedure (run by the skill, never by agents)

1. If `.claude/ideation.json` is missing or invalid JSON, initialize it as `{"ideas": [], "summary": {}, "lastUpdated": null}`.
2. For each idea in the shard: it is a **duplicate** when an existing idea has the same `type` and `title` → keep the existing entry unchanged (this preserves user-edited `status`) and discard the incoming one. Otherwise append.
3. On append, make the ID continue from the highest existing number for that prefix (`sec-004` exists → next appended idea is `sec-005`); renumber the incoming idea on collision.
4. Recompute `summary` from scratch: `total`, `byType`, `byEffort`, `byImpact`.
5. Set `lastUpdated` to now, write the file, then delete the merged shard(s).
