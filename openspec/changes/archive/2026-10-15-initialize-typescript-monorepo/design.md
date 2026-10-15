# Design

## Context

动机见 proposal.md。初始仓库无提交、代码、依赖、流水线或主规格；当前 `work` 分支没有继承 change。按 `app`、`packages`、版本、端口、启动、构建、CI、技能及发布路径全面检索，无可复用项目实现。全部行为为新增，采用四个 delta spec 的边界，不改外部仓库。

OpenSpec: required。涉及路径及影响见 proposal.md；协作规则原样来自 `tellok/dotai@7f96019efc531774786892de1573b937e7274be9`，文件 244 行、25864 字节，符合体积门禁。已完整阅读其规则及发布设计 skill、共享契约、GitHub/GitLab 参考。

External-Skill: exempt。初始无消费方技能、分发清单或公开技能接口，新增 OpenSpec 与发布技能仅面向维护者，放 `.agents/skills/`；不为本任务创建对外技能。

README-Glossary: verified。检索四个 delta spec 与上游术语后，没有项目私域概念，README 只添加规定表头及“当前无项目私域术语”的说明，不收录 TypeScript、Changesets 等行业通用名称。

## Goals / Non-Goals

**Goals:** 建立可冻结安装、类型检查、构建和本地运行的模板；维护各包独立版本；提供 GitHub/GitLab 原生质量配置与可审阅的两份发布方案。

**Non-Goals:** 不推送代码、不创建或合并远程 PR/MR、不发布 npm 包或 Release、不部署网页、不修改远程权限或秘密。发布自动化按用户“设计发布流”的范围交付设计和启用条件；本次实现双平台质量入口，自动版本请求维护、目标更新调度器及正式交付写入不默认启用。所有包初始设为私有，未来公开发布须明确包名、许可证、注册表及访问级别。

## Decisions

### 1. 工具、布局与版本

使用当前已提供的 Node `24.19.0`、pnpm `11.25.0`，根 `packageManager`、`.node-version` 和 README 保持一致；pnpm 清单支持范围以实际 CLI 验证。候选依赖已通过 npm 官方元数据核对：Vite `8.3.4`、TypeScript `6.0.3`（实测 TypeScript 7 与 vue-tsc 不兼容）、Turborepo `2.11.8`、skills-npm `4.1.0`、Changesets CLI `3.0.3`、portless `0.15.8`、Vue `3.5.44`（npm latest 稳定标签）、@vitejs/plugin-vue `6.0.10`、vue-tsc `3.3.13`、Prettier `3.9.10`，写精确版本并生成锁文件，实施时验证兼容性，不能静默换代。

```text
app/webapp/                 # @template/webapp，0.1.0，private
packages/tsconfig/          # @template/tsconfig，0.1.0，private
scripts/                   # Git 上下文路由与维护辅助
.agents/skills/             # 维护者技能
.changeset/                # 独立版本配置、中文变更说明
.github/workflows/ci.yml    # GitHub 原生质量入口
.gitlab-ci.yml              # GitLab 原生质量入口
docs/release-contract.md
docs/release-github.md
docs/release-gitlab.md
```

工作区仅匹配 `app/*`、`packages/*`。根设为私有工具容器；各包持有自己的版本。`@template/webapp` 通过 `workspace:*` 使用共享严格 TypeScript 配置。应用按用户补充采用 Vue 最新稳定版，使用组合式接口（Composition API）与 `<script setup lang="ts">` 单文件组件；Vite 加载官方 Vue 插件，`vue-tsc --noEmit` 检查组件及 TypeScript 类型，页面展示应用标识及可交互的 Vue 计数按钮。Turborepo 对构建输出 `dist/**` 缓存，对开发任务使用 `persistent: true`、`cache: false`，根提供 `dev`、`build`、`typecheck`、`test`、`check`、`format`、`format:check`、`spec:list`、`spec:validate`。配置包不伪造无意义构建任务。

### 2. npm 技能与忽略规则

pnpm 负责依赖安装，`skills-npm` 负责自动发现依赖附带技能；根 `prepare` 非交互执行递归同步，目标使用 Codex 通用 `.agents/skills/`。保留工具生成的锁文件和可提交相对链接，不覆盖 OpenSpec 生成的真实目录。根 `skills` 声明只安装指定的 design-pr-versionization，固定 dotai 完整提交；OpenSpec 用已核对的 `1.14.2` 初始化维护技能并作为根开发依赖固定，提供规格列表和严格校验命令，README 记录 Proposal → 审批 → Apply → 验证 → Archive 流程，避免在每次 prepare 重初始化。安装两次确认远程锁与本地链接幂等。

