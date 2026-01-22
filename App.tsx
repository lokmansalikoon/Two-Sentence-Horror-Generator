
import React, { useState, useEffect } from 'react';
import { Scene } from './types';
import { expandPrompt, generateImage, editImageWithNudge } from './services/geminiService';
import { SceneCard } from './components/SceneCard';
import { ErrorAlert } from './components/ErrorAlert';

// Removed conflicting Window declaration; aistudio is assumed to be globally available as per guidelines.

const STYLE_OPTIONS = [
  "Noir Horror",
  "Found Footage",
  "Junji Ito Manga",
  "Psychological/Surreal Horror"
];

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [sentence1, setSentence1] = useState('');
  const [sentence2, setSentence2] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    // Accessing window.aistudio helper provided by the platform
    const selected = await (window as any).aistudio.hasSelectedApiKey();
    setHasKey(selected);
  };

  const handleConnect = async () => {
    await (window as any).aistudio.openSelectKey();
    // Assume success as per platform guidelines to avoid race condition
    setHasKey(true);
  };

  const runAutomation = async () => {
    if (!sentence1.trim() || !sentence2.trim()) {
      setError("Please provide both sentences to begin the workflow.");
      return;
    }
    setError(null);
    setIsProcessing(true);

    const targetScenes: Scene[] = [
      { id: 1, originalSentence: sentence1, expandedPrompt: null, imageUrl: null, status: 'idle', error: null },
      { id: 2, originalSentence: sentence2, expandedPrompt: null, imageUrl: null, status: 'idle', error: null }
    ];
    setScenes(targetScenes);

    for (const scene of targetScenes) {
      try {
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'expanding' } : s));
        const expanded = await expandPrompt(scene.originalSentence, selectedStyle);
        
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, expandedPrompt: expanded, status: 'generating' } : s));
        const url = await generateImage(expanded);
        
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl: url, status: 'completed' } : s));
      } catch (err: any) {
        const msg = err.message || "Production halted due to an internal error.";
        
        // Handle "Requested entity was not found" error by prompting user to select a paid key again
        if (msg.includes("Requested entity was not found.")) {
          await (window as any).aistudio.openSelectKey();
          setHasKey(true);
        }

        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'error', error: msg } : s));
        setError(msg);
        break;
      }
    }
    setIsProcessing(false);
  };

  const handleRegenerate = async (id: number) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;
    
    setIsProcessing(true);
    try {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'expanding', error: null } : s));
      const expanded = await expandPrompt(scene.originalSentence, selectedStyle);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, expandedPrompt: expanded, status: 'generating' } : s));
      const url = await generateImage(expanded);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, imageUrl: url, status: 'completed' } : s));
    } catch (err: any) {
      const msg = err.message || "Regeneration failed.";
      if (msg.includes("Requested entity was not found.")) {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
      }
      setError(msg);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'error', error: msg } : s));
    }
    setIsProcessing(false);
  };

  const handleEdit = async (id: number, nudge: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene || !scene.imageUrl || !nudge) return;

    setIsProcessing(true);
    try {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'generating' } : s));
      const newUrl = await editImageWithNudge(scene.imageUrl, nudge);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, imageUrl: newUrl, status: 'completed' } : s));
    } catch (err: any) {
      const msg = err.message || "Edit failed.";
      if (msg.includes("Requested entity was not found.")) {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
      }
      setError(msg);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'error', error: msg } : s));
    }
    setIsProcessing(false);
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121216] border border-white/5 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/>
            </svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter">System Offline</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              To begin production, you must connect a valid Google AI Studio API key from a paid project.
            </p>
          </div>
          <button 
            onClick={handleConnect}
            className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-full transition-all shadow-xl shadow-cyan-900/20"
          >
            Connect to AI Studio
          </button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-cyan-500 transition-colors">
            Billing Documentation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 lg:p-20">
      <div className="max-w-6xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
              <h1 className="text-3xl font-black uppercase tracking-tighter">Director.AI</h1>
            </div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.5em]">Economy Production Workflow</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Output: 1920x1920 JPG</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-[340px_1fr] gap-20">
          <aside className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2">Style Protocol</label>
                <div className="grid grid-cols-1 gap-2">
                  {STYLE_OPTIONS.map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      disabled={isProcessing}
                      className={`text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        selectedStyle === style 
                        ? 'bg-cyan-600/10 border-cyan-500 text-cyan-400' 
                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2">Scene 01 Ingest</label>
                <textarea 
                  value={sentence1}
                  onChange={(e) => setSentence1(e.target.value)}
                  placeholder="The old man found a mysterious key..."
                  disabled={isProcessing}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm resize-none outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2">Scene 02 Ingest</label>
                <textarea 
                  value={sentence2}
                  onChange={(e) => setSentence2(e.target.value)}
                  placeholder="The door opened to a void of screaming stars..."
                  disabled={isProcessing}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm resize-none outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <button 
              disabled={isProcessing}
              onClick={runAutomation}
              className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-2xl shadow-cyan-900/30 active:scale-95"
            >
              {isProcessing ? "Producing..." : "Start Sequence"}
            </button>

            {error && <ErrorAlert message={error} />}
          </aside>

          <main className="grid md:grid-cols-2 gap-10">
            {scenes.length > 0 ? (
              scenes.map(scene => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  onRegenerate={handleRegenerate}
                  onEdit={handleEdit}
                  isLocked={isProcessing}
                />
              ))
            ) : (
              <div className="col-span-2 h-[500px] border border-dashed border-white/10 rounded-[4rem] flex flex-col items-center justify-center opacity-20 space-y-4">
                <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-sm" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[1em]">Awaiting Data</span>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
