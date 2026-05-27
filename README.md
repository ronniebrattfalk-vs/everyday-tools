# Everyday Tools

Fast, private tools for everyday work. No signup required.

This is a React + Vite app for browser-first utility tools. The current version has a searchable dashboard, category filters, browser-local favorites/default-tool settings, version badge, and 78 live local-first tools.

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
- Password Generator: secure random generation, passphrase mode, length/word controls, strength indicator, and copy.
- Unit Converter: length, weight, temperature, and data size conversions.
- Timestamp Converter: Unix seconds/milliseconds, local datetime, ISO output, and selected time zones.
- JSON Formatter: validate, format, minify, sort keys, filter with JSONPath, search output, syntax-highlight preview, upload/download, and copy output.
- Invoice Generator: editable invoice details, line items, discount, tax/VAT totals, logo upload, saved presets, accent themes, local draft saving, and print/PDF.
- Resume Helper: guided inputs for summaries, achievement bullets, cover letters, LinkedIn headlines, and bullet-quality analysis.
- PDF Tools: create a PDF from PNG/JPG images, merge or split PDF files, preview pages with thumbnails, and optionally compress merge/split output locally.
- Text Diff Checker: compare two text blocks with line-level or word-level changes, copy diff output, and download `.diff`.
- CSV Cleaner: paste or upload CSV, trim cells, detect or remove duplicate rows, inspect column stats, preview data, and export CSV or JSON.
- Image Resizer: resize, convert, preview, batch-download, and compress JPG, PNG, or WebP images with canvas, smart, or photo compression modes locally.
- Markdown Previewer: write Markdown with live preview, syntax-highlighted code blocks, word count, copy sanitized HTML, and download.
- Color Contrast Checker: check WCAG contrast, copy colors, receive converter colors, and generate palette swatches.
- Regex Tester: test patterns with flags, highlighted matches, replace preview, capture groups, snippets, and copy output.
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

- Completed Invoice Generator with sender/client fields, line items, discounts, tax/VAT, totals, logo upload, payment details, browser print/PDF, local draft saving, and reusable preset layouts.
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
6. Completed Document Metadata Cleaner with local file inspection, searchable EXIF/IPTC/XMP metadata review, image re-encoding, and cleaned image download.
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

### Phase 12: Developer Data Tools

1. Completed Number Base Converter: convert between binary, octal, decimal, and hexadecimal with nibble grouping and copy.
2. Completed JSON To CSV Converter: convert JSON arrays to CSV and CSV back to JSON with column mapping, preview, and export.
3. Completed Color Format Converter: convert between HEX, RGB, HSL, and OKLCH with a live color picker, preview swatch, and copy.
4. Completed SQL Formatter: format, indent, and normalize SQL queries with dialect selection (SQL, PostgreSQL, MySQL, SQLite, T-SQL, BigQuery), keyword casing options, and copy.
5. Completed Semver Helper: parse, compare, and bump patch/minor/major with pre-release and build metadata support.
6. Completed JSON Diff: compare two JSON objects and highlight added, removed, and changed keys with full path display and copy.
7. Completed ASCII And Unicode Inspector: look up characters by code point, UTF-8 bytes, HTML entity, and JS/Python escape sequences.
8. Completed Markdown Table Builder: visual grid editor that generates and copies Markdown table syntax.
9. Completed HTTP Request Snippet Builder: compose and copy request snippets in curl, fetch, and axios formats from a URL and headers.
10. Completed Environment File Parser: parse .env files, export as .env, JSON, or shell variable assignments with copy and download.

### Phase 13: Calculators And Reference

