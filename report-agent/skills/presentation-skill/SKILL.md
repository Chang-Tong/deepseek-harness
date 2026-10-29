---
name: presentation-skill
description: 用已核对的资料生成可编辑 PowerPoint；规划汇报结构、控制每页密度，并保留引用、资料缺口和可重建来源。
---
# 可编辑 PPT

由 siril9/presentation-skill（MIT）精简适配；版本、原文和设计/质检参考保留在 UPSTREAM.json 与 references。当前使用轻量 PptxGenJS 导出器，不加载上游完整分析、绘图与 Office 渲染依赖。

先确认尚不清楚的听众和目的，再查阅资料。工作汇报选 work，行业研究选 industry，年度总结选 annual，产品方案选 product，竞品分析选 comparison。不要让用户重新录入已经给出的信息。

加载 visual-composition 选择移动蓝商务、杂志研究或深色科技，并传入实际 style。编排遵循：每页一个观点，正文左对齐；标题、正文、来源有清楚层级；数字保留单位和条件；证据不足单独列为待核对项。不能为了页面好看编造市场规模、增长率、业绩和图表数据。不得声称看过无法实际读取的图片。

说明建议结构与样式后，调用 report_generate，output=presentation，传入明确的 title、template、style、requirements 和 sections。工具自带最终真人确认，不重复询问生成许可。选用配图时先调用图片工具，只传已返回的 image_ids。

导出文字和基础形状可以在 PowerPoint 中编辑，配图保持位图。正文长段拆成续页，字号在可读下限内适配。导出器按内容选择指标、能力清单、分析、留白观点、图文和引用页，PPT 与 HTML 共用页面位置。保存 presentation.json 可重建文件，引用与原始证据保留在报告归档中。

只有工具返回 draft_ready 时才能提供 pptx_url 和 slides_url。当前不支持复杂图表、自由模板编辑、套用任意上传 PPT 母版；不要承诺完整上游能力。自动引用和数字检查不代替事实复核，正式外发前仍需逐页检查渲染效果。
