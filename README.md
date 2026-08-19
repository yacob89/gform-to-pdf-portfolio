<img width="1635" height="1852" alt="VkyFxlfzQJ" src="https://github.com/user-attachments/assets/e063b243-162d-43a6-ae4f-d3a804d5ce59" /># 🚀 Google Form-to-PDF Automation Engine

### Enterprise-Grade Google Apps Script & TypeScript Workflow

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8%20Runtime-4285F4.svg)](https://developers.google.com/apps-script)
[![Bundler](https://img.shields.io/badge/Bundled%20With-Rollup-ff3e00.svg)](https://rollupjs.org/)
[![Testing](https://img.shields.io/badge/Tested%20With-Jest-C21325.svg)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

---

## 📖 The Story: Modernizing Document Generation in Google Workspace

Every professional services firm, HR department, and educational institution relies on generating personalized documents at scale—contracts, certificates, invoices, proposals, and reports. Yet the typical workflow is painfully manual: copy-pasting client names, dates, and addresses into templates one by one, exporting to PDF, and filing them in the right folder. As volume grows, so do errors, inconsistency, and wasted hours.

Create Google Form:
<img width="3351" height="1967" alt="chrome_5eXvmamBAZ" src="https://github.com/user-attachments/assets/11a2e5f8-422a-49c6-982d-6276a5f8be9f" />

See Form Response:
<img width="3224" height="802" alt="chrome_pNybdbvJm2" src="https://github.com/user-attachments/assets/f4e806e3-3983-46ee-a7ed-92e943938ecf" />

Create Document Templates with Placeholder:
<img width="3328" height="1868" alt="chrome_wcy0xxenV8" src="https://github.com/user-attachments/assets/5f241748-ab80-4b5c-a0af-5f7254cd5fd8" />

Automated PDF creation from responses and doc templates:
<img width="1635" height="1852" alt="VkyFxlfzQJ" src="https://github.com/user-attachments/assets/b91e91b9-611e-4d62-9156-ef6fa6063a67" />


**This project reimagines Google Workspace document automation as a modern, software engineering discipline.**

Instead of brittle macros or repetitive manual work, this portfolio application treats Google Apps Script as a compiled, fully typed deployment target. Built with TypeScript, bundled using Rollup, and tested with Jest, it delivers on-demand PDF generation from Google Form responses, intelligent column mapping that tolerates changing form layouts, and seamless multi-environment deployment via `clasp`. The result: a zero-touch pipeline that turns form submissions into polished, templated PDFs in seconds.

---

## ✨ Key Features & Business Impact

- 📄 **One-Click PDF Generation**: Reads Google Form responses and automatically generates individualized PDF documents from a single Google Docs template—no manual copy-paste required.
- 🎨 **Dynamic Custom Menu**: Injects a native `Generate Pdf` menu into Google Sheets on open, giving users intuitive access to generate PDFs or set a template document without touching code.
- 🛡️ **Defensive Header Mapping**: Dynamically discovers columns by name (e.g. `Client Name`, `Company Name`, `Document Id`), tolerating reordered or renamed form fields across different sheets.
- 🔄 **Multi-Environment Pipeline**: Seamless deployment across `Development` and `Production` Apps Script projects with auto-swapping `clasp` configurations.
- 🧪 **Zero-Breakage CI Workflow**: Strict unit testing via Jest and static linting via ESLint/Prettier to block bad code from reaching production sheets.
- 🗂️ **Automatic PDF Organization**: Creates a dedicated Drive folder per sheet (`PDFs - <SheetName>`) and writes generated PDF URLs back to the response sheet for easy audit trail access.

---

## 🏗️ Technical Stack

- **Core Language**: TypeScript 5.x compiled targeting Google Apps Script V8 Engine.
- **Bundling & Optimization**: Rollup with TypeScript transpilation, cleanup, and license header injection.
- **Deployment & Orchestration**: `@google/clasp` for multi-stage deployments.
- **Testing & Quality Assurance**: Jest + `ts-jest`, ESLint, Prettier, and Apache License header checks.

---

## 📁 Project Architecture

```text
form-to-pdf/
├── src/
│   ├── index.ts           # Global entry point, custom menu, and template setup
│   └── pdf-service.ts     # Core PDF generation engine, column detection, Drive I/O
├── test/                  # Unit test suite powered by Jest
├── .clasp-dev.json        # Staging / Development deployment target
├── .clasp-prod.json       # Live Production deployment target
├── appsscript.json        # Apps Script manifest settings
└── rollup.config.mjs      # Production bundle settings (ESM -> Apps Script standard)
```

---

## 📊 Sheet Data Schema

The workflow is tailored to process Google Form responses with the following structure:

| Column | Name           | Description                              |
| :----- | :------------- | :--------------------------------------- |
| **A**  | `Timestamp`    | Auto-generated form submission timestamp |
| **B**  | `Document Id`  | Unique identifier for each record        |
| **C**  | `Date`         | Date associated with the record          |
| **D**  | `Client Name`  | Full name of the client or recipient     |
| **E**  | `Company Name` | Company or organization name             |
| **F**  | `Address`      | Physical or mailing address              |

### Template Placeholders

The Google Docs template uses the following merge fields, which are automatically replaced during PDF generation:

| Placeholder       | Source Column |
| :---------------- | :------------ |
| `{{DocumentId}}`  | Document Id   |
| `{{Date}}`        | Date          |
| `{{ClientName}}`  | Client Name   |
| `{{CompanyName}}` | Company Name  |
| `{{Address}}`     | Address       |

---

## 🛠️ Developer Guide & Operations

### Prerequisites

- Node.js >= 22
- Google Workspace account with Apps Script enabled
- `clasp` logged in (`npx clasp login`)

### Installation

```bash
npm install
```

### Build & Bundle

Bundles TypeScript source files into a clean `dist/` build output optimized for Apps Script V8 execution:

```bash
npm run build
```

### Run Unit Tests

```bash
npm test
```

### Multi-Stage Deployment

Deploy seamlessly to **Development** or **Production** instances:

```bash
# Deploys to Staging / Development Apps Script Project
npm run deploy

# Deploys directly to Production Apps Script Project
npm run deploy:prod
```

### Workflow: How It Works

1. **Set a Template**: Open the target Google Sheet, navigate to `Generate Pdf > Set Template Document`, and paste the Google Docs Document ID of your template.
2. **Generate PDFs**: Select `Generate Pdf > Generate PDFs from Responses`. The script scans the sheet for rows with a Document Id, prompts you for how many to process, and generates individualized PDFs.
3. **Retrieve Results**: PDFs are saved to a `PDFs - <SheetName>` folder in Google Drive. A `PDF URL` column is appended to the sheet with direct links.

---

## 🧩 Extensibility

The architecture is designed for easy customization:

- **Add new columns**: Extend the `ColumnMapping` interface and `PLACEHOLDER_MAP` in `pdf-service.ts`.
- **Add new template placeholders**: Update `detectColumns()` to recognize new header names and add corresponding `{{Placeholder}}` entries in your Google Docs template.
- **Batch processing**: The count prompt allows selective processing, making it safe for sheets with thousands of responses.

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
