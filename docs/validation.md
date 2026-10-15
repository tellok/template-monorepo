# 初始化验证记录

日期：2026-10-15。当前云实例实测，未执行远程发布或部署。

- `bash scripts/cloud-setup.sh` 成功：冻结安装、Prettier 检查、Vue 类型检查、生产构建、全部测试和 OpenSpec 严格校验。
- Node 24.19.0、pnpm 11.25.0、Vue 3.5.44、TypeScript 6.0.3。TypeScript 7 与 vue-tsc 的接口不兼容已诊断并修正；应用显式声明兼容版本，防止 pnpm 自动补入不兼容 peer。
- Vitest 实际执行 **13 项**，13 通过、0 失败、0 跳过；包括真实 Git 工作树夹具、portless Host 请求、Vite 转换、生产脚本资源、Chromium 中 Vue 点击响应、真实 Changesets 单包版本更新与两次 skills-npm 同步。
- 根 `pnpm dev` 已启动，并通过 node:http 向环回代理发送实际 Host 请求，确认 HTTP 200 与预期首页内容。不能用 Node fetch 自定义 Host 代替此检查；当前 undici 不按此方式路由 Host。
- 构建缓存：实际开发过程中更改 Vite 源配置后发生缓存未命中并重建；相同输入再次构建命中，1/1 缓存恢复。TypeScript 7 → 6 的清单/锁文件变化后执行真实依赖更新与类型检查；未配置远程缓存，不声称跨 Runner 缓存持久。
- YAML 均可解析，VS Code JSON 配置与保存格式化设置已静态核对，CLI 格式检查通过。云端没有实测 VS Code GUI 的保存事件。
- AGENTS.md 与指定 dotai 提交逐字一致；gitignore 保留指定 Toptal API 的完整原始正文，并追加项目规则；VS Code settings/extensions 未被忽略。
- 依赖技能自动同步已验证；一次性发布设计技能不作为项目安装依赖；上游未合并的 tellok/actions 候选没有作为稳定运行依赖采用。
- GitHub/GitLab 质量配置只在本地做结构和引用检查，未在目标平台执行。GitLab 还须按实例套餐启用 merged results 并执行 CI Lint。自动版本请求、目标更新调度、正式资产上传和部署未启用，边界见发布文档。
- 云配置 `install_script`、`start_skill` 已保存为草稿；保存不等于发布或新任务恢复验证。用户需在环境设置中审阅、保存并发布环境。

本次用户明确要求暂时跳过门禁与提案等待，直接实施。保留上游 AGENTS.md 作为后续默认规则及已有 OpenSpec 设计记录，不添加额外审批停顿。

## Vitest 与技能清理

按用户指示直接实施本次调整，不新增提案或审批停顿。统一测试入口改为 Vitest 5.0.4，并提供监听模式，迁移时既有 11 项断言覆盖保持不变。发布设计 skill 仅用于一次性设计，已移除项目自动安装声明、安装目录及锁记录；保留上游设计依据链接与 skills-npm 的依赖技能同步能力。历史归档记录描述当时初始化过程，不作为当前安装配置。

## 模板复用

移除验证脚本中当前云环境的绝对路径及缓存目录覆盖；版本测试从清单读取包名和独立版本，GitHub 使用仓库实际默认分支，GitLab 从根 packageManager 读取 pnpm 版本。新项目在相同占位包名和分支名下也有独立的路由命名空间，默认共享 portless 用户级代理，显式状态目录仍受环境控制。当前 13 项测试全部通过，包括两项新增项目隔离回归。

独立副本验收已通过：根名称改为 sample-product，包 scope/name 改为 @sample/client 与 @sample/typescript-config，版本改为 2.3.4 与 4.5.6，默认分支改为 develop，目录路径含空格，并从 /tmp 调用安装验证脚本。冻结安装、格式、类型、构建、13 项测试与四份规格校验全部通过；副本在检查后已清理。

共享代理验收已通过：两个独立 Git 项目使用相同根包名及 work 分支，共享同一 PORTLESS_STATE_DIR 与代理端口，两条独立域名均返回正确网页。临时应用停止并清理，不停止原应用代理。
