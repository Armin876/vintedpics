import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { blobToBase64 } from '../types';

const VeoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const checkApiKey = async (): Promise<boolean> => {
    const aistudio = (window as any).aistudio;
    if (!aistudio) {
      alert("AI Studio environment not detected.");
      return false;
    }
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      try {
        await aistudio.openSelectKey();
        return true; // Assume success to mitigate race condition
      } catch (e) {
        console.error(e);
        return false;
      }
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await blobToBase64(file);
      setUploadImage(base64);
    }
  };

  const generateVideo = async () => {
    if (!prompt) return;
    
    // Ensure user has selected a paid key for Veo
    const hasKey = await checkApiKey();
    if (!hasKey) return;

    setLoading(true);
    setVideoUrl(null);
    setStatus('Initializing generation...');

    try {
      // Create new instance after key selection to ensure updated env
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation;

      const config = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      };

      if (uploadImage) {
        setStatus('Uploading image & generating video...');
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          image: {
            imageBytes: uploadImage,
            mimeType: 'image/jpeg',
          },
          config: config
        });
      } else {
        setStatus('Generating video from text...');
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: config
        });
      }

      // Poll for completion
      while (!operation.done) {
        setStatus('Rendering video... this may take a minute.');
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (downloadLink && process.env.API_KEY) {
        setStatus('Downloading video...');
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else {
        throw new Error("No video URI returned");
      }

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        alert("API Key issue. Please re-select your key.");
        (window as any).aistudio?.openSelectKey();
      } else {
        alert(`Video generation failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-400 mb-2">Veo Video Studio</h2>
        <p className="text-slate-400">Transform text and images into high-quality videos.</p>
      </div>

      <div className="bg-slate-800 p-8 rounded-2xl border border-purple-500/30 shadow-lg">
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:border-purple-500 focus:outline-none min-h-[100px]"
              placeholder="A neon hologram of a cat driving at top speed..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900 file:text-purple-300 hover:file:bg-purple-800"
            />
            {uploadImage && (
              <div className="mt-2 h-20 w-20 rounded overflow-hidden border border-slate-600">
                <img src={`data:image/jpeg;base64,${uploadImage}`} alt="Preview" className="h-full w-full object-cover"/>
              </div>
            )}
          </div>

          <div className="pt-4">
             <button
              onClick={generateVideo}
              disabled={loading || !prompt}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading || !prompt
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/50'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {status}
                </span>
              ) : (
                'Generate Video'
              )}
            </button>
            <p className="text-xs text-center mt-2 text-slate-500">
              Note: Requires a billing-enabled project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline text-purple-400">Learn more</a>.
            </p>
          </div>
        </div>
      </div>

      {videoUrl && (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 animate-in fade-in zoom-in duration-500">
          <h3 className="text-xl font-bold mb-4 text-white">Generated Video</h3>
          <div className="rounded-xl overflow-hidden shadow-2xl bg-black">
            <video controls src={videoUrl} className="w-full max-h-[500px]" autoPlay loop />
          </div>
        </div>
      )}
    </div>
  );
};

export default VeoStudio;