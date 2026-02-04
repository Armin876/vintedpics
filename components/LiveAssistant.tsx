import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

const LiveAssistant: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = () => {
    sessionRef.current?.close();
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    
    if (inputContextRef.current?.state !== 'closed') {
      inputContextRef.current?.close();
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }

    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();

    setConnected(false);
    setIsTalking(false);
  };

  const startSession = async () => {
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setConnected(true);
            
            // Setup Microphone Stream
            const source = inputContextRef.current!.createMediaStreamSource(stream);
            sourceRef.current = source;
            const processor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(processor);
            processor.connect(inputContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;
            
            if (serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              setIsTalking(true);
              const base64 = serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = audioContextRef.current!;
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(base64),
                ctx,
                24000
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsTalking(false);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
             setConnected(false);
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection error occurred.");
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "You are a helpful and witty creative assistant for a fashion studio. Keep responses concise.",
        }
      });

      sessionRef.current = { close: () => sessionPromise.then(s => s.close()) };

    } catch (e: any) {
      console.error(e);
      setError("Failed to start session. Check permissions.");
      cleanup();
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-pink-400">Live Voice Assistant</h2>
        <p className="text-slate-400">Have a real-time conversation with Gemini 2.5</p>
      </div>

      <div className="relative">
        {/* Visualizer Circle */}
        <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
          connected 
            ? isTalking 
              ? 'border-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.6)] scale-110' 
              : 'border-pink-900 shadow-[0_0_20px_rgba(236,72,153,0.2)]'
            : 'border-slate-700 bg-slate-800'
        }`}>
          {connected ? (
            <div className="space-y-4 text-center">
              <span className="text-4xl animate-pulse">🎙️</span>
              <p className="text-pink-200 font-medium">{isTalking ? 'Speaking...' : 'Listening...'}</p>
            </div>
          ) : (
            <span className="text-6xl text-slate-600">🔇</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        {!connected ? (
          <button
            onClick={startSession}
            className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Start Conversation
          </button>
        ) : (
          <button
            onClick={cleanup}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            End Call
          </button>
        )}
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAssistant;