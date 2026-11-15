# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are self-directed language and vocabulary learners who need high-efficiency spaced repetition (SuperMemo SM-2 algorithm), rapid bulk data import/sync from spreadsheet files (Excel / Google Sheets), and clear retention tracking via the Ebbinghaus forgetting curve.

## Product Purpose

Anki Memory Cast provides a fast, zero-friction, distraction-free flashcard study experience. It exists to eliminate complex setup overhead, manual card-creation bottlenecks, and cloud dependency for vocabulary mastery, delivering instant recall feedback and measurable long-term retention. Success is defined by fast daily review completion (<5 minutes per session) with high long-term retention rates (>85%).

## Positioning

A minimalist, high-speed flashcard web app engineered for zero-latency review sessions, featuring immediate tactile keyboard shortcuts (Space to flip, 1-4 to grade), zero-friction browser Text-to-Speech (TTS), and a resilient, hyphen-collision-proof bulk import parser, delivered as a portable standalone web client that runs with zero backend dependencies.

## Operating Context

- **Workflow:** Daily review sessions scheduled by SM-2 spaced repetition; periodic bulk importing of vocabulary decks from Excel (`.xlsx`) or spreadsheet copies (`\t`, ` - `, colons); quick card inspection and inline edits during study.
- **Environment:** Runs directly in any modern desktop or mobile browser via local file (`file://`) or lightweight static web server (`http://localhost:3000`).
- **Data Persistence:** Browser `localStorage` for offline state preservation, paired with SheetJS-powered round-trip export/import for complete data ownership.

## Capabilities and Constraints

- **Single-File Architecture:** Full application capability packaged into `index.html` with Tailwind CSS, Chart.js, and SheetJS loaded via CDN.
- **SM-2 Algorithm Implementation:** Full spaced repetition logic calculating interval days, repetition count, and ease factor adjustments based on 4-point review responses: Again (0), Hard (3), Good (4), Easy (5).
- **Fast Keyboard & Audio Controls:** Direct keyboard shortcuts (Space bar for 3D flip; keys 1, 2, 3, 4 for response grading); native Web Speech API Text-to-Speech synthesis with pronunciation speed controls.
- **Smart Delimiter Parsing:** Multi-priority bulk parser supporting tabs (`\t`), space-padded hyphens (` - ` protecting hyphenated compounds like `state-of-the-art`), colons (`:`), and pipes (`|`).
- **Ebbinghaus Decay Visualization:** Real-time Chart.js mathematical decay curve $R = e^{-t/S}$ dynamically comparing baseline forgetting against spaced review interventions.
- **Technical Constraint:** Zero server-side database requirement; user data is retained locally in browser storage and exported as `.xlsx` / `.csv`.

## Brand Commitments

- **Product Name:** Anki Memory Cast
- **Visual Identity:** Purple-forward gradient theme (`#7C65FF` to `#5B42F3`) with soft lavender canvas (`#F4F3FB`), crisp white card containers, and accent orange highlights (`#FF8A48`).
- **Layout Signature:** 3-screen mobile device panorama showcase on wide viewports, transitioning to focused viewports on smaller screens.

## Evidence on Hand

- Production web application: `C:\Study\index.html`
- Static node server: `C:\Study\server.js`
- Modular scripts: `C:\Study\js\app.js`, `C:\Study\js\sm2.js`, `C:\Study\js\ebbinghaus.js`, `C:\Study\js\storage.js`
- Styling tokens: `C:\Study\css\style.css`
- Documentation: `C:\Study\README.md`

## Product Principles

1. **Zero Latency, Tactile Feedback:** Study interactions must never lag; flipping cards, triggering audio, and grading responses must occur instantaneously via keyboard or touch.
2. **Data Sovereignty & Portability:** The user owns 100% of their learning data—no accounts, no cloud lock-in, effortless export and import via open spreadsheet formats.
3. **Scientific Spaced Repetition:** Strict adherence to algorithmic interval calculation (SM-2 + Ebbinghaus retention models) to minimize wasted review time while guaranteeing retention.
4. **Resilient Ingestion:** Import tools must anticipate messy user text, protecting hyphenated phrases, colons, and varying spreadsheet copy formats.

## Accessibility & Inclusion

- Keyboard navigability for the entire study loop without requiring mouse interaction.
- High contrast typography adhering to WCAG standards across purple and white card surfaces.
- Integrated Web Speech API audio for pronunciation and auditory reinforcement.
