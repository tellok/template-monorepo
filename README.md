# TypeScript Monorepo Template

Vue + Vite 应用、pnpm 工作区、Turborepo 构建编排，以及每包独立版本。采用 Node **24.19.0**、pnpm **11.25.0**、Vue **3.5.44**（初始化时最新稳定版）、TypeScript **6.0.3**。TypeScript 7 暂不兼容当前 vue-tsc，故显式固定兼容版本。

## 开始开发

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

依赖安装会运行 `skills-npm`，自动发现工作区依赖附带的技能。发布设计技能仅在初始化设计时使用，不安装进项目或通过 prepare 拉取。pnpm 负责 npm 依赖，skills-npm 负责代理技能。无需全局安装项目开发工具。

云环境若用户目录只读，可由环境配置指定可写的工具状态路径（本机通常无需设置）：

```bash
export XDG_DATA_HOME="${TMPDIR:-/tmp}/project-tool-data"
export npm_config_cache="${TMPDIR:-/tmp}/project-npm-cache"
export PORTLESS_STATE_DIR="${TMPDIR:-/tmp}/project-portless"
```

在此仓库现有检出中开发即可；云任务本身已隔离，不自动创建额外 worktree。

## 用作新项目模板

通过 GitHub 的 **Use this template** 创建新仓库，或复制后在新目录初始化 Git；不要沿用模板仓库的 origin。模板本身没有绑定正式发布凭据或生产部署目标。

新项目的必要调整见 [模板复用清单](docs/template-usage.md)，包括根名称、npm scope、包引用、Changesets 基准分支和可见性。示例包名 `@template/*` 是占位名称；模板不会在 install/prepare 时擅自重命名文件、改写 Git 历史或删除规格。

验证安装脚本按自身位置定位仓库，不依赖目录名或 `/workspace`。从任意工作目录运行 `bash <新项目路径>/scripts/cloud-setup.sh` 可执行完整检查。

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

`pnpm dev` 输出实际 URL。名称规则：普通检出用完整分支名，关联工作树用工作树目录名，分离 HEAD 用目录名与短提交；清洗后附加确定性散列，处理斜杠、中文和过长名称。服务冲突明确失败，不覆盖其他注册。域名形态为 `<身份标签>.<项目标签>.webapp.localhost`，项目标签结合根清单名称与 Git 公共目录身份生成，使不同副本即使仍使用同一个占位包名也不会共享路由；应用的随机端口由 portless 管理。

默认采用环回 HTTP 代理、端口 1355 和 `PORTLESS_SYNC_HOSTS=0`；状态使用 portless 的用户级默认目录，多个项目与工作树共享代理。无权限写用户目录的云环境通过 `PORTLESS_STATE_DIR` 指定可写状态目录，同一用户下需要共享代理的项目使用相同目录。测试始终使用独立临时状态及随机代理端口。

项目标签包含当前机器上 Git 公共目录的散列，因此搬移检出目录后域名可能变化；同一位置重复启动以及关联工作树间的项目命名空间保持稳定。若浏览器无法解析 `.localhost`，按 portless 官方文档配置本机解析；云验证使用真实 Host 请求。

开发者可自行启用 `PORTLESS_HTTPS=1` 并按 `pnpm exec portless trust --help` 完成本机证书信任；可用 `PORTLESS_PORT` 调整端口。改变代理设置前，在相同 `PORTLESS_STATE_DIR` 下执行 `pnpm exec portless proxy stop`；默认未指定时直接使用 portless 用户状态。共享代理停止会影响其他项目，先确认使用者。新任务需要重启应用进程，不依赖状态目录推断服务已启动。

## Prettier 与 VS Code

打开本工作区并安装扩展推荐中的 **Prettier** 与 **Vue - Official**。`.vscode/settings.json` 启用 `editor.formatOnSave`，为 Vue、TypeScript、JavaScript、HTML、JSON/JSONC、CSS、Markdown、YAML 指定 Prettier。项目规则为两空格、单引号、分号、尾逗号、120 列与 LF；CLI 和编辑器共用 `.prettierrc.json`。

`.editorconfig` 对齐基础规则，`prettier.requireConfig` 防止依赖个人默认配置。没有预置 ESLint 自动修复、钱包路径、国际化或只读业务文件限制。生成目录、锁文件、上游技能和须原样保留的 AGENTS.md 排除格式化。保存事件需本机 VS Code 扩展执行，云端只能验证配置与 CLI 行为。

## OpenSpec 与代理规则

根 [AGENTS.md](AGENTS.md) 原样来自指定上游，OpenSpec 已初始化，并将 CLI 固定为开发依赖。维护技能位于 `.agents/skills/`。正常后续流程是 Proposal → 用户审批 → Apply → 验证 → Archive。一次性的初始化执行记录不作为新项目的默认授权。

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
