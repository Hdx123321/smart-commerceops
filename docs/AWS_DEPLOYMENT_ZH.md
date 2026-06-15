# Smart CommerceOps AWS 部署手册

本文档用于把 Smart CommerceOps 部署到 AWS 的作品集演示环境。目标是展示微服务、托管数据库、容器镜像、Gateway 入口、HTTPS 前端和可复现发布流程，不引入 Kubernetes。

## 目标架构

- 前端：AWS Amplify Hosting，连接 GitHub `integration` 分支，构建 `frontend` Vite React 应用。
- 后端：Amazon ECS Fargate，每个 Spring Boot 服务一个 ECS Service。
- 镜像：Amazon ECR，每个服务一个私有 repository。
- 入口：Application Load Balancer 只公开 `gateway-service`。
- 数据库：Amazon RDS for MySQL，一个实例内创建多个 schema。
- 缓存：Amazon ElastiCache for Redis，供 `catalog-service` 使用。
- 域名：Route 53 + ACM，建议 `app.example.com` 和 `api.example.com`。

公网只暴露：

- `https://app.example.com`：前端。
- `https://api.example.com`：Gateway。

内部服务端口 `8092`、`8093`、`8094`、`8095`、`8096` 不对公网开放。

## 一次性 AWS 资源

先在 AWS 中创建以下资源，再启用 GitHub Actions 发布。

### 1. 网络

- 创建一个 VPC，至少 2 个 Availability Zones。
- 每个 AZ 建 public subnet 和 private subnet。
- ALB 放在 public subnets。
- ECS tasks、RDS、Redis 放在 private subnets。
- Private subnets 需要 NAT Gateway，否则 ECS 拉取镜像和访问 AWS APIs 会失败。

### 2. 域名与证书

- Route 53 接入真实域名。
- ACM 申请证书：
  - `app.example.com`
  - `api.example.com`
- ALB HTTPS listener 使用 `api.example.com` 证书。
- Amplify custom domain 使用 `app.example.com` 证书。

### 3. 数据库与缓存

- 创建 RDS MySQL 8.x 单实例。
- 初始化 schema：

```sql
CREATE DATABASE IF NOT EXISTS identity_db;
CREATE DATABASE IF NOT EXISTS catalog_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS chat_db;
```

当前仓库本地 init 里也保留了 `analytics_db`，但 `analytics-service` 当前不直接写数据库，AWS 第一版不需要为它配置 datasource。

- 创建 ElastiCache Redis。
- Security Group：
  - ECS tasks -> RDS `3306`
  - catalog ECS task -> Redis `6379`

### 4. ECR repositories

创建 6 个 ECR repositories：

```text
smart-commerceops/gateway-service
smart-commerceops/identity-service
smart-commerceops/catalog-service
smart-commerceops/order-service
smart-commerceops/chat-service
smart-commerceops/analytics-service
```

### 5. ECS 与 Cloud Map

- 创建 ECS cluster：`smart-commerceops`。
- 创建 Cloud Map private DNS namespace：`commerceops.local`。
- 为每个服务创建 ECS Service，service discovery name 必须匹配：
  - `identity-service`
  - `catalog-service`
  - `order-service`
  - `chat-service`
  - `analytics-service`
  - `gateway-service`

服务间 URL 使用：

```text
http://identity-service.commerceops.local:8092
http://catalog-service.commerceops.local:8093
http://order-service.commerceops.local:8094
http://chat-service.commerceops.local:8096
http://analytics-service.commerceops.local:8095
```

初版 desired count 全部设为 `1`。Task template 默认 `256 CPU / 512 MB`，如果 Spring Boot 启动 OOM，把对应 task definition 升级到 `512 CPU / 1024 MB`。

### 6. Load Balancer

- 创建 ALB target group 指向 `gateway-service` container port `8090`。
- Health check path：`/actuator/health`。
- HTTPS listener `443` 转发到 gateway target group。
- Route 53 中 `api.example.com` Alias 到 ALB。

