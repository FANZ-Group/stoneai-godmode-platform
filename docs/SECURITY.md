# Security — stoneai-godmode-platform

## Reporting a vulnerability

Please report security issues privately to the maintainers rather than opening a public issue.
Include reproduction steps and impact assessment.

## Secret handling

- Never commit secrets, API keys, or credentials.
- Use `.env` (gitignored) locally and a secret manager in production.
- Rotate any credential that has been exposed (see repo secret-rotation runbook).

## Supported versions

Security fixes are applied to the latest release on `main`.

## Dependencies

Run the dependency audit (`npm audit` / equivalent) before releases.
