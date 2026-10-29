---
description: "China Mobile and Jiutian presentation for the dedicated report assistant."
kind: "package-reference"
---

# China Mobile and Jiutian report presentation

English | [中文](README.zh.md)

## Summary

This optional native Web presentation embeds the public China Mobile/Jiutian lockup in the sidebar and the Jiutian mark in the conversation hero. Source URLs and ownership are recorded in [assets/sources.json](assets/sources.json). The images are bundled locally for offline operation. The sidebar reserves the full artwork height so the bilingual wordmark remains visible.

## Table of Contents

- [Use](#use)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use"></a>
## Use

The Web bundle declares this package as a disabled roster row; the [report overlay](../../../report-agent/README.md) enables it and disables the official brand. It uses declaration-aware slot registration and typed English/Chinese copy. Blank chats offer six scenario starters that insert editable prompts without sending or replacing custom drafts. It also renders source lookup, source reading, attachment import and report generation as plain business activities; raw arguments and responses remain in Session storage but are not shown in these cards.

<a id="model-experience"></a>
## Model Experience

### Report presentation and network preference

#### What the model sees

This browser presentation sends explicit user network preferences to the host; the host `report-network` plugin owns the resulting model status and transport policy. It contributes no prompt text or tool schemas directly.

#### Token effect

No direct token cost. Activity cards and brand images remain outside model requests.

#### KV Cache effect

No direct effect; changing network preference changes the host-owned status on the next request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- This is a deployment-specific fork with public brand assets, not an official China Mobile product release. It supplies presentation and leaves report truth checks and durable evidence to the report backend. Model selection remains available in the composer.

### Dev Note

<details>
<summary>Working context</summary>

None.

</details>
