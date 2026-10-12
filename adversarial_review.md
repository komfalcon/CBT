# Adversarial Review: Aurikrex CBT Analytics & Dedup Architecture

Reviewed against the live codebase. Every claim below is anchored in what the code actually does today, not what it aspires to do.

---

## 1. WORDING DEDUP VS. CONCEPT DEDUP

**Verdict: Real flaw. Critical.**

### What the code actually does

The entire duplicate protection system is in [questions.service.ts](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/questions/questions.service.ts#L47-L116). It operates exclusively on **surface-level text tokenization**:

```typescript
// Line 47-54: The tokenizer
export function tokenizeQuestionText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}
```

This strips punctuation, lowercases, splits on whitespace. The TF-IDF vectors ([lines 64-95](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/questions/questions.service.ts#L64-L95)) are computed over this bag-of-words. Cosine similarity ([lines 97-116](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/questions/questions.service.ts#L97-L116)) compares these vectors. The threshold is:
- **≥ 0.95**: Blocked
- **≥ 0.85**: Warning

### Why this is a real flaw

Consider the History subtopic `"Nok, Ife and Benin Art Cultures"`. The sample data shows 436+ questions mapped to one subtopic. Your own observation says those trace to ~38 unique stems.

Two questions:
- *"Which pre-colonial civilization is known for bronze plaques depicting royal courts?"*
- *"The wall plaques showing warriors and kings are associated with which empire?"*

These share minimal TF-IDF overlap. Different vocabulary, different syntax. Cosine similarity: low. The dedup system would rate them as **completely distinct questions** and allow both. But they test the **exact same fact**: Benin Empire → bronze/ivory plaques.

The dedup system answers: *"Are these two strings similar?"*
It does not answer: *"Do these two strings test the same knowledge?"*

### What distinguishes "working as intended" from "elegantly disguising a shallow subtopic"

There is **no observable difference from the system's perspective**. Both cases produce the same metrics: high wording diversity, low similarity scores, no blocked duplicates. The system would report a "healthy" question bank with 436 unique questions, when in reality it has 38 facts wearing 11+ outfits each.

The only way to detect this externally:
1. **Student-side signal**: A student who has taken 4-5 mock exams starts scoring consistently higher on that subtopic — not because they studied, but because they've pattern-recognized the ~38 underlying facts through sheer repetition of differently-worded questions probing them.
2. **Content audit**: A human reviewer reads all 436 questions in the subtopic and manually clusters them by tested fact, producing a concept-to-question ratio. If that ratio is > 10:1, the subtopic is shallow regardless of wording diversity.

### What breaks first

A diligent student who takes 8-10 mock exams will unconsciously memorize the answer patterns for shallow subtopics. Their "improvement" on that subtopic isn't learning — it's exposure saturation. The analytics layer will report it as a strength. The LLM will narrate it as mastery. This is **systematically incorrect** and the student will be unprepared for the actual JAMB, which may phrase the same concept in a way they haven't been exposed to — or test an adjacent concept the bank doesn't cover at all.

---

## 2. STATISTICAL SIGNIFICANCE PER SITTING

**Verdict: Real flaw. Will produce misleading outputs immediately.**

### What the code actually does

The exam session creation in [exam.service.ts](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/exam/exam.service.ts#L18-L87) shows:

- **Mock exam**: 4 subjects. English gets 60 questions, the other 3 get 40 each. Total: 180 questions.
- **Drill**: Single subject, 10/20/40 questions.
- **Question selection**: `$sample` — pure random from the published pool within a subject. No topic/subtopic stratification whatsoever ([lines 43-48](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/exam/exam.service.ts#L43-L48)).

```typescript
const subQuestions = await this.questionModel
  .aggregate<Question>([
    { $match: { subject: sub, status: 'published' } },
    { $sample: { size: targetCount } },
  ])
  .exec();
```

### The math

For a non-English subject in a mock exam (40 questions), with the observed History bank structure of 4 topics and 10 subtopics:

- If topics are roughly equally represented in the bank, random sampling gives ~10 questions per topic.
- Per subtopic: **~4 questions per subtopic per sitting.**

4 questions is not a sample size. It's noise. Getting 1 out of 4 wrong (75%) versus 2 out of 4 wrong (50%) has a p-value that is statistically meaningless. The difference between "strong" and "weak" at n=4 is indistinguishable from coin-flip variance.

But it's worse than that: **`$sample` doesn't guarantee topic coverage at all.** With a skewed bank (which your data confirms — subtopics have wildly different question counts), some subtopics may get 0-1 questions in a given sitting, and others may get 8+. The system has no stratified sampling.

### What the analytics layer needs

The deterministic backend must enforce a **minimum cumulative sample floor** before reporting per-subtopic analytics. The minimum defensible threshold:

| Signal | Minimum N | Rationale |
|--------|-----------|-----------|
| Flag a subtopic as "weak" | ≥ 8 cumulative attempts across all sittings | At n=8, getting ≤ 3 correct (37.5%) is outside 1 SD of random chance at 50% baseline |
| Flag a subtopic as "trending down" | ≥ 3 sittings with ≥ 3 questions each on that subtopic | You cannot compute a trend with fewer than 3 data points |
| Declare "mastery" | ≥ 12 cumulative attempts, ≥ 80% correct | False-positive rate at n=12 is acceptably low |

### What breaks first

A student takes one mock exam. They happen to get 1 History subtopic question on "Trans-Atlantic Slave Trade." They get it wrong. The analytics engine (when built) flags this subtopic as a weakness. The LLM narrates: *"You struggled with the Trans-Atlantic Slave Trade. Focus on key abolitionists and the timeline of abolition."* This is irresponsible — it's a conclusion drawn from a sample of 1. The student may know the topic well and simply misread one question. The first support ticket will be a student (or parent) who disputes a "weakness" call that was based on 1-2 questions.

---

## 3. TAXONOMY DEPTH AT SCALE

**Verdict: Real flaw. Scaling questions without scaling taxonomy is zero-value for analytics.**

### What the data shows

From [history_questions.json](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/data/history_questions.json):
- `total: 7820` questions
- Observed structure: 4 topics, ~10 subtopics

From [mathematics_questions.json](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/data/mathematics_questions.json):
- `total: 633` questions
- Topics observed: "Calculus", "Number and Algebra", "Geometry and Trigonometry"
- Subtopics: "Differentiation", "Quadratic Equations", "Coordinate Geometry"

The question schema in [question.schema.ts](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/questions/schemas/question.schema.ts#L79-L82) has:
```typescript
@Prop({ required: true })
topic!: string;

@Prop()
subtopic?: string;  // Optional!
```

`subtopic` is **optional**. There is no validation that it exists, no enforcement of a controlled vocabulary, and no deeper level (sub-subtopic, concept, skill).

### The mechanism question

Going from 2,180 → 10,000 History questions with the same 10 subtopics means each subtopic goes from ~218 → ~1,000 questions. This does:

| What it does | What it does NOT do |
|---|---|
| Gives the dedup system more wording variants to compare against | Add any new testable concepts |
| Makes random sampling less likely to repeat exact questions | Make the analytics recommendation any more specific |
| Increases the raw denominator for per-subtopic statistics | Distinguish between sub-skills within a subtopic |

**The recommendation cannot be more specific than the taxonomy allows.** "You're weak at Pre-colonial Nigeria → Nok, Ife and Benin Art Cultures" is the maximum resolution. Whether there are 218 or 1,000 questions in that bucket, the recommendation is identical. The student gets the same level of guidance.

### What would actually improve granularity

The taxonomy itself must deepen. For History, "Nok, Ife and Benin Art Cultures" could split into:
- Nok terracotta characteristics and dating
- Ife bronze-casting techniques
- Benin royal court structure and art
- Comparative artistic traditions

For Math, "Differentiation" could split into:
- Product rule
- Chain rule
- Implicit differentiation
- Applications of derivatives

Without this, scaling the question count is spending effort to make the dedup system work harder while the analytics layer gains nothing.

### What breaks first

The first teacher or institutional customer who compares the analytics output to their own curriculum breakdown will immediately notice that the platform's "topic-level insights" are coarser than what they already have in their lesson plan. The feature fails to add value over what a teacher already knows by looking at the chapter structure of any JAMB textbook.

---

## 4. CROSS-SUBJECT CONSISTENCY

**Verdict: Real flaw. The architecture is subject-agnostic; the problem domain is not.**

### Evidence from the codebase

The question schema treats `topic` and `subtopic` as free-text strings:
```typescript
@Prop({ required: true })
topic!: string;  // No enum, no controlled vocabulary
```

The dedup runs on `subject`-scoped queries ([line 157](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/questions/questions.service.ts#L155-L157)):
```typescript
const filter: FilterQuery<QuestionDocument> = {
  subject: params.subject,
  status: { $in: duplicateStatuses },
};
```

The exam sampling is also subject-scoped but not topic-aware. The analytics (currently an empty service — [analytics.service.ts](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/analytics/analytics.service.ts) is 5 lines, zero implementation) will presumably follow the same subject→topic→subtopic hierarchy.

### Where it diverges across subjects

| Subject | Bank size | Natural taxonomy depth | Concept overlap risk |
|---------|-----------|----------------------|---------------------|
| History (7,820 Qs) | Large | Shallow. Historical events are discrete facts. ~38 unique stems per subtopic. | **High** — many wordings of the same fact |
| Mathematics (633 Qs) | Small | Deep. Each subtopic contains genuinely distinct sub-skills (product rule ≠ chain rule). | **Low** — different math problems are different problems |
| Physics (1.8MB) | Medium | Deep. Mechanics, Electromagnetism, Optics each contain many distinct problem types. | **Low to Medium** |
| Government (10MB) | Very large | Shallow to Medium. Constitutional provisions are discrete facts, but political theory has more depth. | **High** |

The TF-IDF dedup works *better* for Mathematics because different math problems genuinely use different tokens (different equations, different numbers). It works *worst* for History and Government where the same historical fact gets restated in many natural-language forms.

Meanwhile, the analytics granularity problem is *inverted*: Mathematics has a naturally deep taxonomy that a coarse topic/subtopic structure fails to capture; History has a shallow taxonomy that the same structure covers adequately but with massive redundancy per bucket.

### What breaks first

The feature ships. A Mathematics student gets told "You're weak at Calculus → Differentiation." But they can do product rule perfectly and only struggle with chain rule. The recommendation is too coarse. Meanwhile, a History student gets told "You're weak at Pre-colonial Nigeria → Nok, Ife and Benin Art Cultures" — a recommendation that's appropriately granular for the subject but was computed from a statistically noisy n=4 sample from a bank where 436 questions test 38 facts.

**One design cannot serve both cases without per-subject configuration of taxonomy depth, sampling strategy, and minimum-N thresholds.**

---

## 5. ACTIONABILITY WITHOUT A DESTINATION

**Verdict: Real flaw, but not a technical one. It's a product flaw.**

### What the architecture produces

The confirmed flow is: deterministic analytics → structured result → LLM narration. The output is prose like: *"You consistently struggled with Trans-Atlantic Slave Trade questions. Focus on key abolitionists, the timeline of the abolition movement, and the economic arguments for and against the trade."*

### What the student can do with this

Nothing concrete. The platform does not have:
- A content library or study materials linked to subtopics
- A "practice this subtopic" drill mode that targets specific subtopics (the drill mode in [exam.service.ts](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/exam/exam.service.ts#L52-L73) is subject-level only, not subtopic-level)
- Links to external resources (textbook chapters, video lessons)
- A spaced-repetition queue for weak-area remediation

The drill mode confirms this gap explicitly:
```typescript
} else {
  // Drill
  if (!subject) {
    throw new BadRequestException('Subject is required for individual drills.');
  }
  // ...samples from entire subject, NOT from specific subtopics
  const subQuestions = await this.questionModel
    .aggregate<Question>([
      { $match: { subject, status: 'published' } },
      { $sample: { size: finalCount } },
    ])
    .exec();
}
```

There is no `topic` or `subtopic` filter in the drill flow. A student told to "focus on Trans-Atlantic Slave Trade" cannot start a drill that targets that subtopic.

### How this differs from a generic "study more" message

It barely does. The LLM narration adds specificity in phrasing (naming the subtopic, suggesting focus areas), but the actionable next step is identical: the student closes the app and opens a textbook. The platform captures the intent to help but provides no mechanism to execute on it.

### What breaks first

This doesn't "break" in a technical sense. It fails as a product. Students receive specific-sounding advice with no path to act on it within the product. The second time a student sees *"Focus on Nok, Ife and Benin Art Cultures"* with no way to actually do that inside the app, the analytics feature becomes decoration. Engagement with the feature drops. It becomes the tab nobody clicks.

### Minimum fix

Add a `subtopic` filter to the drill creation flow. This requires a one-line change to the `$match` stage plus a new parameter in `createSession`. This turns the analytics output from a diagnosis without a prescription into a diagnosis with a "practice now" button.

---

## 6. LONGITUDINAL DATA SENSITIVITY

**Verdict: Real flaw. Legal exposure.**

### What the code stores

The [User schema](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/users/schemas/user.schema.ts) stores:
- `userId` (permanent UUID)
- `fullName`, `email`, `phone`
- `jamb_reg_no` (Nigerian exam registration number — uniquely identifies a real student in the national system)
- `state`, `lga`, `school`
- `device_fingerprints` (behavioral tracking)
- `last_login_ip`

The [ExamResult schema](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/results/schemas/result.schema.ts) stores:
- Every answer to every question, per session, forever
- Full question snapshots embedded in results
- Linked to `userId`

There is:
- **No TTL or retention policy** on any collection
- **No data deletion endpoint** anywhere in the codebase
- **No consent/age-verification flow** in the auth module
- **No privacy policy reference** in any user-facing schema or endpoint

### NDPR/NDPA obligations

The Nigeria Data Protection Regulation (2019) and the Nigeria Data Protection Act (2023) require:

1. **Lawful basis for processing** (Article 25, NDPA 2023): Processing minors' data requires parental/guardian consent. JAMB candidates are typically 16-19 years old. Many are minors.
2. **Data minimization**: You're storing `device_fingerprints` and `last_login_ip` — neither of which is necessary for the stated purpose of delivering mock exams.
3. **Right to deletion** (Article 37, NDPA 2023): Data subjects have the right to request deletion. There is no deletion endpoint. Not just "no UI" — no API, no service method, nothing.
4. **Data Protection Impact Assessment**: Required for large-scale processing of minors' data. The longitudinal academic profile is exactly this.
5. **Retention limitation**: Data must not be kept longer than necessary. The system has no retention policy. Results accumulate forever.

### What breaks first

This isn't a "might break" scenario. The NDPA is actively enforced by the Nigeria Data Protection Commission (NDPC). A single complaint from a parent, a competitor, or a disgruntled user to the NDPC triggers an investigation. The investigation will find:
- Minors' data processed without verifiable parental consent
- No DPIA filed
- No data retention policy
- No deletion mechanism
- IP addresses and device fingerprints stored without justification

The fine under NDPA 2023 is up to 2% of annual gross revenue or ₦10 million, whichever is greater.

---

## Failure Mode Ranking: What Surfaces First in Production

| Rank | Failure Mode | Time to Surface | Minimum Viable Fix |
|------|-------------|----------------|-------------------|
| **1** | **#2 — Statistical noise in per-subtopic reporting** | **Day 1.** First mock exam completed → analytics reports "weaknesses" from n=1-4 samples. | Add a minimum-N floor to the deterministic analytics layer. Suppress per-subtopic reporting until cumulative attempts ≥ 8. Display "Not enough data yet" instead. |
| **2** | **#5 — Actionability gap** | **Day 1.** First student reads analytics output, has nothing to click or do inside the app. | Add `topic`/`subtopic` optional filters to `createSession` drill mode. One additional `$match` condition in [exam.service.ts line 63](file:///c:/Users/Korede%20Omotosho/Desktop/CBT/backend/src/exam/exam.service.ts#L63). |
| **3** | **#6 — NDPR/NDPA compliance** | **Pre-launch** if you do legal review. **Within months post-launch** if you don't, via complaint or audit. | Implement a `DELETE /users/:userId/data` endpoint that cascades to results. Add age-gate/consent checkbox at registration. Add a retention TTL (e.g., 24 months post last activity) to the results collection. File a DPIA. |
| **4** | **#1 — Wording dedup masking concept shallowness** | **After 5-8 mock exams** per student. Students pattern-recognize shallow subtopics; analytics misreads this as mastery. | Add a `concept_id` or `stem_id` field to the question schema. Enforce that exam sampling draws at most 1 question per concept per subtopic per sitting. Requires new field + stratified sampling pipeline replacing `$sample`. |
| **5** | **#4 — Cross-subject inconsistency** | **When 2nd/3rd subject goes live** and teachers compare analytics quality across subjects. | Per-subject configuration: define minimum taxonomy depth requirements per subject. Math needs sub-subtopic granularity. History needs higher minimum-N thresholds due to concept shallowness. |
| **6** | **#3 — Taxonomy depth stagnation** | **Months after 10k scale.** Slow realization that quantity didn't buy quality in recommendations. | Content operations problem, not code. Taxonomy must be deepened as deliberate content strategy, with tooling to reclassify existing questions into finer-grained subtopics. |
