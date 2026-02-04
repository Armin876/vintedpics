import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImageGenConfig } from '../types';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<ImageGenConfig['aspectRatio']>('1:1');
  const [size, setSize] = useState<ImageGenConfig['imageSize']>('1K');

  const generate = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: size
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-amber-400">Pro Image Generator</h2>
        <p className="text-slate-400">Create high-fidelity images with Nano Banana Pro (Gemini 3 Pro Image).</p>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-amber-500/30 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Controls */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none"
              placeholder="A futuristic city with flying cars..."
            />
          </div>

          <div>
             <label className="block text-sm text-slate-300 mb-2">Aspect Ratio</label>
             <select 
               value={aspectRatio} 
               onChange={(e) => setAspectRatio(e.target.value as any)}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
             >
               <option value="1:1">Square (1:1)</option>
               <option value="16:9">Landscape (16:9)</option>
               <option value="9:16">Portrait (9:16)</option>
               <option value="3:4">Portrait (3:4)</option>
               <option value="4:3">Landscape (4:3)</option>
             </select>
          </div>

          <div>
             <label className="block text-sm text-slate-300 mb-2">Quality/Size</label>
             <select 
               value={size} 
               onChange={(e) => setSize(e.target.value as any)}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
             >
               <option value="1K">Standard (1K)</option>
               <option value="2K">High (2K)</option>
               <option value="4K">Ultra (4K)</option>
             </select>
          </div>

          <button
            onClick={generate}
            disabled={loading || !prompt}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              loading || !prompt ? 'bg-slate-600 text-slate-400' : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {loading ? 'Generating...' : 'Generate Art'}
          </button>
        </div>

        {/* Display */}
        <div className="md:col-span-2 bg-slate-900 rounded-xl flex items-center justify-center min-h-[400px] border border-slate-700">
          {generatedImage ? (
            <img src={generatedImage} alt="Generated" className="max-h-[500px] max-w-full object-contain rounded-lg shadow-2xl" />
          ) : (
            <div className="text-slate-600 flex flex-col items-center">
               <span className="text-4xl mb-2">🎨</span>
               <span>Image will appear here</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ImageGenerator;