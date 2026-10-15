# editor-formatting Specification

## Purpose

为使用者提供统一的代码格式化（Code Formatting）规则，使命令行、持续集成与 VS Code 编辑器使用仓库内同一份配置，并在保存文件时自动格式化实际采用的语言，避免个人编辑器默认值造成差异。

## Requirements

### Requirement: 统一格式化命令

项目 SHALL 固定 Prettier 版本并提供 `format` 与 `format:check`；配置 MUST 使用两空格缩进、120 列打印宽度及 LF 行尾。格式检查 SHALL 覆盖源代码与维护配置，并排除构建输出、缓存、生成技能、锁文件及须原样保留的上游 AGENTS.md。

#### Scenario: 本地与流水线格式检查

- **WHEN** 开发者或 CI 执行 `format:check`
- **THEN** 使用项目本地 Prettier 与相同规则，格式不符时非零退出，检查不改写文件

### Requirement: VS Code 保存自动格式化

项目 SHALL 提供可提交的 `.vscode/settings.json`，启用 `editor.formatOnSave` 并将 Prettier 指定为 Vue、TypeScript、JavaScript、HTML、JSON/JSONC、CSS、Markdown 和 YAML 的格式化器；扩展推荐 MUST 包含 Prettier 与 Vue 官方扩展。

#### Scenario: 使用推荐扩展保存 Vue 文件

- **WHEN** 使用者安装推荐扩展、打开本工作区并保存 Vue 单文件组件（Single-File Component, SFC）
- **THEN** 编辑器调用项目 Prettier 配置格式化文件

### Requirement: 编辑器配置可移植

项目 SHALL 仅包含模板实际依赖的编辑器设置，不引用不存在的业务路径或强制未安装工具执行保存动作；忽略规则 MUST 允许提交 settings 与 extensions 文件。

#### Scenario: 从新检出打开工作区

- **WHEN** 使用者打开全新检出
- **THEN** 格式化配置无需钱包项目的目录、国际化资源或 ESLint 扩展即可生效

## 术语表（Glossary）

当前无项目私域术语；本文技术术语保持行业通义。
