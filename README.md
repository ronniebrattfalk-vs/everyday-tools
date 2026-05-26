# Everyday Tools

Fast, private tools for everyday work. No signup required.

This is a React + Vite MVP for browser-first utility tools. The current version has a searchable dashboard, category filters, browser-local favorites/default-tool settings, and 48 live local-first tools.

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
- PDF Tools: create a PDF from PNG/JPG images, merge PDF files, or split selected pages with ordering, output naming, and download.
- Text Diff Checker: compare two text blocks, highlight line changes, copy diff output, and download `.diff`.
- CSV Cleaner: paste or upload CSV, trim cells, remove empty/duplicate rows, preview data, and export CSV or JSON.
- Image Resizer: resize, convert, compress, preview, and download JPG, PNG, or WebP images locally.
- Markdown Previewer: write Markdown with live preview, word count, copy sanitized HTML, and download.
- Color Contrast Checker: check WCAG contrast, copy colors, and generate palette swatches.
- Regex Tester: test patterns with flags, highlighted matches, capture groups, snippets, and copy output.
- Cron Builder: build cron expressions, apply schedule presets, and preview next run times.
- URL Encoder And UTM Builder: encode/decode URLs and generate campaign links with UTM parameters.

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

- Completed PDF Tools with browser-side image-to-PDF generation, PDF merge, and PDF split.
- Supports drag/drop, PNG/JPG upload, PDF upload, page ranges, page size, orientation, margins, file ordering, removal, output naming, and PDF download.
- Later improvement: add compression after file handling quality is tested.

### Phase 6: Static Publishing And Local Preferences

- Keep every tool free and usable without an account.
- Remove login, signup, OAuth, Supabase, and subscription wiring from the web application for now.
- Keep useful personalization local to the browser: favorite tools, recent tools, and the default tool.
- Keep file tools browser-local and avoid uploading user files by default.
- Revisit account and subscription features only after the static site is publishing reliably.

### Phase 7: Next Tool Candidates

1. Completed Text Diff Checker with line comparison, added/removed/unchanged counts, copy diff, reset, and download.
2. Completed CSV Cleaner And Converter with upload, delimiter options, trimming, empty-row cleanup, duplicate removal, preview, and CSV/JSON export.
3. Completed Image Resizer And Compressor with JPG/PNG/WebP input, aspect-ratio locking, format conversion, quality control, preview, and download.
4. Completed Markdown Previewer with live preview, word/line/character counts, copy Markdown, copy sanitized HTML, and download.
5. Completed Color Palette And Contrast Checker with color pickers, contrast ratio, WCAG pass/fail badges, copy actions, and generated swatches.
6. Completed Regex Tester with flags, common snippets, highlighted matches, capture groups, copy output, and reset.
7. Completed Cron Expression Builder with presets, editable cron fields, validation, time zone input, copy action, and upcoming run previews.
8. Completed URL Encoder, Decoder, And UTM Builder with full URL/component modes, copy actions, and campaign link generation.
9. Completed Base64 Encoder And Decoder with text encode/decode, small-file Base64 output, copy actions, and downloads.
10. Completed Case Converter And Text Cleaner with casing presets, line trimming, whitespace normalization, duplicate removal, A-Z sorting, copy, and download.

### Phase 8: More Tool Candidates

1. Completed Hash Generator with SHA-1, SHA-256, SHA-384, and SHA-512 hashes for text or files, plus copy and download.
2. Completed UUID Generator with UUID v4 batches, uppercase/braces options, copy, and download.
3. Completed Lorem Ipsum Generator with placeholder paragraphs, sentences, words, names, short UI copy, stats, copy, and download.
4. Completed HTML Entity Encoder And Decoder with encode/decode modes, plain text preview, swap, copy, and download.
5. Completed JWT Decoder with local header/payload decoding, claim previews, expiry timing, and copy actions.
6. Completed HTTP Status Code Lookup with searchable codes, descriptions, troubleshooting notes, and copy actions.
7. Completed MIME Type Lookup with searchable extensions, content types, descriptions, and copy actions.
8. Completed Date Difference Calculator with calendar days, business days, weeks, deadline offsets, and copy summary.
9. Completed Percentage Calculator with percent-of, percent change, discounts, markup, margin, ratios, and copy summary.
10. Completed Checklist Builder with Markdown/plain text output, copy, download, and print actions.

### Phase 9: Network And Security Tool Candidates

