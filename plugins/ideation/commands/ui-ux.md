---
description: Run UI/UX analysis to identify usability issues, accessibility gaps, and visual improvements
---

# UI/UX Ideation Command

Analyze the user interface for usability issues, accessibility gaps, and visual improvement opportunities. This command reviews components, interactions, and design consistency.

## What This Command Does

1. **Reviews components** for consistency and patterns
2. **Checks accessibility** against WCAG guidelines
3. **Analyzes interactions** for missing states and feedback
4. **Evaluates visual design** for consistency
5. **Generates findings** with implementation suggestions

## Usage

```
/ideation:ui-ux
```

## Analysis Scope

### Usability
- Navigation clarity
- Interaction consistency
- Feedback states (loading, success, error)
- Error messaging quality
- Call-to-action clarity

### Accessibility (WCAG)
- Alt text for images
- Color contrast ratios
- Keyboard navigation
- ARIA labels and roles
- Focus management
- Screen reader compatibility

### Visual Consistency
- Spacing and layout
- Typography hierarchy
- Color palette usage
- Component variants
- Design token adherence

### Interaction Design
- Hover/focus states
- Transition animations
- Touch target sizes
- Empty states
- Loading skeletons

### Responsive Design
- Breakpoint behavior
- Mobile navigation
- Text readability
- Touch interactions

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

2. Only after project_index.json exists, use the Task tool to run `ideation:ui-ux-ideator` agent.

3. After completion, display UI/UX findings:
   ```bash
   cat .claude/ideation.json | grep -A 20 '"type": "ui_ux"'
   ```

4. Present summary grouped by category.

## Output Example

```json
{
  "id": "ux-001",
  "type": "ui_ux",
  "title": "Add loading skeletons to dashboard cards",
  "description": "Dashboard cards show empty space while loading",
  "category": "performance_perception",
  "affectedFiles": ["src/components/Dashboard/Card.tsx"],
  "currentState": "Cards render empty then pop in",
  "proposedState": "Cards show skeleton during load",
  "wcagCriteria": null,
  "effort": "small",
  "impact": "medium"
}
```

For accessibility issues:

```json
{
  "id": "ux-002",
  "type": "ui_ux",
  "title": "Add alt text to avatar images",
  "description": "User avatars lack descriptive alt text",
  "category": "accessibility",
  "wcagCriteria": "1.1.1 Non-text Content (Level A)",
  "effort": "trivial",
  "impact": "medium"
}
```

## Categories

| Category | Focus |
|----------|-------|
| usability | Task completion, clarity |
| accessibility | WCAG compliance |
| performance_perception | Perceived speed |
| visual_consistency | Design system |
| interaction_design | Micro-interactions |
| responsive_design | Multi-device |
