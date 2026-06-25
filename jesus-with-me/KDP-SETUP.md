# KDP Interior Setup — *Jesus With Me*

Everything you need to turn these files into a print-ready paperback interior
for Amazon KDP. Hand this page (and `jesus-with-me-KDP.md`) to whoever lays out
the book, or follow it yourself in Word / Google Docs / Atticus / Vellum.

---

## 1. Recommended specs (safe, standard choices)

| Setting | Value | Why |
|---|---|---|
| **Trim size** | **6" × 9"** | The most common KDP size; works great for an illustrated chapter book and keeps printing cheap. *(Alt: 8" × 10" if you want bigger pictures — costs a bit more.)* |
| **Interior** | **Black & white** | One picture per chapter in B&W keeps the print price low. Choose "Standard" paper. *(Premium color only if you go full-color art.)* |
| **Page count** | ~70–90 pages | 13 chapters + front/back matter + chapter-opening art. KDP paperback minimum is 24 pages — we're well over. |
| **Bleed** | **No bleed** if pictures sit inside the margins; **Bleed** if any art runs to the page edge | Decide once with your illustrator. Most chapter-opening pictures sit *inside* the text area → No bleed is simplest. |
| **File format to upload** | **PDF** (print-ready) | Export from your layout tool as PDF. KDP also accepts DOCX, but PDF gives you control. |

## 2. Margins & gutter (the part KDP rejects if you get it wrong)

For a book of ~70–90 pages at 6×9, **no bleed**:

- **Inside (gutter) margin:** 0.5"  *(extra room so text isn't swallowed by the spine)*
- **Outside / top / bottom margins:** 0.5" each (0.375" is the KDP minimum — 0.5" looks nicer)
- Turn ON **"Mirror margins"** (Word) / facing pages, so the gutter alternates left/right.

If you choose **bleed**, add 0.125" past the trim on the three outer edges and size the document to 6.125" × 9.25".

## 3. Fonts & type (easy on a 9-year-old's eyes)

- **Body font:** a friendly serif at **13–14 pt**, line spacing **1.3–1.5**. Good picks: *Georgia, Bookerly, Crimson, Charter.*
- **Chapter titles:** a playful display font (the "diary" feel). Good picks: *Patrick Hand, Caveat, Schoolbell* — or whatever matches the cover.
- **Embed all fonts** in the PDF (KDP requires this).
- Generous paragraph spacing. Short paragraphs. Lots of white space. Don't cram.

## 4. Layout rules to follow

1. **Each chapter starts on a new page** — already marked with `\newpage` in `jesus-with-me-KDP.md`. (If using Word: insert a Page Break, not a bunch of Enters.)
2. **Chapter-opening picture** goes at the top of each chapter, above the title or just under it. Look for the `🎨 Chapter picture:` note in each file — that's the brief for the artist.
3. The **prayer** (`💛`) and **verse** (`📖`) at the end of each chapter can be set in a tinted box or italics so they stand apart from the story.
4. **Images:** save at **300 DPI**, grayscale, sized to fit inside the text margins. Black-and-white line art (like the diary doodles) prints beautifully and cheaply.
5. Front matter order is already set in `front-matter.md`: title page → copyright → dedication → "this book belongs to."

## 5. Image checklist for the illustrator

- 13 chapter-opening pictures (one per chapter) — briefs are in each chapter file.
- 1 "This is me!" picture frame (front matter).
- 2–4 blank picture-frame pages for the back ("Your Turn").
- Style: simple, warm, kid-drawn / diary feel. Black-and-white line art unless you commit to full color.
- **Cover idea:** Chapter 7's scene — Ava on the yellow rail at the baseball field at golden hour, gold sneakers, heart shirt. *(Cover is a separate KDP upload with its own spec — use KDP's Cover Calculator once the final page count is known.)*

## 6. Step-by-step (the short version)

1. Open `jesus-with-me-KDP.md` (or paste it into Word / Google Docs).
2. Set page size to **6 × 9** and margins per section 2 above.
3. Apply body + title fonts (section 3). Embed fonts.
4. Drop in each chapter picture where the `🎨` note is.
5. Make sure every chapter begins on a fresh page.
6. Export as **PDF**.
7. In KDP: create a new **Paperback**, enter title/author, choose 6×9, B&W, upload the PDF interior, then design/upload the cover.
8. Use KDP's **Previewer** to catch margin/gutter problems before you publish.

> Note: Markdown (`.md`) is the *source*. KDP doesn't read Markdown directly —
> you'll paste/convert into a layout tool and export a **PDF**. The `\newpage`
> markers become page breaks; the `🎨 / 💛 / 📖` lines are notes for you and the
> artist, not text to keep in the final book (delete the labels, keep the prayer
> and verse text).
