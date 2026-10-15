---
'@template/webapp': patch
---

为本地域名增加项目命名空间，并默认共享 portless 用户级代理，避免不同模板副本在同名分支下发生路由冲突。用户级目录只读的云环境需通过 PORTLESS_STATE_DIR 指定可写状态路径。
