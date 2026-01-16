---
description: Run comprehensive codebase ideation across all analysis types (security, UI/UX, performance, code quality, documentation, code improvements)
---

# Comprehensive Ideation Command

Run a complete ideation analysis of the current project. This command orchestrates 6 domain-specific agents (out of 8 total plugin agents) to analyze different aspects of your codebase and generate improvement ideas.

## What This Command Does

1. **Analyzes project structure** - Creates a project index with tech stack and patterns
2. **Runs 6 specialized agents in parallel**:
   - Security hardening analysis
   - UI/UX improvements
   - Performance optimizations
   - Code quality issues
   - Documentation gaps
   - Code improvement opportunities
3. **Merges all findings** into `.claude/ideation.json`
4. **Provides summary** of all discovered opportunities

## Usage

```
/ideation:ideate
```

## Process

When the user runs this command:

1. First, check if a project index exists:
   ```bash
   cat .claude/ideation/project_index.json 2>/dev/null
   ```

   If not, run the `ideation:project-analyzer` agent first to create it.

2. Initialize the output directory:
   ```bash
   mkdir -p .claude/ideation
   ```

3. Use the Task tool to spawn all 6 ideation agents **in parallel** (single message, multiple tool calls):
   - `ideation:security-ideator`
   - `ideation:ui-ux-ideator`
   - `ideation:performance-ideator`
   - `ideation:code-quality-ideator`
   - `ideation:documentation-ideator`
   - `ideation:code-improvements-ideator`

4. After all agents complete, read and summarize results:
   ```bash
   cat .claude/ideation.json
   ```

5. Present a summary to the user with counts by type and highlights.

## Output

All findings are saved to `.claude/ideation.json` with this structure:

```json
{
  "project": "project-name",
  "lastUpdated": "ISO timestamp",
  "ideas": [
    {
      "id": "type-001",
      "type": "security|ui_ux|performance|code_quality|documentation|code_improvements",
      "title": "Short title",
      "description": "Detailed description",
      "effort": "trivial|small|medium|large|complex",
      "impact": "low|medium|high",
      "status": "new",
      "createdAt": "ISO timestamp"
    }
  ],
  "summary": { ... }
}
```

## Individual Commands

To run a specific analysis type instead of all:
- `/ideation:security` - Security analysis only
- `/ideation:ui-ux` - UI/UX analysis only
- `/ideation:performance` - Performance analysis only
- `/ideation:code-quality` - Code quality analysis only
- `/ideation:docs` - Documentation analysis only
- `/ideation:improvements` - Code improvements only
