# Tasks

## 1. 工作区与工具

- [x] 1.1 记录用户明确要求暂时跳过门禁与提案等待并直接实施；保留当前设计与测试范围作为记录，不以原门禁要求额外停顿。
- [x] 1.2 创建 Node/pnpm 版本声明、根清单及 `app/*`、`packages/*` 工作区，生成精确版本锁文件；用 pnpm 包列表与冻结安装核验发现和依赖解析。
- [x] 1.3 接入 Turborepo 构建和类型检查任务、共享严格 TypeScript 配置包；执行任务图检查并在 README 记录经过实测的根命令。
- [x] 1.4 固定 OpenSpec CLI 并提供列表和严格校验脚本，保留已生成维护技能；验证 `spec:list`、`spec:validate`，在 README 说明完整审批流程与技能边界。
- [x] 1.5 配置 skills-npm prepare、递归依赖发现、固定远程发布技能与生成锁文件；新增 design 清单中的技能幂等测试并执行，两次安装确认链接稳定且上游手写技能不被覆盖。
- [x] 1.6 在网络配置生效后获取指定 Toptal 完整响应，添加缓存与 VS Code 精确白名单；验证下载来源、正文与 `git check-ignore`，README 记录来源和扩展规则，失败时保留准确阻塞记录。

## 2. Vue 网页应用与本地路由

- [x] 2.1 创建 Vue 3.5.44 + Vite + TypeScript 应用、App.vue 交互与共享配置引用；运行 `vue-tsc` 和生产构建，在 README 记录启动、构建与预览命令。
- [x] 2.2 实现分支/工作树/分离头指针身份解析及 DNS 标签生成；新增并运行清单中的六项路由用例，README 说明身份优先级、清洗和冲突行为。
- [x] 2.3 通过参数数组调用 portless，配置实际 Host 白名单与非特权 HTTP 路径；核对已安装 CLI 帮助并运行清单中的代理和生产预览两项功能请求测试。
- [x] 2.4 安装浏览器验证所需 Playwright 与可信 Chromium，新增并运行清单中的 Vue 挂载点击测试，核对计数从 0 变为 1；文档区分 HTTP 云验证与本机 HTTPS 信任设置。

## 3. 格式化与编辑器

- [x] 3.1 固定 Prettier 并添加 `.prettierrc.json`、`.prettierignore`、`.editorconfig` 和 `format`/`format:check`；格式化当前可维护文件并执行只读检查，验证 AGENTS.md 与上游逐字一致。
- [x] 3.2 添加 `.vscode/settings.json`、`.vscode/extensions.json`，启用保存格式化和对应语言默认格式化器；解析 JSON 核对设置，用代表性 Vue/TypeScript/JSON 内容核验本地格式规则，README 记录安装扩展步骤及 GUI 未实测边界。

## 4. 独立版本与双平台配置

- [x] 4.1 配置独立 Changesets、私有包版本更新和中文说明，创建关联本 change 的初始变更集；在临时干净副本执行清单中的单包版本测试，确认真实版本和日志变化，工作目录不消费变更集。
- [x] 4.2 创建 GitHub 原生质量入口，固定核实过的官方 Action 完整 SHA、最小权限及取消组，运行冻结安装、格式、类型、测试与构建；静态检查配置和所有引用，文档声明未在 GitHub 实测。
- [x] 4.3 创建根级 GitLab MR/default-branch 质量入口，明确合并结果类型与身份要求，复用根检查命令；解析 YAML 并交付目标实例 CI Lint 步骤，未提供实例时如实标记未实测。
- [x] 4.4 生成共享契约及分开的 GitHub/GitLab 发布文档，覆盖阶段图、轻量检测、版本请求、资格、信任、目标更新重检、同源交付、存储、清理、并发与恢复；按指定 skill 清单逐项核对，记录未合并组件状态、固定提交及启用前提，发布写入保持未启用。

## 5. 集成验证与环境复用

- [x] 5.1 执行冻结安装、格式检查、组件类型检查、生产构建及全部获批 11 个用例，记录执行/失败/跳过数量与原始退出码；对失败进行诊断，禁止用空测试成功替代验证。
- [x] 5.2 记录实际实现中相同输入命中、源配置变化后重建、TypeScript 清单/锁文件更新后真实安装与类型检查结果，见 docs/validation.md；不为缓存实验额外改动待交付源码。
- [x] 5.3 核对代码、文档、四份 delta spec 和完整测试清单，运行定向 OpenSpec 严格校验；检查 README 私域术语表、内部技能目录和 AGENTS.md 体积及原文一致性。
- [x] 5.4 保存实测安装脚本与启动说明到云环境草稿，包含工作目录、工具激活、HTTP 就绪检查、复用现有检出和不自动创建 worktree；执行保存内容并区分当前实例结果、草稿持久化及尚未发布状态。

## Workflow follow-up

- 实施和验证通过后使用 openspec-archive-change 同步主规格并归档；在归档后的各主规格保留空的项目私域术语表说明，复核 README 术语表和规格一致性。
- 归档后运行 `openspec validate --specs --strict` 与受影响检查，检查 staged diff，仅提交本 change 的产物。
- 按 AGENTS.md 自动创建中文 Conventional Commit，包含 `OpenSpec-Change: initialize-typescript-monorepo`；不推送、不创建远程发布。
