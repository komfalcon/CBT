import React, { useState } from 'react';
import { explainQuestion, reportExplanation } from './api';
import { Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { addLatexDelimiters } from '../../components/QuestionCard';

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
  const [canReport, setCanReport] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  const handleExplain = async () => {
    if (explanation) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await explainQuestion({ questionId, questionText, correctAnswer, studentAnswer });
      setExplanation(res.explanation);
      setCanReport(Boolean(res.reportable));
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Falke AI Explanations require an active Plus, Pro, or Max plan.');
      } else {
        setError(err.response?.data?.message || 'Failed to generate explanation. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsReporting(true);
    setReportMessage(null);
    try {
      const result = await reportExplanation(questionId, reportReason.trim() || undefined);
      setReportMessage(result.reported ? 'Thank you. Your report was recorded for review.' : 'This explanation has already been reported from your account.');
      setReportOpen(false);
    } catch (err: any) {
      setReportMessage(err.response?.data?.message || 'Could not submit your report. Please try again later.');
    } finally {
      setIsReporting(false);
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
          Explain with Falke AI
        </button>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ai-flag">
          <Loader2 className="w-4 h-4 animate-spin" />
          Falke AI is thinking...
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
            Falke AI Explanation
          </div>
          <div className="prose dark:prose-invert prose-sm max-w-none text-text-primary overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[[remarkMath, { singleDollarTextMath: true }]]}
              rehypePlugins={[rehypeKatex]}
            >
              {addLatexDelimiters(explanation)}
            </ReactMarkdown>
          </div>
          {canReport && <div className="mt-3 border-t border-border pt-3">
            {!reportOpen && !reportMessage && (
              <button type="button" onClick={() => setReportOpen(true)} className="text-xs text-text-secondary hover:text-text-primary underline underline-offset-2">
                Report an issue with this explanation
              </button>
            )}
            {reportOpen && (
              <form onSubmit={handleReport} className="space-y-2">
                <label htmlFor={`explanation-report-${questionId}`} className="block text-xs text-text-secondary">Optional reason (max 500 characters)</label>
                <textarea
                  id={`explanation-report-${questionId}`}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-md border border-border bg-bg-primary p-2 text-sm text-text-primary"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={isReporting} className="rounded-md bg-ai-flag px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                    {isReporting ? 'Sending…' : 'Send report'}
                  </button>
                  <button type="button" onClick={() => setReportOpen(false)} className="px-3 py-1.5 text-xs text-text-secondary">Cancel</button>
                </div>
              </form>
            )}
            {reportMessage && <p role="status" className="text-xs text-text-secondary">{reportMessage}</p>}
          </div>}
        </div>
      )}
    </div>
  );
};
