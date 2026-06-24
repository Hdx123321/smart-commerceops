# Smart CommerceOps 项目技术总结

> 撰写日期：2026-06-23

---

## 一、项目定位

**Smart CommerceOps（又名 DailyHaven）** 是一个多商户 B2C 电商平台的教学/演示项目。它模拟了从商品浏览、AI 导购、购物车、下单、支付、发货、收货到售后退款/换货的完整电商链路，并包含实时客服聊天和运营数据看板。

**三种用户角色**：

| 角色 | 能做什么 |
|------|----------|
| CUSTOMER（顾客） | 浏览商品、AI 导购、加购物车、下单、支付、确认收货、申请售后、联系商家 |
| MERCHANT（商家） | 管理商品、处理订单（发货）、处理售后、查看运营数据 |
| ADMIN（管理员） | 以上所有权限，跨商家管理 |

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────┐
│                    浏览器 (React SPA)                  │
│               Nginx :80 (生产) / Vite :5173 (开发)     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / WebSocket / SSE
                       ▼
┌─────────────────────────────────────────────────────┐
│              Gateway Service (Spring Cloud Gateway)    │
│              端口 8090 — 统一入口                        │
│              JWT 验证 → 注入 X-User-Id 等可信头          │
│              路由分发 + 角色权限控制                      │
└───┬───────┬───────┬───────┬──────┬──────┬──────┬─────┘
    │       │       │       │      │      │      │
    ▼       ▼       ▼       ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│ident-││catal-││order-││paym- ││chat- ││analy-││assis-│
│ity   ││og    ││      ││ent   ││      ││tics  ││tant  │
│:8092 ││:8093 ││:8094 ││:8098 ││:8096 ││:8095 ││:8097 │
└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──────┘└──────┘
   │       │       │       │       │
   ▼       ▼       ▼       ▼       ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│ident-││catal-││order-││paym- ││chat- │  ← 每个服务独享一个数据库
│ity_db││og_db ││_db   ││ent_db││_db   │
└──────┘└──────┘└──────┘└──────┘└──────┘

Redis :6379  ← catalog-service 缓存商品数据
MySQL :3306  ← 所有数据库的物理存储
Prometheus + Grafana ← 监控（仅本地开发环境）
```

### 微服务间调用关系

```
gateway (8090) ── 路由到所有服务，不做业务调用