### 7. IAM 与 Secrets

GitHub Actions 推荐使用 OIDC AssumeRole，不要使用长期 Access Key。

GitHub Actions role 至少需要：

- ECR push/pull 权限。
- ECS describe/register/update service 权限。
- IAM pass role 到 ECS execution role/task role。

ECS execution role 需要：

- `AmazonECSTaskExecutionRolePolicy`
- `secretsmanager:GetSecretValue`
- CloudWatch Logs 写入权限。
- 如果使用 task definition 中的 `awslogs-create-group=true`，需要 `logs:CreateLogGroup`。

Secrets Manager 保存两个 plain string secret：

- `smart-commerceops/db-password`
- `smart-commerceops/jwt-secret`

## GitHub 配置

新增 workflow：`.github/workflows/aws-backend-deploy.yml`。

Repository Variables：

```text
AWS_REGION=ap-southeast-1
APP_DOMAIN=app.example.com
DB_HOST=<rds-endpoint>
DB_USERNAME=<rds-username>
REDIS_HOST=<redis-primary-endpoint>
ECS_CLUSTER=smart-commerceops
ECS_EXECUTION_ROLE_ARN=<ecs-execution-role-arn>
ECS_TASK_ROLE_ARN=<ecs-task-role-arn>
```

Repository Secrets：

```text
AWS_ROLE_TO_ASSUME=<github-actions-deploy-role-arn>
DB_PASSWORD_SECRET_ARN=<secrets-manager-db-password-secret-arn>
JWT_SECRET_ARN=<secrets-manager-jwt-secret-arn>
```

Workflow 行为：

- `integration` 分支 push 且影响 `backend/**`、`infra/aws/**` 或 workflow 自身时自动触发。
- 也可手动 `workflow_dispatch`。
- 先执行 `backend` 全模块 `mvn test`。
- 为 6 个服务构建镜像并推送 ECR。
- 渲染 `infra/aws/ecs/task-definitions/*.json`。
- 更新对应 ECS Service。

## Amplify 前端部署

仓库根目录新增 `amplify.yml`，适用于 monorepo 下的 `frontend` app。

Amplify 设置：

- Repository：`Hdx123321/smart-commerceops`
- Branch：`integration`
- App root：`frontend`
- Build config：使用仓库根目录 `amplify.yml`
- Environment variable：

```text
VITE_API_BASE_URL=https://api.example.com
```

添加 SPA rewrite，避免刷新 `/orders/1`、`/products/1` 时 404：

```text
Source address: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2)$)([^.]+$)/>
Target address: /index.html
Type: 200 (Rewrite)
```

Route 53 中 `app.example.com` 由 Amplify custom domain 自动配置。

## 验收清单

部署前：

```powershell
cd frontend
npm run build
```

```powershell
docker run --rm -v "${PWD}\backend:/workspace" -w /workspace maven:3.9.9-eclipse-temurin-21 mvn test
```

AWS 部署后：

- `https://api.example.com/actuator/health` 返回 `UP`。
- `https://app.example.com` 能打开并刷新任意前端路由。
- CUSTOMER 注册、浏览商品、加入购物车、checkout。
- MERCHANT 注册、创建商品，只能看到自己商户商品。
- 商家发货，客户确认收货。
- 客户发起退货、换货、仅退款售后。
- 商家按售后流程处理，换货需客户确认收到换货后完成。
- 客户与商家聊天可发送和读取消息。
- 浏览器 Network 中所有 API 都访问 `https://api.example.com`，没有直连内部服务端口。

## 当前限制

- 第一版不部署 Prometheus/Grafana 到 AWS；ECS + CloudWatch Logs 用于云端基础观测。
- 商品图片上传当前使用容器临时目录 `/tmp/uploads`，ECS 重启后不保证保留。正式云端版本应迁移到 S3 + CloudFront。
- 第一版不做自动扩容、多 AZ RDS、蓝绿部署和 WAF。
- `api.example.com`、`app.example.com` 是占位域名，实施时必须替换成真实域名。
