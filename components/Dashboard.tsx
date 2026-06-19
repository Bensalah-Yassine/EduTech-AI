'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Flame, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  GitFork, 
  HelpCircle, 
  FileText, 
  Users, 
  RefreshCw, 
  TrendingUp,
  CheckCircle2,
  Play
} from 'lucide-react';

interface DashboardProps {
  userName: string;
  userImage: string;
}

export default function Dashboard({ userName, userImage }: DashboardProps) {
  // Persistence state
  const [streak, setStreak] = useState(7);
  const [credits, setCredits] = useState(85);
  const [lastCheckIn, setLastCheckIn] = useState<string>('');
  const [stats, setStats] = useState({
    completedLessons: 12,
    quizzesTaken: 8,
    mindmapsCreated: 5,
    notesSaved: 14,
  });

  const [recentCourses, setRecentCourses] = useState([
    { id: '1', title: 'Neural Networks & Deep Learning', subject: 'coding', progress: 75, lastStudied: '2 hours ago' },
    { id: '2', title: 'Macroeconomics: Supply & Demand', subject: 'economics', progress: 40, lastStudied: 'Yesterday' },
    { id: '3', title: 'Organic Chemistry: Carbon Chains', subject: 'science', progress: 90, lastStudied: '3 days ago' },
  ]);

  // Load from localStorage
  useEffect(() => {
    const storedStreak = localStorage.getItem('et_streak');
    const storedCredits = localStorage.getItem('et_credits');
    const storedLastCheck = localStorage.getItem('et_last_checkin');
    const storedStats = localStorage.getItem('et_stats');
    
    if (storedStreak) setStreak(Number(storedStreak));
    if (storedCredits) setCredits(Number(storedCredits));
    if (storedLastCheck) setLastCheckIn(storedLastCheck);
    if (storedStats) {
      try {
        setStats(JSON.parse(storedStats));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleCheckIn = () => {
    const today = new Date().toDateString();
    if (lastCheckIn === today) {
      alert("You have already checked in today! Keep up the good work! 🔥");
      return;
    }
    const newStreak = lastCheckIn === new Date(Date.now() - 86400000).toDateString() ? streak + 1 : 1;
    
    setStreak(newStreak);
    setLastCheckIn(today);
    localStorage.setItem('et_streak', String(newStreak));
    localStorage.setItem('et_last_checkin', today);
  };

  const refillCredits = () => {
    setCredits(100);
    localStorage.setItem('et_credits', '100');
  };

  // Helper for rendering subject tag color
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

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = (new Date().getDay() + 6) % 7; // Convert to Mon=0 ... Sun=6

  return (
    <div className="w-full flex flex-col gap-8 max-w-[1300px] mx-auto px-4 md:px-0">
      {/* Welcome & Quick Streak Banner */}
      <section className="flex flex-col lg:flex-row gap-6 justify-between items-stretch">
        <div className="flex-1 rounded-3xl p-8 glass-panel flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <GraduationCap size={240} className="text-primary" />
          </div>
          <Image 
            src={userImage} 
            alt={userName} 
            width={90} 
            height={90} 
            className="rounded-2xl border-4 border-white/50 shadow-md"
          />
          <div className="flex-1 text-center md:text-left">
            <span className="text-primary font-bold text-sm tracking-widest uppercase">Welcome back</span>
            <h2 className="text-3xl font-extrabold mt-1">Hey, {userName}! 👋</h2>
            <p className="text-muted-foreground mt-2 max-w-md text-sm">
              Your AI tutors are ready. What are we studying today? Expand your knowledge using mindmaps or test yourself with a custom quiz.
            </p>
          </div>
        </div>

        {/* Streak card */}
        <div className="w-full lg:w-[350px] rounded-3xl p-6 glass-panel flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Daily Study Streak</span>
            <span className="bg-orange-500/10 text-orange-500 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-orange-500/20">
              <Flame size={12} className="fill-orange-500" /> STREAK ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-4 my-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/10">
              <Flame size={32} className="fill-orange-500" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold">{streak} Days</h3>
              <p className="text-xs text-muted-foreground">Keep studying to grow your fire!</p>
            </div>
          </div>

          {/* Days tracker */}
          <div className="flex justify-between items-center gap-1.5 my-2">
            {daysOfWeek.map((day, i) => {
              const isActive = i <= todayIdx; // Simulation check
              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${isActive 
                      ? 'bg-orange-500 text-white border-orange-400 shadow-sm shadow-orange-500/20' 
                      : 'bg-white/10 dark:bg-slate-900/10 text-muted-foreground border-border/60'
                    }`}>
                    {day[0]}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleCheckIn}
            className="w-full mt-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-xs shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Check In Today
          </button>
        </div>
      </section>

      {/* Stats Counter & Credits */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credits Panel */}
        <div className="rounded-3xl p-6 glass-panel flex flex-col justify-between h-48 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">AI Study Credits</span>
            <Sparkles size={18} className="text-primary animate-pulse" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-4xl font-extrabold text-foreground">{credits}</span>
              <span className="text-xs text-muted-foreground">/ 100 credits</span>
            </div>
            <div className="w-full h-2.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-border/20">
              <div 
                className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500" 
                style={{ width: `${credits}%` }}
              />
            </div>
          </div>
          <button 
            onClick={refillCredits}
            className="text-xs font-semibold text-primary hover:text-primary-foreground dark:hover:text-white flex items-center justify-center gap-1 py-1.5 rounded-lg border border-primary/20 hover:bg-primary transition-all duration-200"
          >
            <RefreshCw size={12} /> Refill Free Sandbox Credits
          </button>
        </div>

        {/* Learning Statistics */}
        <div className="lg:col-span-2 rounded-3xl p-6 glass-panel grid grid-cols-2 md:grid-cols-4 gap-4 h-fit lg:h-48 items-center">
          <div className="text-center p-3 border-r border-border/40">
            <GraduationCap size={24} className="text-blue-500 mx-auto mb-2" />
            <span className="text-2xl font-extrabold block">{stats.completedLessons}</span>
            <span className="text-xs text-muted-foreground">Lessons Finished</span>
          </div>
          <div className="text-center p-3 md:border-r border-border/40">
            <HelpCircle size={24} className="text-amber-500 mx-auto mb-2" />
            <span className="text-2xl font-extrabold block">{stats.quizzesTaken}</span>
            <span className="text-xs text-muted-foreground">Quizzes Taken</span>
          </div>
          <div className="text-center p-3 border-r border-border/40">
            <GitFork size={24} className="text-purple-500 mx-auto mb-2" />
            <span className="text-2xl font-extrabold block">{stats.mindmapsCreated}</span>
            <span className="text-xs text-muted-foreground">Mindmaps Built</span>
          </div>
          <div className="text-center p-3">
            <FileText size={24} className="text-emerald-500 mx-auto mb-2" />
            <span className="text-2xl font-extrabold block">{stats.notesSaved}</span>
            <span className="text-xs text-muted-foreground">Study Notes Saved</span>
          </div>
        </div>
      </section>

      {/* Quick Action Grid */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xl font-bold tracking-tight px-1 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> Study Suite Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/chat" className="rounded-2xl p-4 glass-panel-hover flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="font-bold text-sm block">AI Chat</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Tutor chat</span>
            </div>
          </Link>

          <Link href="/flashcards" className="rounded-2xl p-4 glass-panel-hover flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <Layers size={20} />
            </div>
            <div>
              <span className="font-bold text-sm block">Flashcards</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Decks & review</span>
            </div>
          </Link>

          <Link href="/mindmap" className="rounded-2xl p-4 glass-panel-hover flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
              <GitFork size={20} />
            </div>
            <div>
              <span className="font-bold text-sm block">Mindmaps</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Visual mapping</span>
            </div>
          </Link>

          <Link href="/quizzes" className="rounded-2xl p-4 glass-panel-hover flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <HelpCircle size={20} />
            </div>
            <div>
              <span className="font-bold text-sm block">Quizzes</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Test knowledge</span>
            </div>
          </Link>

          <Link href="/notes" className="rounded-2xl p-4 glass-panel-hover flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <FileText size={20} />
            </div>
            <div>
              <span className="font-bold text-sm block">Notes</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Rich text docs</span>
            </div>
          </Link>

          <Link href="/groups" className="rounded-2xl p-4 glass-panel-hover flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <Users size={20} />
            </div>
            <div>
              <span className="font-bold text-sm block">Study Groups</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Video & chat</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Courses Studied Progress */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-3xl p-6 glass-panel flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Active Topics & Progress</h3>
            <span className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-0.5">
              View details <Play size={10} />
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {recentCourses.map((course) => (
              <div key={course.id} className="p-4 rounded-2xl bg-white/20 dark:bg-slate-900/10 border border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize ${getSubjectColor(course.subject)}`}>
                      {course.subject}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Updated {course.lastStudied}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{course.title}</h4>
                </div>

                <div className="w-full md:w-[200px] flex items-center gap-3">
                  <div className="flex-grow">
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                  <span className="font-bold text-xs w-8 text-right">{course.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources Promo Card */}
        <div className="rounded-3xl p-6 glass-panel flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-primary/5 to-transparent border border-primary/10">
          <div>
            <span className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold text-[10px] px-2.5 py-1 rounded-full border border-indigo-500/20">
              FEATURED RESOURCES
            </span>
            <h4 className="text-lg font-bold mt-3 leading-snug">Study Resource Repository</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Explore user-curated study material, code templates, biology cheatsheets, and economic digests, or add your own resources to summarize them instantly using our built-in AI tool.
            </p>
          </div>
          <Link href="/resources" className="w-full mt-4">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5">
              <BookOpen size={14} /> Open Resource Directory
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
