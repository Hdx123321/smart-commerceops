# 远程 GitHub 协作流程

**日期**: 2026-06-13
**分类**: 概念 / 协作 / 全栈

## 核心问题

远程团队（不在同一台机器上）如何进行代码协作？标准的 GitHub Pull Request 流程是怎样的？团队成员的工作是否需要完全解耦？

## GitHub 标准协作流程（7 步）

### 第 1 步：克隆仓库（只需一次）

```bash
git clone https://github.com/team/smart-commerceops.git
cd smart-commerceops
```

每个人电脑上都有完整代码库的副本。

### 第 2 步：开分支（Feature Branch）

分支命名约定：`feature/xxx`（新功能）、`fix/xxx`（修 bug）、`docs/xxx`（文档）。

```bash
git checkout -b feature/product-images
```

分支是 Git 的"平行宇宙"——从 `main` 分叉出一条独立的开发线，不影响其他人。

### 第 3 步：本地开发 + 提交

```bash
git add .
git commit -m "商品图片支持多图上传和懒加载"
```

### 第 4 步：推到远程 + 开 Pull Request

```bash
git push origin feature/product-images
```

在 GitHub 网页上点 "New Pull Request"，写清楚改了什么、关联哪个 Issue。

**PR（Pull Request）**是 GitHub 的核心协作机制。"我改好了一部分代码，请拉取到主分支"。是代码审查的入口——改动不会直接进 `main`，而是先挂出来等人审。

### 第 5 步：CI 自动检查 + Code Review

PR 一开，CI 自动跑编译、测试、代码风格检查。同时 Reviewer（审查者）逐行审查代码，有问题在 PR 评论区讨论修改。

**CI（持续集成）**：每次提交自动触发编译、测试、检查，确保不会"在我机器上能跑"。GitHub Actions 是最常用的 CI 工具。

**Code Review（代码审查）**：人工逐行检查逻辑、风格、安全问题，不是"找茬"而是"把关"。

### 第 6 步：修改 → 推送 → 重新审查 → 合并

```
提交修改 → CI 重跑 → Reviewer approve ✅ → 点 "Merge Pull Request" → 分支合入 main → 分支自动删除
```

### 第 7 步：同步上游

```bash
git checkout main
git pull origin main          # 拉下最新代码
git checkout feature/my-work
git merge main                # 把别人的改动合进自己的分支
```

## 关键概念

### Source of Truth（唯一真源）
所有改动以 GitHub 仓库为准，本地代码只是副本。丢了本地代码可以重新 clone，仓库才是权威。

### 合并冲突（Merge Conflict）
两个人改了同一个文件的同一行，Git 无法自动合并，需要人工解决。

## 工作是否需要完全解耦？

**不需要，但需要策略。** 完全不耦合是一个理想，真实项目中几乎没有。关键不是"避开耦合"，而是"怎么管理耦合"。

### 管理耦合的 5 种策略

| 策略 | 怎么做 | 解决什么问题 |
|---|---|---|
| 提前沟通 | 开工前在群里声明要动哪些文件 | 避免同时改同一个文件 |
| 小步快跑 | 每人每天合并一次，不让分支存活超过 2 天 | 冲突范围小，解决成本低 |
| 接口先行 | 先约定好 API/类型/数据结构，各写各的实现 | 改同一个文件但改不同区域 |
| 垂直拆分 | 一人改后端整条链路，另一人改前端页面 | 尽量不碰同一个文件 |
| Feature Flag | 代码里埋开关变量，上线后先关着，稳定再开 | 大功能可以长期并行开发 |

### Feature Flag（功能开关）
代码里埋一个开关变量，运行时动态决定是否启用某功能。代码已经合入了 `main`，但用户看不到——直到你打开开关。张三加 Redis、李四加图片上传，两个大功能可以同时合并但不影响线上。

## 对比：本地协作 vs 远程协作

| | 本地协作 | 远程协作 |
|---|---|---|
| 代码存放 | 同一台电脑 | GitHub 仓库 |
| 改动方式 | 直接编辑文件 | 分支 → PR → 审查 → 合并 |
| 冲突处理 | 几乎无 | 合并冲突手动解决 |
| 质量把关 | 口头建议 | CI 自动检查 + Reviewer 审查 + PR 审批 |
| 版本追溯 | 无 | 每条 PR 记录谁、什么时候、为什么改 |
| 回滚 | 手动撤销 | `git revert` 一条命令 |
| 上线 | 手动 | CI 自动构建 Docker 镜像 → 自动部署 |

## 相关笔记

- [[01-顾客完整购物流程]]
- [[02-术语速查]]