`.gitignore` 原始来源固定为用户提供的 Toptal API 地址；附加 `.turbo/`、portless 本地状态等必要项目规则，单独标记项目扩展，不将锁文件或 `.agents/skills/` 整体忽略。2026-10-15 实测 HTTPS CONNECT 被代理以 403 拒绝，尚未取得内容；已在云配置草稿追加 `www.toptal.com`，保留既有包管理器预设，尚未应用到当前运行环境。实施阶段在网络设置生效后重新下载，确认成功正文后再写文件，不以其他模板冒充指定来源。

### 3. portless 路由

已阅读 portless `27598545f08f8055cb3b9fb410f8d250f054f46d`（0.15.8 发布提交）的官方说明：默认自动检测关联工作树，普通主检出不加前缀，部分分支只保留末段。因此仅依赖原生推断无法覆盖普通分支、完整分支名碰撞和工作树目录名需求。

新增小型 Node 启动辅助，读取 Git 元数据确定身份：普通检出取完整分支名；关联工作树取工作树根目录名；分离头指针取检出目录名加短提交。将身份转为小写 ASCII 短横线标签，非 ASCII 清洗为空时回退为 `workspace`；始终附加原身份 SHA-256 的前 10 个十六进制字符，裁剪可读段使每个标签不超过 63 字节。主机形态为 `<身份标签>.webapp.localhost`，散列碰撞概率有限，不承诺数学上绝对唯一；注册冲突显式失败，不使用 `--force` 覆盖其他注册。

显式名称模式调用 portless，避免叠加其自动工作树前缀；先以 `--help` 和已安装源码核对该模式，随后通过真实启动核验最终 Host。子进程用参数数组启动，不将分支名拼成 shell。Vite 仅允许实际生成的域名，不配置 `allowedHosts: true`。路由由 portless 传递实际应用端口并处理模块热替换（Hot Module Replacement, HMR）；应用脚本应保持可识别的 Vite 命令或显式消费所分配端口。

云端默认验证使用非特权 HTTP 代理：`PORTLESS_HTTPS=0`、`PORTLESS_PORT=1355`、`PORTLESS_SYNC_HOSTS=0`，状态默认放 Git 公共元数据目录下，关联工作树共享，不写系统证书与 hosts。README 另说明开发者可自行启用 portless HTTPS 并信任其证书。服务只绑定环回地址；测试通过本地请求设置 Host 核验路由，不生成云网页预览链接。运行时状态与缓存可保留，进程需在新任务重启。

### 4. 独立 Changesets 与发布单元

`.changeset/config.json` 的 `fixed`、`linked` 均为空；`privatePackages.version=true`、`tag=false`，确保应用与配置包仍可独立更新版本和日志。版本命令先消费变更集，再仅刷新 pnpm 锁文件；准备允许路径为两目录下的包清单、对应 CHANGELOG、消费的 Changeset、锁文件和结构化来源记录，越界即失败。中文说明关联 OpenSpec change。初始变更集覆盖两个新增包的兼容能力，验证副本中的版本提升，不消费工作目录的待发布记录。

初始应用交付单元为生产 `dist` 归档及校验和；共享配置包初始仅在工作区消费，保留独立版本但不上传 npm。未来注册表发布另行声明；不引入 Docker、S3、容器镜像或生产部署。正式发布说明从发布源码的精确版本 CHANGELOG 章节生成，重复/缺失章节失败，不从最新分支补旧版本说明。

共享阶段图：

```text
功能 PR/MR → 最新合并结果检查 → 审阅合并
默认分支提交 → 存量 Changeset 检测 → 隔离准备版本和来源 → 版本 PR/MR
版本 PR/MR → 独立合并结果检查 → 审阅合并
受管理版本合并 → 先核实资格 → 质量检查 → 构建与验收一次 → 同源归档与校验和 → 正式资产
```

