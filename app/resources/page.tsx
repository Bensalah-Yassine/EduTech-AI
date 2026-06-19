'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  Coins, 
  BookOpen, 
  Plus, 
  ExternalLink, 
  Search,
  Filter,
  FileText,
  Link2,
  Video,
  Book,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { subjects, subjectsColors } from '@/constants';

interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'link' | 'book';
  subject: string;
  url: string;
  description: string;
  aiSummary?: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [credits, setCredits] = useState(85);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'article' | 'video' | 'link' | 'book'>('link');
  const [newSubject, setNewSubject] = useState('science');
  const [newDesc, setNewDesc] = useState('');
  const [autoSummary, setAutoSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync credits & load resources
  useEffect(() => {
    const storedCredits = localStorage.getItem('et_credits');
    const storedRes = localStorage.getItem('et_resources');
    
    if (storedCredits) setCredits(Number(storedCredits));

    if (storedRes) {
      try {
        setResources(JSON.parse(storedRes));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed preset resources
      const seedResources: Resource[] = [
        {
          id: 'res-1',
          title: 'Khan Academy: Cellular Respiration',
          type: 'video',
          subject: 'science',
          url: 'https://www.khanacademy.org',
          description: 'A detailed breakdown of glycolysis, the Krebs cycle, and the electron transport chain.',
          aiSummary: 'A high-yield biology tutorial explaining how cells convert glucose into ATP. Focuses on oxygen constraints, mitochondrial enzymes, and electron gradients.'
        },
        {
          id: 'res-2',
          title: 'MDN Web Docs: Understanding JS Closures',
          type: 'article',
          subject: 'coding',
          url: 'https://developer.mozilla.org',
          description: 'Official MDN documentation describing lexical scoping and function encapsulation in JavaScript.',
          aiSummary: 'Standard reference detailing closures, enclosing scopes, practical examples, memory considerations, and object simulators.'
        },
        {
          id: 'res-3',
          title: 'MIT OpenCourseWare: Principles of Microeconomics',
          type: 'book',
          subject: 'economics',
          url: 'https://ocw.mit.edu',
          description: 'Full course syllabus, lecture materials, and problem sets covering consumer theory and supply equilibrium.',
          aiSummary: 'Academically rigorous notes covering demand elasticities, utility models, pricing indexes, market failures, and fiscal policies.'
        },
        {
          id: 'res-4',
          title: '3Blue1Brown: Essence of Calculus',
          type: 'video',
          subject: 'maths',
          url: 'https://www.youtube.com',
          description: 'An exceptional visual explanation of derivatives, integrals, and the fundamental theorem of calculus.',
          aiSummary: 'Highly intuitive geometric animations explaining rates of change, tangent slopes, accumulations, and areas under curves.'
        }
      ];
      setResources(seedResources);
      localStorage.setItem('et_resources', JSON.stringify(seedResources));
    }
  }, []);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim() || submitting) return;

    setSubmitting(true);
    let summary = '';

    if (autoSummary && credits > 0) {
      // Deduct credit
      const nextCredits = Math.max(0, credits - 1);
      setCredits(nextCredits);
      localStorage.setItem('et_credits', String(nextCredits));

      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'chat',
            topic: newSubject,
            prompt: `Summarize in 2 short sentences what a student will learn from this study resource: "${newTitle}" located at "${newUrl}". Describe its relevance.`
          })
        });
        const resData = await response.json();
        if (resData.success) {
          summary = resData.data;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const newRes: Resource = {
      id: 'res-' + Math.random().toString(36).substring(2, 9),
      title: newTitle,
      type: newType,
      subject: newSubject,
      url: newUrl,
      description: newDesc || `Online resource covering key concepts of ${newSubject}.`,
      aiSummary: summary || undefined
    };

    const updated = [newRes, ...resources];
    setResources(updated);
    localStorage.setItem('et_resources', JSON.stringify(updated));

    // Reset Form
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setAutoSummary(false);
    setShowAddForm(false);
    setSubmitting(false);
  };

  // Trigger AI Summary on existing resource
  const triggerAiSummary = async (resId: string) => {
    if (aiLoading) return;

    if (credits <= 0) {
      alert("You have run out of AI Credits! Please refill them on your Dashboard. 🪙");
      return;
    }

    const res = resources.find(r => r.id === resId);
    if (!res) return;

    setAiLoading(resId);

    // Deduct credits
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem('et_credits', String(nextCredits));

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          topic: res.subject,
          prompt: `Summarize this learning resource: "${res.title}" (${res.description}). Outline exactly 3 core takeaways for a student.`
        })
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        const updated = resources.map(r => {
          if (r.id === resId) {
            return { ...r, aiSummary: resData.data };
          }
          return r;
        });
        setResources(updated);
        localStorage.setItem('et_resources', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
      // Fallback summary
      const updated = resources.map(r => {
        if (r.id === resId) {
          return { ...r, aiSummary: `AI Summary Fallback: Key educational material for ${res.title}. Covers essential theories, standard models, and review problems.` };
        }
        return r;
      });
      setResources(updated);
      localStorage.setItem('et_resources', JSON.stringify(updated));
    } finally {
      setAiLoading(null);
    }
  };

  const handleDeleteResource = (id: string) => {
    const updated = resources.filter(r => r.id !== id);
    setResources(updated);
    localStorage.setItem('et_resources', JSON.stringify(updated));
  };

  // Render resource icons
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText size={16} className="text-blue-500" />;
      case 'video': return <Video size={16} className="text-red-500" />;
      case 'book': return <Book size={16} className="text-amber-500" />;
      default: return <Link2 size={16} className="text-emerald-500" />;
    }
  };

  // Filter lists
  const filteredResources = resources.filter(res => {
    const matchSubject = selectedSubject === 'all' || res.subject === selectedSubject;
    const matchSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        res.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'science': return 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/50';
      case 'maths': return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50';
      case 'language': return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/50';
      case 'coding': return 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200/50';
      case 'economics': return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200/50';
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-0 py-6 flex flex-col gap-6">
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
            <BookOpen className="text-primary" /> Study Resource Directory
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Store study guides, cheat-sheets, links, and query AI summaries.
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-primary/95 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5 shadow-md shadow-primary/20 text-xs shrink-0"
        >
          <Plus size={14} /> Add Reference Material
        </button>
      </div>

      {/* Add Resource Form block */}
      {showAddForm && (
        <section className="glass-panel rounded-3xl p-6 border border-primary/20 animate-fadeIn">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
            <Plus size={16} className="text-primary" /> Add New Resource
          </h3>
          <form onSubmit={handleAddResource} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Resource Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Periodic Table Cheat-Sheet"
                required
                className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">URL Link</label>
              <input 
                type="url" 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Type</label>
              <select 
                value={newType}
                onChange={(e: any) => setNewType(e.target.value)}
                className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="link">Web Link</option>
                <option value="video">Study Video</option>
                <option value="article">Article / PDF</option>
                <option value="book">Reference Book</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Subject</label>
              <select 
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {subjects.map(s => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground">Short Description</label>
              <textarea 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description of the material..."
                className="w-full h-20 bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={autoSummary}
                  onChange={(e) => setAutoSummary(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary shrink-0"
                />
                <span className="flex items-center gap-1">
                  Auto-Summarize URL using AI <Sparkles size={12} className="text-primary animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-normal">(costs 1 AI credit)</span>
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-border/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  {submitting && <RefreshCw size={11} className="animate-spin" />} Save Resource
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Filter and search bar */}
      <section className="flex flex-col md:flex-row gap-4 items-center shrink-0">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/45 dark:bg-slate-900/30 border border-border/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary backdrop-blur-md transition-all"
          />
          <Search size={14} className="text-muted-foreground absolute left-3.5 top-3.5" />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          <Filter size={13} className="text-muted-foreground shrink-0 hidden sm:inline" />
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border
              ${selectedSubject === 'all'
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/10'
                : 'bg-white/40 dark:bg-slate-900/30 border-border/60 text-muted-foreground hover:bg-white/60'
              }`}
          >
            All Subjects
          </button>
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 capitalize border
                ${selectedSubject === s
                  ? 'bg-primary border-primary text-white shadow-md shadow-primary/10'
                  : 'bg-white/40 dark:bg-slate-900/30 border-border/60 text-muted-foreground hover:bg-white/60'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Resources grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {filteredResources.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-muted-foreground glass-panel rounded-3xl flex flex-col items-center justify-center p-6">
            <BookOpen size={32} className="mb-2 text-muted-foreground" />
            <h4 className="font-bold text-sm text-foreground">No resources found</h4>
            <p className="text-xs max-w-xs mt-1">
              Add custom items or clear filters to view resource list.
            </p>
          </div>
        ) : (
          filteredResources.map((res) => (
            <div 
              key={res.id} 
              className="p-5 rounded-3xl glass-panel-hover flex flex-col justify-between gap-4 border border-border/60 relative overflow-hidden"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {getResourceIcon(res.type)}
                    <span className="text-[10px] text-muted-foreground capitalize font-bold">{res.type}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border capitalize ${getSubjectColor(res.subject)}`}>
                      {res.subject}
                    </span>
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Title & Desc */}
                <h4 className="font-bold text-sm text-foreground mb-1 leading-snug">{res.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{res.description}</p>

                {/* AI Summary Block */}
                {res.aiSummary ? (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex flex-col gap-1.5 animate-fadeIn">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 dark:text-indigo-400">
                      <Sparkles size={11} className="animate-pulse" />
                      <span>AI RECEPTACLE SUMMARY</span>
                    </div>
                    <p className="text-[10.5px] text-foreground leading-relaxed font-medium">
                      {res.aiSummary}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => triggerAiSummary(res.id)}
                    disabled={aiLoading === res.id}
                    className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-600/20 disabled:opacity-40 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    {aiLoading === res.id ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" /> Fetching Summary...
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} /> Summarize Link with AI
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* URL Link redirect */}
              <a 
                href={res.url} 
                target="_blank" 
                rel="noreferrer" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-1.5"
              >
                Open Material Website <ExternalLink size={12} />
              </a>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
