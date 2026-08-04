import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, X, Trophy } from 'lucide-react';

interface QuizModalProps {
  title: string;
  questions: QuizQuestion[];
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ title, questions, onClose }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-emerald-200/80 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-5 border-b border-emerald-200/80 dark:border-zinc-800 flex items-center justify-between bg-emerald-100/50 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black font-black shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-emerald-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-emerald-50/20 dark:bg-zinc-900">
          {isSubmitted && (
            <div className="bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-300">Quiz Completed!</h3>
                  <p className="text-xs text-emerald-900 dark:text-emerald-400 font-semibold">
                    You scored <span className="font-extrabold">{calculateScore()}</span> out of {questions.length} (
                    {Math.round((calculateScore() / questions.length) * 100)}%)
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </button>
            </div>
          )}

          {questions.map((q, qIdx) => {
            const userSelected = selectedAnswers[qIdx];
            const isCorrect = userSelected === q.correctIndex;

            return (
              <div key={q.id || qIdx} className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-emerald-200/80 dark:border-zinc-800 space-y-3 shadow-2xs">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-start gap-2">
                  <span className="text-xs font-mono font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0">
                    Q{qIdx + 1}
                  </span>
                  <span>{q.question}</span>
                </h3>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isOptionSelected = userSelected === optIdx;
                    let optionStyle = 'bg-emerald-50/40 dark:bg-zinc-900 border-emerald-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-emerald-500 dark:hover:border-emerald-400';

                    if (isSubmitted) {
                      if (optIdx === q.correctIndex) {
                        optionStyle = 'bg-emerald-100/90 dark:bg-emerald-950 border-emerald-500 dark:border-emerald-400 text-emerald-950 dark:text-emerald-200 font-bold';
                      } else if (isOptionSelected && !isCorrect) {
                        optionStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-950 dark:text-rose-300 font-medium';
                      } else {
                        optionStyle = 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600 opacity-60';
                      }
                    } else if (isOptionSelected) {
                      optionStyle = 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-600 dark:border-emerald-400 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs';
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          {opt}
                        </span>

                        {isSubmitted && optIdx === q.correctIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {isSubmitted && isOptionSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && q.explanation && (
                  <div className="text-[11px] bg-emerald-50/50 dark:bg-zinc-900 p-3 rounded-xl border border-emerald-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 italic">
                    <span className="font-bold text-emerald-900 dark:text-emerald-400 not-italic">Explanation:</span> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-emerald-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {Object.keys(selectedAnswers).length} of {questions.length} answered
          </span>

          {!isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(true)}
              disabled={Object.keys(selectedAnswers).length < questions.length}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black disabled:opacity-50 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              Submit Answers
            </button>
          ) : (
            <button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
