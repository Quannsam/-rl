# Anki Memory Cast • Single-File Production Web App

A production-ready, single-file Anki-style Flashcard and Ebbinghaus Forgetting Curve web application built in **`index.html`** using **Tailwind CSS CDN**, **Chart.js CDN**, and **SheetJS (`xlsx.full.min.js`) CDN**.

---

## 🚀 Key Features

### 1. Visual Aesthetics & 3-Screen Mobile Layout
- **Primary Purple Gradient:** `linear-gradient(135deg, #7C65FF 0%, #5B42F3 100%)`
- **Soft Lavender Surface:** `#F4F3FB`
- **Inner Card Surface:** `#FFFFFF` with soft diffused drop shadows (`0 12px 32px rgba(91, 66, 243, 0.12)`)
- **Accent Orange:** `#FF8A48`
- **Ultra-Rounded Containers:** Mobile frame shells (`border-radius: 28px`), content cards (`border-radius: 24px`), action pills (`border-radius: 9999px`)
- **Showcase & Responsive Modes:** Simultaneous 3-screen panorama on desktop + individual screen focus switches for mobile viewports.

---

### 2. Screen Architecture

#### Screen 1: Home / Hub (Left Phone)
* **Top Purple Hero Card:**
  * Title: **"Anki Memory Cast"** | Subtitle: **"Spaced repetition & recall"**.
  * Top-right **`"?"` (Hướng Dẫn)** button opening the comprehensive guide modal.
  * Translucent frosted-glass summary card showing **Today's Due Cards** count with a **"Start Due Review"** button.
* **Bottom Sheet (Two Large White Horizontal Action Cards):**
  1. **Purple Icon Card ("Start Due Review"):** Reviews cards scheduled by SM-2 today.
  2. **Orange Icon Card ("Excel & Data Sync Hub"):** Opens SheetJS XLSX & CSV import/export hub.
* **Footer Ebbinghaus Analytics Link:** Displays current retention percentage.

#### Screen 2: Deck, Bulk Add & Active Study (Middle Phone)
* **Search Bar:** Real-time search across vocabulary words and definitions.
* **Dual Input Mode Toggle:**
  * **Tab 1: Single Add:** Front & Back inputs, phonetic guide, example sentence, and "+ Add Card" button.
  * **Tab 2: Bulk Add (Nhập hàng loạt):** Textarea allowing paste of 50–100 lines at once, with live detected card counter and sample template buttons.
* **Smart Bulk Add Parser (Hyphen-Collision Proof):**
  * **Priority 1 (Tab `\t`):** Allows copy-pasting 2 columns directly from Excel or Google Sheets.
  * **Priority 2 (Space-Hyphen-Space ` - `):** Protects hyphenated words like `state-of-the-art`, `mother-in-law`, `cutting-edge`, `user-friendly`, and `matter-of-fact` from ever being split.
  * **Priority 3 (Colons & Pipes ` : `, `::`, ` | `):** Splits dictionary notations safely.
* **Category Counters:** **"Due Now"** vs **"Total Words"** toggle tiles.
* **Interactive Flashcard Study Box:**
  * 3D perspective flip card (click or press `Space` to flip).
  * **Front:** Part-of-speech badge, word, phonetic guide, text-to-speech pronunciation button.
  * **Back:** Definition, example sentence, SM-2 stats (Interval, Repetitions, Ease Factor).
  * **Edit & Delete Action Icons:** In-place edit modal to modify cards, and trash icon to remove cards.
  * **SM-2 Grading Buttons:** `Again (<10m)`, `Hard (1d)`, `Good (3d)`, `Easy (6d)`. Keyboard shortcuts: `1`, `2`, `3`, `4`.

#### Screen 3: Ebbinghaus Analytics (Right Phone)
* **Top Purple Hero Card:**
  * **Chart.js Interactive Line Graph:** Renders exponential decay $R = e^{-t/S}$ over 0–30 days comparing spaced SM-2 reviews against baseline forgetting curves.
* **Middle Counter Box:**
  * **Purple Flip-Digit Counters:** `[0][1][2] days [0][4] hours` with horizontal crease divider lines and total mastered cards counter.
* **Bottom Progress Bars:**
  * Minimal horizontal purple progress bars for vocabulary stability tiers:
    1. **Mature Cards (>21d):** e.g. `150 words | 92% retention`
    2. **Young Cards (1–21d):** e.g. `68 words | 78% retention`
    3. **Learning Queue (<1d):** e.g. `27 words | 45% retention`

---

### 3. Excel & Data Sync Hub (SheetJS Integration)
* **Export to Excel (`.xlsx`):** Generates `.xlsx` spreadsheet with SM-2 history.
* **Export to CSV:** Direct CSV download.
* **Import from Excel / CSV:** Drag & drop or file picker reading spreadsheets with SheetJS, auto-detecting column headers (`Front/Back`, `Word/Meaning`, `Từ/Nghĩa`).
* **Download Sample Template:** Generates ready-to-fill 2-column Excel template.

---

### 4. Running the App
Open `c:\Study\index.html` directly in any web browser (`file:///c:/Study/index.html`) or serve with `node server.js`.
