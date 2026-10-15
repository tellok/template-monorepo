# GitHub Actions 发布设计

先读[共享发布契约](release-contract.md)，本文件只维护 GitHub 的实现选择、组件复用与验收；不加载另一平台的配置来拼工作流。

## 先核对可复用组件

优先调查 [tellok/actions](https://github.com/tellok/actions) 的 `github-actions/`，阅读选定提交的组件 `action.yml`、README 和相关实现，不在项目中重新复制组件已有的传输、缓存、PR 写入、镜像或 Release 机制。官方 Action 已能直接满足的步骤继续用官方 Action，不为 checkout、setup-node 或单个简单命令再造通用封装。

版本必须真实可用：核对完整提交属于预期仓库、是否已审阅/合并、调用权限及目标路径存在；所有组件共用同一个经核实的完整 SHA。不要假设 main 或 v1 已有实现，不以活动分支作稳定依赖，不因复用需求擅自合并组件仓库 PR。组件尚未合并时，在方案中记录依赖状态；若采用 PR 提交，写明完整 SHA 和审核依据，不将其宣称为已发布稳定版本。

2026-10-15 核对状态：实现仍在 [PR #1](https://github.com/tellok/actions/pull/1)，head 为 `b0825d351d972d57063af50479041f2e7e79b957`；main 尚无组件，v1 不存在。这是调查快照，落地前重新核实，不把它当成已发布稳定版本。

| 组件路径（位于 github-actions/） | 复用机制 | 调用方仍负责 |
| --- | --- | --- |
| changesets-version-pr | operation:detect 轻量检测；maintain 调用固定 CLI，范围/分支租约校验，维护版本 PR | 可信 base 事件、CLI/安装、实际 base/版本分支、版本命令、路径白名单、受管理作者、拟发布说明及版本来源记录 |
| build-image | 官方 Buildx 构建并加载本地镜像；可选本地持久缓存、租约、完整代切换与容量控制 | context/Dockerfile、单个平台、标签/OCI 来源版本、验收命令、缓存挂载/作用域与容量 |
| s3-artifacts | 标准 S3 上传/登记/下载/精确删除，字节和生产身份回读、对象版本处理 | 是否需要跨 job、endpoint/桶/作用域凭据、独占生成前缀、可信 identity/record、终态消费者清单和过期策略 |
| publish-image | 官方 Docker 登录与 CLI；校验已验收归档后复用或推送，回读 digest，不重建 | 发布资格、归档及身份清单、匹配 registry 的 image、目标 tags、凭据；覆盖按 registry 正常规则处理 |
| github-release | 官方 Octokit 管理草稿、必需附件 hash、公开/恢复和读回核实 | 合法源码与 Git 标签、精确版本说明、附件 path/name/hash、Latest 判定和恢复范围 |

没有通用的 release-context、build-manifest、deploy 或独立 cleanup 组件，不编造路径。S3 删除可复用 s3-artifacts 的 delete，但消费者终态、来源证据、生成记录发现及完成事件仍由可信调用层核实。无需跨 job 传递时，不为使用组件引入 S3。

### 组合方式与适用边界

- 版本维护入口先 checkout 事件源码，调用 detect；只有 found 为 true 才准备项目环境/固定 CLI 并 maintain。maintain 不依赖 build-image 或上传制品。不要求写额外 dispatch；自动版本 PR 能否原生触发检查按所用令牌核实，GITHUB_TOKEN 写入有事件递归限制。
- PR 验证独立调用项目质量命令及必要的 build-image，在同一镜像上本地验收；不调用产品 publish-image、github-release 或发布制品上传。
- 默认分支正式入口先执行项目发布资格核对；合格后质量、构建和同镜像验收一次。需要跨 job 才使用 s3-artifacts，否则同 job 直接传本地文件。publish-image 消费同一归档/身份，github-release 消费同源附件，不重复构建。
- build-image 当前 load 为单平台；多平台需求先设计逐平台验收与显式聚合，不向单平台组件传平台列表。持久本地缓存需 Docker、Python 3 及支持 flock/rename/symlink 的实际挂载；无挂载或后端不适合时用官方 Buildx 的合适缓存，不伪造共享目录。构建记录 Artifact 上传已关闭；若直接使用官方 build-push-action 且不需要记录上传，核对并配置 DOCKER_BUILD_RECORD_UPLOAD:false。
- publish-image 无标签不可变确认参数：新标签可创建，内容不同的已有标签可正常更新，由服务器允许或拒绝；已有单镜像可按 exact/source 策略复用，索引不能作为单平台已验收镜像复用。不能把可变标签称为固定发布证据。
- s3-artifacts 需要正安全整数文件上限，下载结果路径不得覆盖制品；upload/register 记录 versionId，版本对象按精确版本删除，缺失 ETag 不降级无条件删除。调用方核实 S3 兼容端的条件语义，不能只因 SDK 发送条件头就承诺服务端保护。
- github-release 的 publish/recover 要求非空附件清单及每个有效 SHA-256；draft 不能改已公开 Release。说明不包含管理标记，公开前后核实标签与附件；远程多个 API 不是原子事务。发布恢复不擅自晋升 Latest。
- maintain 的 version-command 不继承序列化输入或任意令牌环境；checkout 应关闭 persist-credentials，不给项目依赖可读的发布秘密。白名单与环境清理不是隔离沙箱。版本 PR 写权限由 job 显式授予，detect 可只读，正文/作者与 PR 开放状态需最终确认。
- 组件使用 github-script v8 的 runner Node 24 运行时，最低 Actions Runner 2.327.1；仓库安装/程序化消费的 Node 最低 22 是另一要求。setup-node 负责项目 Node，不补旧 runner 的 Action 运行时；复核选定组件提交的最终前提。

调用形状（设计占位，不可直接执行；先将同一个已审阅完整 SHA 固定到实际 workflow）：

```yaml
- uses: tellok/actions/github-actions/changesets-version-pr@<reviewed-full-sha>
  id: pending
  with:
    operation: detect
# found == 'true' 时才安装固定 CLI 并调用 maintain；分支/白名单等取项目配置。
```

项目保留最薄且必要的 glue：来源资格与版本单元、正文/清单生成、质量及验收命令、事件调度和终态身份核对。组件不决定发布业务策略；确有通用缺口先评估扩展组件，不把整套 SDK 实现复制回项目 scripts/。

## PR 检查：原生能力优先

来源更新使用 `pull_request` 的 `synchronize`，默认 checkout 测试合并提交；核实触发过滤、checkout 没有改取 head 或默认分支，验证 workflow/脚本对应待验收结果。实际 base 不限定默认分支。

目标 push 另由可信 workflow/事件处理器按实际 base 分页枚举全部开放 PR，触发重检；与 Changeset 检测独立。检查双方真实引用与原生合并提交父提交，滞后时等待重查，必要时最小补充临时合并，不修改双方引用。原生已存在最新检查时去重。

按 PR 用 concurrency 取消旧检查，跨入口/排队仍不覆盖时才补精确 API 取消；绑定 PR、head/base/merge 与 run 身份，回报前复核，不取消其他 PR 或正式链。不要新增本组件库没有提供的“PR 调度 Action”；可信共享调度器已有覆盖时复用，不再放同功能的仓库脚本。

执行信任优先 Settings → Actions → General 中 `Require approval for all external contributors`，以 `Approve workflows to run` 批准运行。核实公开/私有仓库、实际贡献者分类、权限及套餐政策；不以作者名、机器人名或 PR Review 的 Approve 作自定义运行许可证。`pull_request_target` 或默认分支 dispatch 不自动继承 fork 批准；执行 fork 代码的补充入口必须另核实原生执行许可，不能把可信调度器当旁路。要求分支保持最新、撤销过期 Review 都是合并门禁，不能代替目标重检或执行审批。

## 存储、终态与权限

日志/Job Summary 记录测试证据，默认无测试报告 Artifact。临时传递优先同 job 本地；选 S3 则复用组件并明确桶过期和生成记录；若项目选 GitHub Artifact，则用官方传输 Action，按 run ID、run_attempt、精确 artifact ID 隔离，并记录配额及保留限制，不强制换服务。

可信默认分支 `workflow_run:completed` 或等价处理器核实生产 run/attempt、实际生产 jobs、全部消费者终态，再精确删除。本事件可能有写权限，不能 checkout 或运行来源制品代码；尾部 always 只是辅助。删除凭据限定对象/操作，失败和异步存储计量分别记录。

## GitHub 专项验收与依据

除[共享清单](release-contract.md#验收清单)，核对所选提交的全部 uses 路径和输入真实存在、同一完整 SHA、所需 runner/工具及权限；分别验证 detect 空跳过、maintain 无构建、PR 无发布、正式资格预检查和一次构建复用；组件没有的 glue 确实最小。未上线可信终态监听，不称自动清理已经生效。

核对日期：2026-10-15，落地前重查版本与可用性。

- [PR 事件与测试合并提交](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)
- [执行审批设置](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
- [workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Docker Actions 缓存](https://docs.docker.com/build/ci/github-actions/cache/)
- [github-script v8 运行前提](https://github.com/actions/github-script/blob/v8/README.md#breaking-changes)
