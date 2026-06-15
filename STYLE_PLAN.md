# Smart CommerceOps → Shopifi 风格调整方案

## 当前状态诊断

| 维度 | 当前值 | DESIGN.md 目标 | 差距 |
|------|--------|---------------|------|
| 主题色 | `#1677ff` (蓝) | `#000000` (黑) | 完全不一致 |
| 圆角 | `6px` | `9999px` (胶囊) | 按钮形状不对 |
| 背景 | `#f4f6f9` (冷灰) | `#fbfbf5` (暖白) / `#ffffff` | 接近但色调偏冷 |
| 字体 | Inter 默认 | Inter Variable 420-550 | 字重缺少分层 |
| 卡片 | 默认白卡+阴影 | `hairline-light` 1px 边框 | 细节差异 |
| 标签 | Ant Design 默认 | `pill-tag-mint` / `pill-tag-shade` | 无 mint 色系 |
| 按钮 | 蓝底白字 | 黑底白字胶囊 / 白底黑字描边胶囊 | 彻底不同 |

### 页面分类（全部为 Transactional Track）

DESIGN.md 的双画布系统中，本项目所有页面都属于 **Transactional Track**（无营销页），统一走 `canvas-light` / `canvas-cream`：

```
交易型页面（10 个）:
  ProductsPage       → 商品市场（列表 + 筛选）
  ProductDetailPage  → 商品详情
  LoginPage         → 登录注册
  DashboardPage     → 运营仪表盘
  CartPage          → 购物车
  OrdersPage        → 订单列表
  OrderDetailPage   → 订单详情
  ProfilePage       → 个人资料
  ChatListPage      → 消息列表
  ChatDetailPage    → 聊天详情
```

---

## 分阶段实施方案

### Phase 1：Ant Design 主题 Token（`main.tsx`）

**文件**: `frontend/src/main.tsx`

将 `ConfigProvider` 的 theme 从蓝色系切换为 Shopifi 黑色系：

```tsx
<ConfigProvider
  theme={{
    token: {
      // 主色：DESIGN.md {colors.primary}
      colorPrimary: '#000000',
      // 默认圆角统一改为胶囊
      borderRadius: 9999,
      // 字体
      fontFamily: "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      // 基础背景
      colorBgLayout: '#fbfbf5',        // {colors.canvas-cream}
      colorBgContainer: '#ffffff',     // {colors.canvas-light}
      // 边框
      colorBorder: '#e4e4e7',          // {colors.hairline-light}
      colorBorderSecondary: '#e4e4e7',
      // 文字
      colorText: '#000000',            // {colors.ink}
      colorTextSecondary: '#71717a',   // {colors.shade-50}
      // 成功色 (用作 aloe 的近似)
      colorSuccess: '#c1fbd4',
      // 字号微调
      fontSize: 16,                    // {typography.body-md} fontSize
      lineHeight: 1.5,
      // 间距
      padding: 16,                     // {spacing.lg}
      paddingSM: 12,                   // {spacing.md}
      paddingXS: 8,                    // {spacing.sm}
    }
  }}
>
```

> **影响**: 全局按钮变黑胶囊、背景变暖白、边框变细、字体统一。

---

### Phase 2：全局布局样式（`styles.css`）

#### 2a. Body 背景 + 字体

```css
body {
  margin: 0;
  background: #fbfbf5;                          /* {colors.canvas-cream} */
  font-family: 'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

#### 2b. Topbar → nav-bar-light

对照 DESIGN.md `nav-bar-light`:
- 背景 `#ffffff`
- 无下边框，或极细 hairline
- padding `16px 24px`

```css
.topbar {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #ffffff;                          /* {nav-bar-light.backgroundColor} */
  border-bottom: 1px solid #e4e4e7;             /* {colors.hairline-light} */
  padding: 16px 24px;                           /* {nav-bar-light.padding} */
  height: auto;                                 /* 取消 Ant Design Header 强制 64px */
}
```

#### 2c. Brand 字体

```css
.brand {
  flex: 0 0 auto;
  font-size: 16px;
  font-weight: 550;                             /* {typography.body-strong} */
  letter-spacing: 0;
}
```

#### 2d. Content 区域间距

```css
.content {
  padding: 24px;                                /* {spacing.xl} — 保持不变 */
}
```

---

### Phase 3：组件级调整（`styles.css` 增量）

#### 3a. 卡片 → card-pricing style

```css
/* 通用卡片提亮 + 细边框 */
.ant-card {
  border: 1px solid #e4e4e7;                   /* {colors.hairline-light} */
  border-radius: 12px;                          /* {rounded.lg} */
}
```

#### 3b. 标签 → pill-tag

