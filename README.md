# TypeScript Monorepo Template

Vue + Vite 应用、pnpm 工作区、Turborepo 构建编排，以及每包独立版本。采用 Node **24.19.0**、pnpm **11.25.0**、Vue **3.5.44**（初始化时最新稳定版）、TypeScript **6.0.3**。TypeScript 7 暂不兼容当前 vue-tsc，故显式固定兼容版本。

## 开始开发

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

依赖安装会运行 `skills-npm`，自动发现工作区依赖附带的技能。发布设计技能仅在初始化设计时使用，不安装进项目或通过 prepare 拉取。pnpm 负责 npm 依赖，skills-npm 负责代理技能。无需全局安装项目开发工具。

云环境若用户目录只读，先设置可写的工具状态路径：

```bash
export XDG_DATA_HOME=/workspace/.xdg-data
export npm_config_cache=/workspace/.npm-cache
```

在此仓库现有检出中开发即可；云任务本身已隔离，不自动创建额外 worktree。

## 目录

```text
app/webapp/          Vue + TypeScript + Vite，@template/webapp
packages/tsconfig/   共享严格配置，@template/tsconfig
scripts/            本地域名、测试及 CI 身份检查
.agents/skills/      OpenSpec 维护技能
openspec/           规格与变更记录
```

包发现范围仅为 `app/*` 和 `packages/*`。各包持有自己的 package.json/version；根工具清单私有，不作为发布单元。

## 命令

| 命令                                        | 用途                                                          |
| ------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                                  | Turborepo 启动 Vue 应用与 portless 路由                       |
| `pnpm --filter @template/webapp dev:direct` | 直接启动 Vite，绕过域名代理                                   |
| `pnpm typecheck`                            | Vue SFC 与 TypeScript 严格类型检查                            |
| `pnpm build`                                | 生产构建，输出 `app/webapp/dist`                              |
| `pnpm --filter @template/webapp preview`    | 预览生产构建                                                  |
| `pnpm test`                                 | 路由、真实 HTTP、浏览器交互、版本与技能同步测试；先运行 build |
| `pnpm check`                                | 格式、类型、构建及测试全部检查                                |
| `pnpm format`                               | 使用本地 Prettier 格式化                                      |
| `pnpm format:check`                         | 只读格式检查                                                  |
| `pnpm skills:sync`                          | 手动重新同步依赖技能                                          |
| `pnpm spec:list`                            | 查看活跃 OpenSpec change                                      |
| `pnpm spec:validate`                        | 严格校验全部规格与 change                                     |
| `pnpm changeset`                            | 记录受影响包及版本变化                                        |
| `pnpm version:packages`                     | 在干净检出消费 Changeset，并刷新锁文件；不上传包              |

浏览器测试需要 Chromium。没有系统 `/usr/bin/chromium` 时运行：

```bash
pnpm exec playwright install --with-deps chromium
```

可用 `BROWSER_PATH` 指定已安装 Chromium。测试使用隔离临时目录及随机空闲端口，结束时停止自己创建的服务，不上传报告或 trace。

## Vitest

`pnpm test` 使用固定版本的 Vitest 非交互执行测试；`pnpm test:watch` 进入开发监听模式。根 `vitest.config.ts` 发现 scripts、app、packages 下的测试，默认使用 Node 环境，服务集成测试使用 Playwright 驱动真实浏览器。文件串行运行，初始化及清理有独立超时，空测试不会报告成功；GitHub/GitLab 的 `pnpm check` 自动使用同一入口。运行服务测试前先 `pnpm build`。

## 稳定的本地域名

`pnpm dev` 输出实际 URL。名称规则：普通检出用完整分支名，关联工作树用工作树目录名，分离 HEAD 用目录名与短提交；清洗后附加确定性散列，处理斜杠、中文和过长名称。服务冲突明确失败，不覆盖其他注册。域名形态为 `<身份标签>.webapp.localhost`；应用的随机端口由 portless 管理。