1. Completed Tip And Bill Splitter: set tip percentage with a slider or quick presets, split between any number of people, choose rounding mode, and copy the summary.
2. Completed Loan And Mortgage Calculator: monthly payment, total interest, total paid, and a full year-by-year or month-by-month amortization table with preset scenarios and extra payment support.
3. Completed Compound Interest Calculator: project investment growth with monthly contributions, show final balance, total contributed, interest earned, and a year-by-year growth table.
4. Completed Scientific Calculator: full expression evaluator with trig, log, exponents, constants, and input history.
5. Completed World Clock: show and compare current time across multiple cities, add or remove zones, and copy moments.
6. Completed Timezone Overlap Finder: set working hours for multiple zones and highlight shared availability windows.
7. Completed Random Generator: numbers with ranges, dice rolls, coin flips, list shuffling, and random item picks.
8. Completed Aspect Ratio Calculator: enter width or height and lock the ratio to get the matching dimension, with common presets, a visual preview box, and megapixel count.
9. Completed Roman Numeral Converter: convert integers to Roman numerals and Roman numerals back to integers with validation, quick examples, and copy.
10. Completed Number Format Converter: switch between standard, scientific notation, engineering notation, words, ordinals, and locale formats.

### Phase 14: Business And Professional Tools

1. Completed Expense Tracker: local expense log with date, category, amount, notes, category breakdown, and CSV export.
2. Completed Meeting Cost Calculator: estimate meeting cost from duration, per-person hourly rate, and headcount, with a live ticking timer.
3. Completed Decision Matrix: weighted criteria scoring table for comparing options with totals, auto-ranking, and copy summary.
4. Completed Budget Planner: income and expense rows by category with monthly navigation, balance bar, and CSV export.
5. Completed Quote Generator: estimate and proposal builder with line items, discount, tax, sender persistence, and print/PDF export.
6. Completed Time Tracker: start/stop timer with project and task tags, session history, project totals, and CSV export.
7. Completed Changelog Formatter: sort pasted bullet points into Added, Changed, Fixed, Removed, and Deprecated sections with copy.
8. Completed Email Signature Builder: compose a plain-text or HTML email signature with name, title, links, live preview, and copy actions.
9. Completed Proofreading Checklist: writing quality analysis for passive voice, filler words, hedging language, long sentences, repeated words, and adverbs with a quality score.
10. Completed Letter Template Builder: fill sender, recipient, subject, date, and body fields to produce a formatted formal letter; includes job application, complaint, thank you, and recommendation templates.

### Phase 15: Tool Enhancements

- Completed Text Diff Checker enhancement: word-level diff mode now sits alongside the existing line-level view so small edits inside a line are visible without the whole line being flagged.
- Completed Regex Tester enhancement: replace mode now accepts a replacement string and previews substituted output alongside the existing match workflow.
- Completed CSV Cleaner enhancement: column statistics now show inferred type, null count, unique count, min, and max for each parsed field.
- Completed Password Generator enhancement: passphrase mode now generates Diceware-style word combinations as a memorable alternative to random character strings.
- Completed Image Resizer enhancement: batch mode now processes multiple images with shared settings and downloads the results as a ZIP archive.
- Completed PDF Tools enhancement: merge and split flows now offer an optional compression/re-encoding step to reduce file size before download.
- Completed Color Format Converter enhancement: converted colors can now be sent directly into Color Contrast Checker without copy-pasting.
- Completed Tone Rewriter enhancement: rewrites now respond to sentence length, passive phrasing, filler language, and detected formality instead of only using fixed template substitution.
- Completed Resume Helper enhancement: achievement analysis now flags weak action verbs, passive phrasing, missing quantification opportunities, and overly long bullets.
- Completed JSON Formatter enhancement: a JSONPath field now filters or extracts values from parsed JSON inline.

### Phase 16: Library-Backed Tool Upgrades

Each item below replaces hand-rolled logic or a limited browser API with a focused npm library. All libraries run entirely in the browser — no server calls. Install only when implementing the upgrade for a given tool; do not batch-install upfront.

