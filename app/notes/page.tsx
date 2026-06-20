'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  Coins, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  Check, 
  Brain,
  HelpCircle,
  Code
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [credits, setCredits] = useState(85);
  
  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [aiLoading, setAiLoading] = useState(false);

  // Load notes and credits
  useEffect(() => {
    const storedNotes = localStorage.getItem('et_notes');
    const storedCredits = localStorage.getItem('et_credits');
    
    if (storedCredits) setCredits(Number(storedCredits));

    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes);
        setNotes(parsed);
        if (parsed.length > 0) {
          setActiveNoteId(parsed[0].id);
          setTitle(parsed[0].title);
          setContent(parsed[0].content);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed initial notes
      const seedNotes: Note[] = [
        {
          id: 'note-1',
          title: 'Intro to React & Next.js App Router',
          content: `React is a library for building user interfaces. Next.js extends it by offering server-side rendering, routing, and optimization.

Key App Router Concepts:
- Server Components by default
- file-based routing system (page.tsx, layout.tsx)
- 'use client' boundary for interactive components
- Server Actions for zero-fetch database writes`,
          updatedAt: new Date().toLocaleDateString()
        },
        {
          id: 'note-2',
          title: 'Macroeconomics: Aggregate Demand',
          content: `Aggregate Demand (AD) represents the total demand for goods and services in an economy.
Equation: AD = C + I + G + (X - M)

Where:
- C = Consumption (household spending)
- I = Investment (business spending)
- G = Government purchases
- X - M = Net Exports (Exports minus Imports)

Shift factors include interest rates, fiscal policy, and global exchange rates.`,
          updatedAt: new Date(Date.now() - 86400000).toLocaleDateString()
        }
      ];
      setNotes(seedNotes);
      localStorage.setItem('et_notes', JSON.stringify(seedNotes));
      setActiveNoteId('note-1');
      setTitle(seedNotes[0].title);
      setContent(seedNotes[0].content);
    }
  }, []);

  // Handle active note change
  const handleSelectNote = (id: string) => {
    // Save current active note first if dirty
    if (saveStatus === 'dirty' && activeNoteId) {
      saveNoteImmediate(activeNoteId, title, content);
    }

    const note = notes.find(n => n.id === id);
    if (note) {
      setActiveNoteId(id);
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus('saved');
    }
  };

  // Immediate save helper
  const saveNoteImmediate = (id: string, newTitle: string, newContent: string) => {
    const updatedNotes = notes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          title: newTitle,
          content: newContent,
          updatedAt: new Date().toLocaleDateString()
        };
      }
      return n;
    });

    setNotes(updatedNotes);
    localStorage.setItem('et_notes', JSON.stringify(updatedNotes));
    
    // Update stats count
    try {
      const storedStats = localStorage.getItem('et_stats');
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        parsed.notesSaved = updatedNotes.length;
        localStorage.setItem('et_stats', JSON.stringify(parsed));
      }
    } catch(e){}
  };

  // Auto-save logic
  useEffect(() => {
    if (!activeNoteId) return;

    // Check if anything actually changed
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (activeNote && (activeNote.title !== title || activeNote.content !== content)) {
      setSaveStatus('dirty');
      
      const delayDebounce = setTimeout(() => {
        setSaveStatus('saving');
        saveNoteImmediate(activeNoteId, title, content);
        setSaveStatus('saved');
      }, 1000); // auto save after 1s of inactivity

      return () => clearTimeout(delayDebounce);
    }
  }, [title, content]);

  // Create new note
  const handleCreateNote = () => {
    const newId = 'note-' + Math.random().toString(36).substring(2, 9);
    const newNote: Note = {
      id: newId,
      title: 'Untitled Note',
      content: '',
      updatedAt: new Date().toLocaleDateString()
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem('et_notes', JSON.stringify(updatedNotes));
    
    setActiveNoteId(newId);
    setTitle(newNote.title);
    setContent(newNote.content);
    setSaveStatus('saved');
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('et_notes', JSON.stringify(updatedNotes));

    if (activeNoteId === id) {
      if (updatedNotes.length > 0) {
        setActiveNoteId(updatedNotes[0].id);
        setTitle(updatedNotes[0].title);
        setContent(updatedNotes[0].content);
        setSaveStatus('saved');
      } else {
        setActiveNoteId(null);
        setTitle('');
        setContent('');
        setSaveStatus('saved');
      }
    }
  };

  // AI Helper action call
  const triggerAiHelper = async (helperType: 'summarize' | 'questions' | 'format') => {
    if (!content.trim() || aiLoading || !activeNoteId) return;

    if (credits <= 0) {
      alert("You have run out of AI Credits! Please refill them on your Dashboard. 🪙");
      return;
    }

    setAiLoading(true);

    // Deduct credits
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem('et_credits', String(nextCredits));

    let aiPrompt = '';
    if (helperType === 'summarize') {
      aiPrompt = 'Generate a summary block with bullet points of this note. Place it at the beginning of the text.';
    } else if (helperType === 'questions') {
      aiPrompt = 'Formulate 3 conceptual study questions with answers based on the content of these notes. Add them at the end of the text.';
    } else {
      aiPrompt = 'Enhance readability, rewrite spelling errors, and format with clear markdown headers and lists.';
    }

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'note-enhance',
          text: content,
          topic: title,
          prompt: aiPrompt
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const enhancedContent = resData.data;
        setContent(enhancedContent);
        saveNoteImmediate(activeNoteId, title, enhancedContent);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect to AI server. Fallback response generated.');
      const fallbackAdd = helperType === 'summarize' 
        ? `\n\n*Summary (AI Fallback): This note covers the fundamentals of ${title}. Key metrics focus on structured components, implementation boundaries, and optimization methodologies.*`
        : `\n\n*AI Practice Questions (AI Fallback):*\n1. What is the core definition of ${title}?\n2. What is one primary shift factor in this environment?\n3. State the equation or components representing this system.`;
      
      const newC = content + fallbackAdd;
      setContent(newC);
      saveNoteImmediate(activeNoteId, title, newC);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-0 py-6 flex flex-col gap-6 h-[88vh]">
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

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Left Side: Notes list sidebar */}
        <section className="lg:col-span-1 rounded-3xl p-5 glass-panel flex flex-col gap-4 h-[35vh] lg:h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
            <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-foreground">
              <FileText size={16} className="text-primary" /> Study Notes
            </h3>
            <button 
              onClick={handleCreateNote}
              className="bg-primary text-white p-1.5 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Notes List container */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 no-scrollbar">
            {notes.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10 my-auto">
                No notes created yet. Click "+" to start writing!
              </div>
            ) : (
              notes.map((note) => {
                const isActive = activeNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex items-center justify-between group
                      ${isActive 
                        ? 'bg-primary/10 border-primary/30 text-foreground' 
                        : 'bg-white/20 dark:bg-slate-900/10 border-border/40 text-foreground hover:bg-white/40 dark:hover:bg-slate-900/15'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs block truncate">{note.title || 'Untitled Note'}</span>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Updated {note.updatedAt}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 rounded-md transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Side: Notes editor panel */}
        <section className="lg:col-span-3 rounded-3xl glass-panel flex flex-col overflow-hidden h-[50vh] lg:h-full">
          {activeNoteId ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Editor Controls */}
              <div className="p-4 bg-white/10 dark:bg-slate-900/10 border-b border-border/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    {saveStatus === 'saved' && (
                      <span className="flex items-center gap-1"><Check size={10} /> Auto-Saved</span>
                    )}
                    {saveStatus === 'saving' && (
                      <span className="flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Saving...</span>
                    )}
                    {saveStatus === 'dirty' && 'Unsaved edits'}
                  </span>
                </div>

                {/* AI Helpers toolbar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase hidden md:inline">AI ASSIST:</span>
                  
                  <button
                    onClick={() => triggerAiHelper('summarize')}
                    disabled={aiLoading}
                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Brain size={11} /> Summarize
                  </button>

                  <button
                    onClick={() => triggerAiHelper('questions')}
                    disabled={aiLoading}
                    className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <HelpCircle size={11} /> Generate Qs
                  </button>

                  <button
                    onClick={() => triggerAiHelper('format')}
                    disabled={aiLoading}
                    className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 disabled:opacity-40 border border-primary/20 text-primary font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Sparkles size={11} /> AI Format
                  </button>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 no-scrollbar">
                {aiLoading && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center">
                    <RefreshCw size={36} className="text-primary animate-spin mb-3" />
                    <h4 className="font-bold text-sm text-foreground">AI Assistant Processing...</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                      Gemini is scanning and restructuring your notes. This will take a moment.
                    </p>
                  </div>
                )}
                
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  className="w-full bg-transparent border-0 border-b border-transparent focus:border-border/40 text-xl font-extrabold pb-2 focus:outline-none placeholder:text-muted-foreground"
                />

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your study notes here... supports plain text and markdown titles."
                  className="w-full flex-1 bg-transparent border-0 resize-none focus:outline-none text-sm leading-relaxed placeholder:text-muted-foreground"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground my-auto">
              <FileText size={40} className="mb-3" />
              <h4 className="font-bold text-base text-foreground">No Note Selected</h4>
              <p className="text-xs max-w-xs mt-1">
                Select a note from the sidebar or click "+" to create a new one.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
