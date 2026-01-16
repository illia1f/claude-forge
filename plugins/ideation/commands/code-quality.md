---
description: Run code quality analysis to identify code smells, complexity issues, and maintainability improvements
---

# Code Quality Ideation Command

Analyze the codebase for code smells, complexity issues, and maintainability improvements. This command reviews code structure, duplication, naming, error handling, testing, and type safety.

## What This Command Does

1. **Finds complexity issues** (large files, deep nesting)
2. **Detects duplication** and DRY violations
3. **Reviews naming** and clarity
4. **Checks error handling** patterns
5. **Evaluates test coverage** and quality
6. **Analyzes type safety** (any abuse, missing types)
7. **Identifies dead code**

## Usage

```
/ideation:code-quality
```

## Analysis Scope

### Complexity
- Functions exceeding 50 lines
- Deep nesting (>3 levels)
- High cyclomatic complexity
- Complex conditionals
- God classes/modules

### Duplication
- Copy-pasted code blocks
- Similar logic in multiple places
- Repeated patterns that need abstraction

### Naming & Clarity
- Unclear variable/function names
- Misleading names
- Inconsistent naming conventions
- Magic numbers/strings

### Structure
- Circular dependencies
- Poor module organization
- Missing separation of concerns
- Tight coupling

### Error Handling
- Swallowed exceptions
- Missing error boundaries
- Inconsistent error patterns

### Testing
- Missing test coverage
- Untested edge cases
- Brittle tests

### Type Safety
- Excessive `any` usage
- Missing type definitions
- Unsafe type assertions

### Dead Code
- Unused functions/variables
- Commented-out code
- Unreachable code paths

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

2. Only after project_index.json exists, use the Task tool to run `ideation:code-quality-ideator` agent.

3. After completion, display code quality findings:
   ```bash
   cat .claude/ideation.json | grep -A 20 '"type": "code_quality"'
   ```

4. Present summary by category.

## Output Example

```json
{
  "id": "cq-001",
  "type": "code_quality",
  "title": "Refactor UserService - exceeds 500 lines",
  "description": "UserService.ts has 523 lines with 15 methods",
  "category": "complexity",
  "affectedFiles": ["src/services/UserService.ts"],
  "codeSmell": "God Class",
  "currentState": "Single 523-line file with mixed responsibilities",
  "proposedRefactor": "Split into AuthService, ProfileService, NotificationService",
  "effort": "medium",
  "impact": "high"
}
```

For type safety:

```json
{
  "id": "cq-002",
  "type": "code_quality",
  "title": "Remove 'any' types from API handlers",
  "description": "Found 12 instances of 'any' in API response handling",
  "category": "type_safety",
  "affectedFiles": ["src/api/client.ts", "src/hooks/useApi.ts"],
  "currentState": "API responses typed as 'any'",
  "proposedFix": "Create response interfaces, use generics",
  "effort": "small",
  "impact": "medium"
}
```

## Categories

| Category | Focus | Code Smells |
|----------|-------|-------------|
| complexity | Simplification | God class, long method |
| duplication | DRY | Copy-paste, repeated logic |
| naming | Readability | Unclear names, magic values |
| structure | Architecture | Circular deps, coupling |
| error_handling | Robustness | Swallowed errors |
| testing | Test quality | Missing coverage |
| type_safety | Type correctness | any abuse |
| dead_code | Cleanup | Unused code |
