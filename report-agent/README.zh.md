# 对话式报告助手

[English](README.md) | 中文

这个可选的 Web 覆盖层复用 Harness 原生输入框、附件和 Session 历史。报告 agent（智能体）预设暴露三个工具：`knora_search` 检索已保存的原文片段，`knora_import_file` 导入已存储的聊天附件，`report_generate` 等待初稿检查完成并返回下载链接。用户通过对话描述要求，由 agent 整理报告 API 的结构化参数。

## 运行

完成 [Harness 源码环境配置](../README.zh.md#run-from-source)，配置可用的模型服务，并在本机运行兼容的报告 API。当前后端为 [industry-report-agent](https://github.com/Chang-Tong/industry-report-agent)，负责 WeKnora 凭据、证据快照、报告任务、检查与导出。覆盖层不包含凭据。

在 Harness 主目录中生成可选补丁，将项目路径替换为已有目录：

```sh
node report-agent/overlay.mjs --workspace /path/to/project \
  --attachments "$DSH_HOME/attachments/v1/files" \
  --api-url http://127.0.0.1:18087 > "$DSH_HOME/report.patch.yml"
dsh --profile web --patch "$DSH_HOME/report.patch.yml" --host 127.0.0.1 --port 18085
```

使用 Harness 打印的已认证地址。报告项目还提供本机启动器，自动准备独立配置并打开该地址。覆盖层初始化首次使用的工作区，关闭面向编程的输入框控件，保留原生文件选择器和聊天历史。全部插件路径相对于当前源码目录解析。

## 配置与模型体验

工具插件接收 `apiUrl`、`attachmentsDirectory`、`pollIntervalMs`、`timeoutMs` 和 `maxUploadBytes`。它仅连接本机 HTTP 地址。附件路径必须解析到配置的附件目录内，其他文件在上传前即被拒绝。报告预设不暴露 shell 或通用文件系统工具。

检索返回已保存的运行编号、文档与分块标识、片段、真实定位和质量标记。检索结果是候选来源，不是经过独立核验的事实。生成工具返回后端真实终态，仅在状态为 `draft_ready` 时提供下载链接。不能将失败或未完成的任务描述为已完成的正式报告。取消操作只停止工具轮询，已经提交到后端的报告仍保留。

报告角色指令要求模型先检索再回答，通过生成工具产出报告，并披露被省略的内容。工具目录与角色指令在各轮之间保持稳定；返回的片段和初稿增加对话上下文，并由 Harness 记录。这个可选覆盖层不修改 agent loop（智能体循环）或已发布的 Session 数据类型。

## 检查与限制

```sh
node --import tsx/esm --test report-agent/api.test.ts
node node_modules/typescript/bin/tsc -p report-agent/tsconfig.check.json
```

聚焦的传输测试覆盖轮询、终态失败、取消、本机地址校验与附件目录限制。原生 Web 流程的端到端验证还需要真实模型、报告 API 和 WeKnora。报告检查不能判定语义真实性、最新发布日期或精确 PDF 页码；未核实的来源信息仍展示在初稿中。这个覆盖层面向受信任的本机用户，不提供公网多用户认证和权限控制。
