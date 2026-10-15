# Proposal

## Why

仓库尚无提交、源码或开发配置，需要建立可运行、可验证、可复制的 TypeScript 多包仓库（Monorepo）模板，并让各包独立演进版本。初始化同时定义 GitHub 与 GitLab 的持续集成（Continuous Integration, CI）入口及发布边界。

## What Changes

- 原样采用指定上游 AGENTS.md，使用 OpenSpec 提案、审批、实施、验证与归档流程。
- 使用 pnpm 工作区（Workspace），仅以 `app/*`、`packages/*` 发现包；锁定 Node 24 与 pnpm，使用 Turborepo 编排构建和类型检查。
- 创建最新版稳定 Vue + Vite + TypeScript 的 `app/webapp`，使用 Vue 单文件组件及 `vue-tsc` 检查；创建可独立版本化的 `packages/tsconfig` 共享配置包，初始均为 `0.1.0`。
- 配置 Prettier、统一命令行与 VS Code 保存格式化规则，提供 `format`、`format:check`，接入双平台 CI。
- 接入 `skills-npm`，在依赖安装后自动发现并安装依赖携带的代理技能；它管理技能，不替代 pnpm 安装 npm 依赖。远程维护技能固定到上游完整提交。
- 使用指定 Toptal API 的完整响应作为 `.gitignore` 基础，追加必要的项目缓存忽略项并记录来源；无法下载时明确阻塞，不伪称使用了原内容。
- 使用 portless 提供基于分支或工作树（Git Worktree）名称的稳定本地域名，覆盖普通检出、关联工作树和分离头指针（Detached HEAD）。
- 使用 Changesets 管理独立版本、变更日志及版本 PR/MR；为两平台提供独立的质量检查入口、发布设计和启用说明，不执行远端发布或部署。

## Capabilities

### New Capabilities

- `workspace-development`：工作区布局、依赖与技能同步、独立版本元数据和构建编排。
- `webapp-routing`：Vite 应用与基于 Git 上下文的稳定本地域名。
- `release-workflow`：独立版本准备、双平台检查及受信任正式发布契约。

- `editor-formatting`：Prettier 格式规则、格式检查与 VS Code 保存自动格式化。

### Modified Capabilities

无。检索时仓库无主规格与历史归档。

## Impact

OpenSpec: required。计划影响根清单、锁文件、工作区配置、`turbo.json`、`app/webapp/**`、`packages/tsconfig/**`、`scripts/**`、`.changeset/**`、`.github/workflows/**`、`.gitlab-ci.yml`、Prettier 配置、`.editorconfig`、`.vscode/settings.json`、`.vscode/extensions.json`、README 及发布文档。新增构建、依赖、启动、编辑器与发布配置，属于 AGENTS.md 明确规定的行为变更，须审批本提案后实施。

阅读审计：2026-10-15 从空检出检查全部文件、Git 分支及引用；无现有源码、测试、CI、规格或归档。`openspec list --json` 初始无根，初始化后活跃列表为空；当前为无提交的 `work` 分支，无继承 change，本 change 为唯一新建活跃 change。`openspec list --specs --json` 返回空列表。

上游依据：`tellok/dotai@7f96019efc531774786892de1573b937e7274be9` 的 AGENTS.md、design-pr-versionization 及其三份参考资料；`antfu/skills-npm@37a3affb356011d52b6e10a6d2066716acd5a4ac` 的 README；portless 官方 README 与 Git 检出规则。具体方案、平台缺口与测试清单见 design.md。

External-Skill: exempt。检索 `skills/*/SKILL.md`、分发清单、对外文档及 `.agents/skills/`，初始均不存在；模板只引入内部维护技能及开发流程，不提供面向消费方的公开技能契约，无需创建对外 skill。

README-Glossary: verified。检查新增能力名称与发布术语，均为行业通用技术术语或路径标识，无项目私域含义。主规格与 README 保留空的“术语表（Glossary）”及规定表头，说明当前无项目私域术语，不录入行业词典。

审批范围：proposal、四个 delta spec、design 和 tasks 的当前版本，以及 design 中逐项列出的新增测试用例。未获得审批前仅保存规划和协作规则，不创建应用、构建或 CI 实现。

用户补充已纳入：最新版稳定 Vue、OpenSpec 工具与维护流程，以及 Prettier/VS Code 保存格式化。
