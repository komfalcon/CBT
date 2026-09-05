import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, CircleAlert, Flag, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { generateQuestionDiagram } from '../features/ai/api';

const isTikz = (text: string): boolean => {
  if (!text) return false;
  return /\\begin\s*{(?:tikzpicture|circuitikz)}/i.test(text) || /\\tikz\b/i.test(text);
};

const splitTikz = (text: string): string[] => {
  const regex = /(\\begin\s*{(?:tikzpicture|circuitikz)}[\s\S]*?\\end\s*{(?:tikzpicture|circuitikz)})/g;
  return text.split(regex);
};

export const TikzRenderer: React.FC<{ code: string }> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/tikz';
    let cleanCode = code.trim();
    if (!cleanCode.includes('\\begin{tikzpicture}') && !cleanCode.includes('\\begin{circuitikz}')) {
      cleanCode = `\\begin{tikzpicture}\n${cleanCode}\n\\end{tikzpicture}`;
    }
    script.textContent = cleanCode;
    containerRef.current.appendChild(script);
  }, [code]);

  return <div ref={containerRef} className="flex max-w-full items-center justify-center overflow-auto" />;
};

const addLatexDelimiters = (text: string): string => {
  if (!text) return text;
  if (/\$|\\\(|\\\[/.test(text)) return text;

  let result = text.replace(
    /\\begin\s*\{([^}]+)\}[\s\S]*?\\end\s*\{\1\}/g,
    (match) => `$$${match}$$`,
  );

  result = result.replace(
    /(\$\$[\s\S]*?\$\$)|(?<!\$)(\\(?:frac|sqrt|sum|int|lim|infty|alpha|beta|gamma|delta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|cdot|times|div|pm|mp|leq|geq|neq|approx|equiv|in|notin|cup|cap|forall|exists|partial|nabla|sin|cos|tan|cot|sec|csc|log|ln|exp|det|max|min|binom|hat|vec|bar|dot|ddot|tilde|overline|underline|overbrace|underbrace|left|right|mathbf|mathbb|mathrm|text|bold|it)(?:\{[^}]*\}|\[[^\]]*\])*(?:[_^](?:\{[^}]*\}|[^\s{]))*)/g,
    (match, doubleBlock) => doubleBlock ?? `$${match}$`,
  );

  return result;
};

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="exam-markdown-paragraph">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-text-primary">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="text-primary">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="exam-markdown-list list-disc">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="exam-markdown-list list-decimal">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="exam-markdown-quote">{children}</blockquote>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-primary">{children}</code>,
};

