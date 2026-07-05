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
          className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Explain with AI
        </button>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-indigo-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          AI is thinking...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20 flex justify-between items-start">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {explanation && (
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl relative animate-in fade-in slide-in-from-top-2">
          <button 
            onClick={() => setExplanation(null)} 
            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-medium text-sm">
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
