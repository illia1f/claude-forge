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

Runs all 6 specialized agents in parallel and merges results into `.claude/ideation.json`.

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

All findings are saved to `.claude/ideation.json`:

```json
{
  "project": "my-project",
  "lastUpdated": "2026-01-16T12:00:00Z",
  "ideas": [
    {
      "id": "sec-001",
      "type": "security",
      "title": "Fix SQL injection vulnerability",
      "description": "...",
      "severity": "critical",
      "effort": "small",
      "impact": "high",
      "status": "new"
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
    }
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

The plugin includes 8 specialized agents:

| Agent                       | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `project-analyzer`          | Creates project index with tech stack and patterns |
| `ideation-orchestrator`     | Coordinates all agents for full analysis           |
| `security-ideator`          | Security vulnerability analysis                    |
| `ui-ux-ideator`             | UI/UX improvement analysis                         |
| `performance-ideator`       | Performance optimization analysis                  |
| `code-quality-ideator`      | Code quality analysis                              |
| `documentation-ideator`     | Documentation gap analysis                         |
| `code-improvements-ideator` | Code-revealed opportunities                        |

## How It Works

1. **Project Analysis**: First run creates `.claude/ideation/project_index.json` with project structure, tech stack, and patterns.

2. **Specialized Analysis**: Each agent analyzes its domain using targeted searches, pattern matching, and code inspection.

3. **Result Merging**: Findings are merged into `.claude/ideation.json`, preserving history and avoiding duplicates.

4. **Incremental Updates**: Subsequent runs add new findings without losing previous ones.

## Best Practices

1. **Start with full analysis** (`/ideation:ideate`) to get comprehensive view
2. **Run specific types** when focusing on one area
3. **Review regularly** as codebase evolves
4. **Act on high-impact items** first
5. **Track status** by updating idea status in JSON

## File Structure

```
.claude/
├── ideation/
│   └── project_index.json    # Project structure analysis
└── ideation.json             # All ideation findings
```

## Requirements

- Claude Code CLI
- Project with recognizable structure (has package.json, requirements.txt, etc.)

## License

MIT
