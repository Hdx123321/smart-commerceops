# Smart CommerceOps Collaboration Guide

## Repository Scope

Use `smart-commerceops` as the Git repository root.

## Roles

- Codex owns `infra/**`, `docker-compose.yml`, `.env.example`, CI, deployment, and integration coordination. Codex also owns `backend/**` and reviews all backend changes.
- Claude owns `frontend/**` and frontend-specific documentation updates. Claude may modify `backend/**` after submitting a written plan and receiving explicit Codex approval (see Cross-Owner Change Protocol).
- Shared files such as `README.md` must be edited only in the relevant section for each owner.

## Branch Strategy

- `main`: release-ready branch only.
- `integration`: shared integration branch for active work.
- `codex/be-<issue-slug>`: backend and platform work branches.
- `claude/fe-<issue-slug>`: frontend work branches.
- `claude/be-<issue-slug>`: Claude backend work branches (requires approved plan).
- `ops/chore-<issue-slug>`: repo hygiene, docs, or CI-only changes.

## Working Rules

- One issue per branch.
- One pull request per issue.
- Claude may modify `backend/**` only through the Cross-Owner Change Protocol: written plan → Codex approval → implementation. Claude must not touch `infra/**`, `docker-compose.yml`, or container orchestration.
- Codex should treat frontend API expectations as a contract and avoid breaking `frontend/src/api/**` and `frontend/src/types.ts` without a tracked contract change.
- Any API shape change must have a `contract-change` label and be described in the PR.

## Ownership Boundaries

- Frontend owner (Claude):
  `frontend/**`
- Backend owner (Codex, Claude with review):
  `backend/**`
- Platform owner (Codex only):
  `infra/**`, `docker-compose.yml`, `.github/**`

## Cross-Owner Change Protocol

When Claude needs a backend change:

1. **Write a plan** — list files to modify, what changes, and why. Include verification steps.
2. **Submit for review** — post the plan as a GitHub issue with label `claude-plan`.
3. **Wait for approval** — Codex reviews, approves, or requests changes.
4. **Implement** — after approval, implement on a `claude/be-<slug>` branch.
5. **PR & merge** — open PR into `integration`, tag Codex for final review.

