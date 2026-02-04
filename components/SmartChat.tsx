import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { ChatMessage, blobToBase64 } from '../types';

const SmartChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'fast' | 'think' | 'search' | 'maps'>('fast');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await blobToBase64(file);
      setUploadedImage(base64);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedImage) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      images: uploadedImage ? [uploadedImage] : undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setUploadedImage(null);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let model = 'gemini-3-pro-preview'; // Default logic fallback
      let tools: any[] = [];
      let toolConfig: any = {};
      let config: any = {};

      // Logic based on mode
      switch(mode) {
        case 'fast':
          model = 'gemini-2.5-flash-lite-latest'; // Flash lite for speed
          break;
        case 'think':
          model = 'gemini-3-pro-preview';
          config.thinkingConfig = { thinkingBudget: 32768 }; // Max thinking
          break;
        case 'search':
          model = 'gemini-3-flash-preview';
          tools = [{ googleSearch: {} }];
          break;
        case 'maps':
          model = 'gemini-2.5-flash';
          tools = [{ googleMaps: {} }];
          // Ideally get real geolocation here
          toolConfig = {
            retrievalConfig: {
               latLng: { latitude: 40.7128, longitude: -74.0060 } // Default NYC for demo
            }
          };
          break;
      }

      // Construct contents
      const parts: any[] = [{ text: userMsg.text }];
      if (userMsg.images) {
        // If image present, auto-upgrade to multimodal capable model if not already
        if (mode === 'fast') model = 'gemini-3-pro-preview'; 
        parts.unshift({
          inlineData: {
            mimeType: 'image/jpeg',
            data: userMsg.images[0]
          }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          tools: tools.length > 0 ? tools : undefined,
          toolConfig: Object.keys(toolConfig).length > 0 ? toolConfig : undefined,
          ...config
        }
      });

      const text = response.text || "I processed that, but have no text response.";
      const grounding = response.candidates?.[0]?.groundingMetadata;

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        timestamp: Date.now(),
        groundingMetadata: grounding
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `Error: ${err.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
      {/* Header / Mode Selector */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex flex-wrap gap-2 items-center justify-between">
        <h2 className="font-bold text-white">Smart Chat</h2>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
          {(['fast', 'think', 'search', 'maps'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                mode === m ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' ? 'bg-teal-700 text-white' : 'bg-slate-800 text-slate-200'
            }`}>
              {msg.images && (
                <img src={`data:image/jpeg;base64,${msg.images[0]}`} className="max-h-40 rounded-lg mb-2" alt="Uploaded" />
              )}
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {/* Grounding Info */}
              {msg.groundingMetadata?.groundingChunks?.map((chunk: any, i: number) => {
                if (chunk.web?.uri) {
                   return <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="block text-xs text-blue-300 mt-2 hover:underline">Source: {chunk.web.title}</a>
                }
                if (chunk.maps?.uri) {
                   return <a key={i} href={chunk.maps.uri} target="_blank" rel="noreferrer" className="block text-xs text-green-300 mt-2 hover:underline">Map: {chunk.maps.title}</a>
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 text-slate-400 rounded-2xl p-4 animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-800 p-4 border-t border-slate-700">
        <div className="flex gap-2">
           <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-white transition-colors">
              📷
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
           </label>
           {uploadedImage && (
             <div className="relative">
               <img src={`data:image/jpeg;base64,${uploadedImage}`} className="h-12 w-12 object-cover rounded-lg border border-teal-500" alt="Preview"/>
               <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-xs">x</button>
             </div>
           )}
           <input
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
             placeholder={`Ask Gemini (${mode} mode)...`}
             className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 text-white focus:outline-none focus:border-teal-500"
           />
           <button 
             onClick={sendMessage}
             disabled={isLoading}
             className="bg-teal-600 hover:bg-teal-500 text-white px-6 rounded-lg font-bold transition-colors disabled:opacity-50"
           >
             Send
           </button>
        </div>
      </div>
    </div>
  );
};

export default SmartChat;