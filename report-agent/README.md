# Conversational report assistant

English | [中文](README.zh.md)

This optional Web overlay uses the native Harness composer, attachments and Session history. A report preset exposes three tools: `knora_search` retrieves saved source excerpts, `knora_import_file` imports a stored chat attachment, and `report_generate` waits for a checked draft and returns download links. Users describe their request in conversation; the agent supplies the report API's structured arguments.

## Run

Complete the [Harness source setup](../README.md#run-from-source), configure a working model provider, and run a compatible report API on loopback. The current backend is [industry-report-agent](https://github.com/Chang-Tong/industry-report-agent); it owns WeKnora credentials, evidence snapshots, report jobs, checks and exports. The overlay contains no credentials.

Generate an optional patch inside your Harness home, replacing the project path with an existing directory:

```sh
node report-agent/overlay.mjs --workspace /path/to/project \
  --attachments "$DSH_HOME/attachments/v1/files" \
  --api-url http://127.0.0.1:18087 > "$DSH_HOME/report.patch.yml"
dsh --profile web --patch "$DSH_HOME/report.patch.yml" --host 127.0.0.1 --port 18085
```

Use the authenticated address printed by Harness. The report project also provides a local launcher that prepares an isolated profile and opens that address automatically. The overlay initializes the first-use workspace and disables coding-specific composer controls; it retains the native file picker and chat history. All plugin paths are resolved from this checkout.

## Configuration and model experience

The tool plugin accepts `apiUrl`, `attachmentsDirectory`, `pollIntervalMs`, `timeoutMs` and `maxUploadBytes`. It only connects to HTTP loopback endpoints. The attachment path must resolve inside the configured attachment directory; files outside that directory are rejected before upload. No shell or general filesystem tool is exposed by the report preset.

Search returns a saved run identifier, document and chunk identities, excerpts, real locators and quality flags. A retrieval result is a candidate source, not an independently verified fact. Generation returns the backend's actual terminal state and only supplies download links for `draft_ready`. Failed or incomplete work must not be described as a completed final report. Cancellation stops the tool's polling; a report already published to the backend remains there.

The report persona directs the model to retrieve before answering, use the generation tool for reports, and disclose omitted content. The tool catalog and persona remain stable between turns; returned excerpts and drafts increase conversation context and are recorded by Harness. The optional overlay does not change the agent loop or the released Session data types.

## Checks and limits

```sh
node --import tsx/esm --test report-agent/api.test.ts
node node_modules/typescript/bin/tsc -p report-agent/tsconfig.check.json
```

The focused transport tests cover polling, terminal failures, cancellation, local-endpoint validation and attachment confinement. The native Web flow also needs a live model, report API and WeKnora for end-to-end verification. Report checks do not establish semantic truth, current publication dates or exact PDF page numbers; unresolved source details remain visible in the draft. The overlay is for a trusted local user and does not add public multi-user authentication or authorization.
