import React, { useState } from 'react';
import { generateVeoVideo, generateProImage, generateWishes, planParty } from '../../services/geminiService';
import { GeminiModel } from '../../types';

interface FeatureToolsProps {
  onBack: () => void;
}

const FeatureTools: React.FC<FeatureToolsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'veo' | 'pro' | 'wishes' | 'plan'>('wishes');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Inputs
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (activeTab === 'wishes') {
        const text = await generateWishes(prompt);
        setResult(text);
      } else if (activeTab === 'plan') {
        const text = await planParty(prompt);
        setResult(text);
      } else if (activeTab === 'pro') {
        const url = await generateProImage(prompt, imageSize);
        setResult(url);
      } else if (activeTab === 'veo') {
        if (!imageFile) {
            alert("Please upload an image first");
            setLoading(false);
            return;
        }
        const base64 = await fileToBase64(imageFile);
        // Strip data prefix for API if needed, but SDK usually handles or expects base64 bytes
        // The service function expects raw base64 usually, let's clean it in service or here.
        // Actually service expects base64 string.
        const cleanBase64 = base64.split(',')[1];
        const videoUrl = await generateVeoVideo(cleanBase64, prompt, aspectRatio);
        setResult(videoUrl);
      }
    } catch (e) {
      alert("An error occurred. If using Pro/Veo, ensure you selected a paid API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <button onClick={onBack} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-1">
        &larr; Back to Home
      </button>
      
      <h2 className="text-3xl font-bold mb-6 text-slate-800">AI Birthday Tools</h2>
      
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'wishes', label: '⚡ Fast Wishes', icon: 'bolt' },
          { id: 'plan', label: '🧠 Party Planner', icon: 'psychology' },
          { id: 'pro', label: '🖼️ Pro Cards', icon: 'image' },
          { id: 'veo', label: '🎬 Magic Video', icon: 'movie' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setResult(null); setPrompt(''); }}
                className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 max-w-4xl mx-auto">
        <div className="space-y-6">
            
            {/* Dynamic Inputs based on Tab */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {activeTab === 'wishes' && "Who is the birthday for?"}
                    {activeTab === 'plan' && "Describe the party constraints (budget, guests, theme)"}
                    {activeTab === 'pro' && "Describe the perfect birthday card image"}
                    {activeTab === 'veo' && "Describe how the image should move"}
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 resize-none"
                    placeholder="Type here..."
                />
            </div>

            {activeTab === 'pro' && (
                 <div className="flex gap-4">
                    {['1K', '2K', '4K'].map(size => (
                        <label key={size} className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="size" 
                                checked={imageSize === size} 
                                onChange={() => setImageSize(size as any)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span>{size}</span>
                        </label>
                    ))}
                 </div>
            )}

            {activeTab === 'veo' && (
                <div className="grid gap-4">
                    <label className="block w-full p-4 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer text-center">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        {imageFile ? <span className="text-green-600 font-medium">{imageFile.name}</span> : <span className="text-slate-500">Upload a photo to animate</span>}
                    </label>
                    <div className="flex gap-4">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} />
                            Landscape (16:9)
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} />
                            Portrait (9:16)
                         </label>
                    </div>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading || !prompt}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${
                    loading || !prompt 
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-[1.02]'
                }`}
            >
                {loading ? 'Generating Magic...' : 'Generate'}
            </button>

            {/* Results Display */}
            {result && (
                <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4 text-slate-800">Result</h3>
                    
                    {(activeTab === 'wishes' || activeTab === 'plan') && (
                        <div className="bg-slate-50 p-6 rounded-xl prose prose-slate max-w-none whitespace-pre-wrap font-serif">
                            {result}
                        </div>
                    )}

                    {activeTab === 'pro' && (
                        <div className="rounded-xl overflow-hidden shadow-lg">
                            <img src={result} alt="Generated" className="w-full h-auto" />
                            <a href={result} download="birthday-card.png" className="block w-full text-center py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 transition">Download High Quality</a>
                        </div>
                    )}

                    {activeTab === 'veo' && (
                        <div className="rounded-xl overflow-hidden shadow-lg">
                            <video controls src={result} className="w-full h-auto" />
                        </div>
                    )}
                </div>
            )}

            {(activeTab === 'veo' || activeTab === 'pro') && (
                <p className="text-xs text-slate-400 text-center mt-4">
                    *Requires a paid Google Cloud project API Key. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">Learn more</a>
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default FeatureTools;
