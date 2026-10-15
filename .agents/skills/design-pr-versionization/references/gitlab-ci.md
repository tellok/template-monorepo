# GitLab CI/CD 发布设计

先读[共享发布契约](release-contract.md)，本文件独立维护 GitLab 的实例能力、CI 配置、MR 执行上下文与 API；不把其他平台的事件名、令牌、YAML 或批准设置翻译成 GitLab 能力。

## 实例与组件选择

先核实 GitLab.com/自管实例、版本、套餐、Runner 与执行器、受保护变量/分支策略，以及目标实例支持的 CI/CD Components 或 Steps。优先已有受审组件、平台原生能力及工具 CLI，组件使用方式须通过目标实例 CI Lint。

2026-10-15 核对 `tellok/actions` 的 `gitlab-actions/` 仅有说明，没有可调用 Components/Steps。不要编造该目录入口，不在 GitLab YAML 写 GitHub uses，也不因同仓库已有另一平台组件就承诺兼容。若需要新增公共 GitLab 组件，单独确定托管、入口、版本、输入及信任边界；不要把这个设计请求扩展为组件实施授权。

## 轻量版本 MR 维护

默认分支 push 以实际 `CI_DEFAULT_BRANCH` 和 pipeline source 限定入口，先做存量 Changeset 检测，再安装准备依赖及固定 CLI。`rules:changes` 只看路径变化，不能替代存量检测；`rules:exists` 可预筛，但 `.changeset/*.md` 会包含 README，不能因 README 存在而排除全部候选。

要在无候选时完全不启动 Runner，先查实例是否有精确文件规则（包括适用版本的 regexp 能力），用目标实例 CI Lint 核实；不支持则保留一次轻量检测。存在性规则可能受检查数量上限影响，作业内仍需精确兜底。动态子流水线可隔离后续维护，但检测作业仍运行；不能先在全局 before_script 安装后才称空检测轻量。

隔离检出事件源码，以固定 CLI 生成版本/锁文件/CHANGELOG/来源记录，按实际路径范围和分支并发保护维护同一受管理 MR，正文保留人工区域；不依赖产品构建或 artifacts。选择具备所需项目范围权限的身份，不假设 CI_JOB_TOKEN 自动拥有分支写/MR 创建全部权限。

## MR 合并结果检查与重跑

在项目 `.gitlab-ci.yml` 直接定义匹配 `CI_PIPELINE_SOURCE == "merge_request_event"` 的 job rules 或 workflow rules。单独放在 include/component 中的匹配规则不能替代这个入口要求。来源分支更新可原生创建 MR pipeline，但普通 MR pipeline 只检查来源。

需要原生合并结果时，核实实例/套餐及配置支持，在 Settings → Merge requests → Merge options 启用 `Enable merged results pipelines`，检查临时提交确实组合最新来源与实际目标；不移动双方分支。遇到冲突时平台可能回退普通 MR pipeline，必须识别并阻断“合并结果通过”。配置解析来源与源码 checkout 分别核实，不能仅检出合并代码就宣称合并后的 CI 配置已生效。

目标更新是否重跑全部开放 MR 单独验收，不能仅凭合并结果开关宣称满足。缺口由可信目标 push/webhook 按实际 target branch 分页查询受影响 MR，再调用专用 `POST /projects/:id/merge_requests/:merge_request_iid/pipelines`，验证确实是最新合并结果；普通分支/tag pipeline 不是等价替代。该调度独立于 Changeset 检测，覆盖非默认目标。

自动取消冗余流水线及 interruptible 按实例核实；只有目标 SHA 变动时不能假设同分支新提交取消一定覆盖，必要时按 MR、来源/目标与精确 pipeline ID 取消。resource_group 可串行关键写入，不代表已取消旧检查。Merge Train 仅覆盖已入队 MR，不是所有开放 MR 立即重检开关，也不授权自动合并。

## fork MR 执行信任

按目标实例的 fork 流水线运行项目、触发者权限、人工确认及受保护资源政策设计。父项目成员触发 fork MR 运行时，核实来源代码/CI 配置及父项目 Runner、变量的实际暴露边界，不把 MR Review 当作代码执行许可。

