'use client';

import { useState } from 'react';
import { Copy, Download, RefreshCw } from 'lucide-react';
import SharedSidebar from '@/components/shared-sidebar';
import UpgradeCard from '@/components/upgrade-card';
import { CREDIT_COSTS } from '@/models/Credit';

export default function TitleGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [videoTopic, setVideoTopic] = useState('');
  const [titleCount, setTitleCount] = useState(5);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [titleSetName, setTitleSetName] = useState('');
  const [generatedTitleSetName, setGeneratedTitleSetName] = useState('');
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [showUpgradeCard, setShowUpgradeCard] = useState(false);

  // Check if user has enough credits before generating
  const checkCreditsBeforeGenerate = async (): Promise<boolean> => {
    try {
      const creditsRes = await fetch('/api/credits');
      if (!creditsRes.ok) {
        alert('Failed to check credits');
        return false;
      }
      
      const creditsData = await creditsRes.json();
      if (creditsData.credits < CREDIT_COSTS.TITLE_GENERATOR) {
        setShowUpgradeCard(true);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error checking credits:', err);
      alert('Failed to verify credits');
      return false;
    }
  };

  // Deduct credits after successful generation
  const deductCredits = async () => {
    try {
      const deductRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: CREDIT_COSTS.TITLE_GENERATOR, feature: 'title_generator' })
      });
      
      const result = await deductRes.json();
      
      if (!deductRes.ok) {
        if (result.insufficient) {
          setShowUpgradeCard(true);
        }
        return false;
      }
      
      if (result.success) {
        // Dispatch event to update credits in sidebar
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: result.credits } }));
      }
      return true;
    } catch (err) {
      console.error('Error deducting credits:', err);
      return false;
    }
  };

  const generateTitles = async () => {
    if (!videoTopic.trim()) {
      alert('Please enter a video topic');
      return;
    }

    // Check credits before generating
    const hasCredits = await checkCreditsBeforeGenerate();
    if (!hasCredits) return;

    setLoading(true);
    setInsufficientCredits(false);
    try {
      const prompt = `Generate ${titleCount} engaging and SEO-optimized YouTube video titles for the topic: "${videoTopic}". Return only the titles, one per line. Make them catchy, clickable, and include relevant keywords.`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'title'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const titles = data.result || [];
        setGeneratedTitles(titles);
        
        // Deduct credits after successful generation
        await deductCredits();
        
        // Auto-save to history
        if (titles.length > 0) {
          const titlesData = {
            name: videoTopic,
            topic: videoTopic,
            titles: titles,
            titleCount: titleCount,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(`video-titles-${Date.now()}`, JSON.stringify(titlesData));
        }
      } else {
        alert('Failed to generate titles');
      }
    } catch (error) {
      console.error('Error generating titles:', error);
      alert('An error occurred while generating titles');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTitles = () => {
    if (!generatedTitleSetName || generatedTitles.length === 0) {
      alert('Please enter a name');
      return;
    }

    const titlesData = {
      name: generatedTitleSetName,
      topic: videoTopic,
      titles: generatedTitles,
      titleCount,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(`video-titles-${Date.now()}`, JSON.stringify(titlesData));
    alert(`Titles saved for: "${generatedTitleSetName}"`);
    navigator.clipboard.writeText(generatedTitles.join('\n'));
    setShowUseModal(false);
    setTitleSetName('');
    setGeneratedTitleSetName('');
  };

  const copyTitles = () => {
    navigator.clipboard.writeText(generatedTitles.join('\n'));
    alert('Titles copied!');
  };

  const resetForm = () => {
    setVideoTopic('');
    setGeneratedTitles([]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="flex">
        <SharedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <main className={`flex-1 pt-16 md:pt-18 px-3 sm:px-4 md:px-6 pb-24 md:pb-12 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex fixed md:top-20 md:left-3 z-30 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm items-center justify-center"
            aria-label="Toggle sidebar"
          >
            <svg className={`w-5 h-5 text-gray-700 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Title Generator
              </h1>
              <p className="text-slate-600">
                Generate engaging and SEO-optimized video titles powered by Gemini AI
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Settings */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Settings</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Video Topic
                      </label>
                      <input
                        type="text"
                        value={videoTopic}
                        onChange={(e) => setVideoTopic(e.target.value)}
                        placeholder="Enter video topic or keyword..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Number of Titles
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="range"
                          min="3"
                          max="20"
                          value={titleCount}
                          onChange={(e) => setTitleCount(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-blue-200 rounded-lg"
                        />
                        <input
                          type="number"
                          min="3"
                          max="20"
                          value={titleCount}
                          onChange={(e) => setTitleCount(Math.max(3, Math.min(20, parseInt(e.target.value) || 5)))}
                          className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Generated Titles:</span>
                        <span className="font-bold text-blue-600">{generatedTitles.length}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={generateTitles}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
                      >
                        {loading ? 'Generating...' : 'Generate Titles'}
                      </button>
                      {generatedTitles.length > 0 && (
                        <>
                          <button
                            onClick={() => setShowUseModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 4.414V12.5a1 1 0 002 0V4.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                            Use Titles
                          </button>
                          <button onClick={copyTitles} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
                            <Copy size={18} />
                            Copy
                          </button>
                          <button onClick={resetForm} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-400 text-white rounded-lg font-semibold hover:bg-slate-500">
                            <RefreshCw size={18} />
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Preview */}
              <div className="lg:col-span-2">
                {generatedTitles.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      Generated Titles ({generatedTitles.length})
                    </h3>
                    <div className="space-y-2">
                      {generatedTitles.map((title, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-slate-900 text-sm font-medium flex-1">{title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Use Titles Modal */}
          {showUseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 rounded-t-xl">
                  <h2 className="text-xl font-bold text-white">Use Titles</h2>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6 space-y-4">
                  {!generatedTitleSetName && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Name for This Title Set
                        </label>
                        <input
                          type="text"
                          value={titleSetName}
                          onChange={(e) => setTitleSetName(e.target.value)}
                          placeholder="Enter a name"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  {generatedTitleSetName && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700">
                          <span className="font-bold block text-slate-900 mb-1">Name:</span>
                          {generatedTitleSetName}
                        </p>
                      </div>
                      <div className="bg-slate-900 text-white rounded-lg p-4 text-xs overflow-y-auto max-h-48 font-mono whitespace-pre-wrap">
                        {generatedTitles.join('\n')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 px-6 py-4 bg-slate-50 rounded-b-xl border-t">
                  <button
                    onClick={() => {
                      setShowUseModal(false);
                      setTitleSetName('');
                      setGeneratedTitleSetName('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-400"
                  >
                    Close
                  </button>
                  {!generatedTitleSetName ? (
                    <button
                      onClick={() => titleSetName.trim() && setGeneratedTitleSetName(titleSetName)}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                    >
                      Continue
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setGeneratedTitleSetName('')}
                        className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleUseTitles}
                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600"
                      >
                        Save & Use
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Card */}
          {showUpgradeCard && <UpgradeCard />}
        </main>
      </div>
    </div>
  );
}
