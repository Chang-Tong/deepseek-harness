---
description: "专用报告助手的中国移动与九天界面。"
kind: "package-reference"
---

# 中国移动与九天报告界面

[English](README.md) | 中文

## 概述

此可选的原生 Web 界面在侧栏使用中国移动/九天组合标识，在对话首页使用九天标识。来源网址与权属记录在 [assets/sources.json](assets/sources.json)。图片随应用本地打包，离线运行不请求外部图片。侧栏为完整图稿预留高度，保证中英文名称显示完整。

## 目录

- [使用](#use)
- [模型体验](#model-experience)
- [已知局限与延后工作](#known-limitations-and-deferred-work)

<a id="use"></a>
## 使用

Web bundle 以默认禁用的 roster 行声明此包；[报告 overlay](../../../report-agent/README.zh.md) 启用它并禁用官方品牌包。界面通过等待声明的 slot 注册和中英文字典实现。查阅资料、阅读原文、附件入库和生成报告显示为业务活动；原始参数与响应保留在 Session 中，不在这些卡片中展示。

<a id="model-experience"></a>

空白对话提供六个场景入口，点击填入可编辑提示，不发送或覆盖已有自定义草稿。

## 模型体验

### 报告显示与联网偏好

#### 模型所见

此浏览器界面向宿主提交用户明确选择的联网偏好，宿主 `report-network` 插件负责模型状态与传输策略。界面不直接注册提示词或工具 schema。

#### Token 影响

没有直接 token 成本，活动卡片和品牌图片不进入模型请求。

#### KV Cache 影响

没有直接影响；切换联网偏好会改变宿主在下一次请求提供的状态。

## 已知局限与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 这是使用公开品牌素材的专用部署 fork，不表示中国移动官方发布产品。界面负责呈现，报告事实检查和持久证据由后端负责。输入框仍保留模型选择。

### 开发备注

<details>
<summary>维护上下文</summary>

无。

</details>
