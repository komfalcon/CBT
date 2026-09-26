# PDF Multi-Question & Diagram Page Scanning Strategy

## 1. Multi-Question & Diagram Page Processing

**Yes, absolutely!** Scanned past question paper pages contain both **multiple questions** (5 to 10 per page) and **printed diagrams/figures** (such as electric circuits, velocity graphs, biology organ diagrams, or geometry triangles).

Our multimodal vision pipeline (`moonshotai/kimi-k3` on NVIDIA Vision) handles printed diagrams on scanned pages in two complementary ways:

### How Printed Diagrams on Scanned Pages Are Processed:

```
[ Scanned PDF Page with Printed Diagrams & Multiple Questions ]
                                │
                                ▼
         ┌─────────────────────────────────────────────┐
         │ NVIDIA Multimodal Vision (`kimi-k3`)        │
         └─────────────────────────────────────────────┘
                                │
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
【Method A: Vector SVG Reconstruction】     【Method B: Automated Crop Box】
AI inspects the printed diagram           AI outputs precise pixel coordinates
(e.g., circuit, ray optics, triangle)     `[ymin, xmin, ymax, xmax]` to crop the 
and generates crisp, clean vector         printed diagram snippet into a PNG 
`<svg>...</svg>` code in `svg_diagram`.   file for image hosting.
```

1. **Vector SVG Conversion (Method A):** For circuits, graphs, geometric shapes, and chemical structures, `moonshotai/kimi-k3` turns the printed diagram image into clean, resolution-independent SVG vector code (`svg_diagram`).
2. **Automated Diagram Cropping (Method B):** For complex realistic illustrations (e.g. human anatomy or maps), Python crops the diagram region directly from the page image based on AI-detected coordinates and saves it to `/uploads/diagrams/`.

---

## 2. Quota Allocation Across 1,000 NVIDIA Credits

| Category | Database `question_source_type` | Target Quota | Method / Engine |
|:---|:---|:---|:---|
| **Category A: New Standard Text** | `new_text` | **10,000 Questions** | Bulk JSON Prompts on `nvidia/nemotron-3-ultra-550b-a55b` |
| **Category B: New Vector Diagrams** | `new_svg_diagram` | **5,000 Questions** | Embedded Vector SVG JSON Prompts on `nemotron-550b` |
| **Category C: Scanned Past Papers & Diagrams** | `scanned_past_paper` | **~5,000–8,000 Questions** | Multimodal OCR on `moonshotai/kimi-k3` (5-10 Qs + diagrams per page) |

---

## 3. The Exam Interleaving & Randomization Algorithm

To ensure candidates receive a **fresh, varied mix** of modern AI questions and past paper questions without getting repetitive blocks of old papers, the exam backend uses an **Interleaving Delivery Algorithm**.

### Database Field:
In PostgreSQL/LibSQL `questions` schema:
`question_source_type`: `'new_text'` | `'new_svg_diagram'` | `'scanned_past_paper'`

### Delivery Logic (For a 40-Question Exam Session):
1. **Quota Fetching:** For a 40-question test, fetch:
   - 20 questions of type `new_text` (50%)
   - 10 questions of type `new_svg_diagram` (25%)
   - 10 questions of type `scanned_past_paper` (25%)
2. **Pattern Randomization & Alternating Sequence:**
   The delivery engine rotates the starting pattern for every exam session:
   - **Session 1 Sequence:** `Scanned Past Paper` $\rightarrow$ `New Vector Diagram` $\rightarrow$ `New Text` $\rightarrow$ `Scanned Past Paper` ...
   - **Session 2 Sequence:** `New Vector Diagram` $\rightarrow$ `New Text` $\rightarrow$ `Scanned Past Paper` $\rightarrow$ `New Vector Diagram` ...
   - **Session 3 Sequence:** `New Text` $\rightarrow$ `Scanned Past Paper` $\rightarrow$ `New Vector Diagram` $\rightarrow$ ...

This guarantees that **no two questions of the same source type appear back-to-back**, preventing student fatigue and maintaining high engagement!
