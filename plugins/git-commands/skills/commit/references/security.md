# Secret Detection Protocol

Loaded when a candidate file or diff line matches the suspicion patterns in SKILL.md Phase 3, gate 5.

## Filename patterns (case-insensitive)

- `.env`, `.env.*` — except `.env.example`, `.env.template`, `.env.sample` containing only placeholder values
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`
- `id_rsa*`, `id_ed25519*`, `*.ppk`
- `*credentials*`, `*secrets*`
- `.npmrc` — when it contains `_authToken=` or `_password=` with a non-placeholder value; `.pypirc` — when it contains `password =` or `token =` with a non-placeholder value

## Content patterns

- Assignments to names containing `key`, `token`, `secret`, `password`, `passwd`, `authorization`, `auth_token` where the value is a literal string ≥ 16 chars and not a placeholder (`changeme`, `<your-key>`, `xxx`, `***`); a bare `auth` fragment (e.g. `authMethod`, `isAuthenticated`) is not enough on its own
- Known prefixes: `sk-ant-` (Anthropic), `sk-` with ≥ 40 total chars (OpenAI-style), `ghp_`, `gho_`, `github_pat_` (GitHub), `xoxb-`, `xoxp-` (Slack), `AKIA` (AWS access key), `AIza` (Google), `sk_live_` (Stripe), `-----BEGIN ... PRIVATE KEY-----`
- Base64/hex blobs ≥ 40 chars assigned to credential-named variables

## False positives — do NOT flag

- Example/template files with placeholder values
- Test fixtures with clearly fake values (`test-key-123`, `dummy-token`)
- Public keys (`*.pub`, `-----BEGIN PUBLIC KEY-----`)
- Integrity hashes in lockfiles

## Protocol on hit

1. Exclude the file from the commit: `git restore --staged <file>` if staged, or skip it when staging.
2. Continue committing the remaining files. If every candidate file was excluded, abort — never create an empty commit.
3. Report to the user: the file, the matched pattern, why it was excluded.
4. Suggest follow-ups: add the file to `.gitignore` if appropriate; rotate the secret if it was committed in earlier history.
5. **User override:** if the user explicitly says to include the file, comply — state the risk once, do not argue or refuse.
