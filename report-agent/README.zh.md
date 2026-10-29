# 对话式报告助手

[English](README.md) | 中文

这个可选的 Web 预设复用 Harness 原生输入框、附件、模型选择和 Session 历史，作为专用的有据问答助手：每个实质性问题先使用官方 `@wxg-prc-cpg/dsh-weknora@0.1.0` 的检索/阅读工具。此插件直接调用 WeKnora REST，不另加 MCP 包装。普通回复和活动卡片使用业务语言，原始工具记录仍保存在 Session 中。

## 运行

先构建 [Harness 源码](../README.zh.md#run-from-source)，在 profile 中安装官方 WeKnora 插件，并在本机运行 [industry-report-agent 后端](https://github.com/Chang-Tong/industry-report-agent)。后端项目的启动器自动准备独立 profile、提供运行时凭据并打开认证聊天地址，也提供 Docker 镜像构建和离线导出说明。此 fork 不包含凭据和私人文档。

覆盖层通过运行时表达式读取 `WEKNORA_BASE_URL`、`WEKNORA_API_KEY` 和 `WEKNORA_KNOWLEDGE_BASE_IDS`。报告插件接收 `apiUrl`、`publicUrl`、`attachmentsDirectory`、轮询/超时和上传大小限制。内部请求仅走本机地址；产物链接通过同源的认证下载路由返回。附件入库限定在原生存储根目录内，等待解析完成后才返回成功。

## 技能与真人确认

预设只挂载自带的 report-drafting、content-planning、style-selection、visual-composition、presentation-skill、frontend-slides、image-sourcing 七组技能目录。流程为明确用途与读者、查资料及缺口、拟定大纲、选择移动蓝商务/杂志研究/深色科技样式。原生提问工具处理分步选择，已给出的信息不反复询问。shell 和通用文件系统工具继续禁用。

提交报告任务前，report_generate 直接等待原生 userQuestions 的真人回答，卡片展示标题、完整大纲和样式。只有明确批准才提交任务；选择修改、取消或尚未回答都不创建任务。等待用户不受写作超时限制，批准后才开始限时生成。提交后取消只停止等待，已提交报告仍保留。报告工具把当次请求的 provider/model 路由传给后台写作器。

后端保存证据快照、任务、来源追溯、数字/引用检查与 Word/HTML/Markdown 导出及可选 PPTX、HTML 演示，仅对 draft_ready 返回链接。行业研究、工作汇报、年度总结、产品方案、竞品分析是内容结构；business 移动蓝商务、research 杂志研究、brief 深色科技会实际改变导出样式；Word 保留相应的文档格式。这些是通用模板，不代表已精确复刻上传的参考报告。

## 模型体验

报告角色指令、简短技能目录和工具定义参与模型请求；技能正文按需加载，资料片段与初稿写入对话上下文。真人确认由工具执行路径实现，不从模型生成的参数推断。覆盖层不修改 agent loop 或已发布的 Session 事件类型。品牌包不产生模型请求。

## 检查与限制

```sh
node --import tsx/esm --test report-agent/api.test.ts report-agent/confirmation.test.ts
node node_modules/typescript/bin/tsc -p report-agent/tsconfig.check.json
```

聚焦测试覆盖轮询、失败、取消、附件目录限制、解析就绪和真人批准。真实验证还需要 WeKnora、报告 API 和可用模型。数字/引用检查不能证明语义真实或来源最新，未完成核验的内容仍为待复核初稿。部署面向可信单用户，并保留原生认证。

## 可选联网

输入框工具栏提供显式的联网搜索开关，每次进程启动默认关闭。宿主的传输门槛在关闭时阻止所有 web MCP 调用，关闭开关时传播取消信号。Harness 原生 MCP 桥接器以 stdio 运行固定版本的 [web-mcp](https://github.com/Chang-Tong/web-mcp)，开放搜索、网页抓取、图片候选提取和有限大小的 PNG/JPEG 下载，不增加端口或另一个摘要模型。宿主通过 report_network_status 提示词变量提供开关当前状态。

开启后仍先查 WeKnora，再补充公开资料。只有实际读取、且被选入当前报告的网页正文才进入证据快照，不能只凭搜索摘要写报告。原始 URL、采集时间和文本哈希保留。随应用打包的抓取适配器拒绝内网目标与重定向。开关由此单用户运行实例共享，不是按用户隔离的权限系统；界面在获得焦点时刷新状态。

## 场景入口与演示技能适配

空白对话显示工作汇报、行业研究、年度总结、制作 PPT、产品方案、竞品分析六个本地化按钮。点击填入可编辑的开场请求，不自动发送；已有的自定义草稿继续保留。所有场景共用输入框和最终确认流程。

演示适配技能分别参考 MIT 许可的 [frontend-slides](https://github.com/zarazhangrui/frontend-slides) 和 [presentation-skill](https://github.com/siril9/presentation-skill)，保留上游版本、原始说明和许可。visual-composition 还参考了固定 MIT 版本的[归藏 PPT v1.1.0](https://github.com/op7418/guizang-ppt-skill/tree/v1.1.0)。它们调用 report_generate 并指定 output=presentation。后端共用元素定位场景，输出 PptxGenJS 可编辑文字/形状和离线 HTML 演示。内容决定封面、导览、指标、能力清单、分析、观点、阅读、缺口、图文和引用版式；原始段落与引用保留在报告归档和幻灯片备注中。长篇 HTML 带响应式阅读目录、有引用的研究要点和来源区。未安装完整上游的渲染、图表、自由脚本、公开发布和浏览器正文编辑功能。图片下载共用显式联网开关，保存来源、哈希、采集时间，通过认证预览路由展示；图片只作示意，不作事实证据。
