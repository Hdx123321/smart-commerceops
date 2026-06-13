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

## Session Startup Check

Every agent session should begin with the same lightweight self-check:

1. `git fetch origin`
2. `git checkout integration`
3. `git pull origin integration`
4. Re-read this file.
5. Check open GitHub issues or PRs with label `contract-change`.
6. Review the latest entries in `Sync Log`.
7. If working on frontend, inspect changes in:
   - `frontend/src/types.ts`
   - `frontend/src/api/**`
8. If working on backend, inspect changes in:
   - `backend/**/controller/**`
   - `backend/**/dto/**`
   - `backend/**/config/**`
   - `docker-compose.yml`
   - `.env.example`

## Notification Channels

Use the following channels in descending order of importance:

1. GitHub issue with label `contract-change`
2. PR description with a `Frontend Impact` or `Backend Impact` section
3. `Sync Log` entry in this file for fast session recovery

Rules:

- Any change to API request or response shape must create or update a `contract-change` issue.
- Any change to auth, ports, CORS, env vars, startup method, or Docker topology must create a `Sync Log` entry in the same branch.
- If a change blocks the other agent immediately, add both:
  - a `contract-change` issue
  - a `Sync Log` entry

## Sync Log

Append one row for each cross-agent change. Keep newest entries at the top.

| Date | Source | Change | Affected Surface | What To Stop Assuming | Validation |
|---|---|---|---|---|---|
| 2026-06-13 | Codex | Added product detail page, merchant information fields, and product reviews; cart add moved from product list to detail page. | `catalog-service` product/review API, `frontend/src/pages/ProductsPage.tsx`, `frontend/src/pages/ProductDetailPage.tsx`, `frontend/src/App.tsx`, `frontend/src/types.ts`, `frontend/src/api/client.ts` | Do not assume Product only has catalog fields; do not place Add-to-cart actions on marketplace cards. | `mvn test`; `npm run build` |
| 2026-06-13 | Codex | Replaced generic order status workflow with shipment business states and explicit ship/confirm receipt actions. | `order-service` order API, `frontend/src/types.ts`, `frontend/src/api/client.ts`, `frontend/src/pages/OrdersPage.tsx` | Do not assume orders use `PENDING/PAID/PROCESSING/SHIPPED/CANCELLED` or arbitrary status updates; use `PENDING_SHIPMENT`, `PENDING_RECEIPT`, `COMPLETED`, `AFTER_SALES` with `ship` and `confirm-receipt`. | `mvn test`; `npm run build` |
| 2026-06-13 | Codex | Cart checkout now uses shipping address and phone number from Profile; Profile menu is the fourth signed-in tab. | `identity-service` profile fields, `frontend/src/pages/ProfilePage.tsx`, `frontend/src/pages/CartPage.tsx`, `frontend/src/App.tsx` | Do not assume Cart collects separate shipping details; users must maintain shipping address and phone number in Profile. | `mvn test`; `npm run build` |
| 2026-06-13 | Codex | Added editable user profile fields and a frontend Profile page. | `identity-service` `/auth/me`, `frontend/src/types.ts`, `frontend/src/api/client.ts`, `frontend/src/App.tsx`, `frontend/src/pages/ProfilePage.tsx` | Do not assume `UserProfile` only contains id, username, email, and role; profile updates use `PUT /auth/me`. | `mvn test`; `npm run build` |
| 2026-06-12 | Codex | Added fixed product category options and `Other` custom category handling for product creation. | `catalog-service` product API, `frontend/src/types.ts`, `frontend/src/api/client.ts`, `frontend/src/pages/ProductsPage.tsx` | Do not assume category is free text in the merchant form; when `category=Other`, send `customCategory` and store the resolved text. | `mvn test`; `npm run build` |
| 2026-06-12 | Codex | Fixed product creation semantics: omitted `active` now defaults to visible, and duplicate product names return conflict. | `catalog-service` product API, `frontend/src/pages/ProductsPage.tsx` | Do not assume a successful create can be hidden from marketplace; do not assume duplicate names are accepted. | `mvn test`; `npm run build` |
| 2026-06-12 | Codex | Added frontend role route guards while keeping public registration open for `CUSTOMER`, `MERCHANT`, and `ADMIN`. | `frontend/src/App.tsx`, `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/ProductsPage.tsx`, `frontend/src/api/client.ts` | Do not assume any signed-in user can access `/dashboard` or `/cart`; registration still supports all three demo roles. | `npm run build` |
| 2026-06-11 | Codex | Established sync workflow: contract changes go through GitHub issue or PR, and urgent cross-agent changes must also be appended here. | `CONTRIBUTING.md`, GitHub labels and PR template | Do not assume verbal notice or chat-only notice is enough. | Re-read `CONTRIBUTING.md` before starting work. |

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