order-service ──RestClient──▶ catalog-service (锁定库存)
analytics-service ──RestClient──▶ catalog-service + order-service (聚合数据)
assistant-service ──RestClient──▶ catalog-service (获取候选商品)
assistant-service ──RestClient──▶ DeepSeek LLM API (AI 推荐)
payment-service ──RestClient──▶ order-service (验证订单 + 标记已支付)
```

---

## 三、后端技术栈详解

### 共同基础

| 技术 | 版本 | 为什么选它 | 达成什么效果 |
|------|------|-----------|-------------|
| **Java 21** | 21 (LTS) | 长期支持版本，支持 Record、虚拟线程（预留）、Text Block、Switch 表达式 | 代码更简洁（Records 替代 POJO），性能稳定 |
| **Spring Boot** | 3.5.12 | Java 生态最成熟的微服务框架，自动配置、起步依赖、Actuator 健康检查 | 快速搭建服务，无需手写大量配置 |
| **Spring Cloud** | 2025.0.0 | 微服务基础设施（网关、服务间调用） | 统一网关路由，服务间 RestClient 调用 |
| **Spring MVC** | (随 Boot) | 同步 HTTP 模型，学习曲线低，与 Servlet 容器兼容 | RESTful API 开发 |
| **Maven** | 3.9.9 | Java 标准构建工具，多模块项目支持 | 统一管理 8 个子模块的依赖和构建 |
| **MySQL** | 8.4 | 关系型数据库，适合电商交易数据（强一致性） | 存储用户、商品、订单、支付等核心数据 |
| **H2** | (嵌入式) | 零配置内存数据库，适合本地开发 | 开发者不需要装 MySQL 就能跑服务 |
| **Flyway** | (随 Boot) | 数据库版本迁移工具，SQL 脚本 + Java 迁移混合 | 每次启动自动检查并执行未应用的迁移，保证数据库结构与代码一致 |
| **Docker** | 多阶段构建 | 一次构建，到处运行 | 开发/测试/生产环境一致 |
| **Spring Actuator** | (随 Boot) | 生产就绪功能：健康检查、指标暴露 | Prometheus 抓取指标、负载均衡器探活 |
| **Micrometer + Prometheus** | (随 Boot) | JVM 指标采集标准 | Grafana 可视化 JVM 内存、GC、HTTP 请求指标 |
| **SpringDoc OpenAPI** | 2.8.8 | 自动生成 Swagger UI | 开发者可直接在浏览器测试 API |

---

### 3.1 Gateway Service（网关服务）

> 端口 8090 · 无数据库 · 无 Service 层

**职责**：所有前端请求的统一入口。验证 JWT、注入用户身份头、根据角色拦截无权请求、CORS 跨域处理。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **Spring Cloud Gateway WebMVC** | 本项目用 Spring MVC（非 WebFlux），WebMVC 版网关与之一致 | 统一路由入口，不引入响应式编程复杂度 |
| **OncePerRequestFilter** | Servlet 原生过滤器，每个请求执行一次 | 在请求到达下游服务前完成认证 |
| **自定义 JwtVerifier** | 不引入 jjwt/nimbus 等重量级库，用标准库 HMAC-SHA256 手写 | 零额外依赖，完全掌控 JWT 验证逻辑 |
| **HttpServletRequestWrapper** | 需要往请求中注入自定义 Header | 下游服务通过 `X-User-Id` 等头获取用户身份，无需各自解析 JWT |

**关键设计 — 可信头模式（Trusted Header Pattern）**：
```
浏览器 → [Bearer Token] → Gateway → [验证 JWT] → [注入 X-User-Id, X-User-Role] → 下游服务
```
下游服务**不再验证 JWT**，直接信任这些 Header。前提是：外部流量无法绕过 Gateway 直接访问下游服务（Docker 网络隔离保证这点）。

---

### 3.2 Identity Service（身份服务）

> 端口 8092 · 数据库 identity_db · Controller→Repository 模式

**职责**：用户注册、登录（颁发 JWT）、个人信息管理。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **Spring Security Crypto (BCrypt)** | 只用了 BCryptPasswordEncoder，不引入完整的 Spring Security | 密码哈希存储，不可逆；避免 Spring Security 的复杂配置 |
| **自定义 JWT 生成** | HS256 签名，内含 sub/uid/role/iat/exp | 2 小时有效期，无状态认证 |
| **Spring Data JPA** | ORM 框架，自动生成 SQL | 不用手写 CRUD SQL |
| **@Version 乐观锁** | 防止并发更新用户资料导致数据错乱 | 并发安全 |

---

### 3.3 Catalog Service（商品目录服务）

> 端口 8093 · 数据库 catalog_db · Controller→Repository 模式

**职责**：商品 CRUD、分类筛选、图片上传、库存预留/释放、评价系统。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **Spring Data Redis** | 商品列表是读多写少的热点数据 | Redis 缓存 5 分钟，减轻 MySQL 压力，响应时间从 ~50ms 降到 ~5ms |
| **Redis 7.4-alpine** | 轻量级内存缓存 | 比 Memcached 更灵活（支持多种数据结构） |
| **@Cacheable / @CacheEvict** | Spring 声明式缓存，注解驱动 | 无需手写缓存逻辑，修改商品时自动清缓存 |
| **@Version 乐观锁** | 库存扣减是并发热点（多人同时下单同一商品） | 防止超卖——两个请求同时读到 stock=10，各自 -1 写回 → 版本号冲突 → 一个重试 |
| **product Image JSON Array** | 商品图片存储为 `TEXT` 字段中的 JSON 数组 | 灵活支持 1~5 张图片，不用建关联表 |
| **MultipartFile 上传** | Spring MVC 原生文件上传 | 支持 JPEG/PNG/WebP，限制 5MB/张、5 张/次 |
| **UUID 文件名** | 防止文件名冲突和路径遍历攻击 | `a1b2c3d4.jpg` 不暴露原始文件名 |
| **internal-token** | 库存释放由 order-service 内部调用，外部不应直接访问 | 简单的服务间认证 |

---

### 3.4 Order Service（订单服务）

> 端口 8094 · 数据库 order_db · Controller→Repository 模式（最大 Controller，600+ 行）

**职责**：购物车、下单（库存预留 + 按商家拆单）、订单生命周期、售后工单。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **RestClient**（非 Feign） | Spring 6 内置，声明式 HTTP 客户端，比老 RestTemplate 更简洁 | 调用 catalog-service 预留/释放库存 |
| **按商家拆单** | 一个购物车里可能有多个商家的商品，每个商家需要独立发货 | 下单时 `groupBy(merchantId)` → 每个商家生成一个订单 |
| **状态机（实体方法）** | 订单状态转换规则写在 `CommerceOrder.markShipped()` 等方法里 | 非法状态转换在编译期就能被阻止（方法内部抛异常） |
| **@Version 乐观锁** | 防止并发修改订单状态 | 商家发货和顾客取消同时发生 → 只有一个成功 |
| **Spring Kafka**（预留） | 依赖和配置已存在，但尚未使用 | 未来可用于异步通知（如"订单已支付"→通知商家） |
| **商品快照** | 加购物车时保存商品名/价格/图片；下单时再快照到 OrderLine | 即使商家后来改了价格和图片，已下订单不受影响 |

**订单状态机**：
```
PENDING_PAYMENT ──支付成功──▶ PENDING_SHIPMENT ──商家发货──▶ PENDING_RECEIPT ──顾客确认──▶ COMPLETED
      │                                                                                          ▲
      └──取消──▶ CANCELLED                                                                       │
                                                                                                 │
                              PENDING_SHIPMENT / PENDING_RECEIPT / COMPLETED ──申请售后──▶ AFTER_SALES
