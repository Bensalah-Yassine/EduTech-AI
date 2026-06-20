'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  Coins, 
  Layers, 
  RefreshCw, 
  Check, 
  X, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { subjects, subjectsColors } from '@/constants';

interface Flashcard {
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const [subject, setSubject] = useState('science');
  const [topic, setTopic] = useState('Foundations of Cell Biology');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [studyDone, setStudyDone] = useState(false);
  const [credits, setCredits] = useState(85);

  // Sync credits
  useEffect(() => {
    const storedCredits = localStorage.getItem('et_credits');
    if (storedCredits) setCredits(Number(storedCredits));
  }, []);

  const generateFlashcards = async () => {
    if (!topic.trim() || loading) return;

    if (credits <= 0) {
      alert("You have run out of AI Credits! Please refill them on your Dashboard. 🪙");
      return;
    }

    setLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);
    setKnownCount(0);
    setStudyDone(false);

    // Deduct credits
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem('et_credits', String(nextCredits));

    // Update stats mindmapsCreated/quizzesTaken
    try {
      const storedStats = localStorage.getItem('et_stats');
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        parsed.completedLessons = (parsed.completedLessons || 0) + 1;
        localStorage.setItem('et_stats', JSON.stringify(parsed));
      }
    } catch(e){}

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flashcards',
          topic
        })
      });

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        setCards(resData.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error(error);
      // Fallback cards
      setCards([
        { front: "What is the primary function of Mitochondria?", back: "To produce energy in the form of ATP through cellular respiration." },
        { front: "Define Cell Theory.", back: "Theory stating all living organisms are composed of cells, cells are the basic unit of life, and cells arise from pre-existing cells." },
        { front: "What is the role of ribosomes?", back: "Ribosomes are responsible for protein synthesis by translating messenger RNA (mRNA) into polypeptide chains." },
        { front: "Explain Active Transport.", back: "Movement of substances across membrane against concentration gradient, requiring energy (ATP)." },
        { front: "What is Osmosis?", back: "The passive diffusion of water molecules across a semi-permeable membrane from low solute to high solute concentration." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKnown = (known: boolean) => {
    if (known) setKnownCount(prev => prev + 1);
    setIsFlipped(false);
    
    // Give time to flip back
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setStudyDone(true);
      }
    }, 200);
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setKnownCount(0);
    setStudyDone(false);
    setIsFlipped(false);
  };

  const currentSubjectColor = subjectsColors[subject as keyof typeof subjectsColors] || '#BDE7FF';

  return (
    <main className="max-w-[900px] mx-auto px-4 md:px-0 py-6 flex flex-col gap-6">
      {/* Back button & Credits */}
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
            <Layers className="text-primary" /> AI Flashcard Studio
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Instantly generate interactive flashcard decks on any academic topic.
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <section className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Target Subject</label>
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

        <div className="flex-[2] flex flex-col gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Enter Study Concept / Topic</label>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Periodic Table, Quadratic Formula, World War 1..."
            className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button 
          onClick={generateFlashcards}
          disabled={loading || !topic.trim()}
          className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5 shadow-md shadow-primary/20 text-sm h-10 shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Generate Deck
            </>
          )}
        </button>
      </section>

      {/* Deck Review Workspace */}
      <section className="flex flex-col gap-6 items-center">
        {loading ? (
          <div className="w-full h-80 rounded-3xl glass-panel flex flex-col items-center justify-center text-center p-8">
            <RefreshCw size={40} className="text-primary animate-spin mb-4" />
            <h4 className="font-bold text-base">Compiling Study Deck</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Gemini is structuring flashcards for "{topic}". This will take a brief moment.
            </p>
          </div>
        ) : cards.length > 0 && !studyDone ? (
          <div className="w-full flex flex-col gap-6 items-center">
            {/* Progress counter */}
            <div className="w-full max-w-[480px] flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>CARD {currentIndex + 1} OF {cards.length}</span>
              <span>Known: {knownCount}</span>
            </div>

            {/* Flip Card Container */}
            <div 
              className="w-full max-w-[480px] h-72 cursor-pointer relative"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: '1000px' }}
            >
              {/* Inner rotatable card */}
              <div 
                className="w-full h-full rounded-3xl border border-border/80 shadow-lg text-center relative transition-transform duration-500 ease-in-out"
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  backgroundColor: currentSubjectColor
                }}
              >
                {/* Front Side */}
                <div 
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 rounded-3xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary/70 mb-3 block">Question / Prompt</span>
                  <p className="text-xl font-bold text-slate-800 leading-snug">{cards[currentIndex]?.front}</p>
                  <span className="text-[10px] text-muted-foreground/80 mt-6 block absolute bottom-6">Click card to reveal answer</span>
                </div>

                {/* Back Side */}
                <div 
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900 text-white border border-white/10"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 mb-3 block">Answer / Definition</span>
                  <p className="text-base font-medium leading-relaxed max-h-[160px] overflow-y-auto pr-1 text-slate-200">
                    {cards[currentIndex]?.back}
                  </p>
                  <span className="text-[10px] text-slate-400/80 mt-6 block absolute bottom-6">Click card to see question</span>
                </div>
              </div>
            </div>

            {/* Answer verification buttons */}
            <div className="flex items-center gap-4 mt-2">
              <button 
                onClick={() => handleKnown(false)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-95 transition-all text-xs font-bold"
              >
                <X size={14} /> Review Again
              </button>
              <button 
                onClick={() => handleKnown(true)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20 active:scale-95 transition-all text-xs font-bold"
              >
                <Check size={14} /> Got It!
              </button>
            </div>
          </div>
        ) : studyDone ? (
          /* Finished summary card */
          <div className="w-full max-w-[480px] rounded-3xl glass-panel p-8 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-center justify-center mb-1">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-foreground">Deck Completed! 🎉</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Excellent job. You finished reviewing the deck on **{topic}**. 
              You mastered **{knownCount} out of {cards.length}** concepts.
            </p>
            
            <div className="w-full bg-white/20 dark:bg-slate-900/10 border border-border/40 p-4 rounded-2xl flex justify-around my-2">
              <div>
                <span className="text-2xl font-bold block">{knownCount}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Mastered</span>
              </div>
              <div className="border-r border-border/40" />
              <div>
                <span className="text-2xl font-bold block">{cards.length - knownCount}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Needs Review</span>
              </div>
            </div>

            <button 
              onClick={resetDeck}
              className="w-full mt-2 bg-primary hover:bg-primary/95 text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} /> Restart Practice Session
            </button>
          </div>
        ) : (
          /* Empty placeholder */
          <div className="w-full h-72 rounded-3xl glass-panel flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <HelpCircle size={40} className="mb-3" />
            <h4 className="font-bold text-base text-foreground">No Deck Active</h4>
            <p className="text-xs max-w-xs mt-1">
              Enter a study topic above and trigger generation to build your custom flashcards.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
