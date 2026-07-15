import React, { useState } from 'react';
import { explainQuestion } from './api';
import { Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ExplainButtonProps {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
}

export const ExplainButton: React.FC<ExplainButtonProps> = ({ questionId, questionText, correctAnswer, studentAnswer }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    if (explanation) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await explainQuestion({ questionId, questionText, correctAnswer, studentAnswer });
      setExplanation(res.explanation);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('AI Explanations require an active Plus, Pro, or Max plan.');
      } else {
        setError('Failed to generate explanation. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!explanation && !isLoading && !error && (
        <button
          onClick={handleExplain}
          className="flex items-center gap-2 text-sm font-medium text-ai-flag hover:text-ai-flag-hover transition-colors bg-ai-flag/10 hover:bg-ai-flag/20 px-3 py-1.5 rounded-lg border border-ai-flag/20"
        >
          <Sparkles className="w-4 h-4" />
          Explain with AI
        </button>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ai-flag">
          <Loader2 className="w-4 h-4 animate-spin" />
          AI is thinking...
        </div>
      )}

      {error && (
        <div className="text-sm text-error bg-error/10 p-3 rounded-lg border border-error/20 flex justify-between items-start">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error hover:text-error/80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {explanation && (
        <div className="bg-bg-secondary/80 border border-border p-4 rounded-xl relative animate-in fade-in slide-in-from-top-2">
          <button 
            onClick={() => setExplanation(null)} 
            className="absolute top-2 right-2 p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2 text-ai-flag font-medium text-sm">
            <Sparkles className="w-4 h-4" />
            AI Explanation
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