```

**售后状态机（After-Sales）**：
```
PENDING_MERCHANT ──商家同意──▶ (REFUND_ONLY→COMPLETED) / (RETURN/EXCHANGE→RETURN_PENDING_RECEIPT)
PENDING_MERCHANT ──商家拒绝──▶ MERCHANT_REJECTED
PENDING_MERCHANT ──顾客取消──▶ CANCELLED

RETURN_PENDING_RECEIPT ──商家收货──▶ RETURN→COMPLETED / EXCHANGE→EXCHANGE_PENDING_SHIPMENT
EXCHANGE_PENDING_SHIPMENT ──商家发货──▶ EXCHANGE_PENDING_RECEIPT
EXCHANGE_PENDING_RECEIPT ──顾客收货──▶ COMPLETED
```

---

### 3.5 Payment Service（支付服务）

> 端口 8098 · 数据库 payment_db · Controller→Repository 模式

**职责**：处理支付请求（模拟）、记录支付流水、通知订单服务更新状态。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **模拟支付（Thread.sleep）** | 教学项目，不接入真实支付网关 | 1~2 秒延迟模拟银行处理，用户体验真实感 |
| **幂等检查** | 同一订单不能支付两次 | 重复提交 POST → 409 Conflict |
| **@Version 乐观锁** | 支付记录不被并发覆盖 | 多次支付同一订单只有一个成功 |
| **去 @Transactional** | sleep 期间不持有数据库连接 | 避免连接池耗尽 |
| **internal-token** | 调用 order-service 的内部端点标记已支付 | 外部用户无法通过 HTTP 直接改订单状态 |

**支付流程**：
```
Frontend (Pay Now) → Gateway → payment-service
                                    │
                        ┌───────────┘
                        ▼
                  ① GET /orders/{id} (验证订单归属 + 状态=UNPAID)
                  ② save Payment (PROCESSING)
                  ③ sleep(1~2s) // 模拟处理
                  ④ PUT /internal/orders/{id}/mark-paid
                  ⑤ payment.markSuccess() → return PaymentResponse
