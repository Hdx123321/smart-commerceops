# Smart CommerceOps Agent Setup Flow

This document is the project-level agent bootstrap flow for Weknora or any shared project memory system.

## Project Identity

- Repository: `https://github.com/Hdx123321/smart-commerceops`
- Repository root: `smart-commerceops`
- Shared branch for active work: `integration`
- Release branch: `main`

## Agent Roles

- Codex:
  backend owner, platform owner, container owner, CI owner, integration owner
- Claude:
  frontend owner

## Ownership Boundaries

- Claude may change:
  `frontend/**`, frontend tests, frontend-specific README sections
- Codex may change:
  `backend/**`, `infra/**`, `.github/**`, `docker-compose.yml`, deployment, CI, environment wiring

## Mandatory Startup Checks

1. Confirm the active repository root is `smart-commerceops`.
2. Read `CONTRIBUTING.md`.
3. Read `README.md`.
4. Confirm branch base is `integration`.
5. Confirm Docker Compose is the default full-stack runtime.
6. Confirm frontend API base is the gateway, not individual services.

## MCP And Tooling Context

- Sense project MCP is configured in the parent project `.mcp.json`
- Sense command:
  `wsl bash -c "cd '/mnt/c/Users/14188/Desktop/CA_Team4/SpringBoot_CA' && /home/hyc/.local/bin/sense mcp"`
- Weknora MCP endpoint:
  `http://localhost:8082/mcp`

## Runtime Model

- Preferred full stack:
  `docker compose up --build`
- Main entrypoints:
  - frontend: `http://localhost:3000`
  - gateway: `http://localhost:8090`
  - identity: `8092`
  - catalog: `8093`
  - order: `8094`
  - analytics: `8095`

## GitHub Workflow

1. Create or assign issue.
2. Branch from `integration`.
3. Use branch naming:
   - `claude/fe-<issue-slug>`
   - `codex/be-<issue-slug>`
4. Open PR back to `integration`.
5. Merge to `main` only after integration verification.

## Required Labels

- `frontend`
- `backend`
- `integration`
- `contract-change`
- `ready-for-review`
- `blocked`

## Sync Rules

- Codex must sync Claude after:
  - API contract changes
  - auth behavior changes
  - port, CORS, URL, or env changes
  - Docker or CI changes
- Claude must sync Codex after:
  - new backend assumptions
  - route or auth expectation changes
  - payload shape expectations

## Validation Rules

- Frontend:
  `npm run build`
- Backend:
  `mvn test`
- Full stack:
  `docker compose up --build`

## Current Practical Notes

- Docker is installed locally and usable through Docker Desktop.
- The current default Docker stack does not boot Kafka because event producers and consumers are not implemented yet.
- Gateway CORS has already been fixed for browser registration/login flows.
- Registration and login errors are surfaced to the frontend.
