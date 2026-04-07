# Contributing to Stellar Financial Audit

Thanks for contributing! This document describes contribution guidelines and the workflow for this project.

## Contribution Guidelines

- Open an issue before implementing larger features.
- Keep pull requests small and focused.
- Write tests for new features and bug fixes.
- Maintain consistent formatting and naming conventions.

## Branch Naming

Use clear branch names, for example:

- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`
- `docs/<short-description>`

## Commit Message Format

Use conventional commits style:

- `feat: add audit scan for suspicious transactions`
- `fix: resolve JWT token refresh bug`
- `chore: update dependency versions`
- `docs: improve README and API docs`

## Code Style Rules

- Use TypeScript with strict typing enabled.
- Prefer async/await over callbacks.
- Keep services modular and reusable.
- Use descriptive variable names.
- Add inline comments for complex logic.
- Keep controllers thin; business logic belongs in services.

## Pull Request Process

1. Create a feature branch from `main`.
2. Write tests for your changes.
3. Update documentation if the API changes.
4. Open a PR with a clear description and list of changes.
5. Request review from another team member.
6. Address feedback and merge after approval.
