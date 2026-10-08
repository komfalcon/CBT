"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeExplanationField = normalizeExplanationField;
exports.hashQuestionContent = hashQuestionContent;
exports.buildStandardExplanationMessages = buildStandardExplanationMessages;
exports.validateExplanationOutput = validateExplanationOutput;
exports.singleFlight = singleFlight;
const crypto_1 = require("crypto");
function normalizeExplanationField(value) {
    return String(value ?? '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\t \f\v]+/g, ' ')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
}
function hashQuestionContent(question) {
    const options = Array.isArray(question.options) ? question.options : [];
    const media = Array.isArray(question.media) ? question.media : [];
    const canonical = {
        question: normalizeExplanationField(question.question_text),
        options: options.map((option) => ({
            id: normalizeExplanationField(option.id),
            text: normalizeExplanationField(option.text),
            image: normalizeExplanationField(option.image_url),
        })),
        correctOption: normalizeExplanationField(question.correct_option),
        media: media
            .map((item) => ({ type: normalizeExplanationField(item.type), url: normalizeExplanationField(item.url) }))
            .sort((a, b) => `${a.type}:${a.url}`.localeCompare(`${b.type}:${b.url}`)),
        hasDiagram: Boolean(question.has_diagram),
        diagram: normalizeExplanationField(question.diagram_svg),
        latex: normalizeExplanationField(question.latex),
    };
    return (0, crypto_1.createHash)('sha256').update(JSON.stringify(canonical), 'utf8').digest('hex');
}
function buildStandardExplanationMessages(question) {
    const options = (question.options ?? [])
        .map((option) => `${option.id}. ${option.text}${option.image_url ? ` (image: ${option.image_url})` : ''}`)
        .join('\n');
    const correctOption = question.options?.find((option) => option.id === question.correct_option);
    const mediaRefs = [
        ...(question.media ?? []).map((item) => `${item.type ?? 'media'}: ${item.url ?? ''}`),
        question.diagram_svg ? `diagram SVG: ${question.diagram_svg}` : '',
        question.latex ? `math/LaTeX: ${question.latex}` : '',
    ].filter(Boolean).join('\n');
    return [
        {
            role: 'system',
            content: [
                'You are an expert Nigerian secondary and post-secondary exam tutor for JAMB, WAEC, NECO, and JUPEB.',
                'Write one neutral, concise explanation intended to be reused for every student. Do not refer to a learner, their selection, identity, school, score, or past answers.',
                'Use the supplied answer key as authoritative; do not silently replace it. If the question or answer key is ambiguous or appears inconsistent, state the uncertainty and the assumption rather than inventing facts.',
                'Return exactly these three Markdown sections: `### Correct answer` (state the option and why it is correct), `### Why the other options are wrong` (one concise line for every other option), and `### Key takeaway` (one memorable line).',
                'Keep the answer accurate, syllabus-aligned, and under 350 words. Preserve necessary mathematical notation.',
            ].join('\n'),
        },
        {
            role: 'user',
            content: [
                `Subject: ${normalizeExplanationField(question.subject) || 'Not specified'}`,
                `Question: ${normalizeExplanationField(question.question_text)}`,
                `Options:\n${options}`,
                `Correct option: ${normalizeExplanationField(question.correct_option)}${correctOption ? ` (${correctOption.text})` : ''}`,
                mediaRefs ? `Image/diagram/math references:\n${mediaRefs}` : '',
            ].filter(Boolean).join('\n\n'),
        },
    ];
}
const REQUIRED_SECTIONS = [
    /###\s+Correct answer\b/i,
    /###\s+Why the other options are wrong\b/i,
    /###\s+Key takeaway\b/i,
];
const REFUSAL_OR_ERROR = /(?:i(?:'m| am) unable to (?:help|answer|provide)|i cannot (?:help|answer|provide)|as an ai language model|upstream (?:error|failure)|internal server error|quota exceeded|rate limit exceeded|api key (?:is )?invalid)/i;
function validateExplanationOutput(value) {
    if (typeof value !== 'string' || value.trim().length < 60)
        return { valid: false, reason: 'empty_or_too_short' };
    const text = value.trim();
    if (text.length > 12_000)
        return { valid: false, reason: 'too_long' };
    if (text.split(/\s+/).filter(Boolean).length > 350)
        return { valid: false, reason: 'too_many_words' };
    if (REFUSAL_OR_ERROR.test(text))
        return { valid: false, reason: 'provider_refusal_or_error' };
    if (!REQUIRED_SECTIONS.every((pattern) => pattern.test(text)))
        return { valid: false, reason: 'missing_required_section' };
    return { valid: true };
}
function singleFlight(inFlight, key, work) {
    const existing = inFlight.get(key);
    if (existing)
        return existing;
    const pending = work();
    inFlight.set(key, pending);
    void pending.finally(() => {
        if (inFlight.get(key) === pending)
            inFlight.delete(key);
    }).catch(() => undefined);
    return pending;
}
//# sourceMappingURL=explanation-cache.utils.js.map