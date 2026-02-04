import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { blobToBase64 } from '../types';

type QualityOption = '1K' | '2K' | '4K';

const VintedStudio: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Een pluizig wit vloerkleed');
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<QualityOption>('1K');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await blobToBase64(file);
      setOriginalImage(base64);
      setGeneratedImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !process.env.API_KEY) return;

    setLoading(true);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Select model based on quality
      // 1K -> gemini-2.5-flash-image (Fast, efficient)
      // 2K/4K -> gemini-3-pro-image-preview (High fidelity, supports resolution config)
      const model = quality === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';

      const config: any = {};
      
      // Only add imageConfig for the Pro model which supports explicit sizing
      if (quality !== '1K') {
        config.imageConfig = {
          imageSize: quality
        };
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            {
              inlineData: {
                data: originalImage,
                mimeType: 'image/jpeg', 
              },
            },
            {
              text: `Replace the background with ${prompt}`,
            },
          ],
        },
        config: config
      });

      // Extract image from response
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Er is iets misgegaan bij het genereren. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const presetPrompts = [
    "Een pluizig wit boho vloerkleed",
    "Een lichte eikenhouten vloer",
    "Een strakke betonvloer",
    "Een vintage Perzisch tapijt",
    "Een zacht beige slaapkamer tapijt",
    "Een luxe witte marmeren vloer",
    "Een klassieke visgraat parketvloer",
    "Een modern industrieel loft interieur",
    "Een lichte Scandinavische houten vloer",
    "Een minimalistische witte fotostudio",
    "Een warme terracotta tegelvloer",
    "Een rustieke houten veranda",
    "Een abstracte pastelkleurige achtergrond",
    "Een zonnig strand met wit zand",
    "Een gezellige herfstbos achtergrond",
    "Een strakke zwarte studio achtergrond",
    "Een creatieve graffiti muur",
    "Een industriële bakstenen muur",
    "Een zomers bloemenveld",
    "Een moderne neon stad sfeer",
    "Een elegant fluwelen gordijn",
    "Een rustgevende Japanse zen tuin",
    "Een chique Parijse straat",
    "Een kleurrijke Memphis design achtergrond",
    "Een mystiek bos met mist",
    "Een minimalistisch betonnen podium",
    "Een zonnig mediterraan terras",
    "Een luxe inloopkast achtergrond",
    "Een artistieke aquarel achtergrond",
    "Een lavendelveld in de Provence",
    "Een chique hotellobby",
    "Een besneeuwd winterlandschap",
    "Een abstracte gouden textuur",
    "Een rustiek stenen muurtje",
    "Een futuristische neon tunnel",
    "Een zacht pastel wolkendek",
    "Een vintage bibliotheek met boeken",
    "Een kleurrijke Marokkaanse tegelvloer",
    "Een rustieke boerenschuur",
    "Een moderne glazen loopbrug",
    "Een knusse leeshoek met planten",
    "Een luxe marmeren badkamer",
    "Een tropisch regenwoud",
    "Een strakke witte podium trap",
    "Een gezellige koffiebar",
    "Een zonnig terras in Parijs",
    "Een strakke witte bakstenen muur",
    "Een gezellige Scandinavische woonkamer",
    "Een kleurrijk bloemenveld in de lente"
  ];

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center pt-8 pb-2 space-y-4">
        <div className="inline-block relative">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-400 to-indigo-500 pb-2">
            VintedPics
          </h1>
          <div className="absolute -top-6 -right-8 text-2xl animate-bounce">✨</div>
        </div>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          Transformeer je kledingfoto's in seconden. Verwijder rommel, kies een professionele achtergrond en verkoop sneller.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <span className="bg-teal-500/20 text-teal-300 w-8 h-8 rounded-full flex items-center justify-center text-sm border border-teal-500/50">1</span>
                 Jouw Foto
               </h3>
               {originalImage && (
                 <button 
                   onClick={() => { setOriginalImage(null); setGeneratedImage(null); }}
                   className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20 transition-colors"
                 >
                   Verwijderen
                 </button>
               )}
            </div>
            
            <div 
              className={`flex-grow border-2 border-dashed rounded-2xl min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                originalImage 
                  ? 'border-teal-500/50 bg-black/40' 
                  : 'border-slate-600 hover:border-teal-400 hover:bg-slate-800/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {originalImage ? (
                <img src={`data:image/jpeg;base64,${originalImage}`} alt="Original" className="h-full w-full object-contain p-4" />
              ) : (
                <div className="text-center p-8 space-y-4 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-xl font-bold text-white mb-1">Upload foto</span>
                    <span className="text-sm text-slate-400">Sleep bestand of klik hier</span>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
        </div>

        {/* Settings Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl h-full flex flex-col">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <span className="bg-purple-500/20 text-purple-300 w-8 h-8 rounded-full flex items-center justify-center text-sm border border-purple-500/50">2</span>
              Instellingen
            </h3>
            
            {/* Prompt Input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Achtergrond Beschrijving</label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 min-h-[120px] resize-none transition-all placeholder-slate-600 text-lg leading-relaxed"
                  placeholder="Bijv. Een luxe marmeren vloer..."
                />
                <div className="absolute bottom-3 right-3">
                  <div className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">AI</div>
                </div>
              </div>
            </div>

            {/* Quality Selector */}
             <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Kwaliteit & Resolutie</label>
              <div className="grid grid-cols-3 gap-3 p-1 bg-slate-950/50 rounded-xl border border-slate-700">
                {(['1K', '2K', '4K'] as QualityOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQuality(opt)}
                    className={`py-3 px-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      quality === opt 
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-lg border border-slate-600' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="block text-lg">{opt === '1K' ? 'Standaard' : opt === '2K' ? 'Hoog' : 'Ultra'}</span>
                    <span className="text-[10px] font-normal opacity-70">{opt} • {opt === '1K' ? 'Snel' : 'Trager'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Presets */}
            <div className="mb-8 flex-grow">
               <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Inspiratie</label>
               <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {presetPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className={`text-xs px-4 py-2 rounded-full transition-all border ${
                      prompt === p 
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-medium' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!originalImage || loading}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center relative overflow-hidden group ${
                !originalImage || loading
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/25 hover:scale-[1.01]'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="animate-pulse">Magie aan het werk...</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <span>✨</span> Genereer Nieuwe Foto
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {generatedImage && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-teal-500/30 p-8 rounded-[2.5rem] shadow-2xl shadow-teal-900/20 max-w-4xl mx-auto relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600"></div>
            
            <h3 className="text-3xl font-black mb-8 text-white text-center">Jouw Nieuwe Foto</h3>
            
            <div className="rounded-2xl overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-950 flex items-center justify-center min-h-[400px] border border-slate-700/50 shadow-inner">
              <img src={generatedImage} alt="Generated" className="max-h-[700px] w-full object-contain" />
            </div>
            
            <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">
              <a 
                href={generatedImage} 
                download={`vinted-ai-${quality.toLowerCase()}.png`}
                className="bg-white text-slate-900 hover:bg-slate-100 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-white/25 flex items-center justify-center gap-3 transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download ({quality})
              </a>
              <button 
                onClick={() => {
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                   setGeneratedImage(null);
                }}
                className="bg-slate-800 text-slate-300 hover:bg-slate-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-slate-700"
              >
                Nog een maken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VintedStudio;