---
name: frontend-slides
description: 根据资料生成可离线打开、支持翻页的 HTML 网页演示；适合汇报、分享和研究展示，与可编辑 PPT 共用内容。
---
# 网页演示

由 zarazhangrui/frontend-slides（MIT）精简适配；来源版本和原文见 UPSTREAM.json、references/upstream.md。此助手使用受控报告工具，不执行上游的部署脚本。

先沿用对话中已确认的主题、听众、用途和资料范围。演讲以一个观点一页、少量文字为主；供阅读的汇报保留解释、来源和缺口。读者和证据优先于装饰。无需重复询问已经明确的信息。

加载 visual-composition 选择实际版式。默认 business 蓝色商务；深入研判选 research 杂志研究；产品展示选 brief 深色科技。样式尚不明确时通过对话推荐一种，并交给最终确认卡片。不要要求用户填写 CSS 或技术参数。

调用 report_generate，output=presentation。按用途选择 template，可给章节标题、style；想使用配图时先加载 image-sourcing，只传已成功获取的 image_ids。工具按内容编排指标、能力清单、分析和引用页，保存共用场景 presentation.json，生成可编辑 PPT 与单文件 slides.html；HTML 固定 16:9、整体缩放，支持键盘和触屏翻页，图片内嵌，无需 CDN。

工具状态为 draft_ready 时返回 slides_url；同时提供 pptx_url 便于后续修改。网页演示不支持直接修改正文、上传到公网或自由编写脚本；不要承诺这些未接入功能。输出仍是待核对初稿，不能把排版成功当作事实已验证。
