
import React, { useState, useEffect, useRef } from 'react';
import type { Finish } from '../types';
import { searchFinishes } from '../services/geminiService';
import { Spinner, SearchIcon, MicIcon, ToolsIcon, SparklesIcon } from './Shared';

interface FinishesSelectorProps {
  onFinishSelect: (selection: { manufacturer: string; finish: Finish; handleDetails?: string } | null) => void;
  value: { manufacturer: string; finish: Finish; handleDetails?: string } | null;
  showAlert: (message: string, title?: string) => void;
  favoriteFinishes: Finish[];
  onToggleFavorite: (finish: Finish) => void;
}

export const FinishesSelector: React.FC<FinishesSelectorProps> = ({ onFinishSelect, value, showAlert }) => {
    const [handleDetails, setHandleDetails] = useState('');
    const [iaraSearchState, setIaraSearchState] = useState({
        query: '',
        isSearching: false,
        results: [] as Finish[],
        attempted: false,
    });
    
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setIaraSearchState(prev => ({ ...prev, query: transcript }));
                stopRecording();
                handleSearch(transcript);
            };

            recognition.onerror = (e: any) => {
                console.error("STT Error:", e);
                setIsRecording(false);
                showAlert("Não consegui ouvir o material. Tente falar mais perto.");
            };

            recognition.onend = () => setIsRecording(false);
            recognitionRef.current = recognition;
        }
    }, []);

    const startRecording = () => {
        if (!recognitionRef.current) return showAlert("Este navegador não suporta busca por voz.");
        setIsRecording(true);
        try {
            recognitionRef.current.start();
            if (window.navigator.vibrate) window.navigator.vibrate(50);
        } catch (e) {
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        recognitionRef.current?.stop();
    };

    const handleSearch = async (overrideQuery?: string) => {
        const q = overrideQuery || iaraSearchState.query;
        if (!q.trim()) return;
        setIaraSearchState(prev => ({ ...prev, attempted: true, isSearching: true, results: [] }));
        try {
            const results = await searchFinishes(q);
            setIaraSearchState(prev => ({ ...prev, results }));
        } catch (error) {
            showAlert("Erro ao varrer catálogos técnicos.");
        } finally {
            setIaraSearchState(prev => ({ ...prev, isSearching: false }));
        }
    };

    const renderFinishesGrid = (finishes: Finish[]) => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {finishes.map(finish => {
                const isSelected = value?.finish.id === finish.id;
                return (
                    <button
                        key={finish.id}
                        onClick={() => onFinishSelect({ manufacturer: finish.manufacturer, finish, handleDetails })}
                        className={`relative bg-[#fffefb] dark:bg-[#1a1414] rounded-2xl text-left border-2 transition-all p-3 group ${isSelected ? 'border-[#d4ac6e] ring-4 ring-[#d4ac6e]/10' : 'border-white/5 hover:border-white/10'}`}
                    >
                        <div className="w-full h-24 bg-gray-200 dark:bg-black/40 rounded-xl mb-3 overflow-hidden">
                            {finish.imageUrl && <img src={finish.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
                        </div>
                        <p className="text-[10px] font-black uppercase text-[#3e3535] dark:text-white truncate">{finish.name}</p>
                        <p className="text-[8px] font-bold text-[#b99256] uppercase tracking-widest">{finish.manufacturer}</p>
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-[#110e0e] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="bg-[#d4ac6e]/10 p-4 rounded-2xl mb-4">
                        <SparklesIcon className="w-8 h-8 text-[#d4ac6e]" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Pedido por Voz</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-1">Dite o padrão ou marca (Ex: MDF Freijó Guararapes)</p>
                </div>

                <div className="relative group">
                    <input 
                        type="text"
                        value={iaraSearchState.query}
                        onChange={e => setIaraSearchState({...iaraSearchState, query: e.target.value})}
                        placeholder={isRecording ? "Ouvindo mestre marceneiro..." : "Material ou Ferragem..."}
                        className={`w-full bg-black border-2 border-white/5 rounded-2xl p-5 pr-28 text-white font-bold outline-none focus:border-[#d4ac6e] transition-all ${isRecording ? 'animate-pulse border-[#d4ac6e]' : ''}`}
                    />
                    <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                        <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-[#d4ac6e] text-black shadow-lg' : 'bg-white/5 text-[#d4ac6e] hover:bg-[#d4ac6e] hover:text-black'}`}
                        >
                            <MicIcon className="w-6 h-6" isRecording={isRecording} />
                        </button>
                        <button 
                            onClick={() => handleSearch()}
                            className="w-12 h-12 rounded-xl bg-[#d4ac6e] text-black flex items-center justify-center active:scale-95 transition-all shadow-xl"
                        >
                            <SearchIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    {iaraSearchState.isSearching ? (
                        <div className="flex flex-col items-center py-10 opacity-40"><Spinner /><p className="text-[9px] font-black uppercase tracking-widest mt-4">Varrendo Bancos Técnicos...</p></div>
                    ) : iaraSearchState.results.length > 0 ? (
                        renderFinishesGrid(iaraSearchState.results)
                    ) : iaraSearchState.attempted && (
                        <p className="text-center py-10 text-[10px] font-black text-white/20 uppercase">Acabamento não localizado.</p>
                    )}
                </div>
            </div>
            
            {value && (
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 animate-fadeInUp">
                    <div className="flex items-center gap-3 mb-4">
                        <ToolsIcon className="w-4 h-4 text-[#d4ac6e]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Detalhes Adicionais de Montagem</span>
                    </div>
                    <textarea 
                        value={handleDetails}
                        onChange={e => {setHandleDetails(e.target.value); onFinishSelect({...value, handleDetails: e.target.value});}}
                        placeholder="Ex: Puxador perfil oculto, dobradiça 35mm com amortecedor..."
                        className="w-full bg-black border border-white/5 rounded-xl p-4 text-xs text-white/70 focus:border-[#d4ac6e] outline-none h-20 resize-none"
                    />
                </div>
            )}
        </div>
    );
};