1. **Completed Text Diff Checker** → installed `diff` (jsdiff) to replace the hand-rolled line comparison and unlock word-level diff mode with unified-style output generation.
2. **Completed SVG Optimizer** → installed `svgo` to replace the metadata-strip-only flow with real SVG optimization passes and before/after byte savings.
3. **Completed Document Metadata Cleaner** → installed `exifr` to extract EXIF, IPTC, and XMP fields locally and present them in a searchable metadata table before optional image cleanup.
4. **Completed Markdown Previewer** → installed `highlight.js` and wired it into `marked` so fenced code blocks now render with syntax highlighting for common languages.
5. **Completed Image Cropper** → installed `cropperjs` to replace manual coordinates with an interactive crop box, zoom controls, rotation, and aspect-ratio presets.
6. **Completed Semver Helper** → installed `semver` to add canonical parsing, prerelease-aware comparison, range validation, `satisfies`, and max/min matching helpers.
7. **Completed SSL Certificate Decoder** → installed `node-forge` to parse X.509 subject, issuer, SANs, key usage, signature algorithm, public key size, fingerprints, and extension details locally.
8. **Completed Hash Generator** → installed `spark-md5` and `crc-32` to add MD5 and CRC32 alongside the existing SHA outputs for text and file hashing.
9. **Completed Date Difference Calculator** → installed `date-fns` to replace manual business-day logic with canonical date helpers and cleaner formatted summary output.
10. **Completed Image Resizer** → installed `browser-image-compression` to add a smart compression path alongside the existing canvas resize flow, while keeping ZIP batch downloads in place.

### Phase 17: Document And Media Refinement

1. **Completed Image Resizer** → expanded the `browser-image-compression` upgrade with a photo-tuned compression mode and before/after size comparisons for each processed file.
2. **Completed PDF Tools** → added page thumbnail previews for merge and split flows so file order and selected pages are visible before download.
3. **Completed PDF Tools** → added a "preserve text when possible" compression option that keeps text-preserving output unless raster re-encoding is meaningfully smaller.
4. **Completed CSV Cleaner** → added duplicate-row detection panels that group repeated rows, show repeat counts, and explain how many rows were removed from the cleaned output.
5. **Completed Document Metadata Cleaner** → added file-type-specific detail panels that summarize format profile, cleanup coverage, and image/document/media-specific metadata hints before download.
6. **Completed Invoice Generator** → added browser-local invoice template presets with built-in layouts, accent variations, and reusable saved defaults for repeat invoices.

### Phase 18: Developer Workflow Power-Ups

1. **Completed JSON Formatter** → installed `jsonpath-plus` to replace the lightweight extractor with filtered arrays, nested wildcard paths, and match counts beside the extracted output.
2. **Completed Regex Tester** → added saved browser-local snippet presets so commonly used patterns, flags, and replacements can be reused quickly.
3. **Completed HTTP Request Snippet Builder** → installed `parse-curl` so pasted `curl` commands can be imported into the builder and round-tripped between formats more reliably.
4. **Completed SQL Formatter** → reused the installed `diff` package to add a line-by-line change preview between original and formatted SQL so normalization changes are easier to review.
5. **Completed JSON Diff** → installed `jsondiffpatch` to add grouped path navigation, richer array/object change metadata, and search for larger object diffs.
6. **Completed Env File Parser** → installed `dotenv` to improve parsing of quoted values, escapes, comments, and multiline edge cases, then added likely-secret masking in the preview.
7. **Completed Changelog Formatter** → installed `linkify-it` so URLs auto-link in the rendered preview, and `#issue` numbers and short commit hashes link directly into the repo when an optional repo URL is provided.

### Phase 19: Writing And Business Quality Pass

1. **Completed Resume Helper** → added per-bullet rewrite suggestions with a STRONG_VERB_MAP that replaces weak verbs (helped, worked, responsible for, etc.) with stronger alternatives and flags missing metrics alongside the existing issue analysis.
2. **Completed Tone Rewriter** → added sentence-by-sentence compare view with a `tone-compare` panel showing original vs rewritten per sentence, what changed (removed softeners, passive→active, word count), and a context note describing the selected tone.
3. **Completed Proofreading Checklist** → installed `n-gram` to add repeated phrase detection (bigrams and trigrams) across paragraphs, with stop-word filtering so only meaningful repeated phrases surface.
4. **Completed Invoice Generator** → added browser-local client profiles (save, load, delete) and a line-item library (save any line item for reuse, add from library to invoice) using separate localStorage keys.
5. **Completed Quote Generator** → added reusable quote templates (save/apply/delete; stores notes, validity, discount, tax) and a saved line-item library shared across quotes, using the same browser-local preset model as invoices.
6. **Completed Time Tracker** → reused `date-fns` helpers to add manual session entry (date + start/end time with validation) and inline session editing so missed timers can be corrected without exporting first.
7. **Completed Budget Planner** → added a recurring items panel (separate localStorage key) that auto-seeds any new month with saved income/expense templates; manual "Apply to this month" button available for existing months.

