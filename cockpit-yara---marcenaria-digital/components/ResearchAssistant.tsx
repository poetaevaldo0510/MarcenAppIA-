
import React, { useState, useEffect, useRef } from 'react';
import { generateGroundedResponse } from '../services/geminiService';
import type { ChatMessage, LocationState } from '../types';
import { Spinner, LogoIcon, SearchIcon, GlobeIcon, UserIcon } from './Shared';
import { convertMarkdownToHtml } from '../utils/helpers';

interface ResearchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (message: string, title?: string) => void;
}

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({ isOpen, onClose, showAlert }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<LocationState | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const requestLocation = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                setIsLocating(false);
                setMessages(prev => [...prev, { id: `loc-${Date.now()}`, role: 'model', text: '📍 **GPS Ativado.** Buscando distribuidores perto de você...', timestamp: Date.now() }]);
            },
            () => {
                setIsLocating(false);
                showAlert("GPS Negado. Usando modo busca global.");
            }
        );
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        const trimmedInput = userInput.trim();
        if (!trimmedInput || isLoading) return;

        setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmedInput, timestamp: Date.now() }]);
        setUserInput('');
        setIsLoading(true);
        
        try {
            const { text, sources } = await generateGroundedResponse(trimmedInput, location);
            setMessages(prev => [...prev, { id: `m-${Date.now()}`, role: 'model', text, sources, timestamp: Date.now() }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'model', text: 'Erro na conexão geoespacial.', timestamp: Date.now() }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[500] flex justify-center items-center p-4 backdrop-blur-xl animate-fadeIn">
            <div className="bg-[#110e0e] rounded-[3rem] w-full max-w-4xl h-[85vh] shadow-3xl border border-white/5 flex flex-col overflow-hidden animate-scaleIn">
                <header className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1a1414]">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#3e3535] p-3 rounded-2xl text-[#d4ac6e]">
                            <GlobeIcon className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic">Iara Vision GPS</h2>
                    </div>
                    <button 
                        onClick={requestLocation} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${location ? 'bg-green-500/10 text-green-500' : 'bg-[#d4ac6e] text-[#3e3535]'}`}
                    >
                        {isLocating ? <Spinner size="sm" /> : <GlobeIcon className="w-3.5 h-3.5" />}
                        {location ? 'Localização Ativa' : 'Ativar GPS'}
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#0a0808]">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center ${msg.role === 'model' ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-white/10 text-gray-500'}`}>
                                {msg.role === 'model' ? <LogoIcon className="w-5 h-5" /> : <UserIcon className="w-4 h-4" />}
                            </div>
                            <div className={`p-5 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-[#1a1414] text-white/90 border border-white/5'}`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(msg.text) }} />
                                {msg.sources && (
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {msg.sources.map((s, i) => (
                                            <a key={i} href={s.web?.uri || s.maps?.uri} target="_blank" className="bg-white/5 p-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all">
                                                <SearchIcon className="w-3 h-3 text-[#d4ac6e]" />
                                                <span className="text-[10px] font-bold truncate">{s.web?.title || s.maps?.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && <Spinner size="sm" />}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-8 bg-[#1a1414] border-t border-white/5">
                    <div className="max-w-4xl mx-auto flex gap-3">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ex: Distribuidores MDF perto de mim"
                            className="flex-grow bg-black border-2 border-white/5 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-[#d4ac6e]"
                        />
                        <button onClick={handleSendMessage} disabled={isLoading} className="bg-[#d4ac6e] text-[#3e3535] px-10 rounded-2xl font-black uppercase tracking-widest text-[11px]">Enviar</button>
                    </div>
                </footer>
            </div>
            <button onClick={onClose} className="absolute top-10 right-10 text-white text-5xl">&times;</button>
        </div>
    );
};
