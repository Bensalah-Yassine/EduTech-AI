'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  LogOut, 
  User, 
  Volume2, 
  FileText
} from 'lucide-react';
import { subjects, subjectsColors } from '@/constants';

interface Group {
  id: string;
  name: string;
  subject: string;
  topic: string;
  membersCount: number;
}

interface GroupMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
}

export default function StudyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Group states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSubject, setGroupSubject] = useState('coding');
  const [groupTopic, setGroupTopic] = useState('Recursion Problems');

  // Active room states
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  
  // AV status controls
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isPeerSpeaking, setIsPeerSpeaking] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync groups list
  useEffect(() => {
    const storedGroups = localStorage.getItem('et_study_groups');
    if (storedGroups) {
      try {
        setGroups(JSON.parse(storedGroups));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed preset study groups
      const seedGroups: Group[] = [
        { id: 'group-1', name: 'Maths Advanced calculus study', subject: 'maths', topic: 'Definite Integrals', membersCount: 3 },
        { id: 'group-2', name: 'AI & Neural Networks discussion', subject: 'coding', topic: 'Backpropagation algorithms', membersCount: 4 },
        { id: 'group-3', name: 'World History Exam prep', subject: 'history', topic: 'Industrial Revolution Impacts', membersCount: 2 }
      ];
      setGroups(seedGroups);
      localStorage.setItem('et_study_groups', JSON.stringify(seedGroups));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeGroupId) {
      scrollToBottom();
    }
  }, [messages, activeGroupId]);

  // Join group room handler
  const handleJoinGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setMicOn(true);
    setVideoOn(true);
    setScreenSharing(false);
    setSharedNote(`Welcome to the Shared Group Notebook!\n\nUse this area to collaboratively draft questions, equations, or summaries while talking.\n\nActive Study Topic: ${groups.find(g => g.id === groupId)?.topic || 'General'}`);
    
    // Seed chat history for the joined room
    const currentGroup = groups.find(g => g.id === groupId);
    const peerName = currentGroup?.subject === 'maths' ? 'Lucas' : currentGroup?.subject === 'coding' ? 'Ada' : 'Chloe';
    
    setMessages([
      { id: 'msg-1', sender: peerName, content: `Hey! Thanks for joining. We were just looking over "${currentGroup?.topic}".`, timestamp: 'Just now', isSelf: false },
      { id: 'msg-2', sender: 'System', content: `You joined study group: "${currentGroup?.name}"`, timestamp: 'Just now', isSelf: false }
    ]);
  };

  // Leave room handler
  const handleLeaveRoom = () => {
    setActiveGroupId(null);
    setMessages([]);
  };

  // Create Group submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !groupTopic.trim()) return;

    const newGroup: Group = {
      id: 'group-' + Math.random().toString(36).substring(2, 9),
      name: groupName,
      subject: groupSubject,
      topic: groupTopic,
      membersCount: 1
    };

    const updated = [newGroup, ...groups];
    setGroups(updated);
    localStorage.setItem('et_study_groups', JSON.stringify(updated));

    // Reset Form
    setGroupName('');
    setGroupTopic('');
    setShowCreateForm(false);

    // Join room instantly
    handleJoinGroup(newGroup.id);
  };

  // Send message submit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: GroupMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      sender: 'You',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Simulate peer response after 2.5 seconds
    const activeRoom = groups.find(g => g.id === activeGroupId);
    const peerName = activeRoom?.subject === 'maths' ? 'Lucas' : activeRoom?.subject === 'coding' ? 'Ada' : 'Chloe';

    setTimeout(() => {
      if (activeGroupId) {
        setIsPeerSpeaking(peerName);
        setMessages((prev) => [...prev, {
          id: 'msg-p',
          sender: peerName,
          content: `Interesting point! Let's write that down in the Shared Note section so we can save it for review later.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false
        }]);

        // Stop speaking animation after 3s
        setTimeout(() => setIsPeerSpeaking(null), 3000);
      }
    }, 2500);
  };

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

  const currentRoom = groups.find(g => g.id === activeGroupId);
  const activePeerName = currentRoom?.subject === 'maths' ? 'Lucas' : currentRoom?.subject === 'coding' ? 'Ada' : 'Chloe';

  // Filter groups
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="max-w-[1300px] mx-auto px-4 md:px-0 py-6 flex flex-col gap-6 h-[88vh]">
      {/* Back to dashboard */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        {activeGroupId && (
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-600 font-bold text-xs px-3.5 py-1 rounded-full">
            <Volume2 size={13} className="animate-pulse" /> Active study room
          </div>
        )}
      </div>

      {/* Main Container Switch */}
      {!activeGroupId ? (
        /* ==========================================
           LANDING STATE: LIST OF GROUPS & CREATE FORM
           ========================================== */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-3xl p-6">
            <div>
              <h2 className="text-2xl font-extrabold flex items-center gap-2">
                <Users className="text-primary" /> Collaborative Study Rooms
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Join video/voice study spaces with peers, chat in real-time, and take joint notes.
              </p>
            </div>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-primary hover:bg-primary/95 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5 shadow-md shadow-primary/20 text-xs shrink-0"
            >
              <Plus size={14} /> Create Study Group
            </button>
          </div>

          {showCreateForm && (
            <section className="glass-panel rounded-3xl p-6 border border-primary/20 animate-fadeIn">
              <h3 className="font-bold text-sm mb-4">Create New Study Space</h3>
              <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Group Name</label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. NextJS Hackers Session"
                    required
                    className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Focus Topic</label>
                  <input 
                    type="text" 
                    value={groupTopic}
                    onChange={(e) => setGroupTopic(e.target.value)}
                    placeholder="e.g. Recursion & Loops"
                    required
                    className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Subject</label>
                  <select 
                    value={groupSubject}
                    onChange={(e) => setGroupSubject(e.target.value)}
                    className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {subjects.map(s => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-border/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs"
                  >
                    Launch Space
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Search bar */}
          <div className="w-full md:w-80 relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active study groups..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/45 dark:bg-slate-900/30 border border-border/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary backdrop-blur-md transition-all"
            />
            <Search size={14} className="text-muted-foreground absolute left-3.5 top-3.5" />
          </div>

          {/* Group directory list */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-muted-foreground glass-panel rounded-3xl flex flex-col items-center justify-center p-6">
                <Users size={32} className="mb-2" />
                <h4 className="font-bold text-sm text-foreground">No study spaces found</h4>
                <p className="text-xs max-w-xs mt-1">
                  Launch a custom group above to initiate a study workspace.
                </p>
              </div>
            ) : (
              filteredGroups.map((g) => (
                <div 
                  key={g.id} 
                  className="p-5 rounded-3xl glass-panel-hover flex flex-col justify-between gap-5 border border-border/60"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border capitalize ${getSubjectColor(g.subject)}`}>
                        {g.subject}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Users size={11} /> {g.membersCount} online
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-foreground leading-snug mb-1 truncate">{g.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Topic: **{g.topic}**</p>
                  </div>

                  <button 
                    onClick={() => handleJoinGroup(g.id)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-1"
                  >
                    Join Study Space
                  </button>
                </div>
              ))
            )}
          </section>
        </div>
      ) : (
        /* ==========================================
           IN-ROOM STATE: CHAT, VIDEO GRID, NOTEBOOK
           ========================================== */
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Column 1: Live text chat feed (lg:col-span-3) */}
          <section className="lg:col-span-3 rounded-3xl glass-panel flex flex-col justify-between overflow-hidden h-[30vh] lg:h-full">
            {/* Header info */}
            <div className="p-4 bg-white/10 dark:bg-slate-900/10 border-b border-border/40 shrink-0">
              <span className="font-bold text-xs text-foreground block truncate">{currentRoom?.name}</span>
              <span className="text-[9px] text-muted-foreground block">Real-time Group Chat</span>
            </div>

            {/* Chat feed history */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 no-scrollbar">
              {messages.map((m) => {
                const isSystem = m.sender === 'System';
                if (isSystem) {
                  return (
                    <div key={m.id} className="text-center text-[10px] text-muted-foreground italic my-1">
                      {m.content}
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`flex flex-col max-w-[85%] ${m.isSelf ? 'ml-auto items-end' : 'mr-auto'}`}>
                    <span className="text-[9px] font-bold text-muted-foreground px-1">{m.sender}</span>
                    <div className={`rounded-xl p-2.5 text-xs mt-0.5 leading-relaxed border
                      ${m.isSelf 
                        ? 'bg-primary/95 text-white border-primary' 
                        : 'bg-white/30 dark:bg-slate-900/20 border-border/60 text-foreground'
                      }`}
                    >
                      <p>{m.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 bg-white/10 dark:bg-slate-900/10 flex gap-2 shrink-0">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message to group..."
                className="flex-grow bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button 
                type="submit"
                className="bg-primary text-white rounded-xl p-2 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <Send size={12} />
              </button>
            </form>
          </section>

          {/* Column 2: Video study layout (lg:col-span-5) */}
          <section className="lg:col-span-5 flex flex-col gap-4 min-h-0">
            {/* 4-Peer Video Grid layout */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              
              {/* Peer 1: You */}
              <div className="rounded-3xl border border-border/60 relative overflow-hidden flex flex-col items-center justify-center p-4 glass-panel">
                {videoOn ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto mb-2 shadow-md">
                      Y
                    </div>
                    <span className="font-bold text-xs block text-foreground">You (Learning)</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-1">
                    <VideoOff size={24} />
                    <span className="text-[10px] font-bold">Camera Muted</span>
                  </div>
                )}
                {/* Audio voice waveform indicator */}
                {micOn && (
                  <div className="absolute bottom-3 left-3 flex gap-0.5 items-end h-3">
                    <span className="w-1 bg-primary rounded-full animate-pulse h-2" style={{ animationDelay: '100ms' }} />
                    <span className="w-1 bg-primary rounded-full animate-pulse h-3" style={{ animationDelay: '250ms' }} />
                    <span className="w-1 bg-primary rounded-full animate-pulse h-1" style={{ animationDelay: '400ms' }} />
                  </div>
                )}
                <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded bg-black/10 text-muted-foreground uppercase">LOCAL</span>
              </div>

              {/* Peer 2: Active Peer (Ada/Lucas/Chloe) */}
              <div className="rounded-3xl border border-border/60 relative overflow-hidden flex flex-col items-center justify-center p-4 glass-panel">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xl mx-auto mb-2 shadow-md">
                    {activePeerName.charAt(0)}
                  </div>
                  <span className="font-bold text-xs block text-foreground">{activePeerName}</span>
                </div>

                {/* Voice waveform when speaking */}
                {isPeerSpeaking === activePeerName && (
                  <div className="absolute bottom-3 left-3 flex gap-0.5 items-end h-3">
                    <span className="w-1 bg-indigo-500 rounded-full animate-pulse h-3" style={{ animationDelay: '50ms' }} />
                    <span className="w-1 bg-indigo-500 rounded-full animate-pulse h-4" style={{ animationDelay: '200ms' }} />
                    <span className="w-1 bg-indigo-500 rounded-full animate-pulse h-2" style={{ animationDelay: '350ms' }} />
                  </div>
                )}
                <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded bg-black/10 text-muted-foreground uppercase">STUDENT</span>
              </div>

              {/* Peer 3: Dummy peer 2 */}
              <div className="rounded-3xl border border-border/60 relative overflow-hidden flex flex-col items-center justify-center p-4 glass-panel">
                <div className="text-center opacity-60">
                  <div className="w-16 h-16 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-xl mx-auto mb-2">
                    S
                  </div>
                  <span className="font-bold text-xs block text-foreground">Sophia</span>
                </div>
                <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded bg-black/10 text-muted-foreground uppercase">AWAY</span>
              </div>

              {/* Peer 4: Screen Share preview or simulated dummy */}
              <div className="rounded-3xl border border-border/60 relative overflow-hidden flex flex-col items-center justify-center p-4 glass-panel">
                {screenSharing ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-indigo-600/10">
                    <Monitor size={30} className="text-indigo-600 animate-pulse mb-1" />
                    <span className="font-bold text-[10px] text-indigo-600">You are sharing screen</span>
                  </div>
                ) : (
                  <div className="text-center opacity-60">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xl mx-auto mb-2">
                      L
                    </div>
                    <span className="font-bold text-xs block text-foreground">Lucas</span>
                  </div>
                )}
                <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded bg-black/10 text-muted-foreground uppercase">
                  {screenSharing ? 'SHARING' : 'STUDENT'}
                </span>
              </div>
            </div>

            {/* In-Call Action Toggles */}
            <div className="rounded-3xl p-4 glass-panel flex items-center justify-around shrink-0 bg-slate-900 border border-white/10">
              <button 
                onClick={() => setMicOn(!micOn)}
                className={`p-3 rounded-2xl flex items-center justify-center text-white transition-all 
                  ${micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button 
                onClick={() => setVideoOn(!videoOn)}
                className={`p-3 rounded-2xl flex items-center justify-center text-white transition-all 
                  ${videoOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              <button 
                onClick={() => setScreenSharing(!screenSharing)}
                className={`p-3 rounded-2xl flex items-center justify-center text-white transition-all 
                  ${screenSharing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <Monitor size={18} />
              </button>

              <button 
                onClick={handleLeaveRoom}
                className="p-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1 px-5"
              >
                <LogOut size={16} /> <span className="text-xs font-bold">Leave</span>
              </button>
            </div>
          </section>

          {/* Column 3: Shared Group Notepad (lg:col-span-4) */}
          <section className="lg:col-span-4 rounded-3xl glass-panel flex flex-col justify-between overflow-hidden h-[35vh] lg:h-full">
            <div className="p-4 bg-white/10 dark:bg-slate-900/10 border-b border-border/40 flex items-center gap-2 shrink-0">
              <FileText size={15} className="text-primary animate-pulse" />
              <div>
                <h4 className="font-bold text-xs text-foreground uppercase">Collaborative Group Note</h4>
                <p className="text-[9px] text-muted-foreground">Changes sync dynamically in room</p>
              </div>
            </div>

            {/* Note text area content */}
            <div className="flex-1 p-5 overflow-hidden flex flex-col gap-2 h-full">
              <textarea
                value={sharedNote}
                onChange={(e) => setSharedNote(e.target.value)}
                placeholder="Start typing collective definitions or outline ideas..."
                className="w-full flex-1 bg-transparent border-0 resize-none focus:outline-none text-xs leading-relaxed placeholder:text-muted-foreground h-full"
              />
            </div>

            <div className="p-3 bg-white/10 dark:bg-slate-900/10 border-t border-border/40 shrink-0 text-center">
              <span className="text-[9px] text-muted-foreground">Note automatically updates for all active group members.</span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
