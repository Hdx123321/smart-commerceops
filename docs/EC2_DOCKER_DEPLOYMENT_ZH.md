# Smart CommerceOps 单 EC2 + Docker Compose 部署手册

这是一套低成本云端测试方案：用一台 EC2 跑完整 Docker Compose，不使用 ECS、RDS、ElastiCache、ALB 或 Route 53。适合验证“云端可访问、完整业务链路可跑通”。

## 成本策略

- 测试时启动 EC2。
- 不测试时停止 EC2。
- 停止后 EC2 计算费用停止，EBS 磁盘仍会收费。
- MySQL、Redis、后端、前端都跑在这台 EC2 的 Docker Compose 里。

建议实例：

- 最低可试：`t3.small` 或 `t4g.small`，2GB 内存可能紧张。
- 推荐测试：`t3.medium` 或 `t4g.medium`，4GB 内存更稳。
- 磁盘：30GB gp3 起步。

如果选择 `t4g.*` ARM 实例，需要确认 Docker 镜像构建支持 ARM。为了少踩坑，初版建议用 `t3.medium`。

## 1. 创建 EC2

AWS Console -> EC2 -> Launch instance：

- AMI：Ubuntu Server 24.04 LTS 或 22.04 LTS。
- Instance type：`t3.medium`。
- Key pair：创建或选择你的 SSH key。
- Storage：30GB gp3。
- Auto-assign public IP：Enable。

Security Group inbound：

```text
SSH  22  你的公网 IP/32
HTTP 80  0.0.0.0/0
```

初版不要开放：

```text
3306 MySQL
6379 Redis
8090-8096 backend ports
```

这些服务只在 Docker 内部网络访问。

## 2. SSH 登录 EC2

Windows PowerShell 示例：

```powershell
ssh -i C:\path\to\your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

如果权限报错，在 PowerShell 中收紧 key 权限，或用 Windows 文件属性移除其他用户访问权限。

## 3. 安装 Docker

在 EC2 上执行：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

退出 SSH 后重新登录，让 docker 用户组生效：

```bash
exit
```

重新 SSH 后检查：

```bash
docker version
docker compose version
```

## 4. 拉取项目

```bash
git clone https://github.com/Hdx123321/smart-commerceops.git
cd smart-commerceops
git checkout integration
```

如果你不是公开仓库，先配置 GitHub token 或 SSH key。

## 5. 配置环境变量

复制模板：

```bash
cp .env.ec2.example .env.ec2
nano .env.ec2
```

填写：

```text
MYSQL_ROOT_PASSWORD=<强密码>
JWT_SECRET=<长随机字符串>
PUBLIC_WEB_ORIGIN=http://<EC2_PUBLIC_IP>
PUBLIC_API_BASE_URL=/api
WEB_PORT=80
```

生成 JWT secret 示例：

```bash
openssl rand -base64 48
```

如果后续你把域名指向这台 EC2：

```text
PUBLIC_WEB_ORIGIN=https://commerce.example.com
```

## 6. 启动项目

第一次构建会比较慢：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build
```

查看状态：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml ps
```

查看日志：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml logs -f gateway-service
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml logs -f frontend
```

打开：

```text
http://<EC2_PUBLIC_IP>
```

API health：

```text
http://<EC2_PUBLIC_IP>/api/actuator/health
```

期望返回：

```json
{"status":"UP"}
```

## 7. 更新项目

每次代码更新后：

```bash
git pull origin integration
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build
```

只改前端：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build frontend
```

只改 order-service：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build order-service
```

## 8. 停止服务省钱

临时停 Docker 服务，但保留 EC2 运行：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml down
```

保留数据卷，不会删除 MySQL 数据。

测试结束后，在 AWS Console 停止 EC2：

```text
EC2 -> Instances -> 选择实例 -> Instance state -> Stop instance
```

下次测试再 Start instance。注意：如果没有绑定 Elastic IP，EC2 stop/start 后公网 IP 可能变化，需要更新 `.env.ec2` 的 `PUBLIC_WEB_ORIGIN` 并重新 build frontend：

```bash
nano .env.ec2
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build frontend gateway-service
```

如果想避免 IP 变化，可以绑定 Elastic IP。但 AWS 对未使用或部分场景的 Elastic IP 会收费，使用前确认价格。

## 9. 完整业务验收

按顺序测试：

1. 打开 `http://<EC2_PUBLIC_IP>`。
2. 注册 CUSTOMER。
3. 注册 MERCHANT。
4. 商家创建商品。
5. 客户 marketplace 能看到商品。
6. 客户加入购物车并 checkout。
7. 商家发货。
8. 客户确认收货。
9. 客户申请退货、换货、仅退款。
10. 商家按售后流程处理。
11. 客户和商家聊天。
12. 商家 Products 页面只显示自己的商品。

## 10. 常见问题

### 页面能打开，但 API 报错

检查：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml logs -f gateway-service
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml logs -f frontend
```

确认：

```text
PUBLIC_API_BASE_URL=/api
http://<EC2_PUBLIC_IP>/api/actuator/health 能访问
```

### 前端还在访问 localhost

`VITE_API_BASE_URL` 是构建时变量。修改 `.env.ec2` 后必须重新 build frontend：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build frontend
```

### MySQL 连接失败

看 mysql 状态：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml logs -f mysql
```

如果第一次启动时改过 `MYSQL_ROOT_PASSWORD`，但旧 volume 已存在，MySQL 不会自动改旧密码。测试环境可以删除数据重来：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml down -v
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build
```

这会删除数据库数据。

### 内存不足

查看：

```bash
free -h
docker stats
```

如果 2GB 实例不稳，升级到 `t3.medium`。

## 11. 后续可选 HTTPS

最低成本初版可以只用 HTTP + EC2 public IP。

如果后续想加 HTTPS：

- 方式 A：买域名，把 `commerce.example.com` 指向 EC2。
- 方式 B：在 EC2 上加 Caddy 或 Nginx + Certbot。

这一步不是云端效果测试必需项。
