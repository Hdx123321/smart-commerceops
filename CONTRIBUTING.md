# Smart CommerceOps Collaboration Guide

## Repository Scope

Use `smart-commerceops` as the Git repository root.

## Roles

- Codex owns `backend/**`, `infra/**`, `docker-compose.yml`, `.env.example`, CI, deployment, and integration coordination.
- Claude owns `frontend/**` and frontend-specific documentation updates.
- Shared files such as `README.md` must be edited only in the relevant section for each owner.

## Branch Strategy

- `main`: release-ready branch only.
- `integration`: shared integration branch for active work.
- `codex/be-<issue-slug>`: backend and platform work branches.
- `claude/fe-<issue-slug>`: frontend work branches.
- `ops/chore-<issue-slug>`: repo hygiene, docs, or CI-only changes.

## Working Rules

- One issue per branch.
- One pull request per issue.
- Claude must not directly modify `backend/**`, `infra/**`, or container orchestration.
- Codex should treat frontend API expectations as a contract and avoid breaking `frontend/src/api/**` and `frontend/src/types.ts` without a tracked contract change.
- Any API shape change must have a `contract-change` label and be described in the PR.

## Ownership Boundaries

- Frontend owner:
  `frontend/**`
- Backend owner:
  `backend/**`
- Platform owner:
  `infra/**`, `docker-compose.yml`, `.github/**`

## Pull Request Flow

1. Create or assign a GitHub issue.
2. Branch from `integration`.
3. Implement only the scoped change.
4. Run local verification relevant to the change.
5. Open PR into `integration`.
6. Add labels:
   `frontend`, `backend`, `integration`, `contract-change`, `ready-for-review`, `blocked`
7. Merge to `main` only from a reviewed and working `integration`.

## Sync Protocol

- Codex is the integration owner and must notify Claude after any backend, contract, container, CI, or environment change that affects frontend work.
- Claude must notify Codex after any frontend change that introduces a new backend expectation, route dependency, payload assumption, or auth behavior.
- High-priority sync events:
  - endpoint or payload changes
  - auth or token behavior changes
  - port, URL, or CORS changes
  - Docker or environment variable changes
  - branch or GitHub workflow changes
- The sync message must include:
  - what changed
  - what file or endpoint is affected
  - what Claude should stop assuming
  - how to validate the new behavior

## Minimum Verification

- Frontend changes:
  `npm run build`
- Backend changes:
  `mvn test`
- Container or environment changes:
  `docker compose up --build`

## Definition Of Done

- Builds pass.
- The changed workflow is manually verified.
- Any API or env var changes are documented.
- PR includes risk and validation notes.