版本维护无候选时在安装前退出，忽略 README、隐藏文件与元数据；有候选才用固定 CLI 校验实际发布项。版本分支写入按实际远端引用使用租约保护，维护唯一受管理请求，管理正文标记外的人工说明保留；响应不确定时回读，不盲重建。维护不依赖产品构建。正式资格核对原仓库默认分支、受管理请求作者与标记、合并来源、消费记录、版本、锁文件与日志，不按分支名或提交标题单独授权。

### 5. GitHub 独立方案

质量入口使用 `pull_request`（所有实际目标）及默认分支 push，最小只读权限、checkout 不保留凭据、冻结安装、根检查。PR 按编号取消过期运行，核对 PR head/base 与合并提交父身份；冲突或旧合并引用失败。正式实现时固定官方 Actions 完整 SHA，声明项目 Node 与 Actions Runner 运行时要求。

目标更新补充设计：可信目标 push 处理器分页枚举以该分支为 base 的开放 PR，独立于 Changeset 检测调度最新检查，入场及回报前验证来源、目标、合并身份与运行 ID。配置解析来源单独审计；若原生工作流解析不含合并后的 CI 变更，对合并树中的验证配置执行独立配置验收，不仅 checkout 合并源码就声称通过。外部贡献执行使用平台原生审批；补充入口无法证明继承该许可时等待，不以 `pull_request_target` 执行未信任代码。该控制器本次只设计，未部署时说明合并结果随目标更新自动重检尚未生效。

组件调查：`tellok/actions` main 为 `a562854939acb109beb718c84f633625c1002081`，只有初始化文件；PR #1 当前 head 为 `a7986e161f36c5db3386aab94201554c42014a5b`，存在五个 github-actions 组件，v1 不存在。已阅读候选 changesets-version-pr 的 action.yml 与 README：支持 detect/maintain、白名单、租约及正文保留；需要 Linux/macOS、Git/Bash、Runner >=2.327.1。未确认其审阅状态，故不在可执行模板引用此 PR。发布文档记录该依赖；正式启用时复核合并与审阅，所有选用组件固定同一经核实完整 SHA，不复制已有公共机制，也不编造 GitLab 组件。

若该组件可用，版本维护仅复用 detect/maintain，调用方生成资格证据、版本正文与白名单；GitHub 正式资产根据实际需求复用 github-release 或官方工具，并在采用前阅读其实现及输入。版本 PR 需要可触发原生检查的受授权 GitHub App 身份；普通 GITHUB_TOKEN 的递归限制不能当检查成功。初始质量入口不接收发布秘密。正式链只对合法版本合并开放，默认关闭。

### 6. GitLab 独立方案

根 `.gitlab-ci.yml` 直接声明 `CI_PIPELINE_SOURCE == "merge_request_event"` 入口，并保留默认分支 push 质量检查。使用固定 Node、pnpm，冻结安装与同一根级检查命令。MR 要求 `merged_result` 类型与最新 source/target 身份；缺少实例能力或冲突回退普通来源流水线时明确拒绝声称合并结果验收。流水线源码与配置解析来源分别记录。

本次未提供 GitLab 实例、版本、套餐或 Runner，故交付配置及启用手册，实测结果留为未验证。启用须核实 merged results 支持、保护变量和 fork 边界，并通过目标实例 CI Lint。可信目标 push/webhook 分页枚举目标 MR，调用专用 MR pipeline API；核对最新合并身份，按 MR/精确 pipeline ID 取消过期运行，`resource_group` 仅串行写入，不冒充取消功能。fork 的父项目运行必须维持实例原生许可，不把 Review 当执行授权。

版本 MR 维护先用轻量作业检测存量 Changeset，再启动准备作业；不把依赖安装放全局 before_script。使用具备最小分支写入与 MR API 权限的项目身份，不假设 CI_JOB_TOKEN 自动足够；默认分支、分支租约及管理正文策略与共享契约一致。当前 `tellok/actions` main 无 GitLab 可调用入口，因此不写 GitHub uses 或假定组件跨平台；文档定义原生脚本/CLI 需要实现的薄层接口，待正式启用单独验证。

正式 Release 资产链接指向持久 Generic Package Registry 或其他已批准持久存储，不指向即将过期的 job artifacts。实际存储项目、凭据和访问范围由启用时确定；未配置时不进行网络写入。

### 7. 缓存、制品、并发和恢复

