# High-Quality Image & Diagram Question Generation Strategy for CBT

**Challenge:** Standard JAMB UTME exams rely heavily on visual diagrams for key subjects:
- **Physics:** Circuit diagrams, velocity-time graphs, ray optics/lenses, pulleys, vector forces.
- **Mathematics:** Geometry figures, circle theorems, trigonometry triangles, histogram graphs.
- **Chemistry:** Organic structural formulas, laboratory setups, energy profile diagrams.
- **Biology:** Cell structures, food webs, skeletal diagrams, organ systems.

---

## 2 Winning Approaches for Diagram & Image Questions

---

### Approach 1: Vector SVG Diagram Generation (100% Crisp, Scalable, Zero-Cost CDN) ⭐ *Best Practice*

Instead of generating raster PNG images (which blur on retina displays and cost image hosting bandwidth), high-fidelity CBT platforms instruct LLMs like **NVIDIA Nemotron 550B** or **DeepSeek V4** to output **raw vector SVG markup** inside the question JSON payload.

#### How It Works:
The LLM generates JSON containing an `svg_diagram` field. Your frontend component renders the raw SVG string directly inside the question card!

#### Example Output Payload from NVIDIA:
```json
{
  "subject": "physics",
  "topic": "Electricity & Circuits",
  "question_text": "In the circuit diagram shown below, calculate the effective resistance between points X and Y.",
  "svg_diagram": "<svg viewBox='0 0 300 150' xmlns='http://www.w3.org/2000/svg'><rect x='20' y='20' width='260' height='110' fill='none' stroke='#4D6BFF' stroke-width='2'/><circle cx='20' cy='75' r='5' fill='#4D6BFF'/><text x='5' y='80' fill='#fff' font-size='12'>X</text><circle cx='280' cy='75' r='5' fill='#4D6BFF'/><text x='288' y='80' fill='#fff' font-size='12'>Y</text><rect x='110' y='10' width='80' height='20' fill='#1E293B' stroke='#64748B'/><text x='130' y='25' fill='#38BDF8' font-size='11'>4 Ω</text><rect x='110' y='120' width='80' height='20' fill='#1E293B' stroke='#64748B'/><text x='130' y='135' fill='#38BDF8' font-size='11'>6 Ω</text></svg>",
  "options": [
    { "id": "A", "text": "2.4 Ω" },
    { "id": "B", "text": "10.0 Ω" },
    { "id": "C", "text": "5.0 Ω" },
    { "id": "D", "text": "1.2 Ω" }
  ],
  "correct_option": "A",
  "explanation": "Resistors are in parallel: 1/R = 1/4 + 1/6 = 5/12 => R = 12/5 = 2.4 Ω."
}
```

#### NVIDIA Credit Yield for SVG Diagrams:
- **Batch size:** 15–20 SVG diagram questions per request (due to SVG text size).
- **Yield across 1,000 credits:** **15,000 to 20,000 Vector Diagram Questions!**

---

### Approach 2: Multimodal Ingestion (Digitizing Scanned Paper Diagrams)

If you have scanned past question papers containing diagrams (such as biological figures or geography maps):

1. Pass the scanned page image URL to **`moonshotai/kimi-k3`** on NVIDIA NIM.
2. The vision model analyzes the diagram, extracts the question text, describes the visual features, and outputs structured JSON.

#### NVIDIA Credit Yield for Vision OCR:
- **Batch size:** 5–8 diagram questions extracted per page per credit.
- **Yield across 1,000 credits:** **5,000 to 8,000 Digitized Past Paper Diagram Questions**.

---

## 3. Implementation in Frontend Question Components

In `frontend/src/components/QuestionCard.tsx` or `QuestionBankPage.tsx`, render the diagram conditionally:

```tsx
{question.svg_diagram && (
  <div 
    className="my-3 flex justify-center p-4 bg-bg-secondary/40 border border-border rounded-xl"
    dangerouslySetInnerHTML={{ __html: question.svg_diagram }}
  />
)}
```

This guarantees 100% crisp, responsive, interactive diagrams across all mobile phones, tablets, and desktop computers with zero image hosting latency!
