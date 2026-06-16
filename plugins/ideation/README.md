# Ideation Plugin for Claude Code

A multi-agent codebase ideation framework that analyzes projects for improvements across security, UI/UX, performance, code quality, documentation, and code patterns.

> **Inspiration**: This plugin was inspired by [auto_claude](https://github.com/AndyMik90/Auto-Claude) - a project that demonstrated the power of automated codebase analysis workflows.

## Installation

### From Claude Forge Marketplace

```bash
# Add the marketplace
/plugin marketplace add illia1f/claude-forge

# Install the plugin
/plugin install ideation@claude-forge
```

### Local Development

```bash
claude --plugin-dir ./plugins/ideation
```

## Commands

### Run All Analysis Types

```bash
/ideation:ideate
```

Runs the domain agents in parallel (skipping UI/UX for projects without a UI) and merges their findings into `.claude/forge/ideation/ideation.json`.

### Individual Analysis Commands

| Command                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `/ideation:security`     | Security vulnerabilities, risks, and hardening opportunities |
| `/ideation:ui-ux`        | Usability, accessibility, and visual improvements            |
| `/ideation:performance`  | Speed, memory, and efficiency optimizations                  |
| `/ideation:code-quality` | Code smells, complexity, and maintainability                 |
| `/ideation:docs`         | Documentation gaps and improvements                          |
| `/ideation:improvements` | Code-revealed feature opportunities                          |

## Output

All findings end up in `.claude/forge/ideation/ideation.json`. Full field reference: [skills/ideate/references/schema.md](skills/ideate/references/schema.md).

```json
{
  "lastUpdated": "2026-01-16T12:00:00Z",
  "ideas": [
    {
      "id": "sec-001",
      "type": "security",
      "title": "Fix SQL injection in user search",
      "description": "searchUsers() builds SQL via string concatenation with user input",
      "rationale": "Unsanitized input lets an attacker read or modify arbitrary rows",
      "category": "input_validation",
      "affectedFiles": ["src/api/users.ts"],
      "severity": "critical",
      "effort": "small",
      "impact": "high",
      "status": "new",
      "createdAt": "2026-01-16T12:00:00Z"
    }
  ],
  "summary": {
    "total": 24,
    "byType": {
      "security": 5,
      "ui_ux": 4,
      "performance": 3,
      "code_quality": 6,
      "documentation": 3,
      "code_improvements": 3
    },
    "byEffort": { "trivial": 4, "small": 8, "medium": 7, "large": 4, "complex": 1 },
    "byImpact": { "low": 3, "medium": 12, "high": 9 }
  }
}
```

## Analysis Types

### Security (`/ideation:security`)

Covers OWASP Top 10 and more:

- Authentication & Authorization
- Input Validation (injection, XSS)
- Data Protection
- Dependencies (CVEs)
- Configuration & Secrets

Severity levels: critical, high, medium, low

### UI/UX (`/ideation:ui-ux`)

- Usability issues
- Accessibility (WCAG compliance)
- Visual consistency
- Interaction design
- Responsive design
- Performance perception (loading states)

### Performance (`/ideation:performance`)

- Bundle size optimization
- Runtime performance
- Data fetching patterns (N+1, caching)
- Asset loading
- Database/API efficiency

### Code Quality (`/ideation:code-quality`)

- Complexity (god classes, long methods)
- Duplication (DRY violations)
- Naming and clarity
- Error handling
- Testing coverage
- Type safety
- Dead code

### Documentation (`/ideation:docs`)

- README completeness
- API documentation
- Code comments/docstrings
- Architecture docs
- Guides and tutorials
- Changelog

### Code Improvements (`/ideation:improvements`)

Discovers opportunities the code reveals:

- Pattern extensions (reuse existing patterns)
- Architecture opportunities
- Configuration options
- Utility enhancements
- UI enhancements following existing patterns

Effort levels: trivial, small, medium, large, complex

## Agents

The plugin includes 7 specialized agents:

| Agent                       | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `project-analyzer`          | Creates project index with tech stack and patterns |
| `security-ideator`          | Security vulnerability analysis                    |
| `ui-ux-ideator`             | UI/UX improvement analysis                         |
| `performance-ideator`       | Performance optimization analysis                  |
| `code-quality-ideator`      | Code quality analysis                              |
| `documentation-ideator`     | Documentation gap analysis                         |
| `code-improvements-ideator` | Code-revealed opportunities                        |

Agents are invoked by the plugin skills, not directly. Each ideator writes its findings to its own shard file (`.claude/forge/ideation/findings-<type>.json`) — never to the shared `.claude/forge/ideation/ideation.json` — so parallel agents can't overwrite each other's results.

## How It Works

1. **Project analysis**: The invoking skill ensures `.claude/forge/ideation/project_index.json` exists (and re-runs `project-analyzer` when it's stale), so agents have project structure, tech stack, and patterns to work from.

2. **Specialized analysis**: Each agent loads the project index and the existing `.claude/forge/ideation/ideation.json` (to skip already-reported ideas and continue ID numbering), analyzes its domain, and writes its own shard under `.claude/forge/ideation/`.

3. **Merge in the skill**: After the agent(s) return, the skill merges the shard(s) into `.claude/forge/ideation/ideation.json`: an idea with an existing `type` + `title` is a duplicate and the existing entry is kept (preserving its user-edited `status`); new ideas are appended with IDs continuing from the highest existing number per prefix; the `summary` is recomputed and `lastUpdated` set. See [skills/ideate/references/schema.md](skills/ideate/references/schema.md).

4. **Incremental updates**: Because merging dedupes on `type` + `title` and never overwrites existing entries, repeated runs add new findings without losing previous ones or your status edits.

## Best Practices

1. **Start with full analysis** (`/ideation:ideate`) to get comprehensive view
2. **Run specific types** when focusing on one area
3. **Review regularly** as codebase evolves
4. **Act on high-impact items** first
5. **Track status** by updating idea status in JSON

## File Structure

```
.claude/forge/ideation/
├── project_index.json        # Project structure analysis
├── ideation.json             # All ideation findings (merged)
└── findings-<type>.json      # Per-agent shards (transient, deleted after merge)
```

## Requirements

- Claude Code CLI
- Project with recognizable structure (has package.json, requirements.txt, etc.)
- `jq` recommended for displaying/merging results (optional — skills fall back to reading the JSON directly)

## License

MIT