```

---

### 3.6 Chat Service（聊天服务）

> 端口 8096 · 数据库 chat_db · **Controller → Service → Repository 模式**（唯一的经典三层架构）

**职责**：顾客与商家之间的实时文字聊天。支持关联商品/订单/售后上下文。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **WebSocket + STOMP** | HTTP 是请求-响应模型，聊天需要服务端主动推送 | 实时消息，无需前端轮询 |
| **SockJS 回退** | 某些网络环境不支持原生 WebSocket | 自动降级到 HTTP 长轮询 |
| **@stomp/stompjs**（前端） | STOMP 协议的 JavaScript 客户端 | 订阅 `/topic/chat/...` 收到实时消息 |
| **SimpMessagingTemplate** | Spring 封装的 STOMP 消息发送工具 | 后端一行代码推送消息到指定用户 |
| **JWT 验证（WebSocket 握手）** | WebSocket 连接不走 Gateway，需要独立验证 JWT | 握手时从 STOMP CONNECT 头提取 Token 验证 |
| **Service 层** | 聊天业务逻辑较复杂（会话创建/复用、未读计数、已读标记、上下文关联） | 避免 Controller 膨胀，可单测 |
| **REST 降级** | WebSocket 可能断连 | 前端自动切换到 HTTP 轮询（15s 间隔），用户无感知 |

---

### 3.7 Analytics Service（分析服务）

> 端口 8095 · 无数据库 · Controller→RestClient 模式

**职责**：聚合商品和订单数据，计算 GMV（总交易额）、AOV（平均客单价）、低库存预警、热销商品排行。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **无数据库** | 只做聚合，不从源头存储数据 | 架构简单，数据始终从 catalog-service 和 order-service 实时拉取 |
| **RestClient 并发调用** | 需要同时调用商品和订单两个服务 | 两个独立数据源聚合为一份 Dashboard |

---

### 3.8 Assistant Service（AI 导购服务）

> 端口 8097 · 无数据库 · Controller→Service→Client 模式

**职责**：接收用户自然语言需求 → 从 catalog-service 拉取候选商品 → 发送给 DeepSeek LLM → 验证 LLM 推荐 → SSE 流式返回。

| 技术 | 为什么选它 | 达成什么效果 |
|------|-----------|-------------|
| **DeepSeek API (OpenAI 兼容)** | 用户指定，性价比高 | AI 根据商品数据智能推荐，不编造商品 |
| **SSE (Server-Sent Events)** | 单向流（服务端→客户端），比 WebSocket 轻量 | 逐字推送分析文字 + 最终结果，用户看到"打字效果" |
| **SseEmitter** | Spring MVC 原生 SSE 支持 | 不引入 WebFlux，与现有 MVC 体系兼容 |
| **ThreadPoolTaskExecutor** | SSE 是长时间持有的连接，不能占用 Tomcat 工作线程 | 异步处理，Tomcat 线程立即释放处理下一个请求 |
| **productIndex（非 productId）** | LLM 容易编造不存在的 ID | 用候选列表索引代替真实 ID，后端映射回产品 |
| **FallbackRecommender** | LLM 可能宕机/超时 | 自动降级到关键词匹配的规则推荐，用户不感知 |
| **无状态** | 每次请求独立，不依赖会话 | 不存用户对话历史，降低复杂度 |

**SSE 流式协议**：
```
event:token     data:{"text":"正在分析您的需求…"}
event:token     data:{"text":"已从 20 件在售商品中为您智能筛选。"}
event:result    data:{"summary":"…","recommendations":[...]}
event:done      data:{}
```

---

## 四、前端技术栈详解

| 技术 | 版本 | 为什么选它 | 达成什么效果 |
|------|------|-----------|-------------|
| **React 18** | ^18.3.1 | 最流行的前端 UI 框架，组件化、生态丰富 | 页面拆分为独立组件，复用性高 |
| **TypeScript** | ^5.7.2 | 给 JavaScript 加上类型系统 | 编译时发现拼写错误、类型不匹配等低级 bug |
| **Vite 6** | ^6.0.5 | 新一代前端构建工具，开发时秒级热更新（ESM 原生） | 改代码后浏览器毫秒级刷新，不用等 Webpack 重编译 |
| **Ant Design 5** | ^5.22.5 | 企业级 React UI 组件库，自带 Table/Form/Modal/Drawer 等 | 不用从零写 UI 组件，界面风格统一 |
| **React Router 7** | ^7.1.1 | 前端路由，URL 变化时不刷新页面 | 12 个页面路由，支持懒加载和角色权限守卫 |
| **TanStack React Query 5** | ^5.62.7 | 服务端状态管理——自动缓存、后台刷新、乐观更新 | 不用手写 loading/error/data 三态，代码减少 50%+ |
| **Axios** | ^1.7.9 | HTTP 客户端，拦截器 | 自动附加 Bearer Token，401 时自动跳转登录 |
| **@stomp/stompjs** | ^7.3.0 | STOMP WebSocket 客户端 | 聊天消息实时推送，指数退避重连 |
| **ECharts 5** | ^5.6.0 | 数据可视化图表库 | 预留用于 Dashboard 图表（当前页面未使用） |
| **GSAP** | ^3.15.0 | 工业级 JS 动画引擎 | FadeContent 组件的滚动触发动画 |
| **Motion** | ^12.40.0 | 声明式 React 动画库 | BlurText 模糊渐入、Counter 数字滚动 |

### 前端关键设计

**1. JWT 管理**：
```
登录 → saveSession({token, user}) → localStorage
每次请求 → Axios 拦截器自动附加 Authorization: Bearer <token>
页面刷新 → currentUser() 从 localStorage 读 + 检查 exp 是否过期
401 响应 → Axios 拦截器自动清空会话 + 跳转登录页
```

**2. 角色权限路由**：
```tsx
<ProtectedRoute allowedRoles={['CUSTOMER']}>
  <CartPage />
