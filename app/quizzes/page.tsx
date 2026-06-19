'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  Coins, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  BookOpen
} from 'lucide-react';
import { subjects, subjectsColors } from '@/constants';

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export default function QuizzesPage() {
  const [subject, setSubject] = useState('coding');
  const [topic, setTopic] = useState('JavaScript Loops & Closures');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(85);

  // Playback state
  const [currIndex, setCurrIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  // Sync credits
  useEffect(() => {
    const storedCredits = localStorage.getItem('et_credits');
    if (storedCredits) setCredits(Number(storedCredits));
  }, []);

  const generateQuiz = async () => {
    if (!topic.trim() || loading) return;

    if (credits <= 0) {
      alert("You have run out of AI Credits! Please refill them on your Dashboard. 🪙");
      return;
    }

    setLoading(true);
    setCurrIndex(0);
    setSelectedIdx(null);
    setQuizFinished(false);
    setScore(0);

    // Deduct credits
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem('et_credits', String(nextCredits));

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quiz',
          topic,
          difficulty
        })
      });

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        setQuestions(resData.data);
      } else {
        throw new Error('Invalid format');
      }
    } catch (error) {
      console.error(error);
      // Fallback questions
      setQuestions([
        {
          question: "Which keyword is used to declare a block-scoped variable in JavaScript?",
          options: ["var", "let", "declare", "assign"],
          answerIndex: 1,
          explanation: "The 'let' keyword (along with 'const') declares variables that are limited in scope to the block, statement, or expression on which it is used."
        },
        {
          question: "What is a closure in JavaScript?",
          options: [
            "A method to close web socket streams",
            "The combination of a function bundled together with references to its surrounding state",
            "A tool to minify source code",
            "A structural loop helper"
          ],
          answerIndex: 1,
          explanation: "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment)."
        },
        {
          question: "Which of the following is NOT a JavaScript loop type?",
          options: ["for...in", "while", "do...while", "loop...until"],
          answerIndex: 3,
          explanation: "'loop...until' is not a valid loop structure in JavaScript. The standard loops are for, for...in, for...of, while, and do...while."
        },
        {
          question: "What will a promise return if it resolves successfully?",
          options: ["An error catch", "A pending state", "A resolved value", "undefined"],
          answerIndex: 2,
          explanation: "A promise is returned in a fulfilled state, yielding the value passed to the resolve() handler."
        },
        {
          question: "What is the primary difference between double equals (==) and triple equals (===)?",
          options: [
            "Double equals performs type coercion; triple equals checks both type and value.",
            "Triple equals is older and deprecated.",
            "Double equals is twice as fast.",
            "Triple equals allows null pointers."
          ],
          answerIndex: 0,
          explanation: "== checks for value equality after coerced comparison, while === checks value and type equality without coercion."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (selectedIdx !== null) return; // already answered this question
    setSelectedIdx(idx);
    const correctIdx = questions[currIndex].answerIndex;
    if (idx === correctIdx) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedIdx(null);
    if (currIndex < questions.length - 1) {
      setCurrIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      // Update local storage stats
      try {
        const storedStats = localStorage.getItem('et_stats');
        if (storedStats) {
          const parsed = JSON.parse(storedStats);
          parsed.quizzesTaken = (parsed.quizzesTaken || 0) + 1;
          localStorage.setItem('et_stats', JSON.stringify(parsed));
        }
      } catch(e){}
    }
  };

  const currentSubjectColor = subjectsColors[subject as keyof typeof subjectsColors] || '#BDE7FF';

  return (
    <main className="max-w-[900px] mx-auto px-4 md:px-0 py-6 flex flex-col gap-6">
      {/* Back & Credits */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary font-bold text-xs px-3.5 py-1.5 rounded-full">
          <Coins size={14} />
          <span>Credits remaining: {credits}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-3xl p-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <HelpCircle className="text-primary" /> AI Quiz Arena
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Challenge yourself with custom multiple-choice quizzes designed by AI on any subject.
          </p>
        </div>
      </div>

      {/* Config parameters */}
      <section className="glass-panel rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub} className="bg-background text-foreground capitalize">{sub}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Difficulty</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="Easy" className="bg-background text-foreground">Easy</option>
            <option value="Medium" className="bg-background text-foreground">Medium</option>
            <option value="Hard" className="bg-background text-foreground">Hard</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2 flex-grow">
          <label className="text-xs font-bold text-muted-foreground uppercase">Enter Study Topic</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Chemical Equations, Calculus Integrals..."
              className="flex-grow bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button 
              onClick={generateQuiz}
              disabled={loading || !topic.trim()}
              className="bg-primary hover:bg-primary/95 text-white font-bold px-5 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center gap-1 text-xs shadow-md shadow-primary/20 h-9.5 shrink-0"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Generate Quiz
            </button>
          </div>
        </div>
      </section>

      {/* Quiz Workspace */}
      <section className="w-full flex justify-center">
        {loading ? (
          <div className="w-full max-w-[650px] h-80 rounded-3xl glass-panel flex flex-col items-center justify-center text-center p-8">
            <RefreshCw size={40} className="text-primary animate-spin mb-4" />
            <h4 className="font-bold text-base">Creating Quiz Arena</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Gemini is structuring a custom quiz on "{topic}". Hold tight!
            </p>
          </div>
        ) : questions.length > 0 && !quizFinished ? (
          <div className="w-full max-w-[650px] flex flex-col gap-6">
            {/* Progress counter */}
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>QUESTION {currIndex + 1} OF {questions.length}</span>
              <span>SCORE: {score}</span>
            </div>

            {/* Question card */}
            <div 
              className="rounded-3xl p-6 md:p-8 border border-border/80 shadow-md relative overflow-hidden flex flex-col gap-6"
              style={{ backgroundColor: currentSubjectColor }}
            >
              <h3 className="text-lg font-bold text-slate-800 leading-snug">
                {questions[currIndex]?.question}
              </h3>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 gap-3">
              {questions[currIndex]?.options.map((opt, idx) => {
                const isCorrect = idx === questions[currIndex].answerIndex;
                const isSelected = idx === selectedIdx;
                const answered = selectedIdx !== null;

                let optClass = 'bg-white/40 dark:bg-slate-900/30 border-border/80 text-foreground hover:bg-white/60 dark:hover:bg-slate-900/50';
                let icon = null;

                if (answered) {
                  if (isCorrect) {
                    optClass = 'bg-green-500/10 border-green-500/30 text-green-600 font-bold';
                    icon = <CheckCircle2 size={16} className="text-green-600 shrink-0" />;
                  } else if (isSelected) {
                    optClass = 'bg-red-500/10 border-red-500/30 text-red-600 font-bold';
                    icon = <XCircle size={16} className="text-red-600 shrink-0" />;
                  } else {
                    optClass = 'opacity-55 bg-white/20 dark:bg-slate-900/15 border-border/30 text-muted-foreground';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={answered}
                    className={`w-full p-4 rounded-2xl border text-left text-sm transition-all duration-200 flex items-center justify-between gap-4 font-medium 
                      ${optClass} ${!answered && 'hover:scale-[1.005] active:scale-[0.995]'}`}
                  >
                    <span>{opt}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Explanatory notes & Next CTA */}
            {selectedIdx !== null && (
              <div className="rounded-3xl p-5 border border-border/80 glass-panel flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <BookOpen size={14} className="text-primary" />
                  <span>EXPLANATORY ANALYSIS</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {questions[currIndex]?.explanation}
                </p>
                <button 
                  onClick={handleNext}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-1"
                >
                  {currIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz & View Score'}
                </button>
              </div>
            )}
          </div>
        ) : quizFinished ? (
          /* Score summary */
          <div className="w-full max-w-[500px] rounded-3xl glass-panel p-8 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-1 shadow-lg shadow-amber-500/5">
              <Trophy size={30} />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground">Quiz Finished! 🎉</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Challenge completed. You scored **{score} out of {questions.length}** on the topic of **{topic}**.
            </p>

            <div className="w-full bg-white/20 dark:bg-slate-900/10 border border-border/40 p-4 rounded-2xl flex justify-around my-2 items-center">
              <div>
                <span className="text-2xl font-bold block">{score}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Correct Answers</span>
              </div>
              <div className="border-r border-border/40 h-8" />
              <div>
                <span className="text-2xl font-bold block">
                  {Math.round((score / questions.length) * 100)}%
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">Accuracy</span>
              </div>
            </div>

            <button 
              onClick={generateQuiz}
              className="w-full mt-2 bg-primary hover:bg-primary/95 text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} /> Play Again
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="w-full max-w-[650px] h-72 rounded-3xl glass-panel flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <HelpCircle size={40} className="mb-3" />
            <h4 className="font-bold text-base text-foreground">No Quiz Loaded</h4>
            <p className="text-xs max-w-xs mt-1">
              Select variables and click Generate Quiz to test your parameters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
