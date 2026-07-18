import React, { useEffect, useRef, useState } from 'react';
import { generateQuestionDiagram } from '../features/ai/api';
import { BookOpen } from 'lucide-react';
import Latex from 'react-latex-next';

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

  return <div ref={containerRef} className="flex justify-center items-center overflow-auto max-w-full" />;
};

const addLatexDelimiters = (text: string): string => {
  if (!text) return text;
  // If the text already contains properly delimited math, return as-is
  if (/[$\\(start\\[]/.test(text.replace('\\(','(start'))) return text;
  // Wrap bare LaTeX commands in $ delimiters
  return text.replace(
    /(\\(?:frac|sqrt|sum|int|lim|infty|alpha|beta|gamma|delta|theta|pi|sigma|omega|cdot|times|div|pm|mp|leq|geq|neq|approx|equiv|in|notin|cup|cap|forall|exists|partial|nabla|sin|cos|tan|log|ln|exp|binom|text|mathrm|mathbf|mathbb|hat|vec|bar|overline|left|right|begin|end)(?:\{[^}]*\}|\[[^\]]*\]|[^\s\\{])*(?:[\^_](?:\{[^}]*\}|[^\s]))*)+/g,
    (match) => `$${match}$`
  );
};

export const SmartTextRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = splitTikz(text);
  return (
    <>
      {parts.map((part, index) => {
        if (isTikz(part)) {
          return (
            <div key={index} className="my-4 flex justify-center border border-border bg-bg-secondary/40 rounded-xl p-4 overflow-auto max-w-lg">
              <TikzRenderer code={part} />
            </div>
          );
        }
        return <Latex key={index}>{addLatexDelimiters(part)}</Latex>;
      })}
    </>
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
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalCount,
  selectedOption,
  onSelectOption,
  showFeedback = false,
  correctOption,
}) => {
  const isEditable = !!onSelectOption;

  const [diagramSvg, setDiagramSvg] = useState<string | null | undefined>(question.diagram_svg);
  const [isLoadingDiagram, setIsLoadingDiagram] = useState(false);

  useEffect(() => {
    setDiagramSvg(question.diagram_svg);
    
    if (question.has_diagram && !question.diagram_svg) {
      setIsLoadingDiagram(true);
      generateQuestionDiagram(question.questionId)
        .then((res) => {
          setDiagramSvg(res.svg);
        })
        .catch((err) => {
          console.error('Failed to generate diagram:', err);
        })
        .finally(() => {
          setIsLoadingDiagram(false);
        });
    }
  }, [question.questionId, question.has_diagram, question.diagram_svg]);

  return (
    <div className="flex-1 flex flex-col justify-between space-y-6 w-full">
      <div className="space-y-6">
        {/* Header: Question Number & Difficulty */}
        <div className="flex justify-between items-center text-xs text-text-secondary">
          <span className="font-bold text-primary uppercase tracking-wider">
            Question {index + 1} {totalCount ? `of ${totalCount}` : ''}
          </span>
          {question.difficulty_level !== undefined && (
            <span className="px-2.5 py-1 rounded-lg bg-bg-secondary border border-border text-[10px] font-semibold">
              Difficulty {question.difficulty_level}/5
            </span>
          )}
        </div>

        {/* Question Stem text */}
        <div className="text-base sm:text-lg leading-relaxed text-text-primary font-medium overflow-x-auto">
          <SmartTextRenderer text={question.question_text} />
        </div>

        {/* Diagrams SVG */}
        {isLoadingDiagram && (
          <div className="border border-border bg-bg-secondary/40 rounded-xl p-8 flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-xs text-text-secondary font-medium animate-pulse">AI Tutor is generating diagram...</p>
          </div>
        )}
        {!isLoadingDiagram && diagramSvg && (
          <div className="border border-border bg-bg-secondary/40 rounded-xl p-4 flex justify-center overflow-auto max-w-lg">
            {isTikz(diagramSvg) ? (
              <TikzRenderer code={diagramSvg} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
            )}
          </div>
        )}

        {/* Multiple choice options */}
        <div className="grid gap-3 mt-6 sm:grid-cols-2">
          {question.options.map((option) => {
            const isOptionSelected = selectedOption === option.id;
            const isCorrect = showFeedback && (correctOption || question.correct_option) === option.id;
            const isWrongSelection = showFeedback && isOptionSelected && !isCorrect;

            let cardStyle = 'border-border bg-bg-secondary/20 text-text-secondary hover:border-border-hover hover:bg-bg-secondary/45';
            let circleStyle = 'border-border bg-bg-primary text-text-secondary group-hover:border-border-hover group-hover:text-text-primary';

            if (showFeedback) {
              if (isCorrect) {
                cardStyle = 'border-success bg-success/10 text-text-primary';
                circleStyle = 'bg-success text-text-on-accent border-success';
              } else if (isWrongSelection) {
                cardStyle = 'border-error bg-error/10 text-text-primary';
                circleStyle = 'bg-error text-text-on-accent border-error';
              }
            } else if (isOptionSelected) {
              cardStyle = 'border-primary bg-primary/10 text-text-primary';
              circleStyle = 'bg-primary text-text-on-accent border-primary shadow-md';
            }

            if (isEditable) {
              return (
                <button
                  key={option.id}
                  onClick={() => onSelectOption(option.id)}
                  className={`w-full text-left rounded-xl border p-4 text-sm transition-all flex gap-4 items-center group relative overflow-hidden active:scale-[0.98] ${cardStyle}`}
                >
                  <span
                    className={`h-7 w-7 rounded-lg border font-bold text-xs flex items-center justify-center transition-all ${circleStyle}`}
                  >
                    {option.id}
                  </span>
                  <span className="flex-1 leading-normal font-medium overflow-x-auto">
                    <SmartTextRenderer text={option.text} />
                  </span>
                </button>
              );
            } else {
              return (
                <div
                  key={option.id}
                  className={`rounded-xl border p-4 text-sm flex gap-4 items-center ${cardStyle}`}
                >
                  <span
                    className={`h-7 w-7 rounded-lg border font-bold text-xs flex items-center justify-center ${circleStyle}`}
                  >
                    {option.id}
                  </span>
                  <span className="flex-1 leading-normal font-medium overflow-x-auto">
                    <SmartTextRenderer text={option.text} />
                  </span>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Explanation Solution */}
      {!isEditable && question.explanation && (
        <div className="mt-6 pt-6 border-t border-border space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
            <BookOpen className="h-4 w-4" /> Solution Explanation:
          </div>
          <div className="text-xs text-text-secondary leading-relaxed bg-bg-secondary/40 rounded-xl border border-border p-4 overflow-x-auto">
            <SmartTextRenderer text={question.explanation} />
          </div>
        </div>
      )}
    </div>
  );
};