### Phase 20: Release And Publishing Polish

1. **Completed axe-core** → installed `@axe-core/react` as a devDep and wired it into `main.jsx` behind `import.meta.env.DEV` so violations are logged to the browser console during development. Fixed `aria-label` on all icon-only delete buttons in Budget Planner, Time Tracker, and the What's New modal close button.
2. **Completed smoke-test notes** → added a release smoke-test checklist to the README below this roadmap.
3. **Completed rollup-plugin-visualizer** → installed as devDep and wired into `vite.config.js` behind `ANALYZE=1` env flag; run `ANALYZE=1 npm run build` to open `dist/stats.html` with gzip/brotli breakdown per chunk.
4. **Completed tool updated badges** → added `updated: true` field to 8 tools enhanced in Phases 18–19; ToolCard renders a small accent dot on the icon for any tool with that field set.
5. **Completed mobile layout review** → added `.tone-tool`, `.svg-tool`, `.favicon-tool`, `.pdf-reorder-tool`, `.cropper-tool`, `.metadata-tool`, and `.gradient-tool` to the 900 px single-column breakpoint (they were missing); collapsed `.tt-manual-row` to 2-col at 900 px and 1-col at 560 px; hid What's New version/date on 560 px screens.

### Phase 21: Dependency And UX Refinements

Notes from a post-Phase-18 review. None of the items below are blocking, but each addresses a known limitation or a better-fit library.

1. **Completed PDF Tools** → Added a visible warning when "Smaller file" or "Smart" compression is applied: the inline compression hint now uses a stronger orange callout style (`pdf-raster-notice`) with explicit text that the output will be raster-only and text will not be selectable or searchable. A post-download confirmation banner also appears after any raster operation.
2. **Resolved HTTP Request Snippet Builder** → Evaluated replacing `parse-curl` with `curlconverter`. Decision: keep `parse-curl`. `curlconverter` is a code-generation library (outputs Python, fetch, etc.) with a different API surface, not a curl parser. The existing `parse-curl` covers the primary use case of importing URL, method, headers, and body into the builder. If multipart/proxy/auth edge cases become a frequent complaint, revisit with a purpose-built curl parser instead.
3. **Resolved Env File Parser** → `dotenv` is kept as-is. It bundles correctly under Vite and handles quoted values, escapes, and multiline blocks reliably. Lighter alternatives like `envfile` lack the same edge case coverage. No action required.

### Phase 22: Tool Intelligence And Precision

Full audit of all tools in the app surfaced several targeted improvements that require no new heavy dependencies. Each item below sharpens an existing tool with either a better algorithm or a new display mode.

1. **Completed Password Generator** → Replaced the heuristic score (character-set count + length thresholds) with information-theoretic entropy: `bits = length × log₂(pool_size)`. Strength thresholds are 40/60/80 bits. The detail label now shows the exact bit count (e.g. "87 bits entropy") instead of a character-set count.
2. **Completed Word Counter Plus** → Added a Flesch-Kincaid grade label alongside the raw readability score. Seven bands: Very Easy (90+), Easy (80–89), Fairly Easy (70–79), Standard (60–69), Fairly Difficult (50–59), Difficult (30–49), Very Confusing (< 30). Label appears below the score as a small caption.
3. **Completed Text Diff Checker** → Added a third **Char** mode alongside Line and Word. Uses `diffChars` from the already-installed `diff` library. Stats show added/removed/unchanged character counts. Download filename is `text-diff-char.diff`.
4. **Completed QR Code Generator** → Added SVG output alongside the existing PNG mode. A format toggle (PNG / SVG) switches the generator between `QRCode.toDataURL` and `QRCode.toString({ type: 'svg' })`. The preview renders via a data URI; download produces a `.svg` file. SVG output is vector-sharp at any size and has a smaller file footprint than PNG.
5. **Completed Regex Tester** → Named capture groups (e.g. `(?<year>\d{4})`) are now displayed as labelled badges below each match rather than merged into the raw group list. The pattern is parsed for group names via `(?<name>)` detection. A "named" count appears in the stats bar when the pattern contains named groups.
6. **Future CSV Cleaner** → Excel `.xlsx`/`.xls` import and export via the `xlsx` library. Deferred: `xlsx` adds ~600 KB to the chunk. Revisit if CSV+Excel round-tripping becomes a top request.
7. **Future Expense Tracker / Budget Planner** → SVG mini-charts (sparklines and category bars) with no new dependency. Deferred to a dedicated UX pass.
8. **Future Settings Backup / Restore** → Export all tool localStorage keys as a single JSON archive, import to restore. No new dependency. Deferred to a settings management phase.

