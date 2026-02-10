
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { processImage, validateMediaFile, convertMarkdownToHtmlWithInlineStyles, decode, decodeAudioData, createBlob } from '../utils/helpers';
import { Spinner, MicIcon, CameraIcon, PaperClipIcon, CheckIcon, WandIcon, LockIcon } from './Shared';
import type { ProjectHistoryItem, ChatMessage } from '../types';

interface ProjectChatProps {
    project: ProjectHistoryItem;
    onSendMessage: (message: string, media?: {data: string, mimeType: string}[]) => Promise<void>;
    isProcessing: boolean;
    onOpenCamera: () => void;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ 
    project, onSendMessage, isProcessing, onOpenCamera
}) => {
    const [input, setInput] = useState('');
    const [attachedMedia, setAttachedMedia] = useState<{data: string, mimeType: string, preview: string}[]>([]);
    const [isRefiningMenuOpen, setIsRefiningMenuOpen] = useState(false);
    const [isMasterLocked, setIsMasterLocked] = useState(false);
    const MAX_CHARS = 4000;
    const MASTER_CODE = "MESTRE-IARA-PRO-2025";
    
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [isIaraSpeaking, setIsIaraSpeaking] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const [localDims, setLocalDims] = useState({ width: 0, height: 0, depth: 0 });
    const [selectedMaterial, setSelectedMaterial] = useState('Louro Freijó');

    useEffect(() => {
        const locked = localStorage.getItem(`lock_${project.id}`);
        if (locked === 'true') setIsMasterLocked(true);
    }, [project.id]);

    useEffect(() => {
        if (project.technicalSpec?.projectParams?.dimensions) {
            const d = project.technicalSpec.projectParams.dimensions;
            setLocalDims({ width: d.width, height: d.height, depth: d.depth });
            setSelectedMaterial(project.technicalSpec.projectParams.dominantMaterial || 'Louro Freijó');
        }
    }, [project.technicalSpec]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [input]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [project.chatHistory, isProcessing, liveTranscript, isIaraSpeaking]);

    const stopLiveSession = () => {
        if (sessionRef.current) { try { sessionRef.current.close(); } catch(e){} sessionRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e){} audioContextRef.current = null; }
        sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
        sourcesRef.current.clear();
        setIsLiveActive(false);
        setIsIaraSpeaking(false);
        setLiveTranscript('');
    };

    const startLiveSession = async () => {
        setIsLiveActive(true);
        try {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
            outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    inputAudioTranscription: {},
                    systemInstruction: "Você é a Dra. Iara Fox PhD. Responda ao Mestre Evaldo de forma técnica e curta."
                },
                callbacks: {
                    onopen: () => {
                        if (!audioContextRef.current) return;
                        const source = audioContextRef.current.createMediaStreamSource(stream);
                        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        processor.onaudioprocess = (e) => {
                            const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
                            sessionPromise.then(session => session && session.sendRealtimeInput({ media: pcmBlob })).catch(() => {});
                        };
                        source.connect(processor);
                        processor.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (msg.serverContent?.inputTranscription) setLiveTranscript(msg.serverContent.inputTranscription.text);
                        if (msg.serverContent?.turnComplete) setLiveTranscript('');
                        const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioBase64 && outputAudioContextRef.current) {
                            setIsIaraSpeaking(true);
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);
                            source.onended = () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) setIsIaraSpeaking(false);
                            };
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: () => stopLiveSession(),
                    onclose: () => stopLiveSession()
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (e) {
            setIsLiveActive(false);
        }
    };

    const handleActionClick = () => {
        if (input.trim() || attachedMedia.length > 0) {
            handleSend();
        } else {
            isLiveActive ? stopLiveSession() : startLiveSession();
        }
    };

    const handleSend = async () => {
        if (isProcessing) return;
        if (input.trim().toUpperCase() === MASTER_CODE) {
            const newState = !isMasterLocked;
            setIsMasterLocked(newState);
            localStorage.setItem(`lock_${project.id}`, String(newState));
            setInput('');
            return;
        }
        if (isMasterLocked) {
             alert("PROJETO SELADO: Use o código Master para destravar.");
             return;
        }
        if (!input.trim() && attachedMedia.length === 0) return;
        const textToSend = input;
        const mediaToSend = attachedMedia.map(m => ({ data: m.data, mimeType: m.mimeType }));
        setInput('');
        setAttachedMedia([]);
        await onSendMessage(textToSend, mediaToSend.length > 0 ? mediaToSend : undefined);
    };

    const spec = project.technicalSpec;
    const dims = spec?.projectParams?.dimensions;

    return (
        <div className="flex flex-col h-full w-full bg-[#0b141a] relative">
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}></div>

            {dims && (
                <div className="bg-[#202c33] border-b border-white/5 py-2 px-4 z-20 flex justify-between items-center shadow-lg">
                    <div className="flex gap-4">
                        <div className="flex flex-col"><span className="text-[7px] text-gray-500 font-black uppercase tracking-widest leading-none">Largura</span><span className="text-xs font-bold text-white">{dims.width}{dims.unit}</span></div>
                        <div className="flex flex-col"><span className="text-[7px] text-gray-500 font-black uppercase tracking-widest leading-none">Padrão</span><span className="text-xs font-bold text-[#d4ac6e] italic">{selectedMaterial}</span></div>
                    </div>
                    <button onClick={() => setIsRefiningMenuOpen(true)} className="p-2 bg-[#d4ac6e]/10 text-[#d4ac6e] rounded-lg active:scale-90 transition-all">
                        <WandIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar flex flex-col gap-2 z-10 pb-20">
                {project.chatHistory.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                        <div key={msg.id || idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'self-end' : 'self-start'} relative mb-1 animate-fadeIn`}>
                            <div className={`relative px-3 py-2 rounded-xl shadow-md min-w-[60px] ${isUser ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}`}>
                                {msg.metadata?.renderedImageUrl && (
                                    <div onClick={() => window.dispatchEvent(new CustomEvent('openPreview3D'))} className="mb-2 rounded-lg overflow-hidden border border-black/10 cursor-pointer active:scale-95 transition-all relative group shadow-2xl">
                                        <img src={msg.metadata.renderedImageUrl} className="w-full max-h-64 object-cover" alt="Projeto" />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="bg-[#00a884] text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Inspecionar 3D</span>
                                        </div>
                                    </div>
                                )}
                                {msg.metadata?.originalImageUrl && <img src={msg.metadata.originalImageUrl} className="mb-2 rounded-lg max-h-60 object-cover shadow-lg border border-white/5" alt="Rascunho" />}
                                {msg.text && <div className="text-[14.5px] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtmlWithInlineStyles(msg.text) }} />}
                                <div className="flex justify-end items-center gap-1 mt-1 opacity-40">
                                    <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isUser && <div className="flex -space-x-1.5 text-[#53bdeb]"><CheckIcon className="w-3.5 h-3.5" /><CheckIcon className="w-3.5 h-3.5" /></div>}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {(isProcessing || isIaraSpeaking) && (
                    <div className="self-start relative bg-[#202c33] px-4 py-3 rounded-xl rounded-tl-none shadow-sm flex items-center gap-3 ml-1 border border-white/5 animate-pulse">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-[13px] font-medium text-[#8696a0] italic">Dra. Iara processando...</span>
                    </div>
                )}
            </div>

            <footer className="p-2 flex items-end gap-2 z-[110] bg-[#0b141a] pb-safe">
                <div className="flex-grow flex items-end gap-2 bg-[#2a3942] rounded-[24px] px-3 py-1.5 shadow-lg border border-white/5">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-[#8696a0] hover:text-white transition-colors">
                        <PaperClipIcon className="w-6 h-6 rotate-45" />
                    </button>
                    <textarea 
                        ref={textareaRef} value={input} 
                        onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))} 
                        rows={1} placeholder="Mensagem" 
                        className="flex-grow bg-transparent border-none outline-none text-[#e9edef] text-[16px] py-1.5 resize-none max-h-32 placeholder:text-[#8696a0]" 
                    />
                    <button onClick={onOpenCamera} className="p-2 text-[#8696a0] hover:text-white transition-colors">
                        <CameraIcon className="w-6 h-6" />
                    </button>
                </div>
                <button 
                    onClick={handleActionClick} 
                    className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all ${isLiveActive ? 'bg-red-500 animate-pulse' : 'bg-[#00a884]'}`}
                >
                    {input.trim() || attachedMedia.length > 0 ? (
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="ml-1"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
                    ) : <MicIcon className="w-6 h-6" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={async (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target && target.files) {
                        const files: File[] = Array.from(target.files);
                        for (const file of files) {
                            if (validateMediaFile(file).isValid) {
                                const processed = await processImage(file);
                                setAttachedMedia(prev => [...prev, { ...processed, preview: URL.createObjectURL(file) }]);
                            }
                        }
                    }
                }} />
            </footer>

            {isRefiningMenuOpen && (
                <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-[#202c33] p-8 rounded-[2.5rem] w-full max-w-sm border border-white/10 shadow-3xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-black uppercase text-sm tracking-widest">Refinar Motor YARA</h3>
                            <button onClick={() => setIsRefiningMenuOpen(false)} className="text-white/40 text-2xl active:scale-75 transition-all">&times;</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Mudar Padrão de MDF</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Louro Freijó', 'Branco TX', 'Grafite Trama', 'Carvalho Malva', 'Laca Branca', 'Preto Silk'].map(mat => (
                                        <button 
                                            key={mat}
                                            onClick={() => setSelectedMaterial(mat)}
                                            className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all ${selectedMaterial === mat ? 'bg-[#d4ac6e] text-black border-[#d4ac6e]' : 'bg-black/20 text-gray-400 border-white/5 hover:border-white/20'}`}
                                        >
                                            {mat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1"><span className="text-[7px] text-gray-500 font-bold uppercase">Largura</span><input type="number" value={localDims.width} onChange={e => setLocalDims({...localDims, width: Number(e.target.value)})} className="bg-black border border-white/5 p-3 rounded-xl text-white font-bold text-center outline-none focus:border-[#d4ac6e]" /></div>
                                <div className="flex flex-col gap-1"><span className="text-[7px] text-gray-500 font-bold uppercase">Altura</span><input type="number" value={localDims.height} onChange={e => setLocalDims({...localDims, height: Number(e.target.value)})} className="bg-black border border-white/5 p-3 rounded-xl text-white font-bold text-center outline-none focus:border-[#d4ac6e]" /></div>
                                <div className="flex flex-col gap-1"><span className="text-[7px] text-gray-500 font-bold uppercase">Prof.</span><input type="number" value={localDims.depth} onChange={e => setLocalDims({...localDims, depth: Number(e.target.value)})} className="bg-black border border-white/5 p-3 rounded-xl text-white font-bold text-center outline-none focus:border-[#d4ac6e]" /></div>
                            </div>
                        </div>

                        <button 
                            onClick={() => { onSendMessage(`[REFINO]: Alterar material para ${selectedMaterial}. Medidas: L ${localDims.width}, A ${localDims.height}, P ${localDims.depth}`); setIsRefiningMenuOpen(false); }} 
                            className="w-full bg-[#d4ac6e] text-black font-black py-4 rounded-2xl uppercase text-[10px] shadow-xl active:scale-95 transition-all"
                        >
                            Aplicar ao JSON Canônico
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
