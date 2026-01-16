---
description: Run code improvements analysis to discover feature opportunities by analyzing existing patterns and architecture
---

# Code Improvements Ideation Command

Analyze the codebase to discover code-revealed improvement opportunities. This command finds features and improvements that naturally emerge from existing patterns, architecture, and infrastructure.

## What This Command Does

1. **Discovers existing patterns** that can be extended
2. **Identifies architecture opportunities** for new features
3. **Finds configuration options** that could be exposed
4. **Locates utilities** that could be enhanced
5. **Suggests UI enhancements** based on existing patterns
6. **Proposes data handling improvements**

## Key Principle

Find opportunities the **code reveals**. These are features that naturally emerge from understanding what patterns exist and how they can be extended or applied elsewhere.

**This is NOT strategic product planning** - it focuses on what the CODE tells you is possible.

## Usage

```
/ideation:improvements
```

## Analysis Scope

### Pattern Extensions (trivial → medium)
- CRUD for one entity → CRUD for similar entity
- Filter for one field → Filters for more fields
- Export to CSV → Export to JSON/Excel
- Sort by one column → Sort by multiple

### Architecture Opportunities (medium → complex)
- Data model supports feature X
- API structure enables new endpoints
- Component architecture supports new views
- State management enables new features

### Configuration/Settings (trivial → small)
- Hard-coded values → user-configurable
- Missing preferences following existing patterns
- Feature toggles extending existing patterns

### Utility Additions (trivial → medium)
- Validators that could validate more cases
- Formatters that could handle more formats
- Helpers with related helpers

### UI Enhancements (trivial → medium)
- Missing loading states (pattern exists)
- Missing empty states (pattern exists)
- Keyboard shortcuts (pattern exists)

### Data Handling (small → large)
- Lists that could have pagination
- Forms that could auto-save
- Data that could have search

### Infrastructure Extensions (medium → complex)
- Plugin points not fully utilized
- Event systems with new event types
- Caching that could cache more

## Effort Levels

| Level | Scope | Example |
|-------|-------|---------|
| trivial | 1-2 hours | Add search (exists elsewhere) |
| small | Half day | Add filter type (pattern exists) |
| medium | 1-3 days | New CRUD entity (CRUD exists) |
| large | 3-7 days | Webhook support (events + HTTP exist) |
| complex | 1-2 weeks | Multi-tenant (data layer supports) |

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

2. Only after project_index.json exists, use the Task tool to run `ideation:code-improvements-ideator` agent.

3. After completion, display improvement findings:
   ```bash
   cat .claude/ideation.json | grep -A 20 '"type": "code_improvements"'
   ```

4. Present summary by effort level.

## Output Example

```json
{
  "id": "ci-001",
  "type": "code_improvements",
  "title": "Add search to user list",
  "description": "User list lacks search, but ProductList has it",
  "category": "pattern_extension",
  "buildsUpon": ["ProductList search", "useSearch hook"],
  "affectedFiles": ["src/components/UserList.tsx"],
  "existingPatterns": ["src/components/ProductList.tsx"],
  "implementation": "Import useSearch, add SearchInput, filter by name/email",
  "effort": "trivial",
  "impact": "medium"
}
```

For larger opportunities:

```json
{
  "id": "ci-002",
  "type": "code_improvements",
  "title": "Add webhook support using event system",
  "description": "EventEmitter exists, can be extended for webhooks",
  "category": "infrastructure",
  "buildsUpon": ["EventEmitter", "HTTP client"],
  "existingPatterns": ["src/events/emitter.ts", "src/utils/http.ts"],
  "implementation": "WebhookManager subscribes to events, POSTs to URLs",
  "effort": "large",
  "impact": "high"
}
```

## Good vs Bad Improvements

**Good** (code-revealed):
- Add search to list (search exists elsewhere)
- Add CSV export (JSON export exists)
- Add pagination (pattern exists)

**Bad** (not code-revealed):
- Add real-time collab (no WebSocket infra)
- Add AI suggestions (no ML integration)
- Add feature because users want it (product decision)