当前模板正式构建和归档可同作业完成，无跨作业消费者，因此不上传临时产品制品、测试报告或整个源码。生产者为验收构建，消费者为正式资产上传；本地 dist 与归档按执行器策略回收，正式资产独立持久保存。未来拆作业才引入精确生产身份、允许文件清单、消费者终态回读与清理权限；尾部 always/after_script 不能代替可信终态处理器，需有限过期兜底。

Turborepo 本地缓存和 pnpm store 可重建；远端缓存不默认开启。CI 缓存按平台、运行时、锁文件和信任域隔离，外部请求不写正式发布共享缓存。验证相同输入、仅源码变化、锁文件变化三种情形，记录命中和安装行为；缓存缺失仍能构建，不将缓存视作发布来源证明。

正式写入按包/版本串行，重跑核对源码、构建摘要与校验和，远端同版本字节冲突失败。Latest 按 SemVer 前进，旧运行不能回退；本次模板未启用 Latest 写入。无持久同源归档时恢复完整原生产链，不承诺只重跑下游。发布成功而后续说明失败时只修复同版本内容。未知 API 写入先回读；不得覆盖其他请求、其他生成或正式资产。

### 8. Prettier 与 VS Code

固定 Prettier `3.9.10`，使用 `.prettierrc.json`：两空格、分号、单引号、尾逗号、`printWidth: 120`、`endOfLine: lf`；`.editorconfig` 对齐缩进和行尾。提供 `format` 写入与 `format:check` 只读检查，并接入根 `check` 及双平台 CI。`.prettierignore` 排除依赖、构建、缓存、生成技能与锁文件；AGENTS.md 因要求保留指定上游原文而显式排除，不让格式化改写它。OpenSpec 产物保持可格式化，防止格式检查与规格流程冲突。

`.vscode/settings.json` 设置 `editor.defaultFormatter: esbenp.prettier-vscode`、`editor.formatOnSave: true`，为 Vue、TypeScript、JavaScript、HTML、JSON/JSONC、CSS、Markdown、YAML 显式设置同一格式化器，使用本地 Prettier 配置与 `prettier.requireConfig: true`；设置 120 列参考线、工作区 TypeScript SDK 提示、合理文件嵌套。`.vscode/extensions.json` 推荐 `esbenp.prettier-vscode` 与 `Vue.volar`。只设置格式化，不开启尚未安装的 ESLint 修复、不强制导入排序，避免与格式化职责混杂。

参考配置中的钱包路径、Proto、国际化、Copilot 指令文件、Markdown 默认预览、额外扩展专属配置及流水线只读限制均不复制；只保存模板实际使用的选项。Toptal VisualStudioCode 规则可能忽略 `.vscode/*`，需要追加精确的 settings/extensions 白名单并用 `git check-ignore` 验证配置可提交。格式化验证运行 CLI 检查及代表性 Vue/TS/JSON 格式化，检查 settings JSON 值与扩展推荐；本云环境无 VS Code GUI，不能把静态配置验证表述为已实测编辑器保存事件。

### 9. 测试完整盘点与拟新增清单

2026-10-15 检索整个空检出及 Git 索引，覆盖 `test/spec/e2e`、快照、夹具、生成脚本、CI 配置和 package 脚本，无任何现有用例或待维护用例。OpenSpec 初始化生成内容仅为维护技能与规划配置，不含产品测试。不存在无法检查的现有测试目录。按 `workspace-development`、`webapp-routing`、`release-workflow` 的路径与 Scenario 定位新增测试如下，共 **11 个**，均为新增，现状均为“不存在”：

