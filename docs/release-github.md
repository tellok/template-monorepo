# GitHub Actions 方案

共享规则见 [独立版本发布契约](release-contract.md)。当前 `.github/workflows/ci.yml` 提供 PR 与仓库实际默认分支 push 质量入口、只读权限、完整 SHA 固定的官方 Actions、按请求取消旧运行，以及前后两次合并身份检查。尚未在 GitHub 执行；真实执行结果以推送后的检查为准。

当前仓库使用 Tower 临时 self-hosted runner，保留远端已有的按 run ID/attempt 分配标签配置。该基础设施不会随模板复制自动开通；新项目应替换 runs-on 或接入自己的 Tower，见[模板复用清单](template-usage.md)。

## 原生检查与启用设置

PR 使用原生测试合并检出，检验实际 head/base 父提交并回读最新 PR 身份；修改过期即失败。工作流没有目标分支过滤，覆盖非默认目标。安装与根检查脚本来自该检出。配置解析来源需要在目标仓库实测，涉及 CI 修改时单独审计实际解析版本。

启用 Settings → Actions → General 的外部贡献者原生运行审批，按身份和仓库权限判定信任；不按作者显示名认定可信，不用 PR Review 代替执行许可。官方 Actions v5 使用 Node 24 运行时，Runner 需要支持该版本，项目 Node 则由 `.node-version` 固定。流程不向依赖安装或应用提供发布秘密。

默认分支 push 当前只运行质量检查，目标更新不会自动重跑所有开放 PR。若要求该能力，应启用可信目标 push 处理器，分页枚举实际 base 匹配的开放 PR，核对最新 head/base/merge 后调度并精确取消旧运行，回报前重新核实；调度独立于 Changesets。外部 PR 的补充调度必须维持原生执行许可，不能通过 `pull_request_target` 绕过。尚未部署此处理器，不宣称目标更新重检已生效。

## 版本维护与组件调查

2026-10-15 核对：`tellok/actions` main 为 `a562854939acb109beb718c84f633625c1002081`，没有组件；PR #1 head `a7986e161f36c5db3386aab94201554c42014a5b` 有五个组件，v1 标签不存在。候选 changesets-version-pr 的 action.yml/README 已阅读，审阅/合并状态未确认，因此模板没有引用其 PR 提交作为稳定依赖，也不复制其版本请求 SDK 机制。

启用时重新核实受审提交、路径与输入，所有采用的 tellok/actions 组件固定同一完整 SHA。版本维护优先复用 changesets-version-pr 的 detect/maintain；调用方提供固定 CLI、白名单、来源证明、中文说明及分支。先 detect，只有有候选才安装准备依赖；维护不依赖质量构建。组件要求 Linux/macOS、Git/Bash 与 Runner >=2.327.1。

写版本 PR 的 GitHub App 身份须具备最小 contents/pull-requests 写权限，并能触发原生 PR 检查；GITHUB_TOKEN 创建 PR 的事件递归限制不能忽略。只在维护 job 授予写权限，checkout 不保留凭据，版本命令不继承发布秘密。维护分支用租约保护，正文保留人工块，API 不确定结果先回读。

## 正式交付

启用前确定 webapp 正式归档目标与资产权限，先验证合法版本 PR 合并来源，再运行质量、构建和同构建验收。说明与资产来自同一源码；无跨 job 消费时不上传临时 artifact。若采用 github-release 组件，须另行阅读其固定提交实现并核对精确标签、正文、附件 SHA-256 和恢复接口。

目前不创建 Release、不上传资产、不写 Latest。引入跨 job 传递时需要可信终态监听器、精确 artifact/run/attempt 身份和有限过期策略，不以尾部清理冒充取消情况下的回收保证。

## 待平台验收

检查新 PR、来源更新、非默认目标更新、旧运行取消、冲突与身份过期、fork 运行审批、版本机器人触发检查、无 Changeset 的轻量跳过、合法版本合并资格、同源归档及失败重试。当前只有本地检查与组件源码调查，不代表远端流程已部署。
