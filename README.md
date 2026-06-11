# Smart CommerceOps

Smart CommerceOps is a modernized microservice version of the original Spring Boot shopping cart project. It is designed as an internship-ready platform engineering portfolio project for e-commerce companies such as Shopee, TikTok Shop, Grab/Foodpanda, and similar marketplace teams.

## What This Demonstrates

- Java 21 and Spring Boot 3 microservices.
- Gateway-first API access.
- BCrypt password hashing and JWT access tokens.
- Product catalog, inventory reservation, cart, checkout, order workflow, and operations analytics.
- React TypeScript frontend with Ant Design and TanStack Query.
- Docker Compose local stack with MySQL, Redis, Prometheus, and Grafana.
- Flyway database migrations instead of `ddl-auto=update`.
- Actuator metrics and OpenAPI/Swagger UI on every backend service.
- Kafka dependencies are wired in code, but the current local Docker stack does not boot a broker because event producers/consumers are not implemented yet.

## Services

| Service | Port | Responsibility |
|---|---:|---|
| gateway-service | 8090 | Single API entrypoint and routing |
| identity-service | 8092 | Registration, login, roles, JWT |
| catalog-service | 8093 | Products, inventory, ratings |
| order-service | 8094 | Cart, checkout, orders, status workflow |
| analytics-service | 8095 | Dashboard metrics and restock recommendations |
| frontend | 3000 | React TypeScript UI |
| Prometheus | 9090 | Metrics scraping |
| Grafana | 3001 | Metrics dashboards |

## Local Startup

```powershell
cd C:\Users\14188\Desktop\CA_Team4\SpringBoot_CA\smart-commerceops
copy .env.example .env
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Gateway health: http://localhost:8090/actuator/health
- Catalog Swagger: http://localhost:8093/swagger-ui.html
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

## Local Development Without Docker

Use the original Maven Wrapper from `SpringBoot_CA_Backend` to build the new backend:

```powershell
.\SpringBoot_CA_Backend\mvnw.cmd -f .\smart-commerceops\backend\pom.xml test
```

Frontend:

```powershell
cd smart-commerceops\frontend
npm install
npm run dev
```

## Demo Flow

1. Register a `CUSTOMER`, add products to cart, and checkout.
2. Register a `MERCHANT` or `ADMIN`.
3. Open Operations Dashboard to review GMV, order count, top products, and low-stock recommendations.
4. Open Orders and move orders through `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, and `COMPLETED`.
5. Add a new product and observe inventory alert behavior when stock is below threshold.

## Cloud Deployment Notes

- Deploy frontend as a static site with `VITE_API_BASE_URL` pointing to the gateway.
- Deploy each service as a container.
- Use managed MySQL or separate schemas in one managed MySQL instance.
- Use a managed Kafka-compatible service or replace Kafka with the cloud provider's queue/event bus for the first deployment.
- Set `JWT_SECRET`, datasource credentials, and service URLs as environment variables.

## Internship Position Mapping

- Backend engineering: Spring Boot 3, JPA, Flyway, REST APIs, validation, tests.
- Platform/e-commerce engineering: inventory reservation, checkout workflow, order lifecycle, dashboard metrics.
- Full-stack engineering: React TypeScript, Ant Design, token-aware API client, protected workflows.
- DevOps/cloud readiness: Dockerfiles, Compose, CI, Actuator, Prometheus/Grafana.
