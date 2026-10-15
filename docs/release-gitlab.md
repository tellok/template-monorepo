# GitLab CI/CD 方案

共享规则见 [独立版本发布契约](release-contract.md)。根 `.gitlab-ci.yml` 直接声明 MR pipeline 与默认分支入口，运行冻结安装、格式、类型、构建、测试和规格检查。当前未提供 GitLab 实例、套餐、版本或 Runner，配置尚未经过目标实例 CI Lint 与实际流水线验收。

## 原生检查与实例设置

在目标实例核对 merged results pipelines 支持及开关；质量脚本拒绝把普通来源 MR pipeline 当合并结果检查，要求 `CI_MERGE_REQUEST_EVENT_TYPE=merged_result` 且合并父提交与声明的 source/target SHA 一致。冲突导致回退普通 MR pipeline 时失败，不能仅来源通过。工作流不限定 MR 目标为默认分支。需分别核对合并源码与 CI 配置解析来源。

`interruptible: true` 允许平台取消冗余任务；仍须启用并实测相应自动取消设置，不能把它当作所有目标更新自动取消保证。现有模板没有目标 push 调度器。启用完整目标重检时，可信 webhook/处理器分页枚举实际 target 对应的 MR，调用专用 `POST /projects/:id/merge_requests/:merge_request_iid/pipelines`，确认最新合并结果并按精确 pipeline ID 取消旧检查；分支 pipeline 与 Merge Train 都不能代替全部开放 MR 的目标重检。

fork 的运行项目、触发身份、Runner 和变量暴露边界按实际实例核对；父项目成员发起运行不能跳过源代码审查或原生许可。合并审批与执行许可分离，发布变量只在受保护可信链中使用。

## 版本 MR 维护

默认分支 push 先运行无安装的存量 Changeset 检测，有候选才运行隔离版本准备；禁止在全局 before_script 先安装再宣称空检测轻量。`rules:changes` 不等于检测未消费存量，README 不构成有效 Changeset。

固定 CLI、消费证据、路径白名单、正文保留和租约遵循共享契约。维护唯一受管理版本 MR，项目身份仅具备所需分支写入与 MR API 权限；CI_JOB_TOKEN 未经验证不假定足够。当前 tellok/actions main 没有 GitLab Components/Steps，不编造入口或使用 GitHub uses。自动维护未实现，启用时用原生 API/CLI 薄层并在目标实例验证。

## 正式资产与恢复

正式链只接受实际合法版本 MR 合并，适配项目 merge/squash/rebase 策略。生产构建及验收一次，生成源码/版本/校验和清单。正式归档规划放持久 Generic Package Registry 或其他已批准的正式存储；Release asset link 只是链接，不自动复制文件，也不能指向将过期的 job artifacts。

当前不发布资产、不创建 Release、不部署。若新增跨作业传递，使用明确 `needs:artifacts`、实际 producer job ID 与自定义生成身份，不下载分支“最新成功”。可信完成处理器确认消费者终态后精确删除，核对 expire_in/keep-latest 与实际删除权限；after_script 不能保证取消或 Runner 丢失时执行。清理后没有持久同源归档就重跑完整生产链。

## 待平台验收

在目标实例 CI Lint，实测来源更新、非默认目标更新、merged result 与普通 MR/冲突回退、fork 边界、冗余取消、版本 MR 身份及 token 权限、候选检测、retry 新 job ID、keep-latest 与恢复。模板本地检查不能代替这些结果。