1. Completed DNS Lookup Helper with pasted A, AAAA, CNAME, MX, TXT, SPF, and DMARC record explanations.
2. Completed SPF And DMARC Checker with SPF version/all checks, DMARC policy/reporting checks, and copy summary.
3. Completed SSL Certificate Decoder with pasted PEM inspection, local date extraction, readable strings, size, and SHA-256 fingerprint.
4. Completed CIDR Calculator with IPv4 network, broadcast, subnet mask, wildcard mask, usable range, and host counts.
5. Completed IP Address Inspector with IPv4/IPv6 classification for public, private, loopback, link-local, multicast, and reserved addresses.
6. Completed HTTP Header Analyzer with cache, redirect, CORS, compression, status, and security header checks.
7. Completed Security Headers Checklist with CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, and nosniff checks.
8. Completed JWT Claims Inspector with expiry timing, algorithm risk hints, issuer, audience, scopes, and copy summary.
9. Completed Password Policy Tester with configurable length, uppercase, lowercase, number, symbol, repeat checks, and copy summary.
10. Completed Port Reference Lookup with searchable common ports, protocols, services, safety notes, and copy actions.

### Phase 10: Design, Documents, And Writing Tool Candidates

1. Completed Image Cropper with common aspect presets, manual crop coordinates, preview, and local PNG export.
2. Completed SVG Optimizer with metadata cleanup, sanitized preview, copy, and download.
3. Completed CSS Gradient Builder with linear/radial modes, color stops, live preview, and copyable CSS.
4. Completed Favicon Generator with uploaded image input, common PNG favicon/app-icon sizes, previews, and downloads.
5. Completed PDF Page Reorderer with range-based reorder, reverse, duplicate, remove, output naming, and local download.
6. Completed Document Metadata Cleaner with local file inspection, metadata hint detection, image re-encoding, and cleaned image download.
7. Completed Word Counter Plus with word, sentence, paragraph, character, readability, keyword frequency, and reading-time stats.
8. Completed Meeting Notes Formatter with agenda, decisions, actions, risks, follow-ups, copy, and download.
9. Completed Email Subject Line Tester with length, mobile preview, tone hints, scoring, and copy summary.
10. Completed Tone Rewriter with concise, friendly, formal, and executive local template rewrites, copy, and download.

### Phase 11: Architecture And Release Hardening

- Current assessment: the app is a solid React 19 + Vite 8 browser-only utility suite with local-first tools across Developer, Security, Everyday, Writing, Business, Documents, and Design categories.
- Completed hardening pass: tool registry wiring is centralized, sidebar ordering supports recent tools and A-Z browsing, the default-tool effect no longer depends on `queueMicrotask`, and the package is on a prerelease version.
- Keep protecting the strengths that are working well:
  - One file per tool in `src/tools/`, lazy-loaded tool screens, and low coupling between tools.
  - Lean dependencies limited to libraries that directly support live tools.
  - Real privacy-first behavior: no analytics, no tracking, no CDN calls, no auth, and no backend dependency.
- Completed registry refactor:
  - Each tool entry in `src/data/tools.js` now includes its lazy-load component metadata.
  - `src/data/toolRegistry.jsx` derives lazy components and icon components from the registry.
  - `App.jsx` no longer maintains separate lazy imports, `iconMap`, or `toolComponents` objects.
- Completed sidebar scanability pass:
  - Tool icons are now more distinct across repeated areas such as passwords/hashes/UUIDs, writing tools, network tools, and document tools.
- Completed tool ordering pass:
  - Sidebar sorting supports **Recent** and **A-Z** modes.
  - Recent tools are stored locally and fall back to A-Z order.
- Completed default-tool effect cleanup:
  - The old `queueMicrotask` timing dependency was removed.
- Completed prerelease version bump:
  - `package.json` and `package-lock.json` are now `0.1.0-beta.1`.
- Completed static-app rollback:
  - Login, signup, OAuth, Supabase client code, environment placeholders, and database schema files were removed.
  - Favorites, recent tools, and default tool settings remain browser-local.
- Completed verification pass:
  - `npm run lint` and `npm run build` pass.
  - Local Vite boot check and representative direct routes return HTTP 200.
- Remaining release checks before publishing:
  - Do a browser smoke test across the highest-risk file tools.
  - Review final public copy and deployment URL assumptions.

## Acceptance Checklist

- Each live tool works without a server request.
- Empty, invalid, normal, and long inputs are handled cleanly.
- Copy/download/print actions give visible feedback.
- Layout works on mobile and desktop.
- `npm run lint` and `npm run build` pass before release.
- No account, login, signup, OAuth, or backend setup is required.
- Uploaded files remain local.
- Favorite tools and default tool settings work locally in the browser.

## Project Shape

- `src/App.jsx`: main app layout, dashboard, active tool routing, and tool URLs.
- `src/components/`: shared UI components.
- `src/data/tools.js`: tool metadata, roadmap metadata, and component module metadata.
- `src/data/toolRegistry.jsx`: lazy component loading and icon registry derived from tool metadata.
- `src/hooks/`: browser-local UI state hooks.
- `src/tools/`: individual browser-only tools.
