# Smart CommerceOps 项目 Agent 配置流程

## 一、项目定位

- GitHub 仓库：`https://github.com/Hdx123321/smart-commerceops`
- 仓库根目录：`smart-commerceops`
- 默认协作分支：`integration`
- 发布分支：`main`

## 二、角色分工

- Codex：
  后端负责人、平台负责人、容器负责人、CI 负责人、联调负责人
- Claude：
  前端负责人

## 三、职责边界

- Claude 允许修改：
  `frontend/**`、前端测试、README 中前端相关说明
- Codex 允许修改：
  `backend/**`、`infra/**`、`.github/**`、`docker-compose.yml`、部署、CI、环境编排

## 四、每次进入项目的启动检查

1. 确认当前仓库根目录是 `smart-commerceops`
2. 阅读 `CONTRIBUTING.md`
3. 阅读 `README.md`
4. 确认当前工作基线分支是 `integration`
5. 确认 Docker Compose 是默认的全栈运行方式
6. 确认前端 API 统一走 gateway，而不是直接访问单个后端服务

## 五、MCP 与工具配置

- Sense 项目级 MCP 配置文件：
  父目录 `.mcp.json`
- Sense 启动命令：
  `wsl bash -c "cd '/mnt/c/Users/14188/Desktop/CA_Team4/SpringBoot_CA' && /home/hyc/.local/bin/sense mcp"`
- Weknora MCP 地址：
  `http://localhost:8082/mcp`

## 六、运行方式

- 推荐全栈启动方式：
  `docker compose up --build`

- 当前主要入口：
  - 前端：`http://localhost:3000`
  - gateway：`http://localhost:8090`
  - identity：`8092`
  - catalog：`8093`
  - order：`8094`
  - analytics：`8095`

## 七、GitHub 协作流程

1. 先创建或分配 GitHub Issue
2. 所有工作从 `integration` 拉分支
3. 分支命名规则：
   - Claude：`claude/fe-<issue-slug>`
   - Codex：`codex/be-<issue-slug>`
4. 完成后向 `integration` 提 PR
5. 只有联调通过后，才允许从 `integration` 合并到 `main`

## 八、标签规范

- `frontend`
- `backend`
- `integration`
- `contract-change`
- `ready-for-review`
- `blocked`

## 九、同步规则

- Codex 必须同步 Claude 的变更：
  - API 契约变化
  - 鉴权或 token 行为变化
  - 端口、CORS、URL、环境变量变化
  - Docker、CI、部署方式变化

- Claude 必须同步 Codex 的变更：
  - 新的后端依赖假设
  - 路由或鉴权预期变化
  - 前端对 payload 结构的新要求

## 十、验证规则

- 前端改动：
  `npm run build`
- 后端改动：
  `mvn test`
- 全栈改动：
  `docker compose up --build`

## 十一、今天的配置经验总结

1. Docker 实际已经安装在本机，但 Codex 受限 shell 最初无法直接解析 `docker`，需要显式路径或外部权限确认
2. 项目最终已经切换到 Docker Compose 运行，不再依赖手动启动本地 Java/Node 进程
3. 原先 Compose 中的 `bitnami/kafka:3.8` 镜像标签已经失效
4. 当前代码里还没有真正实现 Kafka producer/consumer，所以默认 Docker 栈中先移除了 Kafka 硬依赖
5. gateway 的 CORS 之前导致浏览器注册时报 `Network Error`，现已通过显式 CORS 配置修复
6. 注册与登录失败现在会在前端明确展示错误信息，不再静默失败
7. 仓库根目录已经明确固定为 `smart-commerceops`，而不是更外层的 `SpringBoot_CA`
8. GitHub 仓库已经初始化并推送，`main` 与 `integration` 都已建立

## 十二、当前协作约定

- 我与 Claude 的协作关系固定如下：
  - 我负责后端、平台、容器、CI、联调和最终集成
  - Claude 负责前端实现和交互体验
- 任何关键后端变更，我都要主动同步给 Claude
- 任何关键前端契约要求，Claude 都必须同步给我
- 后续所有跨边界变更，都必须通过 issue 或 PR 描述明确记录