This protocol applies to any file under `backend/**`. Platform files (`infra/**`, `docker-compose.yml`, `.github/**`) remain Codex-only — Claude must request those changes via a standard GitHub issue.

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
| 2026-06-23 | Codex | Added simulated payment v1: checkout creates `PENDING_PAYMENT`/`UNPAID` orders, customers pay through Gateway `/payments`, payment-service marks orders paid through internal `/internal/orders/{id}/mark-paid`, unpaid orders cannot be shipped, and customers can cancel unpaid pending orders to release reserved stock. Auto timeout release is still future work. | `payment-service`, `order-service` payment status/internal mark-paid/cancel, catalog internal reservation release, Gateway `/payments/**` and `/internal/**` blocking, `payment_db`, `PAYMENT_INTERNAL_TOKEN`, Docker Compose, frontend `paymentApi`, order detail Pay Now/Cancel | Do not assume new orders are immediately paid. Do not call service internal endpoints through Gateway. Do not assume stock reservation is payment-finalized inventory; unpaid orders reserve stock until payment or explicit cancel because automatic expiry is not implemented. | `mvn clean test`; `npm run build`; Docker payment smoke test |
| 2026-06-18 | Codex | Fixed stale frontend sessions that appeared logged in after the 2-hour JWT expired or its signature became invalid: startup now validates token expiry, and any API 401 clears local session state and redirects to login. | `frontend/src/api/client.ts` session bootstrap and Axios response interceptor | Do not assume a stored user profile means the access token is usable. Protected actions should not keep rendering an authenticated shell after a 401; users must log in again because refresh tokens are not implemented. | `npm run build`; real Gateway smoke: MERCHANT product create 201 and CUSTOMER add-to-cart 200 with fresh JWT |
| 2026-06-18 | Codex | Upgraded customer-merchant chat from 2-second REST polling to hybrid REST + WebSocket/STOMP: REST loads paginated history and provides fallback, while authenticated STOMP delivers new messages and read events. The same-origin Nginx `/ws-chat` route proxies to internal chat-service; connected clients disable polling and disconnected clients fall back to 15-second polling. | `chat-service` WebSocket/JWT/STOMP configuration and message pagination, `frontend/src/api/chatSocketClient.ts`, `frontend/src/hooks/useChatSocket.ts`, chat list/detail pages, `frontend/nginx.conf`, Docker Compose JWT/origin configuration | Do not assume chat refreshes every 2 seconds or trust sender identity from message payloads. Do not connect browsers directly to port 8096; use same-origin `/ws-chat`. REST `/chat/**` remains the history and fallback path. | `docker run --rm -v "${PWD}:/workspace" -w /workspace/backend maven:3.9.9-eclipse-temurin-21 mvn -pl chat-service -am test`; `npm run build`; two-browser CUSTOMER/MERCHANT WebSocket smoke test |
| 2026-06-14 | Codex | Added first-pass server-side multi-user boundaries: Gateway validates JWT for protected routes and forwards trusted `X-User-Id`, `X-User-Role`, and `X-Merchant-Id`; public ADMIN registration is blocked; order/catalog/chat/analytics now scope customer and merchant operations from trusted headers; catalog product stock uses optimistic locking; cart items are unique per `userId + productId`. | `gateway-service` auth filter/JWT verifier, `identity-service` register, `catalog-service` product ownership/cache keys/stock version, `order-service` ownership checks/cart unique migration, `chat-service` conversation access checks, `analytics-service` merchant dashboard scoping, `frontend/src/pages/LoginPage.tsx`, `docker-compose.yml` `JWT_SECRET` | Do not assume frontend-provided `userId`, `merchantId`, `customerId`, or `senderRole` is trusted. Do not offer public ADMIN registration. Do not assume checkout stock reservation is last-write-wins. Frontend should continue sending JWT through Gateway and must not call service ports directly. | `mvnw -f backend/pom.xml -pl gateway-service,identity-service,catalog-service,order-service,chat-service,analytics-service test`; `npm run build`; Docker smoke: public products 200, unauth orders 401, admin register 403, own cart 200, other cart 403 |
| 2026-06-14 | Codex | Added `chat-service` v1 for merchant-customer text conversations using REST polling, independent `chat_db`, Gateway `/chat/**`, Docker Compose service, and frontend chat list/detail pages. Product, order, and after-sales detail pages can create or reuse contextual conversations. | `backend/chat-service`, `gateway-service` `/chat/**`, `docker-compose.yml`, `infra/mysql/init/01-databases.sql`, `infra/prometheus/prometheus.yml`, `frontend/src/types.ts`, `frontend/src/api/client.ts`, `frontend/src/pages/ChatListPage.tsx`, `frontend/src/pages/ChatDetailPage.tsx`, product/order/after-sales detail pages | Do not assume contact merchant is only an order-service after-sales placeholder. Frontend must call chat only through Gateway `/chat/**`, not port `8096`. Do not assume chat is realtime WebSocket; v1 is REST polling and text-only. | `mvn clean test`; `npm run build` |
| 2026-06-14 | Codex | Added after-sales workflow: customers can request return, exchange, refund-only, or contact merchant; return/exchange/refund requests create after-sales cases and move the order to `AFTER_SALES`; merchants/admins can complete or reject pending cases; customers can cancel pending cases. | `order-service` `after_sales_cases` schema, `POST /orders/{id}/after-sales`, `GET /orders/{id}/after-sales`, `GET /after-sales`, `GET /after-sales/{id}`, `PUT /after-sales/{id}/cancel`, `PUT /after-sales/{id}/complete`, `PUT /after-sales/{id}/reject`, `OrderResponse.latestAfterSales*`, `frontend/src/types.ts`, `frontend/src/api/client.ts`, `frontend/src/pages/OrderDetailPage.tsx`, `frontend/src/pages/AfterSalesDetailPage.tsx`, `frontend/src/pages/OrdersPage.tsx` | Do not assume `AFTER_SALES` is only an order status placeholder. Do not assume refund/return/exchange actions live only on the order detail page; after-sales cases have their own detail route `/after-sales/:caseId`. Contact-merchant requests are recorded but do not move order fulfillment status. | `mvn clean test`; `npm run build` |
| 2026-06-13 | Codex | Converted merchant ownership from a single platform merchant to account-bound multi-merchant: `MERCHANT` user id is the merchant id, product creation binds to the current merchant profile, checkout splits selected cart items into merchant-owned orders, and merchant order/dashboard queries filter by `merchantId`. | `identity-service` `UserProfile`/`UpdateProfileRequest`, `catalog-service` product create/list contracts, `order-service` checkout/order contracts, `analytics-service` `/analytics/dashboard?merchantId=`, `frontend/src/types.ts`, `frontend/src/pages/ProfilePage.tsx`, `frontend/src/pages/ProductsPage.tsx`, `frontend/src/pages/OrdersPage.tsx`, `frontend/src/pages/OrderDetailPage.tsx`, `frontend/src/pages/DashboardPage.tsx` | Do not assume all products/orders/dashboard metrics belong to `Smart CommerceOps`. Do not let merchant users manage products or orders whose `merchantId` does not match their profile. Do not assume checkout returns one order; checkout may return multiple orders split by merchant. | `mvn clean test`; `npm run build` |
| 2026-06-13 | Codex | Added selected-item checkout, merchant-grouped cart display, and order detail pages with item/store snapshots, payment information, and state-specific actions. | `order-service` `/cart/{userId}`, `POST /cart/items`, `POST /checkout`, `GET /orders/{id}`, `CartItemResponse`, `CheckoutRequest.cartItemIds`, `CheckoutRequest.paymentMethod`, `OrderResponse`, `OrderLineResponse`, `frontend/src/pages/CartPage.tsx`, `frontend/src/pages/OrdersPage.tsx`, `frontend/src/pages/OrderDetailPage.tsx`, `frontend/src/types.ts`, `frontend/src/api/client.ts` | Do not assume checkout always consumes the whole cart; frontend should send selected `cartItemIds`. Do not assume order/cart lines only contain product name, quantity, and price; they now carry `imageUrls`, `merchantId`, and `merchantName` snapshots. Order actions now live on the detail page. | `mvn clean test`; `npm run build` |
| 2026-06-13 | Claude/Codex Sync Correction | Added product image gallery/upload support plus marketplace category and search filters; this was a contract-affecting change and must be visible to both agents. | `catalog-service` `GET /products?category=&search=`, `POST /admin/upload`, `PUT /admin/products/{id}/images`, `/images/**`, `frontend/src/types.ts`, `frontend/src/api/client.ts`, `docker-compose.yml`, `frontend/nginx.conf`, `frontend/vite.config.ts` | Do not assume Product has a single `imageUrl`; use `imageUrls: string[]`. Do not assume uploaded images are served by frontend assets; they are persisted under the catalog upload volume and served through gateway `/images/**`. | `mvn test`; `npm run build`; Docker stack image upload smoke test |
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