### Phase 23: Drag-And-Drop File Import

Added drag-and-drop support to every tool that accepts a file import. Files can now be dropped onto the upload area instead of using the file picker button.

1. **Completed upload-box tools** → Hash Generator, Image Cropper, Document Metadata Cleaner, PDF Page Reorderer, Favicon Generator, Base64 Encoder, Image Resizer. Each tool's `upload-box` label now accepts drops and highlights with the accent blue on hover. Hint text updated to "Choose or drop a file".
2. **Completed toolbar-import tools** → JSON Formatter (drop `.json` onto tool body), CSV Cleaner (drop `.csv` onto tool body), HTTP Request Builder (drop `.txt`/`.sh` onto the Import curl panel), JSON ↔ CSV Converter (drop `.json`/`.csv` onto the input panel), Invoice Generator (drop image onto the Branding & Payment section to set the logo). Container-level drop zones show a dashed accent outline while dragging over them.

## Acceptance Checklist

- Each live tool works without a server request.
- Empty, invalid, normal, and long inputs are handled cleanly.
- Copy/download/print actions give visible feedback.
- Layout works on mobile and desktop.
- `npm run lint` and `npm run build` pass before release.
- No account, login, signup, OAuth, or backend setup is required.
- Uploaded files remain local.
- Favorite tools and default tool settings work locally in the browser.

## Release Smoke Tests

Completed 2026-05-27. All items below verified passing. Run again before each future publish.

### PDF Tools

- [x] Upload a multi-page PDF → merge, compress, and split actions each produce a downloadable result
- [x] "Smaller file" compression shows the orange raster-only warning banner
- [x] PDF worker loads without console errors (check Network tab for `pdf.worker` chunk)

### Image Resizer

- [x] Upload a JPG and a PNG → resize by pixel and by percentage, download both formats
- [x] Crop tool opens, selection drag works, output downloads correctly

### SQL Formatter

- [x] Paste a complex multi-table query → format, minify, copy each work without errors
- [x] Syntax highlighting renders on the output panel

### Markdown Previewer

- [x] Paste markdown with code fences, tables, and links → preview renders correctly
- [x] Export to HTML and copy both work

### SVG Optimizer

- [x] Upload an SVG → optimized output downloads and is valid SVG
- [x] SVGO options panel opens and changes affect output size

### File tools (general)

- [x] All file-upload tools show an appropriate error state for wrong file types
- [x] No tool stores uploaded file content in `localStorage` (verify in DevTools → Application)
- [x] All file-import tools support drag-and-drop (Hash Generator, Image tools, PDF tools, Base64, CSV, JSON, HTTP curl import, Invoice logo)

## Project Shape

- `src/App.jsx`: main app layout, dashboard, active tool routing, tool URLs, and What's New button.
- `src/version.js`: current version string and release date.
- `src/components/`: shared UI components including `WhatsNewModal.jsx`.
- `src/data/tools.js`: tool metadata, roadmap metadata, and component module metadata.
- `src/data/toolRegistry.jsx`: lazy component loading and icon registry derived from tool metadata.
- `src/data/changelog.js`: phase-by-phase changelog data for the What's New modal.
- `src/hooks/`: browser-local UI state hooks.
- `src/tools/`: individual browser-only tools.