```css
/* mint 标签（替代当前 category Tag） */
.pill-tag-mint {
  background: #c1fbd4;                          /* {colors.aloe-10} */
  color: #000000;                               /* {colors.ink} */
  font-size: 12px;                              /* {typography.eyebrow-cap} */
  font-weight: 400;
  letter-spacing: 0.72px;
  border-radius: 9999px;                        /* {rounded.pill} */
  padding: 4px 12px;
  border: none;
}

/* shade 标签 */
.pill-tag-shade {
  background: #d4d4d8;                          /* {colors.shade-30} */
  color: #000000;
  font-size: 12px;
  letter-spacing: 0.72px;
  border-radius: 9999px;
  padding: 4px 12px;
  border: none;
}
```

#### 3c. 统计数字

```css
/* Statistic 组件标题重量对齐 body-strong */
.ant-statistic-title {
  font-weight: 420;                             /* {typography.body-md} weight */
  color: #71717a;                               /* {colors.shade-50} */
}
```

#### 3d. 输入框微调

```css
/* 输入框对齐 text-input token */
.ant-input,
.ant-input-number {
  border-radius: 8px;                           /* {rounded.md} — 输入框不是胶囊 */
}
```

#### 3e. Cart / Order 行样式微调

```css
.cart-toolbar,
.cart-summary-bar {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;                          /* {rounded.lg} — 从 6px 升级 */
}
```

#### 3f. 分隔线颜色统一

```css
.cart-item-row {
  border-top: 1px solid #f0f0f0;                /* 保持轻量 — DESIGN.md 无强分隔线 */
}
```

---

### Phase 4：页面级调整

#### 4a. LoginPage

登录页最接近 DESIGN.md 的交易型页面风格。只需调整卡片：

```css
.auth-card {
  width: min(440px, 100%);
  border-radius: 12px;                          /* {rounded.lg} */
  border: 1px solid #e4e4e7;
}
```

#### 4b. ProductsPage — 商品卡片

把 `Tag` 从 Ant Design 默认色切换为 pill-tag：

```tsx
// 当前：<Tag color={...}>
// 改为：
<Tag className={product.stockQuantity <= product.lowStockThreshold ? 'pill-tag-shade' : 'pill-tag-mint'}>
  {product.category}
</Tag>
```

商品卡片价格/库存/评分使用 `body-strong` 字重。

#### 4c. ProductDetailPage — 详情页

- 图片圆角从 `6px` → `8px` (`{rounded.md}`)
- 轮播容器背景保持 `#f5f5f5`
- Category Tag 同上换成 pill-tag

#### 4d. DashboardPage

这是最能接近"cinematic"味道的页面。但按 DESIGN.md 规则，Dashboards 也是 Transactional Track。

可以用 `card-pistachio-band` 的变体：
```css
/* 仪表盘顶部统计卡 */
.dashboard-stat-card {
  background: #d4f9e0;                          /* {colors.pistachio-10} */
  border-radius: 12px;                          /* {rounded.lg} */
  border: none;
}
```

#### 4e. 其他页面

Cart / Orders / OrderDetail / AfterSales / Profile / Chat — 这些页面主要靠 Phase 1-3 的全局 token 更新自然改善。无需额外页面级 CSS。

---

## 实施顺序（按影响面从小到大）

| 步骤 | 文件 | 影响范围 | 验证方式 |
|------|------|----------|----------|
| **1** | `main.tsx` | 全局主题 token | 启动看首页颜色、按钮形状 |
| **2** | `styles.css` — body/topbar/content | 全局布局 | 看顶栏、背景 |
| **3** | `styles.css` — 组件级 (card/tag/input) | 所有卡片和输入框 | 打开 Products、Login |
| **4** | `ProductsPage.tsx` — Tag 替换 | 商品列表 | 看分类标签是否变 mint 胶囊 |
| **5** | `ProductDetailPage.tsx` — Tag 替换 | 详情页 | 看分类标签 |
| **6** | Dashboard 可选增强 | 仪表盘 | 统计卡片样式 |

## 不改的内容

| 项目 | 原因 |
|------|------|
| 页面结构、组件逻辑、API 调用 | 样式调整，不动功能 |
| 聊天消息气泡 (`chat-message`) | 已有合理样式，不需改为 black canvas |
| 响应式断点 (`@media 640px`) | 当前已覆盖 |
| Neue Haas Grotesk Display 字体 | 本项目无营销/hero 页面，Inter Variable 已足够 |
| 全出血摄影 | 本项目无 cinematic 页，不需要 |

## 预期效果

调完后，整个应用呈现：
- **纯黑 + 暖白** 配色（非蓝色）
- **所有按钮都是胶囊形**，黑底白字 / 白底黑描边
- **卡片有细 hairline 边框**，非粗阴影
- **mint/灰 小标签** 替换 Ant Design 默认彩色 Tag
- 整体从一个"蓝色主题后台"变为"黑色极简电商"