| 测试文件                      | 完整用例名称/稳定标识             | 变更类型 | 变更前行为 | 变更后行为                                                                   | 具体原因与证据                       |
| ----------------------------- | --------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| scripts/dev-route.test.mjs    | 普通检出以完整分支名生成稳定域名  | 新增     | 不存在     | 重复解析相同分支得到相同域名                                                 | webapp-routing／普通分支重复启动     |
| scripts/dev-route.test.mjs    | 关联工作树使用工作树根目录名      | 新增     | 不存在     | 同分支信息而不同目录生成不同域名                                             | webapp-routing／不同工作树分别启动   |
| scripts/dev-route.test.mjs    | 分离头指针使用目录与短提交        | 新增     | 不存在     | 无分支仍得到稳定合法域名                                                     | webapp-routing／稳定的本地域名       |
| scripts/dev-route.test.mjs    | 清洗相同的完整分支名仍可区分      | 新增     | 不存在     | feature/a 与 feature-a 不得到相同标签                                        | webapp-routing／特殊或过长名称       |
| scripts/dev-route.test.mjs    | 过长名称符合 DNS 长度限制         | 新增     | 不存在     | 长标签被裁剪且保留散列                                                       | webapp-routing／特殊或过长名称       |
| scripts/dev-route.test.mjs    | 非 ASCII 名称生成非空合法标签     | 新增     | 不存在     | 中文与符号名称有合法回退与散列                                               | webapp-routing／特殊或过长名称       |
| scripts/webapp-smoke.test.mjs | HTTP 代理返回首页与已转换入口模块 | 新增     | 不存在     | 启动实际 portless 和 Vite，Host 请求、TypeScript 入口及 App.vue 转换请求成功 | webapp-routing／受限环境的功能请求   |
| scripts/webapp-smoke.test.mjs | 生产预览提供构建首页与脚本资源    | 新增     | 不存在     | 构建后实际请求首页及其引用脚本成功                                           | webapp-routing／开发及生产首页可访问 |
| scripts/versioning.test.mjs   | 单包变更不无条件提升其他包版本    | 新增     | 不存在     | 临时干净副本实际消费 webapp patch，只提升其版本并产生日志                    | release-workflow／仅一个包有变更     |
| scripts/skills-sync.test.mjs  | 依赖内技能同步且再次同步保持稳定  | 新增     | 不存在     | 在临时项目用已安装工具和本地依赖技能夹具实际同步两次，锁和链接一致           | workspace-development／安装后同步    |

| scripts/webapp-smoke.test.mjs | Vue 组件在浏览器挂载并响应点击 | 新增 | 不存在 | 浏览器打开实际应用，计数按钮从 0 点击后为 1 | 用户要求 Vue，验证组件运行及响应式交互 |

以上为本次需要修改的完整测试用例清单。当前无无法检查的已有测试范围。测试输入、预期和夹具包含在本清单范围；后续若需增加或修改清单，先提交完整修订清单再实施。使用 Node 内置测试运行器（Test Runner），浏览器交互用 Playwright 驱动 Chromium，不引入额外测试框架；真实代理测试只停止自身启动的进程。其他安装、类型检查、构建缓存、版本状态、配置语法及 OpenSpec 校验作为命令验证记录，不伪造测试计数。

## Risks / Trade-offs

- [Toptal 代理拒绝访问] → 已保存最小网络域名追加草稿；生效后重试，不能取得准确内容时保留该项阻塞。
- [portless 在云端无法写系统状态或信任证书] → 使用仓库忽略状态目录、HTTP 和非特权端口进行验证，保留开发者 HTTPS 配置说明。
- [发布组件未合并、GitLab 实例未知] → 交付已调查的设计与关闭的发布入口；不声称远端流程生效，不引入未审组件作为稳定依赖。
- [技能安装涉及网络与生命周期] → 固定提交、保留锁、非交互同步；失败显式暴露，CI 使用只读最小权限，不注入发布秘密。
- [独立版本仍存在 workspace 依赖传播] → 不配置 fixed/linked；允许真实依赖约束需要的传播，测试确保没有无条件全量提升。

## Migration Plan

本提案审批后实施任务，先生成与验证工作区，再验证 webapp 与路由，最后完成质量配置和发布文档。所有验证仅本地或隔离临时副本；完成后按 AGENTS.md 归档主规格并创建中文 Conventional Commit，不推送。云环境保存经过实测的安装和启动说明，明确复用现有检出、不自动创建 worktree；发布环境由用户在产品中执行。没有已有数据或部署需要迁移；本地回退只移除本次生成内容，不删除既有用户文件。

## 实施记录

用户于 2026-10-15 明确要求暂时跳过门禁与提案等待，直接实施。本次按该指示推进，原样保留 AGENTS.md 作为后续默认规则，不将指示解释为永久移除 OpenSpec。工具兼容性修正为 TypeScript 6.0.3；portless 显式命名模式与 Vite 的 PORT 配置已实测。上游 Toptal 内容现已成功下载，原 403 阻塞已解除。共享代理默认状态位于 Git common dir 的 portless 子目录。
