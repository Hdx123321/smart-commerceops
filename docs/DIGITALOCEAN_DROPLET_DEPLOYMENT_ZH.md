# Smart CommerceOps DigitalOcean Droplet 部署手册

这份手册用于把项目部署到一台 Ubuntu Droplet 上，使用 `docker-compose.ec2.yml` 跑完整服务。这个 compose 文件同样适用于 DigitalOcean：只对公网暴露前端 Nginx 的 `80` 端口，后端服务、MySQL、Redis 都走 Docker 内网。

## 1. Droplet 建议配置

- Ubuntu 22.04 LTS 或 24.04 LTS
- 最低 2 vCPU / 4GB RAM；服务较多，1GB 或 2GB 内存容易构建失败
- 磁盘建议 50GB 起
- 防火墙只开放：
  - `22/tcp` SSH
  - `80/tcp` HTTP
  - 后续配置 HTTPS 时再开放 `443/tcp`

不要对公网开放 MySQL、Redis 或后端端口。

## 2. 安装 Docker

SSH 登录 Droplet 后执行：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git ufw
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

重新登录 SSH 后检查：

```bash
docker version
docker compose version
```

## 3. 配置防火墙

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

## 4. 拉取代码

```bash
git clone https://github.com/Hdx123321/smart-commerceops.git
cd smart-commerceops
git checkout integration
```

如果仓库是 private，先在 Droplet 配置 GitHub SSH key 或 token。

## 5. 配置环境变量

```bash
cp .env.ec2.example .env.ec2
nano .env.ec2
```

至少填写：

```text
MYSQL_ROOT_PASSWORD=<strong-mysql-password>
JWT_SECRET=<long-random-jwt-secret>
PAYMENT_INTERNAL_TOKEN=<long-random-internal-service-token>
PUBLIC_WEB_ORIGIN=http://<droplet-public-ip-or-domain>
PUBLIC_API_BASE_URL=/api
WEB_PORT=80
LLM_API_BASE_URL=https://api.deepseek.com
LLM_API_KEY=<optional-api-key>
LLM_MODEL=deepseek-v4-flash
```

生成随机 secret 示例：

```bash
openssl rand -base64 48
```

如果你用域名，例如 `http://smart-commerceops.hdx-lab.org`，需要先把域名 A 记录指向 Droplet 公网 IP，并把 `PUBLIC_WEB_ORIGIN` 改成这个域名。

## 6. 启动服务

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

## 7. 验证

浏览器打开：

```text
http://<droplet-public-ip-or-domain>
```

健康检查：

```bash
curl http://localhost/api/actuator/health
curl http://localhost/api/products?page=0\&size=1
```

期望 health 返回：

```json
{"status":"UP"}
```

## 8. 更新部署

本地代码 push 后，在 Droplet 上执行：

```bash
cd smart-commerceops
git pull origin integration
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build
```

如果只改前端：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build frontend
```

如果只改某个服务：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build order-service gateway-service frontend
```

## 9. 数据和图片备份

数据库在 `mysql-data` Docker volume 中，商品上传图片在 `catalog-uploads` Docker volume 中。Droplet 重建或迁移前必须同时备份数据库和图片。

数据库导出：

```bash
docker exec smart-commerceops-mysql-1 mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --databases identity_db catalog_db order_db payment_db chat_db analytics_db > /root/smart-commerceops.sql
```

图片备份：

```bash
docker run --rm -v smart-commerceops_catalog-uploads:/data -v /root:/backup alpine tar czf /backup/catalog-uploads-$(date +%Y%m%d).tar.gz -C /data .
```

## 10. 常见问题

如果前端还能访问 `localhost`，说明 `PUBLIC_API_BASE_URL` 没有在构建时生效，重新构建前端：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build frontend
```

如果 MySQL 密码改过但旧 volume 还在，MySQL 不会自动修改 root 密码。测试环境可清空重建，但会删除数据：

```bash
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml down -v
docker compose --env-file .env.ec2 -f docker-compose.ec2.yml up -d --build
```

如果内存不足，构建 Java 服务可能失败。先查看：

```bash
free -h
docker stats
```

必要时给 Droplet 升级到 4GB 或更高内存。
