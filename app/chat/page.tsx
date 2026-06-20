'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Send, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Coins, 
  User, 
  Bot,
  Brain,
  MessageSquare
} from 'lucide-react';
import { subjects, subjectsColors } from '@/constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const [subject, setSubject] = useState('science');
  const [topic, setTopic] = useState('Photosynthesis & Cellular Respiration');
  const [tutorName, setTutorName] = useState('Dr. Elixir the Science Sage');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [credits, setCredits] = useState(85);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync credits
  useEffect(() => {
    const storedCredits = localStorage.getItem('et_credits');
    if (storedCredits) {
      setCredits(Number(storedCredits));
    } else {
      localStorage.setItem('et_credits', '85');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle changing subjects & presets
  const handleSubjectChange = (val: string) => {
    setSubject(val);
    if (val === 'science') {
      setTutorName('Dr. Elixir the Science Sage');
      setTopic('Photosynthesis & Cellular Respiration');
    } else if (val === 'maths') {
      setTutorName('Professor Pi the Geometry King');
      setTopic('Derivatives & Rates of Change');
    } else if (val === 'coding') {
      setTutorName('Ada the Compiler Wizard');
      setTopic('Asynchronous Programming in NextJS');
    } else if (val === 'economics') {
      setTutorName('Marshall the Supply & Demand Guru');
      setTopic('Keynesian Economic Equilibrium');
    } else if (val === 'history') {
      setTutorName('Chronos the Memory Keeper');
      setTopic('The Renaissance and Humanism');
    } else {
      setTutorName('Linguistica the Grammar Guide');
      setTopic('Stylistic Devices in Literature');
    }
    setMessages([]);
  };

  // Text to speech
  const speak = (text: string) => {
    if (!speechEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[\*\#\`]/g, ''));
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    if (credits <= 0) {
      alert("You have run out of AI Credits! Please refill them on your Dashboard. 🪙");
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    // Deduct credit
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem('et_credits', String(nextCredits));

    // Update stats completed sessions
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
          action: 'chat',
          topic,
          history: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
          prompt: userMessage.content
        })
      });

      const resData = await response.json();
      if (resData.success) {
        const botReply = resData.data;
        const botMessage: Message = {
          role: 'assistant',
          content: botReply,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, botMessage]);
        // Trigger speak
        speak(botReply);
      } else {
        throw new Error(resData.error);
      }
    } catch (error) {
      console.error(error);
      // Fallback message
      const botMessage: Message = {
        role: 'assistant',
        content: `I'm having a hard time reaching my database, but let's continue discussing ${topic}! Could you explain how you visualize this concept?`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const currentSubjectColor = subjectsColors[subject as keyof typeof subjectsColors] || '#BDE7FF';

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-0 py-6 flex flex-col gap-6 h-[88vh]">
      {/* Back link & Credit meter */}
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
        {/* Left config panel */}
        <section className="lg:col-span-1 rounded-3xl p-6 glass-panel flex flex-col gap-5 justify-between h-fit lg:h-full">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Brain size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">AI Tutor Config</h3>
                <p className="text-[10px] text-muted-foreground">Select your learning path</p>
              </div>
            </div>

            {/* Subject Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Choose Subject</label>
              <select 
                value={subject} 
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-background text-foreground capitalize">{sub}</option>
                ))}
              </select>
            </div>

            {/* Topic Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Target Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter study topic..."
                className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Tutor avatar profile card */}
            <div className="p-4 rounded-2xl bg-white/20 dark:bg-slate-900/10 border border-border/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: currentSubjectColor }}>
                {tutorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs block text-foreground truncate">{tutorName}</span>
                <span className="text-[10px] text-muted-foreground block capitalize">{subject} Specialist</span>
              </div>
            </div>
          </div>

          {/* Voice Speech toggler */}
          <button
            onClick={() => {
              setSpeechEnabled(!speechEnabled);
              if (speechEnabled) window.speechSynthesis.cancel();
            }}
            className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all duration-200 
              ${speechEnabled 
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                : 'bg-white/40 dark:bg-slate-900/30 border-border/80 hover:bg-white/60 dark:hover:bg-slate-900/50'
              }`}
          >
            {speechEnabled ? (
              <>
                <Volume2 size={15} /> Vocal Tutors: ON
              </>
            ) : (
              <>
                <VolumeX size={15} /> Vocal Tutors: OFF
              </>
            )}
          </button>
        </section>

        {/* Right chat panel */}
        <section className="lg:col-span-3 rounded-3xl glass-panel flex flex-col justify-between overflow-hidden relative h-[50vh] lg:h-full">
          {/* Header */}
          <div className="p-4 bg-white/10 dark:bg-slate-900/10 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div>
                <h4 className="font-bold text-sm text-foreground">{tutorName}</h4>
                <p className="text-[10px] text-muted-foreground capitalize">Tutor Session • Topic: {topic || 'General'}</p>
              </div>
            </div>
          </div>

          {/* Message History Feed */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 no-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4">
                  <MessageSquare size={32} />
                </div>
                <h4 className="font-bold text-base text-foreground mb-1">Start a Conversation</h4>
                <p className="text-xs max-w-sm">
                  Introduce yourself to {tutorName} or ask a question on "{topic}" to begin this learning session.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                      ${isUser ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-slate-800 text-foreground'}`}
                      style={!isUser ? { backgroundColor: currentSubjectColor } : {}}
                    >
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className={`rounded-2xl p-3.5 text-sm leading-relaxed border
                        ${isUser 
                          ? 'bg-primary/95 text-white border-primary shadow-sm shadow-primary/10' 
                          : 'bg-white/40 dark:bg-slate-900/30 border-border/80 text-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex gap-3 mr-auto items-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: currentSubjectColor }}>
                  <Bot size={14} />
                </div>
                <div className="bg-white/40 dark:bg-slate-900/30 border border-border/80 rounded-2xl p-3 px-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form message input */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 border-t border-border/40 bg-white/10 dark:bg-slate-900/10 flex gap-2.5 items-center"
          >
            <input 
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask ${tutorName} a question...`}
              disabled={loading}
              className="flex-grow bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary backdrop-blur-md"
            />
            <button 
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl p-3 w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
