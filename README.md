# Everyday Tools

Fast, private tools for everyday work. No signup.

This is a React + Vite MVP for browser-first utility tools. The first version has a searchable dashboard, category filters, live tools, and roadmap cards for planned tools.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Deploy To GitHub Pages

GitHub Pages can host this as a static site from a public repository on GitHub Free. Private-repository Pages publishing requires a paid GitHub plan.

1. Create a public GitHub repository, for example `everyday-tools`.
2. Push this project to the `main` branch.
3. In GitHub, open the repository settings and go to **Pages**.
4. Set the build source to **GitHub Actions**.
5. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

The workflow builds with `BASE_PATH` set to the repository name, so project-site URLs such as `/everyday-tools/json-formatter` work. It also copies `index.html` to `404.html` so direct tool links load the React app on GitHub Pages.

For a local production build that mimics GitHub Pages on PowerShell:

```powershell
$env:BASE_PATH='/everyday-tools/'; npm run build
```

## Live MVP Tools

- QR Code Generator: text/URL input, instant preview, copy text, download PNG.
- Password Generator: secure random generation, length slider, character set toggles, strength indicator, copy.
- Unit Converter: length, weight, temperature, and data size conversions.
- Timestamp Converter: Unix seconds/milliseconds, local datetime, ISO output, and selected time zones.
- JSON Formatter: validate, format, minify, sort keys, search output, syntax-highlight preview, upload/download, and copy output.
- Invoice Generator: editable invoice details, line items, discount, tax/VAT totals, logo upload, payment details, local draft saving, and print/PDF.
- Resume Helper: guided inputs for summaries, achievement bullets, cover letters, and LinkedIn headlines.
- PDF Tools: create a PDF from PNG/JPG images or merge PDF files with ordering, output naming, and download.

## Roadmap Breakdown

### Phase 1: Core Tool Platform

- Build the searchable dashboard, category filters, active tool panel, and shared visual system.
- Keep all v1 tools local in the browser with no login, backend, database, or analytics.
- Completed tools: QR Code Generator, Password Generator, Unit Converter.

### Phase 2: Developer Utilities

- Add Timestamp / Time Zone Converter for Unix seconds, milliseconds, local datetime, ISO, and common zones.
- Add JSON Formatter for validation, pretty formatting, minifying, raw mirroring, and copy output.
- Improve JSON Formatter with syntax highlighting, key sorting, file upload/download, search, clearer error locations, and explicit copy actions.

### Phase 3: Business Tools

- Completed Invoice Generator with sender/client fields, line items, discounts, tax/VAT, totals, logo upload, payment details, browser print/PDF, and local draft saving.
- Later improvement: add invoice templates and recurring invoice presets.

### Phase 4: Writing Tools

- Completed Resume / Cover Letter Helper with guided inputs for role, experience, skills, achievements, tone, and company.
- Uses template-based output so it works without an AI key or backend.
- Includes copy actions for resume summary, bullets, cover letter, and LinkedIn headline.

### Phase 5: Document Tools

- Completed PDF Tools with browser-side image-to-PDF generation and PDF merge.
- Supports drag/drop, PNG/JPG upload, PDF upload, page size, orientation, margins, file ordering, removal, output naming, and PDF download.
- Later improvement: add split and compression after file handling quality is tested.

## Acceptance Checklist

- Each live tool works without a server request.
- Empty, invalid, normal, and long inputs are handled cleanly.
- Copy/download/print actions give visible feedback.
- Layout works on mobile and desktop.
- `npm run lint` and `npm run build` pass before release.

## Project Shape

- `src/App.jsx`: main app layout, dashboard, active tool routing, and tool URLs.
- `src/components/`: shared UI components.
- `src/data/tools.js`: tool registry and roadmap metadata.
- `src/tools/`: individual browser-only tools.