</ProtectedRoute>
// 非 CUSTOMER 访问 → 自动重定向到角色对应的首页
```

**3. SSE 自研解析器**：
项目没有用 `EventSource`（它不支持 POST + 自定义 Header），而是用 `fetch() + ReadableStream + TextDecoder` 手写 SSE 解析器，支持 `event:`/`data:` 字段解析和流结束安全处理。

**4. 微交互动画**：
- `.product-card-fixed:hover { transform: translateY(-2px) }` — 卡片悬浮上浮
- `.product-image-fixed:hover { transform: scale(1.04) }` — 图片悬浮放大
- `.ant-btn:active { transform: scale(0.96) }` — 按钮按下缩小
- `ClickSpark` — Canvas 点击涟漪特效
- `BlurText` — 标题文字从模糊到清晰的入场动画

---

## 五、基础设施

| 技术 | 用途 | 为什么这么设计 |
|------|------|---------------|
| **Docker Compose** | 本地一键启动全部 12 个容器 | 新开发者 `docker compose up` 即可跑通全栈 |
| **Docker 多阶段构建** | 构建阶段（Maven/Node）→ 运行阶段（JRE/Nginx） | 最终镜像不含 JDK 和 node_modules，体积小 |
| **Nginx** | 生产环境前端服务器 | 静态资源缓存（图片 7 天、JS 1 年不可变）、API 反向代理 |
| **MySQL 8.4** | 6 个独立数据库，初始化脚本自动建库 | 服务间数据隔离，各自 Flyway 管理各自的 Schema |
| **Redis 7.4** | catalog-service 商品缓存 | 5 分钟 TTL，修改商品时全量清缓存 |
| **Prometheus + Grafana** | 指标采集 + 可视化 | 本地开发环境监控 JVM 指标（生产 EC2 版不含） |
| **Flyway** | 数据库版本迁移 | SQL 脚本 + Java 迁移混合，每次启动自动执行未应用的迁移 |
| **H2**（本地）/ **MySQL**（Docker） | 开发用嵌入式、部署用真实数据库 | 本地开发零配置，生产保证数据持久性 |
| **Kafka**（预留）| 依赖已配置但未使用 | 预留给未来的异步事件驱动（订单状态变更通知等） |
| **AWS ECS Fargate**（预留）| 6 个 Task Definition 已写好 | 预留给云部署 |

---

## 六、核心设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 服务间通信 | RestClient（同步 HTTP） | 学习曲线低，调试简单。Kafka 预留用于将来异步场景 |
| 服务发现 | 无（直接环境变量配置 URL） | 8 个服务不引入 Eureka/Consul 的运维复杂度 |
| 分层模式 | 多数用 Controller→Repository | 简单 CRUD 不需要 Service 层。chat-service 和 assistant-service 因业务复杂而引入 Service 层 |
| 认证 | Gateway 统一认证 + 可信头 | 下游服务不各自验证 JWT，减少重复代码和安全漏洞面 |
| 鉴权 | 每个服务各自检查 X-User-Role + 所有权 | Gateway 做粗粒度（角色），服务做细粒度（这个订单是你的吗） |
| 库存并发 | @Version 乐观锁 | 电商场景冲突概率低，乐观锁比悲观锁（SELECT FOR UPDATE）吞吐量更高 |
| SSE vs WebSocket | AI 导购用 SSE，聊天用 WebSocket | SSE 单向够用（AI 推送结果），聊天需要双向 |
| DeepSeek vs OpenAI | DeepSeek | 用户指定，API 兼容 OpenAI 格式 |
| 订单默认 UNPAID | 不在下单时自动标记已支付 | 分离"下单"和"支付"，更接近真实电商体验 |

---

## 七、数据流全景

以一次完整的"浏览→下单→支付"为例，数据经过的服务：

```
① 顾客打开商品页
   Browser → Gateway → catalog-service (GET /products)
                               └── Redis (缓存命中，5ms 返回)

② 搜索"跑步鞋"
   Browser → Gateway → catalog-service (GET /products?search=跑步鞋)
                               └── MySQL (缓存未命中，50ms → 写入 Redis)

③ 加入购物车
   Browser → Gateway → order-service (POST /cart/items)
                               └── RestClient → catalog-service (GET /products/{id} 取快照)
                               └── MySQL order_db (INSERT cart_items)

④ 结算下单
   Browser → Gateway → order-service (POST /checkout)
                               └── RestClient → catalog-service (POST /products/{id}/reserve × N)
                               └── MySQL order_db (INSERT orders + order_lines, DELETE cart_items)
   结果：订单状态 = PENDING_PAYMENT, 支付状态 = UNPAID

⑤ 去支付
   Browser → Gateway → payment-service (POST /payments)
                               └── RestClient → order-service (GET /orders/{id} 验证)
                               └── sleep(1~2s)  ← 模拟银行处理
                               └── RestClient → order-service (PUT /internal/orders/{id}/mark-paid)
                               └── MySQL payment_db (INSERT payments)
   结果：订单状态 → PENDING_SHIPMENT, 支付状态 → PAID

