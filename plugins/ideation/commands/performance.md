---
description: Run performance analysis to identify optimization opportunities for speed, memory, and efficiency
---

# Performance Ideation Command

Analyze the codebase for performance bottlenecks, optimization opportunities, and efficiency improvements. This command reviews bundle size, runtime performance, data fetching, caching, and asset loading.

## What This Command Does

1. **Analyzes bundle size** for large dependencies
2. **Reviews runtime code** for expensive operations
3. **Checks data fetching** for N+1 and overfetching
4. **Evaluates caching** strategies
5. **Generates findings** with expected improvements

## Usage

```
/ideation:performance
```

## Analysis Scope

### Bundle Size
- Large dependencies (moment.js, lodash full)
- Missing tree-shaking
- Unnecessary polyfills
- Unoptimized imports
- Duplicate dependencies

### Runtime Performance
- Expensive computations in render paths
- Missing memoization (useMemo, useCallback)
- Unnecessary re-renders
- Inefficient algorithms
- Memory leaks

### Data Fetching
- N+1 query patterns
- Missing request batching
- Overfetching data
- Missing pagination
- No request deduplication

### Caching
- Missing cache layers
- Cache invalidation issues
- No HTTP caching headers
- Missing memoization

### Asset Loading
- Unoptimized images
- Missing lazy loading
- No code splitting
- Render-blocking resources

### Database/API
- Missing indexes
- Slow queries
- Unnecessary JOINs
- Missing connection pooling

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

2. Only after project_index.json exists, use the Task tool to run `ideation:performance-ideator` agent.

3. After completion, display performance findings:
   ```bash
   cat .claude/ideation.json | grep -A 20 '"type": "performance"'
   ```

4. Present summary with potential improvements.

## Output Example

```json
{
  "id": "perf-001",
  "type": "performance",
  "title": "Add memoization to expensive filter",
  "description": "filterProducts() recalculates on every render",
  "category": "runtime",
  "affectedFiles": ["src/components/ProductList.tsx"],
  "currentPerformance": "Filter runs every render (~50ms)",
  "expectedImprovement": "Only runs when inputs change",
  "implementation": "Wrap with useMemo, deps: [products, filters]",
  "effort": "trivial",
  "impact": "medium"
}
```

For bundle size issues:

```json
{
  "id": "perf-002",
  "type": "performance",
  "title": "Replace moment.js with date-fns",
  "description": "moment.js adds ~300KB to bundle",
  "category": "bundle_size",
  "currentSize": "~300KB",
  "expectedSize": "~10KB (tree-shaken)",
  "effort": "medium",
  "impact": "high"
}
```

## Categories

| Category | Focus | Metrics |
|----------|-------|---------|
| bundle_size | JS/CSS size | KB saved |
| runtime | Execution speed | ms saved |
| data_fetching | Network efficiency | Requests reduced |
| caching | Cache strategy | Cache hit rate |
| asset_loading | Resource loading | LCP improvement |
| database | Query performance | Query time |
