import React, { useState, useEffect } from 'react';
import CameraCapture from './components/CameraCapture';
import BirthdayAnimation from './components/BirthdayAnimation';
import FeatureTools from './components/Tools/FeatureTools';
import { generateBirthdayImagesFromFace, editImage } from './services/geminiService';
import { AppRoute } from './types';

function App() {
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  const [birthdayName, setBirthdayName] = useState('');
  const [shareLink, setShareLink] = useState('');
  
  // Recipient Flow State
  const [images, setImages] = useState<string[]>([]);
  const [step, setStep] = useState<'camera' | 'generating' | 'animation' | 'download'>('camera');
  const [loadingText, setLoadingText] = useState('Creating magic...');
  
  // Image Editing State
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/celebrate')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        const name = params.get('name');
        if (name) setBirthdayName(name);
        setRoute(AppRoute.CELEBRATE);
      } else if (hash.startsWith('#/tools')) {
        setRoute(AppRoute.TOOLS);
      } else {
        setRoute(AppRoute.HOME);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCreateLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}#/celebrate?name=${encodeURIComponent(birthdayName)}`;
    setShareLink(link);
    setRoute(AppRoute.CREATE_LINK);
  };

  const handleCapture = async (base64: string) => {
    setStep('generating');
    setLoadingText('Generating your birthday surprises... This might take a moment.');
    try {
        const generatedImages = await generateBirthdayImagesFromFace(base64);
        if (generatedImages.length > 0) {
            setImages(generatedImages);
            setStep('animation');
        } else {
            alert("Could not generate images. Please try again.");
            setStep('camera');
        }
    } catch (e) {
        console.error(e);
        alert("Something went wrong. Please check your connection.");
        setStep('camera');
    }
  };

  const handleEditImage = async () => {
    if (!selectedImageForEdit || !editPrompt) return;
    setIsEditing(true);
    try {
        // Strip prefix if needed, or pass full data url if service handles it. Service handles it.
        const result = await editImage(selectedImageForEdit, editPrompt);
        if (result) {
            // Update the images array with the edited version
            setImages(prev => prev.map(img => img === selectedImageForEdit ? result : img));
            setSelectedImageForEdit(null);
            setEditPrompt('');
        }
    } catch (e) {
        alert("Failed to edit image.");
    } finally {
        setIsEditing(false);
    }
  };

  // ---------------- Render Views ----------------

  if (route === AppRoute.TOOLS) {
    return <FeatureTools onBack={() => { window.location.hash = ''; }} />;
  }

  if (route === AppRoute.CREATE_LINK) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Link Created!</h2>
          <p className="text-gray-600">Share this magic link with {birthdayName} for their surprise.</p>
          
          <div className="bg-gray-100 p-3 rounded-lg break-all text-sm font-mono text-gray-600 border border-gray-200">
            {shareLink}
          </div>
          
          <button 
            onClick={() => { navigator.clipboard.writeText(shareLink); alert('Copied!'); }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Copy Link
          </button>
          <button 
             onClick={() => { window.location.hash = ''; setRoute(AppRoute.HOME); }}
             className="text-sm text-gray-500 hover:underline"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  if (route === AppRoute.CELEBRATE) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {step === 'camera' && (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1513151241138-65922e4e9ea2?q=80&w=2000&auto=format&fit=crop")'}}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="relative z-10 w-full max-w-lg text-center space-y-8">
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
                Happy Birthday {birthdayName}!
              </h1>
              <p className="text-lg text-gray-200">We have a special AI surprise for you.</p>
              <CameraCapture onCapture={handleCapture} />
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
             <h2 className="text-2xl font-bold animate-pulse">{loadingText}</h2>
             <p className="text-slate-400 max-w-sm">We are using advanced AI to craft festive images just for you.</p>
          </div>
        )}

        {step === 'animation' && (
          <BirthdayAnimation images={images} onComplete={() => setStep('download')} />
        )}

        {step === 'download' && (
          <div className="min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-4xl font-bold text-center mb-2">Your Birthday Gallery</h2>
                <p className="text-center text-slate-500 mb-8">Download your favorites!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {images.map((img, idx) => (
                        <div key={idx} className="group relative bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-xl transition-shadow">
                            <img src={img} alt="Generated" className="w-full aspect-square object-cover" />
                            <div className="p-4 flex flex-col gap-2">
                                <a 
                                    href={img} 
                                    download={`birthday-${idx}.png`}
                                    className="w-full py-2 bg-pink-500 text-white text-center rounded-lg font-medium hover:bg-pink-600 transition"
                                >
                                    Download
                                </a>
                                <button
                                    onClick={() => setSelectedImageForEdit(img)}
                                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition text-sm flex items-center justify-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Edit with AI
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => { window.location.hash = '#/tools'; }} className="inline-flex items-center gap-2 text-slate-500 hover:text-pink-600 transition">
                        <span>Try more AI tools</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {selectedImageForEdit && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold">Edit Image</h3>
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                             <img src={selectedImageForEdit} alt="Editing" className="w-full h-full object-contain" />
                             {isEditing && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div></div>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">What should we change?</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., Add a retro filter, remove background..."
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setSelectedImageForEdit(null)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                            <button 
                                onClick={handleEditImage}
                                disabled={!editPrompt || isEditing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                Generate Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Route: HOME
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 text-center space-y-8">
        <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.707 3.707 0 014.11 0 1.704 1.704 0 001.89 0 3.707 3.707 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 11.732V11a2 2 0 00-2-2V8a2 2 0 00-2-2v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V6zm-3 8a1 1 0 00-1 1v2a1 1 0 003 0v-2a1 1 0 00-1-1H5z" clipRule="evenodd" />
            </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
          Create the Ultimate <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">AI Birthday Surprise</span>
        </h1>
        
        <p className="text-lg text-slate-600 leading-relaxed">
          Generate a personalized birthday experience for your friend. We'll create custom images starring them, a video animation, and more!
        </p>

        <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
            <input 
                type="text" 
                placeholder="Birthday Person's Name"
                value={birthdayName}
                onChange={(e) => setBirthdayName(e.target.value)}
                className="w-full px-6 py-4 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-lg"
            />
            <button
                onClick={handleCreateLink}
                disabled={!birthdayName}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transform transition-all hover:scale-[1.02] ${
                    birthdayName 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
            >
                Start Surprise
            </button>
        </div>
        
        <div className="pt-8 border-t border-slate-200">
             <button onClick={() => { window.location.hash = '#/tools'; }} className="text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-2 w-full">
                <span>Explore AI Tools (Video, Pro Cards & More)</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">New</span>
             </button>
        </div>
      </div>
    </div>
  );
}

export default App;
