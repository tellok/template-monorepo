# Spec Delta

## Purpose

为模板使用者提供一致的多包仓库（Monorepo）开发入口，保证新检出可以根据固定依赖重现开发环境，应用与共享包具有各自版本，并可通过统一命令执行构建和类型检查。

## ADDED Requirements

### Requirement: 工作区发现与独立版本

项目 SHALL 仅从 `app/*` 和 `packages/*` 发现工作区包；每个包 MUST 声明自身名称和初始版本，版本变更不得无条件同步全部包。

#### Scenario: 安装两个顶层目录中的包

- **WHEN** 开发者从根目录安装依赖
- **THEN** `app/webapp` 和 `packages/tsconfig` 被发现且工作区依赖本地解析
- **AND** 每个包具有独立的 `0.1.0` 初始版本

### Requirement: 可重复的开发命令

项目 SHALL 提供固定工具版本、已提交的锁文件（Lockfile）和根级构建、类型检查命令；冻结安装 MUST 在依赖与锁文件不一致时失败。

#### Scenario: 全新安装与构建

- **WHEN** 开发者按 README 使用指定 Node 与 pnpm 版本冻结安装并运行根级检查
- **THEN** 工作区类型检查与应用生产构建成功，且安装不修改锁文件

### Requirement: 依赖技能自动同步

项目 SHALL 在安装后自动同步 npm 依赖携带的代理技能（Agent Skill），并保留同步锁文件；同步失败 MUST 使安装生命周期失败，不得覆写人工维护的技能。

#### Scenario: 安装后同步

- **WHEN** 开发者安装依赖且生命周期脚本正常运行
- **THEN** `skills-npm` 按工作区扫描依赖并生成其管理清单，内部维护技能进入 `.agents/skills/`

### Requirement: 忽略文件来源可追溯

项目 SHALL 使用用户指定 Toptal 地址的完整成功响应作为 `.gitignore` 基础，并明确标注额外项目规则；下载失败 MUST 报告而非静默替换来源。

#### Scenario: 原始规则与缓存规则并存

- **WHEN** 指定来源下载成功并生成 `.gitignore`
- **THEN** 基础规则保留，依赖目录、构建输出、开发代理状态及构建缓存不进入版本控制