export const SmartTextRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <div className="exam-markdown">
      {splitTikz(text).map((part, index) => (
        isTikz(part) ? (
          <div key={index} className="my-4 flex max-w-full justify-center overflow-auto rounded-2xl border border-border bg-bg-secondary/40 p-4">
            <TikzRenderer code={part} />
          </div>
        ) : (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {addLatexDelimiters(part)}
          </ReactMarkdown>
        )
      ))}
    </div>
  );
};

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionData {
  questionId: string;
  question_text: string;
  has_diagram?: boolean;
  diagram_svg?: string | null;
  difficulty_level?: number;
  options: QuestionOption[];
  correct_option?: string | null;
  explanation?: string | null;
}

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  totalCount?: number;
  selectedOption?: string;
  onSelectOption?: (optionId: string) => void;
  showFeedback?: boolean;
  correctOption?: string;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalCount,
  selectedOption,
  onSelectOption,
  showFeedback = false,
  correctOption,
  isFlagged = false,
  onToggleFlag,
}) => {
  const isEditable = !!onSelectOption;
  const [diagramSvg, setDiagramSvg] = useState<string | null | undefined>(question.diagram_svg);
  const [isLoadingDiagram, setIsLoadingDiagram] = useState(false);

  useEffect(() => {
    setDiagramSvg(question.diagram_svg);
    if (question.has_diagram && !question.diagram_svg) {
      setIsLoadingDiagram(true);
      generateQuestionDiagram(question.questionId)
        .then((res) => setDiagramSvg(res.svg))
        .catch((err) => console.error('Failed to generate diagram:', err))
        .finally(() => setIsLoadingDiagram(false));
    }
  }, [question.questionId, question.has_diagram, question.diagram_svg]);

  return (
    <article className="exam-question-card">
      <div className="exam-question-header flex items-start justify-between gap-5 border-b border-border/70 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.17em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_4px_rgba(91,114,255,0.12)]" />
              Question {String(index + 1).padStart(2, '0')}
            </span>
            {totalCount && <span className="text-xs font-semibold text-text-muted">of {totalCount}</span>}
            {question.difficulty_level !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1.5 text-xs font-bold text-amber-500">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Level {question.difficulty_level}
              </span>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-text-muted">Read carefully, then select one answer.</p>
        </div>
        {onToggleFlag && (
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={isFlagged}
            className={`inline-flex min-h-11 md:min-h-0 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isFlagged ? 'border-amber-400/45 bg-amber-400/15 text-amber-500' : 'border-border bg-bg-secondary/55 text-text-secondary hover:border-amber-400/35 hover:text-amber-500'}`}
          >
            <Flag className="h-3.5 w-3.5" fill={isFlagged ? 'currentColor' : 'none'} aria-hidden="true" />
            {isFlagged ? 'Flagged' : 'Flag for review'}
          </button>
        )}
      </div>

      <div className="mt-7 max-w-3xl text-[clamp(1.15rem,1.75vw,1.55rem)] font-semibold leading-[1.6] tracking-[-0.018em] text-text-primary">
        <SmartTextRenderer text={question.question_text} />
      </div>

      {isLoadingDiagram && (
        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-text-secondary">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          Preparing the supporting diagram…
        </div>
      )}
      {!isLoadingDiagram && diagramSvg && (
        <div className="mt-7 flex max-w-3xl justify-center overflow-auto rounded-2xl border border-border bg-bg-secondary/45 p-5">
          {isTikz(diagramSvg) ? <TikzRenderer code={diagramSvg} /> : <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />}
        </div>
      )}

      <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Answer options">
        {question.options.map((option) => {
          const isOptionSelected = selectedOption === option.id;
          const isCorrect = showFeedback && (correctOption || question.correct_option) === option.id;
          const isWrongSelection = showFeedback && isOptionSelected && !isCorrect;
          const stateClass = isCorrect
            ? 'border-success/70 bg-success/10 text-text-primary shadow-[0_10px_28px_rgba(52,211,153,0.12)]'
            : isWrongSelection
              ? 'border-error/70 bg-error/10 text-text-primary shadow-[0_10px_28px_rgba(251,113,133,0.12)]'
              : isOptionSelected
                ? 'border-primary bg-primary/10 text-text-primary shadow-[0_12px_30px_rgba(91,114,255,0.18)] ring-1 ring-primary/20'
                : 'border-border bg-bg-secondary/35 text-text-secondary hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/5 hover:text-text-primary hover:shadow-[0_10px_24px_rgba(91,114,255,0.1)]';
          const badgeClass = isCorrect
            ? 'border-success bg-success text-text-on-accent'
            : isWrongSelection
              ? 'border-error bg-error text-text-on-accent'
              : isOptionSelected
                ? 'border-primary bg-primary text-text-on-accent shadow-[0_0_0_5px_rgba(91,114,255,0.14)]'
                : 'border-border bg-bg-primary text-text-secondary group-hover:border-primary/60 group-hover:text-primary';

          const content = (
            <>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition-[background-color,border-color,box-shadow,color,transform] duration-200 ${badgeClass}`}>
                {isCorrect ? <Check className="h-4 w-4" strokeWidth={3} /> : isWrongSelection ? <CircleAlert className="h-4 w-4" /> : option.id}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold leading-7"><SmartTextRenderer text={option.text} /></span>
            </>
          );

          return isEditable ? (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isOptionSelected}
              onClick={() => onSelectOption(option.id)}
              className={`group relative flex min-h-[78px] w-full items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary active:scale-[0.985] ${stateClass}`}
            >
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-60" />
              {content}
            </button>
          ) : (
            <div key={option.id} className={`flex min-h-[78px] items-center gap-4 rounded-2xl border p-4 ${stateClass}`}>{content}</div>
          );
        })}
      </div>

      <div className="exam-question-rhythm mt-auto grid max-w-3xl grid-cols-[auto_1fr] items-start gap-3 rounded-2xl border border-dashed border-border bg-bg-secondary/25 px-4 py-4 text-xs text-text-muted">
        <BookOpen className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
        <p><span className="font-bold text-text-secondary">Exam rhythm:</span> Use the navigator to jump between questions. Flag anything you want to revisit before submitting.</p>
      </div>

      {!isEditable && question.explanation && (
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <BookOpen className="h-4 w-4" aria-hidden="true" /> Solution explanation
          </div>
          <div className="mt-3 rounded-2xl border border-border bg-bg-secondary/35 p-5 text-sm leading-7 text-text-secondary">
            <SmartTextRenderer text={question.explanation} />
          </div>
        </div>
      )}
    </article>
  );
};