⑥ 商家发货
   Browser → Gateway → order-service (PUT /orders/{id}/ship)
   结果：订单状态 → PENDING_RECEIPT

⑦ 顾客收货
   Browser → Gateway → order-service (PUT /orders/{id}/confirm-receipt)
   结果：订单状态 → COMPLETED
```

---

## 八、文件统计

| 层级 | 文件数（约） | 主要语言 |
|------|-------------|----------|
| 后端 8 个服务 | ~120 个 Java 文件 | Java 21 |
| 数据库迁移 | ~18 个 SQL/Java 迁移 | SQL + Java |
| 前端 | ~25 个 TSX/TS 文件 | TypeScript + React |
| 样式 | 1 个 CSS 文件 (650+ 行) | CSS |
| Docker/部署 | ~15 个文件 | YAML / Dockerfile / Nginx |
| 文档 | ~5 个 Markdown 文件 | Markdown |

---

## 九、技术亮点

1. **多商户拆单**：结算时自动按 `merchantId` 分组，一个购物车产生多个独立订单，每个商家只能看到自己的订单。

2. **商品快照**：购物车和订单行保存加入时的价格/名称/图片，即使商家后续修改，历史订单不受影响。

3. **库存乐观锁**：`@Version` 字段在并发扣库存时自动检测冲突，防止超卖。

4. **AI 推荐防编造**：LLM 用候选列表索引进标推荐，后端映射回真实 productId，不信任 LLM 输出的任何 ID。

5. **SSE 自研解析器**：支持 POST + 自定义头的 SSE 流（浏览器原生 `EventSource` 不支持），并在 Spring 的非标准 SSE 格式（`event:done` 冒号后无空格）下工作。

6. **WebSocket + REST 双模**：聊天主用 WebSocket，断连自动降级到 HTTP 轮询，用户无感知。

7. **JWT 过期自动检测**：前端在每次读取 localStorage 时检查 `exp` 字段，过期自动清除会话。

8. **Docker 一键启动**：新开发者只需 `docker compose up`，12 个容器自动编排启动。

---

## 十、技术迭代路线

这个项目不是一次性写完的，而是按照“单体电商功能 → 微服务拆分 → 交易一致性 → 实时通信 → AI 能力 → 性能和部署”的路线逐步演进。这样的路线更接近真实业务系统从 MVP 到可演示平台的成长过程。

### 阶段 1：电商核心 MVP

最早目标是先跑通基础电商闭环：

- 用户注册、登录、JWT 鉴权。
- 商品浏览、分类、搜索、商品详情。
- 购物车加购、修改数量、删除商品。
- 顾客下单，商家查看订单并发货。

这一阶段的重点不是架构复杂度，而是把“用户能买、商家能卖、系统能记录订单”这条主链路打通。

### 阶段 2：从普通购物车项目升级为多商户平台

在基础链路稳定后，项目加入了多商户模型：

- 商品归属于具体 `merchantId`。
- 顾客购物车可以同时包含多个商家的商品。
- Checkout 时按商家自动拆单。
- 商家只能管理自己的商品、订单和售后。
- Admin 可以跨商家查看和管理数据。

这个阶段的核心变化是从“单店铺购物车”升级为“Marketplace 平台”，数据权限和订单归属成为设计重点。

### 阶段 3：订单生命周期和售后能力完善

随后补齐更真实的订单状态机：

- 订单从 `PENDING_PAYMENT` 到 `PENDING_SHIPMENT`、`PENDING_RECEIPT`、`COMPLETED`。
- 未支付订单不能发货。
- 已支付后才能进入履约阶段。
- 售后支持退款、退货、换货等不同流程。
- 订单和售后状态转换由实体方法约束，避免 Controller 随意改状态。

这一阶段的价值在于让项目从 CRUD 变成有业务规则的交易系统。

### 阶段 4：支付服务独立与交易一致性补强

支付模块被单独拆为 `payment-service`，并补齐安全和幂等设计：

- Checkout 只生成待付款订单，不再假设订单已经支付。
- `payment-service` 负责创建支付记录并模拟支付成功。
- `order-service` 暴露内部 `mark-paid` 接口，只允许服务间调用。
- Gateway 阻止外部访问 `/internal/**`，避免用户绕过支付改订单状态。
- 同一订单重复支付会返回已有处理中记录或拒绝重复成功支付。
- 支付成功但后续保存失败时，后续重试可以根据订单已支付状态恢复一致性。

这部分体现的是电商系统里非常关键的交易安全意识：支付、订单、发货不能只靠前端按钮控制。

### 阶段 5：实时聊天从轮询升级到 WebSocket

聊天功能最初可以用 REST 轮询实现，但轮询会带来延迟和无效请求。后续升级为：

- WebSocket/STOMP 推送新消息和已读事件。
- REST 保留为历史消息加载和断线降级方案。
- WebSocket 握手独立验证 JWT，因为它不完全走普通 HTTP 网关流程。
- 前端连接成功时关闭轮询，断线时自动恢复低频轮询。

这个阶段展示了对实时场景的取舍：主路径用 WebSocket，兜底路径用 REST，避免单点体验失败。

### 阶段 6：AI Assistant 能力加入

项目加入 `assistant-service`，用于 AI 导购和运营辅助：

- 从 catalog-service 拉取候选商品。
- 调用 DeepSeek 兼容 OpenAI 风格的 API。
- 使用 SSE 流式返回分析过程和推荐结果。
- 使用候选索引映射真实商品 ID，降低 LLM 编造商品的风险。
- LLM 不可用时降级到规则推荐。

这一阶段的重点不是简单“接一个大模型 API”，而是把 LLM 放进业务约束里：只能推荐真实商品，失败时系统仍能工作。

### 阶段 7：性能优化和生产化准备

最新一轮迭代聚焦性能和部署准备：

- 后端商品、订单、售后、聊天列表接口支持分页，避免一次性返回大量数据。
- 数据库补齐高频查询索引，例如商品分类/搜索、订单用户/商家/状态、聊天会话时间排序。
- 前端使用 route-level code splitting，减少首屏主包体积。
- 图片增加懒加载，Nginx 对 `/assets/` 和 `/images/` 增加缓存策略。
- Docker Compose 增加云服务器部署配置，适配 DigitalOcean Droplet 单机部署。

这一阶段把项目从“功能能跑”推进到“数据量变大后仍然可用、可以放到云服务器演示”。

---

## 十一、迭代复盘与工程经验

结合开发过程中的工作日记，项目中比较有价值的不只是最终功能，还包括几次关键方向调整和踩坑修正。

### 1. 从功能堆叠转向契约驱动协作

早期多商户、购物车、订单详情、Dashboard、售后等功能连续叠加在同一个工作区里，开发速度快，但 review 粒度过大，容易把不相关改动混到一起。后来通过 `CONTRIBUTING.md` 和 Sync Log 固化协作规则：

- 跨模块或跨 Agent 修改前先明确计划。
- 后端接口契约变化要同步到前端类型、API client 和文档。
- 文档 Sync Log 只能描述已经真实合入的能力，不能提前声明尚不存在的契约。
- 提交前用 `git status --short` 检查 staged 范围，避免混入旧改动。

这让项目从“个人快速开发”逐步转向“可多人协作、可 review 的工程流程”。

### 2. 从页面按钮设计转向业务状态机设计

售后和订单模块早期容易围绕页面操作按钮设计，例如“商家确认后售后结束”。复盘后发现真实电商流程必须先建模状态机：

- 仅退款可以商家同意后直接完成。
- 退货需要经历用户寄回、商家收货、退款完成。
- 换货需要经历用户寄回、商家收货、商家重新发货、用户确认收货。
- 订单必须先支付再发货，不能由前端按钮绕过。

因此后续把状态转换沉到领域实体方法里，并用测试覆盖关键流转，避免 Controller 直接随意改状态。

### 3. 从理想云架构调整为低成本可演示部署

最初设计过 AWS ECS/Fargate、RDS、ElastiCache、ALB、Route 53 的完整云方案，作品集展示价值高，但对“先让项目在公网跑起来”来说成本和复杂度偏高。后续调整为两层部署策略：

- **当前演示方案**：DigitalOcean Droplet + Docker Compose + 单机 MySQL/Redis，成本低，适合面试演示和快速验证。
- **生产化目标方案**：ECS/Fargate + RDS + ElastiCache + ALB + 对象存储，用于展示云原生扩展方向。

这个调整体现了工程取舍：先满足当前目标，再保留向生产架构演进的路线。

### 4. 数据迁移不仅是数据库迁移

部署排查时发现，迁移 MySQL 只能迁移图片路径，不能迁移 Docker volume 里的真实上传文件。这暴露出一个典型问题：业务数据不只存在数据库里，还可能存在本地磁盘、对象存储、缓存或消息队列中。

当前项目的处理方式：

- 短期：记录 `catalog-uploads` Docker volume 的备份/恢复命令。
- 中期：商品图片尽量使用稳定公开 URL。
- 长期：迁移到 S3、DigitalOcean Spaces 或 Cloudflare R2，并配合 CDN。

这也是后续生产化最值得优先升级的一点。

### 5. 实时通信和 AI 能力是渐进式引入

聊天并不是一开始就上 WebSocket，而是先用 REST 轮询跑通业务，再升级为 WebSocket/STOMP，并保留 REST 作为断线降级方案。AI Assistant 也是先实现无状态推荐和 SSE 流式 UI，再考虑更复杂的 RAG、Embedding 和向量库。

这种路线避免了过早引入复杂基础设施：

- REST 先保证可用。
- WebSocket 解决实时性。
- SSE 解决 AI 流式输出。
- RAG/向量搜索作为后续增强，而不是 MVP 前置依赖。

### 6. 前端体验问题需要可视化验证

UI 迭代中出现过标签“大小不一致”的问题。第一次只从 CSS 优先级和 line-height 入手，没有真正定位视觉差异来源；后来通过截图分析确认主要是文字长度导致宽度差异，最终用 `min-width`、`height`、`inline-flex` 和居中对齐解决。

这个经验可以概括为：视觉问题不要只凭描述猜，先确认到底是宽度、高度、间距、颜色还是对齐问题，再改 CSS。

---

## 十二、后续可优化方向

如果继续迭代，优先级最高的是这几类：

1. **支付和库存最终一致性**  
   当前未支付订单会预留库存，用户可以手动取消释放库存。下一步应增加订单超时取消任务，自动释放长时间未支付订单占用的库存。

2. **事件驱动改造**  
   订单支付成功、发货、售后状态变化可以通过 Kafka/RabbitMQ 发送事件，analytics、通知、聊天提醒等服务异步订阅，减少同步调用耦合。

3. **对象存储迁移**  
   当前商品图片保存在 Docker volume，适合单机演示。真实生产应迁移到 S3、DigitalOcean Spaces 或 Cloudflare R2，避免 Droplet 损坏导致图片丢失。

4. **服务间认证增强**  
   当前服务间调用使用固定 internal token。后续可以升级为 mTLS、短期服务 token，或至少支持 token rotation。

5. **观测性增强**  
   已有 Actuator、Prometheus、Grafana 基础，但可以继续增加结构化日志、traceId、分布式追踪和错误告警。

6. **前端继续减包**  
   当前已做页面级懒加载，后续可以进一步拆分 Ant Design、图表库和动画库 vendor chunk，降低首屏加载体积。

7. **测试覆盖增强**  
   继续补充支付失败恢复、库存释放、跨商家权限、WebSocket 断线重连、售后状态机等集成测试。

---

📖 术语速查

- **JWT (JSON Web Token)**：一种自包含的令牌，服务端签发后客户端保存，每次请求带上。服务端通过签名验证真伪，无需查数据库。
- **SSE (Server-Sent Events)**：服务器向浏览器单向推送数据的协议。比 WebSocket 简单（纯文本流），适合实时推送但不需要客户端回传的场景。
- **STOMP (Simple Text Oriented Messaging Protocol)**：WebSocket 之上的子协议，提供了"目的地"（destination）的概念（类似 HTTP 的 URL），让消息路由更清晰。
- **ORM (Object-Relational Mapping)**：把数据库表自动映射为 Java 对象的框架。Spring Data JPA 是 ORM 的一种实现——你操作 Java 对象，框架自动生成 SQL。
- **乐观锁 (Optimistic Locking)**：假设并发冲突概率低，"先改再检查"。用版本号（@Version）实现：读数据时记下版本号，写回时检查版本号是否被改过。被改过就重试。
- **悲观锁 (Pessimistic Locking)**：假设冲突必然发生，"先锁再改"。用 `SELECT FOR UPDATE` 锁住行，改完再释放。吞吐量低于乐观锁。
- **Flyway**：数据库版本管理工具。把数据库结构的变更写成脚本，按顺序执行，保证所有环境的数据库结构一致。
- **幂等 (Idempotent)**：同一个操作执行一次和执行多次的结果相同。支付接口的幂等检查防止用户重复点击导致扣款两次。
- **可信头模式 (Trusted Header Pattern)**：网关验证身份后，把用户信息放在 HTTP Header 中传给下游服务。下游服务信任这些 Header，不再各自验证。
- **DTO (Data Transfer Object)**：在不同层或不同服务之间传递数据的简单对象（本项目用 Java Record）。不包含业务逻辑。
- **服务降级 (Fallback)**：当一个依赖服务不可用时，自动切换到备用方案。例如 LLM 宕机 → 规则推荐。
