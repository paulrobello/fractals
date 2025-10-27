# Security Policy

## Claude Code GitHub Actions

### Secret Management

This repository uses the `CLAUDE_CODE_OAUTH_TOKEN` secret for Claude Code integration.

#### Token Rotation Schedule

- Review and rotate the `CLAUDE_CODE_OAUTH_TOKEN` every 90 days
- Rotate immediately if:
  - A team member with access leaves
  - The token appears in logs or is potentially exposed
  - Unusual activity is detected in GitHub Actions runs

#### Token Rotation Procedure

1. Generate a new token at [claude.com/claude-code](https://claude.com/claude-code)
2. Update the `CLAUDE_CODE_OAUTH_TOKEN` secret in repository settings:
   - Go to Settings → Secrets and variables → Actions
   - Update the `CLAUDE_CODE_OAUTH_TOKEN` secret
3. Test by triggering a Claude workflow (comment `@claude hello` on a PR)
4. Document the rotation date in the repository's internal documentation

#### Monitoring

- Review GitHub Actions run history regularly for unauthorized usage
- Monitor Anthropic API usage dashboard for rate limiting or unusual patterns
- Check audit logs for secret access
- Set up notifications for workflow failures

### Workflow Security

#### Permissions

Both workflows follow the principle of least privilege:

- **claude.yml**: Has write permissions to fix issues and update PRs
- **claude-code-review.yml**: Read-only for code review, write only for PR comments

#### Safeguards

- **Timeouts**: All jobs have 15-30 minute timeout limits to prevent runaway costs
- **Concurrency controls**: Prevent parallel runs on the same PR/issue
- **Token validation**: Workflows validate the secret exists before execution
- **Path filtering**: Code review only triggers on relevant file changes

### Reporting Security Issues

If you discover a security vulnerability in this project, please:

1. **Do NOT** open a public GitHub issue
2. Contact the repository owner directly through GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Best Practices for Contributors

- Never commit secrets or API keys to the repository
- Review workflow changes carefully before merging
- Be cautious with `@claude` mentions in public PRs (usage is metered)
- Keep dependencies up to date to avoid known vulnerabilities

### CI/CD Security

- All workflows run in GitHub-hosted runners (isolated environments)
- Workflows use specific action versions (not `@latest`) for reproducibility
- Token permissions are scoped per job
- Secrets are never exposed in logs

### Additional Resources

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Anthropic Claude Code Action Documentation](https://github.com/anthropics/claude-code-action)
- [Managing Secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
