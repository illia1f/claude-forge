---
description: Run documentation analysis to identify missing, outdated, or unclear documentation
---

# Documentation Ideation Command

Analyze the codebase for documentation gaps, outdated content, and improvement opportunities. This command reviews README, API docs, code comments, architecture documentation, and guides.

## What This Command Does

1. **Reviews README** for completeness
2. **Checks API documentation** for coverage
3. **Analyzes code comments** and docstrings
4. **Looks for architecture docs**
5. **Identifies missing guides** and tutorials
6. **Checks changelog** and versioning

## Usage

```
/ideation:docs
```

## Analysis Scope

### README & Getting Started
- Installation instructions
- Setup steps
- Prerequisites
- Quick start guide
- Troubleshooting section

### API Documentation
- Endpoint coverage
- Request/response examples
- Parameter descriptions
- Error documentation
- Authentication docs

### Code Documentation
- Function docstrings/JSDoc
- Parameter descriptions
- Return value documentation
- Usage examples
- Inline comments

### Architecture Docs
- System overview
- Component diagrams
- Data flow documentation
- Decision records (ADRs)
- Folder structure explanation

### Guides & Tutorials
- How-to guides
- Contribution guidelines
- Deployment docs
- Migration guides
- Onboarding docs

### Changelog & Versioning
- CHANGELOG file
- Version documentation
- Breaking change notes
- Deprecation notices

## Process

When the user runs this command:

1. **REQUIRED FIRST STEP** - Ensure project index exists:
   ```bash
   mkdir -p .claude/ideation
   ```

   Check if project index exists:
   ```bash
   cat .claude/ideation/project_index.json 2>/dev/null
   ```

   **If the file doesn't exist or the command fails**, you MUST first use the Task tool to run `ideation:project-analyzer` agent to create it. Wait for it to complete before proceeding.

2. Only after project_index.json exists, use the Task tool to run `ideation:documentation-ideator` agent.

3. After completion, display documentation findings:
   ```bash
   cat .claude/ideation.json | grep -A 20 '"type": "documentation"'
   ```

4. Present summary by category and audience.

## Output Example

```json
{
  "id": "doc-001",
  "type": "documentation",
  "title": "Add API authentication documentation",
  "description": "API has auth endpoints but no documentation",
  "category": "api",
  "affectedFiles": ["docs/api.md", "src/routes/auth.ts"],
  "currentState": "No authentication docs exist",
  "proposedContent": "Create auth guide: login flow, tokens, errors",
  "audience": "API consumers, frontend developers",
  "effort": "small",
  "impact": "high"
}
```

For code documentation:

```json
{
  "id": "doc-002",
  "type": "documentation",
  "title": "Add JSDoc to utility functions",
  "description": "23 exported utils, only 4 have JSDoc",
  "category": "code",
  "affectedFiles": ["src/utils/format.ts", "src/utils/validate.ts"],
  "proposedContent": "Add @param, @returns, @example to exports",
  "effort": "medium",
  "impact": "medium"
}
```

## Categories

| Category | Focus | Audience |
|----------|-------|----------|
| readme | Project intro | New users |
| api | API reference | API consumers |
| code | Inline docs | Developers |
| architecture | System design | Team members |
| guides | How-to content | Various |
| changelog | Version history | Upgraders |
