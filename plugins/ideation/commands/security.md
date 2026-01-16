---
description: Run security hardening analysis to identify vulnerabilities, risks, and security improvement opportunities
---

# Security Ideation Command

Analyze the codebase for security vulnerabilities, risks, and hardening opportunities. This runs a focused security audit covering authentication, authorization, input validation, data protection, dependencies, configuration, and secrets management.

## What This Command Does

1. **Audits dependencies** for known CVEs
2. **Scans code** for dangerous patterns (injection, XSS, etc.)
3. **Reviews configuration** for security misconfigurations
4. **Detects secrets** that may be hardcoded
5. **Generates findings** with severity and remediation

## Usage

```
/ideation:security
```

## Analysis Scope

The security analysis covers:

### OWASP Top 10
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Data Integrity Failures
- A09: Logging Failures
- A10: SSRF

### Categories
- **Authentication** - Password policies, MFA, sessions, tokens
- **Authorization** - Access controls, IDOR, privilege escalation
- **Input Validation** - SQL injection, XSS, command injection
- **Data Protection** - Encryption, PII handling, logging
- **Dependencies** - CVEs, outdated packages
- **Configuration** - Headers, debug mode, defaults
- **Secrets** - Hardcoded credentials, env handling

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

2. Only after project_index.json exists, use the Task tool to run `ideation:security-ideator` agent.

3. After completion, read and display findings:
   ```bash
   cat .claude/ideation.json | grep -A 20 '"type": "security"'
   ```

4. Present summary with severity counts.

## Output Example

```json
{
  "id": "sec-001",
  "type": "security",
  "title": "Fix SQL injection in user search",
  "description": "searchUsers() uses string concatenation with user input",
  "category": "input_validation",
  "severity": "critical",
  "affectedFiles": ["src/api/users.ts"],
  "vulnerability": "CWE-89: SQL Injection",
  "remediation": "Use parameterized queries",
  "effort": "small",
  "impact": "high"
}
```

## Severity Levels

| Severity | Risk | Examples |
|----------|------|----------|
| Critical | Immediate exploitation | SQL injection, RCE |
| High | Significant risk | XSS, CSRF, broken access |
| Medium | Moderate risk | Info disclosure, weak crypto |
| Low | Minor risk | Missing headers |
