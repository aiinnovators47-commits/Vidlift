'use client';

import { useState } from 'react';
import { Copy, Download, RefreshCw } from 'lucide-react';
import SharedSidebar from '@/components/shared-sidebar';
import UpgradeCard from '@/components/upgrade-card';
import { CREDIT_COSTS } from '@/models/Credit';

export default function TagGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [tagCount, setTagCount] = useState(10);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [tagTitle, setTagTitle] = useState('');
  const [generatedTagTitle, setGeneratedTagTitle] = useState('');
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
      if (creditsData.credits < CREDIT_COSTS.TAG_GENERATOR) {
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
        body: JSON.stringify({ amount: CREDIT_COSTS.TAG_GENERATOR, feature: 'tag_generator' })
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

  const generateTags = async () => {
    if (!videoTitle.trim()) {
      alert('Please enter a video title');
      return;
    }

    // Check credits before generating
    const hasCredits = await checkCreditsBeforeGenerate();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const prompt = `Video title: "${videoTitle}"${videoDescription ? `\nDescription: ${videoDescription}` : ''}\n\nGenerate ${tagCount} relevant YouTube tags. Return only the tags, one per line.`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'tags'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const tags = data.result || [];
        setGeneratedTags(tags);
        
        // Deduct credits after successful generation
        await deductCredits();
        
        // Auto-save to history
        if (tags.length > 0) {
          const tagsData = {
            title: videoTitle,
            tags: tags,
            tagCount: tagCount,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(`video-tags-${Date.now()}`, JSON.stringify(tagsData));
        }
      } else {
        alert('Failed to generate tags');
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      alert('An error occurred while generating tags');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTags = () => {
    if (!generatedTagTitle || generatedTags.length === 0) {
      alert('Please enter a title');
      return;
    }

    const tagsData = {
      title: generatedTagTitle,
      tags: generatedTags,
      tagCount,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(`video-tags-${Date.now()}`, JSON.stringify(tagsData));
    alert(`Tags saved for: "${generatedTagTitle}"`);
    navigator.clipboard.writeText(generatedTags.join(', '));
    setShowUseModal(false);
    setTagTitle('');
    setGeneratedTagTitle('');
  };

  const copyTags = () => {
    navigator.clipboard.writeText(generatedTags.join(', '));
    alert('Tags copied!');
  };

  const resetForm = () => {
    setVideoTitle('');
    setVideoDescription('');
    setGeneratedTags([]);
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
                Tag Generator
              </h1>
              <p className="text-slate-600">
                Generate relevant tags for your YouTube videos powered by Gemini AI
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
                        Video Title
                      </label>
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="Enter video title..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Video Description (optional)
                      </label>
                      <textarea
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        placeholder="Paste description..."
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Number of Tags
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={tagCount}
                          onChange={(e) => setTagCount(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-orange-200 rounded-lg"
                        />
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={tagCount}
                          onChange={(e) => setTagCount(Math.max(5, Math.min(50, parseInt(e.target.value) || 10)))}
                          className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Generated Tags:</span>
                        <span className="font-bold text-orange-600">{generatedTags.length}</span>
                      </div>
                      {generatedTags.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Characters:</span>
                          <span className="font-bold text-orange-600">{generatedTags.join(', ').length}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={generateTags}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                      >
                        {loading ? 'Generating...' : 'Generate Tags'}
                      </button>
                      {generatedTags.length > 0 && (
                        <>
                          <button
                            onClick={() => setShowUseModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 4.414V12.5a1 1 0 002 0V4.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                            Use Tags
                          </button>
                          <button onClick={copyTags} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
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
                {generatedTags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      Generated Tags ({generatedTags.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedTags.map((tag, index) => (
                        <span key={index} className="inline-flex bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 text-orange-900 px-4 py-2 rounded-full text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Use Tags Modal */}
          {showUseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 rounded-t-xl">
                  <h2 className="text-xl font-bold text-white">Use Tags</h2>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6 space-y-4">
                  {!generatedTagTitle && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Title for This Tag Set
                        </label>
                        <input
                          type="text"
                          value={tagTitle}
                          onChange={(e) => setTagTitle(e.target.value)}
                          placeholder="Enter a title"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  {generatedTagTitle && (
                    <div className="space-y-4">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700">
                          <span className="font-bold block text-slate-900 mb-1">Title:</span>
                          {generatedTagTitle}
                        </p>
                      </div>
                      <div className="bg-slate-900 text-white rounded-lg p-4 text-xs overflow-y-auto max-h-48 font-mono whitespace-pre-wrap">
                        {generatedTags.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 px-6 py-4 bg-slate-50 rounded-b-xl border-t">
                  <button
                    onClick={() => {
                      setShowUseModal(false);
                      setTagTitle('');
                      setGeneratedTagTitle('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-400"
                  >
                    Close
                  </button>
                  {!generatedTagTitle ? (
                    <button
                      onClick={() => tagTitle.trim() && setGeneratedTagTitle(tagTitle)}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                    >
                      Continue
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setGeneratedTagTitle('')}
                        className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleUseTags}
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

        {/* Upgrade Card for insufficient credits */}
        {showUpgradeCard && (
          <UpgradeCard 
            requiredCredits={CREDIT_COSTS.TAG_GENERATOR}
            currentCredits={0}
            feature="Tag Generator"
            onClose={() => setShowUpgradeCard(false)}
          />
        )}
        </main>
      </div>
    </div>
  );
}
