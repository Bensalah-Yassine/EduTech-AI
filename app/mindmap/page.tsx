'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  Coins, 
  GitFork, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MousePointer
} from 'lucide-react';
import { subjects, subjectsColors } from '@/constants';

interface MindmapNode {
  id: string;
  name: string;
  children?: MindmapNode[];
}

export default function MindmapPage() {
  const [subject, setSubject] = useState('science');
  const [topic, setTopic] = useState('Photosynthesis');
  const [tree, setTree] = useState<MindmapNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(85);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);

  // Canvas Transform State (Pan & Zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync credits
  useEffect(() => {
    const storedCredits = localStorage.getItem('et_credits');
    if (storedCredits) setCredits(Number(storedCredits));
  }, []);

  // Helper: Generates simple unique IDs
  const makeId = () => Math.random().toString(36).substring(2, 9);

  // Build tree from AI response
  const formatNode = (rawNode: any): MindmapNode => {
    return {
      id: makeId(),
      name: rawNode.name || 'Concept',
      children: Array.isArray(rawNode.children) ? rawNode.children.map(formatNode) : []
    };
  };

  const generateMindmap = async () => {
    if (!topic.trim() || loading) return;

    if (credits <= 0) {
      alert("You have run out of AI Credits! Please refill them on your Dashboard. 🪙");
      return;
    }

    setLoading(true);
    setPan({ x: 0, y: 0 });
    setZoom(1);

    // Deduct credits
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem('et_credits', String(nextCredits));

    // Update stats
    try {
      const storedStats = localStorage.getItem('et_stats');
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        parsed.mindmapsCreated = (parsed.mindmapsCreated || 0) + 1;
        localStorage.setItem('et_stats', JSON.stringify(parsed));
      }
    } catch(e){}

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mindmap',
          topic
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const parsedTree = formatNode(resData.data);
        setTree(parsedTree);
        setSelectedNodeId(parsedTree.id);
      } else {
        throw new Error('Invalid format');
      }
    } catch (error) {
      console.error(error);
      // Fallback Tree
      const fallbackTree: MindmapNode = {
        id: 'root',
        name: topic,
        children: [
          {
            id: 'f1',
            name: 'Light Reactions',
            children: [
              { id: 'f1-1', name: 'Chlorophyll Activation' },
              { id: 'f1-2', name: 'Photolysis of Water' },
              { id: 'f1-3', name: 'ATP & NADPH Synthesis' }
            ]
          },
          {
            id: 'f2',
            name: 'Calvin Cycle (Dark Reactions)',
            children: [
              { id: 'f2-1', name: 'Carbon Fixation' },
              { id: 'f2-2', name: 'Reduction Stage' },
              { id: 'f2-3', name: 'RuBP Regeneration' }
            ]
          },
          {
            id: 'f3',
            name: 'Chloroplast Anatomy',
            children: [
              { id: 'f3-1', name: 'Thylakoid Membrane' },
              { id: 'f3-2', name: 'Stroma Fluid' }
            ]
          }
        ]
      };
      setTree(fallbackTree);
      setSelectedNodeId('root');
    } finally {
      setLoading(false);
    }
  };

  // AI Expand Node Action
  const expandNodeWithAI = async (nodeId: string, nodeName: string) => {
    if (credits <= 0) {
      alert("You have run out of AI Credits! Please refill them on your Dashboard. 🪙");
      return;
    }

    setExpandingNodeId(nodeId);

    // Deduct credits
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    localStorage.setItem('et_credits', String(nextCredits));

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mindmap',
          topic: `${topic} -> ${nodeName}`
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const subNodes = resData.data.children?.map(formatNode) || [];
        
        // Add subNodes to the specific node in our local tree
        if (tree) {
          const updated = { ...tree };
          const appendSubnodes = (curr: MindmapNode): boolean => {
            if (curr.id === nodeId) {
              curr.children = [...(curr.children || []), ...subNodes];
              return true;
            }
            if (curr.children) {
              for (let child of curr.children) {
                if (appendSubnodes(child)) return true;
              }
            }
            return false;
          };
          appendSubnodes(updated);
          setTree(updated);
        }
      }
    } catch (e) {
      console.error(e);
      // Local fallback expand
      if (tree) {
        const updated = { ...tree };
        const appendMock = (curr: MindmapNode): boolean => {
          if (curr.id === nodeId) {
            curr.children = [...(curr.children || []), { id: makeId(), name: 'Detailed Process' }, { id: makeId(), name: 'Important Variable' }];
            return true;
          }
          if (curr.children) {
            for (let child of curr.children) {
              if (appendMock(child)) return true;
            }
          }
          return false;
        };
        appendMock(updated);
        setTree(updated);
      }
    } finally {
      setExpandingNodeId(null);
    }
  };

  // Add Child Manually
  const handleAddChild = () => {
    if (!newNodeName.trim() || !selectedNodeId || !tree) return;

    const updated = { ...tree };
    const addNode = (curr: MindmapNode): boolean => {
      if (curr.id === selectedNodeId) {
        curr.children = [...(curr.children || []), { id: makeId(), name: newNodeName }];
        return true;
      }
      if (curr.children) {
        for (let child of curr.children) {
          if (addNode(child)) return true;
        }
      }
      return false;
    };

    addNode(updated);
    setTree(updated);
    setNewNodeName('');
  };

  // Delete Node Manually
  const handleDeleteNode = (nodeId: string) => {
    if (!tree || nodeId === tree.id) {
      alert("Cannot delete the root node!");
      return;
    }

    const updated = { ...tree };
    const removeNode = (parent: MindmapNode): boolean => {
      if (parent.children) {
        const index = parent.children.findIndex(c => c.id === nodeId);
        if (index > -1) {
          parent.children.splice(index, 1);
          return true;
        }
        for (let child of parent.children) {
          if (removeNode(child)) return true;
        }
      }
      return false;
    };

    removeNode(updated);
    setTree(updated);
    if (selectedNodeId === nodeId) setSelectedNodeId(tree.id);
  };

  // Canvas Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
    setIsDraggingCanvas(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCanvas) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // Layout calculations for coordinates
  // Root node: positioned center. Branch children left/right.
  const getCoordinates = (node: MindmapNode, depth = 0, index = 0, total = 1, parentX = 400, parentY = 250) => {
    let x = parentX;
    let y = parentY;

    if (depth === 0) {
      x = 400;
      y = 250;
    } else if (depth === 1) {
      const angle = (index / total) * 2 * Math.PI;
      const radius = 180;
      x = parentX + radius * Math.cos(angle);
      y = parentY + radius * Math.sin(angle);
    } else {
      // Grandchildren and beyond branch outward
      const angle = (index / total) * Math.PI - (Math.PI / 2); // semi circle
      const radius = 120;
      // Get direction vector of parent relative to root
      const rootDistX = parentX - 400;
      const rootDistY = parentY - 250;
      const len = Math.sqrt(rootDistX*rootDistX + rootDistY*rootDistY) || 1;
      const dirX = rootDistX / len;
      const dirY = rootDistY / len;

      x = parentX + dirX * radius + (Math.cos(angle) * 30);
      y = parentY + dirY * radius + (Math.sin(angle) * 30);
    }
    return { x, y };
  };

  // Flatten tree layout coordinates
  const layoutNodes: Array<{ node: MindmapNode; x: number; y: number; parentX?: number; parentY?: number; depth: number }> = [];
  
  const computeLayout = (node: MindmapNode, depth = 0, index = 0, total = 1, parentX = 400, parentY = 250) => {
    const { x, y } = getCoordinates(node, depth, index, total, parentX, parentY);
    
    layoutNodes.push({
      node,
      x,
      y,
      parentX: depth > 0 ? parentX : undefined,
      parentY: depth > 0 ? parentY : undefined,
      depth
    });

    if (node.children && node.children.length > 0) {
      node.children.forEach((child, i) => {
        computeLayout(child, depth + 1, i, node.children!.length, x, y);
      });
    }
  };

  if (tree) {
    computeLayout(tree);
  }

  const currentSubjectColor = subjectsColors[subject as keyof typeof subjectsColors] || '#BDE7FF';

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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-3xl p-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <GitFork className="text-primary" /> Visual Mindmap Creator
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Build structured visual maps of concepts, double-click nodes to expand sub-topics with AI.
          </p>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Left Side: Topic generation and node editing controls */}
        <section className="lg:col-span-1 rounded-3xl p-6 glass-panel flex flex-col gap-5 justify-between h-fit lg:h-full overflow-y-auto">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-extrabold text-sm text-foreground">Generate Mindmap</h3>
            </div>

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
              <label className="text-xs font-bold text-muted-foreground uppercase">Central Concept</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Supply & Demand"
                className="w-full bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button 
              onClick={generateMindmap}
              disabled={loading || !topic.trim()}
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/10"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Build Mindmap Structure
                </>
              )}
            </button>

            {/* Selected Node Editor panel */}
            {tree && selectedNodeId && (
              <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <MousePointer size={14} className="text-primary" />
                  <h4 className="font-bold text-xs text-foreground uppercase">Selected Node Actions</h4>
                </div>

                {/* Show node name */}
                <div className="p-3 bg-white/20 dark:bg-slate-900/10 border border-border/40 rounded-xl">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase block">Node Name</span>
                  <span className="font-semibold text-xs text-foreground block mt-0.5 truncate">
                    {layoutNodes.find(n => n.node.id === selectedNodeId)?.node.name}
                  </span>
                </div>

                {/* AI expansion button */}
                <button
                  onClick={() => {
                    const node = layoutNodes.find(n => n.node.id === selectedNodeId)?.node;
                    if (node) expandNodeWithAI(node.id, node.name);
                  }}
                  disabled={expandingNodeId !== null}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-colors"
                >
                  {expandingNodeId === selectedNodeId ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" /> Expanding...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} /> Expand Node with AI
                    </>
                  )}
                </button>

                {/* Add child form */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase">Add Sibling/Child Node</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      placeholder="Node text..."
                      className="flex-grow bg-white/40 dark:bg-slate-900/30 border border-border/60 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleAddChild}
                      className="bg-primary text-white rounded-xl p-2 flex items-center justify-center shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Delete node */}
                <button
                  onClick={() => handleDeleteNode(selectedNodeId)}
                  className="w-full mt-2 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 size={12} /> Delete Node
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Canvas: Renders mindmap graphic SVG + node HTML overlays */}
        <section 
          ref={canvasRef}
          className="lg:col-span-3 rounded-3xl glass-panel relative overflow-hidden h-[50vh] lg:h-full select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
            <button 
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-border/60 flex items-center justify-center hover:bg-white/80 transition-colors"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-border/60 flex items-center justify-center hover:bg-white/80 transition-colors"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
              className="w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-border/60 flex items-center justify-center hover:bg-white/80 transition-colors"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {tree ? (
            /* Transformed Canvas Container */
            <div 
              className="absolute inset-0 transition-transform duration-75 origin-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                width: '800px',
                height: '500px',
                left: 'calc(50% - 400px)',
                top: 'calc(50% - 250px)'
              }}
            >
              {/* SVG Link lines background */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {layoutNodes.map((lNode, index) => {
                  if (lNode.parentX === undefined || lNode.parentY === undefined) return null;
                  
                  // Compute smooth bezier curve between parent and child
                  const dx = lNode.x - lNode.parentX;
                  const dy = lNode.y - lNode.parentY;
                  const c1x = lNode.parentX + dx * 0.4;
                  const c1y = lNode.parentY;
                  const c2x = lNode.parentX + dx * 0.6;
                  const c2y = lNode.y;

                  return (
                    <path 
                      key={index}
                      d={`M ${lNode.parentX} ${lNode.parentY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${lNode.x} ${lNode.y}`}
                      fill="none"
                      stroke={currentSubjectColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.8"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>

              {/* HTML Nodes overlay */}
              {layoutNodes.map((lNode) => {
                const isSelected = selectedNodeId === lNode.node.id;
                const isRoot = lNode.depth === 0;

                return (
                  <div
                    key={lNode.node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(lNode.node.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      expandNodeWithAI(lNode.node.id, lNode.node.name);
                    }}
                    className={`absolute z-10 px-4 py-2.5 rounded-2xl cursor-pointer text-xs font-bold text-center border shadow-md flex items-center gap-1.5 transition-all duration-300 select-none
                      ${isSelected 
                        ? 'border-primary ring-2 ring-primary/30 text-foreground scale-105' 
                        : 'border-border/60 hover:scale-[1.02] text-foreground'
                      }`}
                    style={{
                      transform: 'translate(-50%, -50%)',
                      left: `${lNode.x}px`,
                      top: `${lNode.y}px`,
                      backgroundColor: isRoot ? '#fff' : currentSubjectColor,
                      minWidth: '100px',
                      maxWidth: '180px',
                    }}
                  >
                    {/* Level marker */}
                    {isRoot && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className="truncate flex-grow">{lNode.node.name}</span>
                    
                    {expandingNodeId === lNode.node.id && (
                      <RefreshCw size={10} className="animate-spin text-primary shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty Canvas Prompt */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-muted-foreground z-10 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4">
                <GitFork size={30} />
              </div>
              <h4 className="font-bold text-base text-foreground mb-1">Canvas Ready</h4>
              <p className="text-xs max-w-sm leading-relaxed">
                Choose a central concept in the configuration panel on the left and build a mindmap.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
