# Jesus With Me
### *My Diary About the Best Friend I Never Have to Say Goodbye To* — by Ava

A children's **chapter book** for ages 8–10, told in the funny, first-person
diary voice of a girl named **Ava** (just turning nine). It is **not** a Bible
retelling — it's *Ava's own story*: thirteen chapters about real times in her
life and how Jesus was with her in each one.

The tone is light and honest and a little bit goofy (think a faith-filled
*Diary of a Wimpy Kid*), but every chapter lands somewhere real. **One picture
opens each chapter** — Ava can draw them herself, which is half the charm.

Format target: **print-ready interior for Amazon KDP** (see `KDP-SETUP.md`).

---

## The 13 chapters

| # | Chapter | The heart of it |
|---|---------|-----------------|
| 1 | Learning With Jesus | Knowing him isn't homework — it's getting to know a person |
| 2 | Praying When I Felt Down | You don't need a reason to come to him |
| 3 | Praying to Beat My Brother at Chess | Jesus isn't a vending machine — he's *with* you, win or lose |
| 4 | Praying When I Was Scared | The dark can't hide anything from him |
| 5 | The Day I Was Mean | When you mess up, he comes *closer* |
| 6 | Praying for Something I REALLY Wanted | "No / not yet" can be love you can't see yet |
| 7 | Jesus at the Baseball Field | He made the good days too (cover scene) |
| 8 | …Help Me Not Strangle My Brother | Take the anger to him *before* you act |
| 9 | When I Felt Left Out | With him you're never outside the window |
| 10 | The Sick Week | He sits at the worst-day bedside *(nods to Dad's "Sick Seven")* |
| 11 | Praying for Somebody Else | A kid can carry someone to Jesus |
| 12 | How I Actually Talk to Him | Prayer is just talking |
| 13 | Now I Am Nine | He was in every chapter — and every one still to come |

**Ava's three picks** (chapters 1–3) lead the book; 4–13 are draft suggestions —
swap any of them for real moments from Ava's life and it'll only get better.

---

## What's in this folder

```
jesus-with-me/
├── front-matter.md        Title page, copyright, dedication, "this book belongs to"
├── chapters/              One file per chapter (01–13) — edit these with Ava
├── back-matter.md         Ava's closing note + "Your Turn" draw-your-own pages
├── jesus-with-me-KDP.md   ← assembled PRINT INTERIOR (front + chapters + back, with page breaks)
├── jesus-with-me-FULL.md  ← plain reading copy (same content)
├── KDP-SETUP.md           How to publish it on Amazon KDP (trim size, margins, fonts, steps)
├── build.sh               Rebuilds the two assembled files from the sources
└── README.md              This file
```

### After you edit any chapter, rebuild the assembled book:
```
bash build.sh
```

---

## How each chapter is built (keep new ones consistent)

1. A `🎨 Chapter picture:` brief at the top — the single illustration that opens the chapter.
2. A funny, honest diary-style story from a moment in Ava's life.
3. A gentle turn where she names where Jesus was in it.
4. **A little prayer** (`💛`) — one or two lines in Ava's voice.
5. **Jesus says** (`📖`) — a kid-friendly paraphrase of a real verse, with the reference to look up.

`\newpage` markers tell the layout tool where to break pages. The
`🎨 / 💛 / 📖` labels are notes — in the final book, delete the labels but keep
the prayer and verse text. See `KDP-SETUP.md` for the full publishing recipe.

## About Ava (for the illustrator)

A happy nine-year-old with long, wavy brown hair and a big smile — often in a
red/pink **heart shirt**, jeans, and shiny **gold sneakers**. A recurring
setting is a **baseball field at golden hour** with a long, round **yellow rail**
she likes to sit on, mountains in the distance (Chapter 7 — and the cover).
Jesus is best shown as a gentle *presence* — a warmth, a glow, a hand, a figure
just at the edge — rather than a literal face, so each child can picture him.
