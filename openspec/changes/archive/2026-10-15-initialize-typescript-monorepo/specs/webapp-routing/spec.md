# Spec Delta

## Purpose

为网页应用提供可运行的开发与生产构建入口，并将本地路由绑定到稳定的 Git 上下文名称，使开发者在不同分支或工作树间切换时不必依赖随机分配的应用监听端口。

## ADDED Requirements

### Requirement: 可运行的网页应用

`app/webapp` SHALL 使用初始化时最新版稳定 Vue、Vite 与 TypeScript 提供单文件组件（Single-File Component, SFC）网页应用、开发启动、组件类型检查与生产构建入口；首页 MUST 包含可核验的应用标识。

#### Scenario: 开发及生产首页可访问

- **WHEN** 启动开发服务或预览生产构建并请求首页
- **THEN** 返回成功响应及 webapp 标识，开发入口引用的 TypeScript 与 Vue SFC 模块可由服务处理

### Requirement: 稳定的本地域名

开发命令 SHALL 使用 portless 提供稳定本地域名：普通检出使用当前完整分支名；关联工作树使用其根目录名；分离头指针（Detached HEAD）使用检出目录名和短提交标识。清洗 MUST 符合域名系统（Domain Name System, DNS）标签限制，保留确定性散列以区分清洗碰撞和截断名称。

#### Scenario: 普通分支重复启动

- **WHEN** 在同一分支重复启动服务
- **THEN** 本地域名一致，即使底层应用端口改变

#### Scenario: 不同工作树分别启动

- **WHEN** 两个不同根目录名的关联工作树启动 webapp
- **THEN** 获得不同且稳定的本地域名

#### Scenario: 特殊或过长名称

- **WHEN** 分支包含斜杠、中文、符号或超过 DNS 标签长度
- **THEN** 生成合法标签并以稳定散列区分清洗或截断造成的冲突

### Requirement: 自动化环境可启动

开发入口 SHALL 支持在无提权、无系统证书写入的云环境中通过本地 HTTP 代理完成验证；常规启动 MUST 输出真实路由，冲突时明确失败，不自动抢占其他服务。

#### Scenario: 受限环境的功能请求

- **WHEN** 使用文档中的 HTTP 与非特权端口配置启动，并携带预期 Host 请求本地代理
- **THEN** 返回目标 webapp 首页且可获取转换后的入口模块
