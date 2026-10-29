# Conversational report assistant

English | [中文](README.zh.md)

This optional Web preset reuses the native Harness composer, attachments, model selector and Session history. It is a dedicated source-grounded assistant: every substantive question first uses the official `@wxg-prc-cpg/dsh-weknora@0.1.0` search/read tools. This plugin calls WeKnora REST directly; no additional MCP wrapper is introduced. Normal replies and activity cards use business language, while original tool records remain in Session history.

## Run

Build the [Harness source checkout](../README.md#run-from-source), install the official WeKnora plugin in the profile, and run the [industry-report-agent backend](https://github.com/Chang-Tong/industry-report-agent) on loopback. Its launcher prepares an isolated profile, supplies runtime credentials and opens the authenticated chat address. It also provides a Docker image recipe and offline export instructions. The fork contains no credentials or private documents.

The overlay consumes `WEKNORA_BASE_URL`, `WEKNORA_API_KEY` and `WEKNORA_KNOWLEDGE_BASE_IDS` through runtime environment expressions. The report plugin accepts `apiUrl`, `publicUrl`, `attachmentsDirectory`, polling/timeout limits and an upload size limit. Internal report requests use loopback only; artifact links use an authenticated same-origin download route. Attachment import is confined to the configured native storage root and waits for parsing before returning success.

## Skills and human confirmation

The preset mounts only its seven bundled skill roots: report-drafting, content-planning, style-selection, visual-composition, presentation-skill, frontend-slides and image-sourcing. It clarifies purpose and audience, retrieves source coverage and gaps, proposes an outline and selects a business, research or brief style. The native question tool handles incremental choices; previously supplied decisions are not repeatedly requested. Shell and general filesystem tools remain disabled.

Before posting any report job, report_generate directly waits for a native userQuestions answer showing the title, complete outline and style. Only an unambiguous human approval permits submission. Choosing an edit, canceling or leaving the question unanswered never creates a job. Waiting for the human has no writer timeout; bounded generation starts after approval. Canceling later stops waiting but preserves any report already submitted. The report tool captures the current request's provider/model route for the backend writer.

The backend owns evidence snapshots, jobs, original file/chunk identities and hashes, number/citation checks and Word/HTML/Markdown exports plus optional PPTX and HTML slides. It returns links only for draft_ready. Industry, work, annual, product and comparison are content structures; business (Mobile Blue), research (Editorial Research) and brief (Dark Technology) alter actual export styling; Word retains its corresponding document formatting. These are generic templates, not a promise of exact reproduction of an uploaded reference report.

## Model Experience

The report persona, compact skill catalog and registered tools shape model requests. Skill bodies are loaded on demand; source excerpts and drafts are recorded in conversation context. Human confirmation is implemented in the tool execution path, not inferred from model-generated arguments. The overlay does not change the agent loop or released Session event types. The brand package contributes no model requests.

## Checks and limits

```sh
node --import tsx/esm --test report-agent/api.test.ts report-agent/confirmation.test.ts
node node_modules/typescript/bin/tsc -p report-agent/tsconfig.check.json
```

Focused tests cover polling, failure, cancellation, attachment confinement, parser readiness and human approval. Live verification additionally needs WeKnora, the report API and a configured model. Number/citation checks do not establish semantic truth or source freshness; incomplete work remains a review draft. The deployment targets a trusted single user and retains native authentication.

## Optional networking

The input toolbar provides an explicit Web search switch, initially closed on every process start. A host transport gate blocks every web MCP call while closed and propagates cancellation when disabled. The official Harness MCP bridge runs a pinned [web-mcp](https://github.com/Chang-Tong/web-mcp) stdio server exposing search, page fetch, image discovery and bounded PNG/JPEG download; no new port or secondary summarization model is required. The host contributes current switch status through the report_network_status prompt variable.

When enabled, the assistant still queries WeKnora first and can supplement it with public sources. Only actually fetched page bodies selected for the current report enter its evidence snapshot; a search snippet alone is insufficient. Original URLs, capture times and text hashes are retained. Private network destinations and redirects are rejected by the bundled fetch adapter. The switch is shared across this single-user runtime; it is not a per-user permission system. The UI refreshes its state on focus.

## Scenario starters and presentation adapters

A blank conversation shows six localized starter buttons: work update, industry research, annual review, slides, product proposal and competitor analysis. Clicking inserts an editable opening request without sending it. Existing custom draft text is retained. The same composer and confirmation flow handle all scenarios.

The presentation adapters are MIT-licensed adaptations of [frontend-slides](https://github.com/zarazhangrui/frontend-slides) and [presentation-skill](https://github.com/siril9/presentation-skill); each retains its upstream revision, original instructions and license. The visual-composition adapter additionally references [Guizang PPT v1.1.0](https://github.com/op7418/guizang-ppt-skill/tree/v1.1.0), pinned to its MIT release. They route through report_generate with output=presentation. The backend shares positioned scenes across editable PptxGenJS text/shapes and offline HTML. Content selects cover, overview, metric, capabilities, analysis, statement, reading, gaps, image and reference layouts; original paragraph text and citations remain in the report archive and slide notes. Long-form HTML has a responsive reading directory, cited research highlights and references. The complete upstream rendering, charting, arbitrary scripting, public deployment and in-browser editing features are not installed. Image downloads share the explicit network gate, save source/hash/time metadata and use an authenticated preview route; pictures are illustrations, never evidence.
