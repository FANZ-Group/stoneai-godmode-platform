# Contributing — stoneai-godmode-platform

## Getting started

1. Clone the repository.
2. Install dependencies (see README.md).
3. Copy `.env.example` to `.env` and fill in values.
4. Run the test suite before submitting changes.

## Branching

- `main` is the default branch and is protected.
- Create feature branches: `feat/<short-description>`, `fix/<short-description>`.

## Commit messages

Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.

## Pull requests

- Keep PRs focused on one concern.
- Include tests for new behavior.
- Ensure CI (lint, typecheck, tests) passes before requesting review.

## Code style

- Follow the existing style; linter/formatter config is committed.
- No committed secrets; use environment variables.
