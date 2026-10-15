# 在新项目中使用模板

模板提供可复用的开发、检查与版本管理基线。历史归档和 `docs/validation.md` 是模板仓库的验证记录，不能当作新项目的运行证据；新项目应执行自己的验证。

## 创建与命名

1. 模板维护者先在 GitHub 仓库 Settings 中启用 **Template repository**（此操作未由本次代码变更执行）。使用 GitHub **Use this template** 创建仓库，或复制到新目录后初始化 Git。确认 `git remote -v` 指向新项目；如果还没有 Git 仓库，先 `git init -b <默认分支>`，再运行依赖 Git 元数据的开发命令和测试。
2. 修改根 `package.json` 的 `name`；修改 `app/webapp/package.json` 与 `packages/tsconfig/package.json` 的包名和独立初始版本。
3. 同步应用清单中的 workspace 依赖键、`app/webapp/tsconfig.json` 的 extends 路径，以及 `.changeset/*.md` 正文头部的包名。用 `rg '@template|template-monorepo'` 检查当前使用文档、清单及配置中的占位值；历史归档可以保留原始名称，不做全仓库盲目替换。
4. 修改应用标题、页面内容和本项目 README，按需保留或删除初始化 Changeset。测试读取实际清单名称及版本，不要求保留示例包名。
5. 运行 `pnpm install --lockfile-only --ignore-scripts` 更新锁文件，再运行 `pnpm install --frozen-lockfile`。将新清单与更新后的锁文件一起提交。

模板不会在 prepare 中自动改包名、重写 Git 记录或删除历史规格。维护用 OpenSpec 技能保留；一次性发布设计 skill 不安装。

## 工具与目录

包发现仅使用 `app/*` 与 `packages/*`。默认应用位置为 `app/webapp`、共享配置位置为 `packages/tsconfig`；这些是模板约定，包重命名无需移动目录。若需要改变目录，必须同步 dev 脚本、集成测试和构建配置中的路径。

Node 的推荐版本来自 `.node-version`，pnpm 的唯一版本声明来自根 `packageManager`。本机按这两个声明安装工具。GitLab 的 Node image 保持固定，升级 Node 时同步修改 image 与 `.node-version`；GitLab 的 pnpm 安装命令自动读取根清单。安装验证脚本不写入固定的 `/workspace` 路径，也不覆盖调用者的缓存配置。

用户级目录只读的云环境在外部设置 `XDG_DATA_HOME`、`npm_config_cache` 和 `PORTLESS_STATE_DIR` 为可写路径。多个项目共用代理时使用同一个 `PORTLESS_STATE_DIR`，不要把某个开发者机器的绝对路径提交进项目。

## 分支与版本策略

GitHub CI 从事件仓库元数据识别默认分支，GitLab 使用 `CI_DEFAULT_BRANCH`，更改默认分支名不需要手改质量任务的分支过滤。GitHub PR 仍支持非默认目标。

Changesets 的 `.changeset/config.json` 中 `baseBranch` 需要显式设为新项目的实际基准分支；默认示例为 main。首次提交并同步该分支后，再执行 `pnpm changeset status`。每包保持独立版本，无 fixed/linked 组；真实 workspace 依赖约束仍可能引起必要的版本传播。

全部包初始为 private。需要公开 npm 发布时，先决定包名所有权、许可证、注册表与访问级别，再调整 private、publishConfig、分发文件及 Changesets 策略；不要因为来自模板就直接上传占位包。模板没有配置发布凭据、自动版本 PR/MR 或部署目标，详见两平台发布设计文档。

## 本地域名

默认域名由分支/工作树身份、项目名称与 Git 公共目录标识组成，因此不同目录下的模板副本即使仍保留同名占位包和分支也能隔离。关联工作树共享同一项目命名空间，具体路由仍以工作树目录名区分。目录搬移会改变项目标识，这属于本机检出身份变化。

代理默认使用 portless 的用户级状态，支持多个项目共享；环境显式提供状态目录时所有共享者保持一致。模板不会使用 --force 抢占其他项目的路由，也不会自动停止他人的代理。

## 新项目验收

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm check
pnpm spec:validate
pnpm dev
```

已有可用系统 Chromium 可跳过浏览器下载。验证后提交清单、锁文件及项目配置，检查新平台上的 CI 实际结果。GitLab 需要核实 merged results 支持并在目标实例执行 CI Lint；本地成功不能替代平台验收。VS Code 的保存格式化需要在新项目中安装推荐扩展。