默认采用环回 HTTP 代理、端口 1355、`PORTLESS_SYNC_HOSTS=0` 和Git 公共元数据下的 `portless/` 状态目录（关联工作树共享），适合无提权云开发。若浏览器无法解析 `.localhost`，按 portless 官方文档配置本机解析；云验证使用真实 Host 请求，不依赖系统 DNS。

开发者可自行启用 `PORTLESS_HTTPS=1` 并按 `pnpm exec portless trust --help` 完成本机证书信任，HTTPS 使用当前代理端口；可用 `PORTLESS_PORT` 调整端口。改变运行中的代理设置前先在相同环境变量和状态目录下执行 `pnpm exec portless proxy stop`。默认状态路径可通过 `git rev-parse --path-format=absolute --git-common-dir` 查询，再追加 `/portless`；直接调用 portless CLI 时需用 `PORTLESS_STATE_DIR` 指向相同目录。不要停止他人使用的代理。`PORTLESS_STATE_DIR` 可指定独立状态；切换服务进程或新云任务时需要重启，不能只依赖缓存目录。

## Prettier 与 VS Code

打开本工作区并安装扩展推荐中的 **Prettier** 与 **Vue - Official**。`.vscode/settings.json` 启用 `editor.formatOnSave`，为 Vue、TypeScript、JavaScript、HTML、JSON/JSONC、CSS、Markdown、YAML 指定 Prettier。项目规则为两空格、单引号、分号、尾逗号、120 列与 LF；CLI 和编辑器共用 `.prettierrc.json`。

`.editorconfig` 对齐基础规则，`prettier.requireConfig` 防止依赖个人默认配置。没有预置 ESLint 自动修复、钱包路径、国际化或只读业务文件限制。生成目录、锁文件、上游技能和须原样保留的 AGENTS.md 排除格式化。保存事件需本机 VS Code 扩展执行，云端只能验证配置与 CLI 行为。

## OpenSpec 与代理规则

根 [AGENTS.md](AGENTS.md) 原样来自指定上游，OpenSpec 已初始化，并将 CLI 固定为开发依赖。维护技能位于 `.agents/skills/`。正常后续流程是 Proposal → 用户审批 → Apply → 验证 → Archive；本次初始化按用户明确指示跳过门禁和提案等待，已有规划作为设计记录保留，不更改上游协作规则。

```bash
pnpm exec openspec new change <change-name>
pnpm exec openspec list --json
pnpm exec openspec validate <change-name> --strict
```

代理可用 openspec-propose、openspec-apply-change 等技能。不要将维护技能误放到面向消费方的 `skills/` 目录。

## 版本与流水线

Changesets 使用独立版本，无 fixed/linked 组。初始包均私有，应用也生成版本和 CHANGELOG，但不上传 npm。正式版本命令只能在预期变更已合并且工作区干净时运行；测试在隔离副本消费，不改工作目录。

GitHub Actions 与 GitLab CI 使用分开的原生配置，执行相同的质量命令。GitLab MR 检查要求实例启用 merged results pipelines，否则明确失败。GitHub 需要启用 Actions 的外部贡献者原生执行审批。两平台的远端实际运行尚未验证。

自动版本 PR/MR、目标分支 push 对全部开放请求的重检调度、正式上传与部署尚未启用。设计、组件可用状态、权限与启用条件见 [共享发布契约](docs/release-contract.md)、[GitHub 方案](docs/release-github.md)、[GitLab 方案](docs/release-gitlab.md)。

## 忽略规则来源

`.gitignore` 基础内容完整来自 [指定 Toptal API](https://www.toptal.com/developers/gitignore/api/macos,visualstudiocode,vim,node,windows,python)，末尾明确标注项目新增缓存规则。锁文件、维护技能和 VS Code settings/extensions 保持可提交。

## 术语表（Glossary）

当前没有项目私域术语。行业通用技术术语保持其通常含义。

| 中文术语 | 英文术语（English Term） | 缩写 | 定义与使用边界 |
| -------- | ------------------------ | ---- | -------------- |