目标重跑、API 触发及重试必须沿用选定执行边界，不因为调用者是可信维护者就跳过 fork 来源审查或泄露父项目秘密。协作者和自动化的权限从项目身份及授权核实，不按作者显示名判断，也不自动追加所有者逐提交批准规则。

## 正式链、缓存与存储

原项目默认分支流水线先核实实际版本 MR 合并来源、消费证据及受保护边界，才进入质量、正式构建及同镜像验收。使用项目实际 merge/squash/rebase 身份；有流水线或同版本号不构成发布资格。包/镜像、说明及文档全部消费同一已验收构建。

长期执行器可复用本地 BuildKit 缓存；临时构建器显式导入/导出 local 或 registry cache，后端和 scope 按权限及生命周期选择，registry max 模式可保存中间层。不要照搬特定共享磁盘路径；按[共享缓存要求](release-contract.md#构建缓存)实测，缓存 mount 与构建层持久分开核实。

需要跨 job 时显式 `needs:artifacts` 或 `dependencies` 下载必要文件，按 pipeline ID、实际生产 job ID 及自定义生成身份隔离。retry 通常产生新 job ID，不假造其他平台的 attempt 字段；不能下载“某分支最新成功”当固定身份。采用外部 S3 时使用经核对的标准 CLI/SDK 或实际可用的组件，不假装有尚未实现的公共 Action。

正式 Release 的 asset link 只是链接，不自动复制文件；指向有明确持久生命周期的包仓库或资产存储，禁止指向将清理的 job artifacts。测试证据默认放日志，若明确选 JUnit 等报告界面，单独说明 artifacts:reports 的上传目的和保留政策。

## 终态清理、权限与恢复

可信 pipeline 完成 webhook 处理器核实来源、pipeline、生产 job 与消费者全部终态后，以精确 job ID 删除 artifacts；先确认该操作涉及的报告和元数据。项目若用外部临时存储，则核对同一生产记录和对象身份再删。尾部 when:always/after_script 仅辅助，不保证取消、超时或执行器丢失必达。

expire_in 结合项目/实例 keep-latest 策略核实，过期不意味着即时回收。下载用 job token 不代表拥有删除权限；按实例 API、角色和项目范围选可靠终态清理身份，不能依赖重跑后失效 token。清理后若无持久来源，应重建完整生产链，retry failed jobs 不等于重跑生产者。

## GitLab 专项验收与依据

除[共享清单](release-contract.md#验收清单)，在目标实例执行 CI Lint 并核实套餐/版本；实测普通 MR 与 merged results 的差异、冲突回退、来源/非默认目标更新、取消范围、fork 父项目执行边界、存量检测、实际 retry job 身份及 keep-latest 清理例外。未在该实例跑过流水线，不称 GitLab 已部署验证。

核对日期：2026-10-15。套餐、规则及 API 支持以落地实例为准。

- [MR pipelines 与直接规则入口](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/)
- [Merged results 设置与冲突回退](https://docs.gitlab.com/ci/pipelines/merged_results_pipelines/)
- [专用 MR pipeline API](https://docs.gitlab.com/api/merge_requests/#create-merge-request-pipeline)
- [fork MR 执行上下文](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/#use-with-forked-projects)
- [Merge Trains](https://docs.gitlab.com/ci/pipelines/merge_trains/)、[自动取消](https://docs.gitlab.com/ci/pipelines/settings/#auto-cancel-redundant-pipelines)
- [rules:exists](https://docs.gitlab.com/ci/yaml/#rulesexists)、[regexp 规则](https://docs.gitlab.com/ci/yaml/#rulesexistsregexp)
- [job artifacts](https://docs.gitlab.com/ci/jobs/job_artifacts/)、[精确 artifacts API](https://docs.gitlab.com/api/job_artifacts/)
- [Release asset links](https://docs.gitlab.com/user/project/releases/release_fields/)、[pipeline 完成 webhook](https://docs.gitlab.com/user/project/integrations/webhook_events/#pipeline-events)
- [CI/CD Components](https://docs.gitlab.com/ci/components/)、[CI Lint](https://docs.gitlab.com/ci/yaml/lint/)
