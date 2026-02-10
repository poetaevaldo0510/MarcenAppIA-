
import React, { useState } from 'react';
/* Fix: Added DocumentTextIcon to the imports from Shared components */
import { DocumentTextIcon, InfoIcon, LogoIcon } from './Shared';

interface LegalCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LegalCenter: React.FC<LegalCenterProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[120] flex justify-center items-center p-4 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-[#2d2424] rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="bg-[#f5f1e8] dark:bg-[#3e3535] p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <LogoIcon className="text-[#b99256]" />
                        <h2 className="text-xl font-black text-[#3e3535] dark:text-white uppercase tracking-tighter">Central Jurídica MarcenApp</h2>
                    </div>
                    <div className="flex bg-gray-200 dark:bg-[#1a1414] p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('privacy')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'privacy' ? 'bg-white dark:bg-[#4a4040] shadow-sm text-[#b99256]' : 'text-gray-500'}`}
                        >
                            Privacidade
                        </button>
                        <button 
                            onClick={() => setActiveTab('terms')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'terms' ? 'bg-white dark:bg-[#4a4040] shadow-sm text-[#b99256]' : 'text-gray-500'}`}
                        >
                            Termos de Uso
                        </button>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto p-8 prose prose-sm dark:prose-invert max-w-none custom-scrollbar">
                    {activeTab === 'privacy' ? (
                        <div className="animate-fadeIn">
                            <h3 className="flex items-center gap-2"><InfoIcon className="text-[#b99256]" /> Política de Privacidade</h3>
                            <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                            <p>Esta Política de Privacidade descreve como o MarcenApp coleta, usa e protege seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>
                            
                            <h4>1. Coleta de Dados</h4>
                            <p>Coletamos seu e-mail, nome, fotos de rascunhos e descrições de voz para processamento através de nossos motores de Inteligência Artificial (Google Gemini).</p>
                            
                            <h4>2. Uso de Imagens e Voz</h4>
                            <p>As imagens enviadas para renderização e os áudios são processados de forma segura e não são utilizados para treinamento público de IA, sendo restritos ao seu perfil de usuário.</p>
                            
                            <h4>3. Seus Direitos</h4>
                            <p>Você pode solicitar a exclusão total de sua conta e histórico de projetos a qualquer momento através das configurações de perfil.</p>
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <h3 className="flex items-center gap-2"><DocumentTextIcon className="text-[#b99256]" /> Termos de Uso</h3>
                            <p>Ao utilizar o MarcenApp, você concorda com as seguintes condições:</p>
                            
                            <h4>1. Propriedade Intelectual</h4>
                            <p>Os designs gerados pela IA são de sua propriedade para fins comerciais. O código-fonte e a arquitetura da plataforma pertencem exclusivamente ao MarcenApp.</p>
                            
                            <h4>2. Precisão dos Orçamentos</h4>
                            <p>A Iara fornece estimativas baseadas em lógica computacional. Recomendamos sempre a conferência técnica humana antes da compra efetiva de materiais ou assinatura de contratos com terceiros.</p>
                            
                            <h4>3. Sistema de Créditos</h4>
                            <p>Créditos adquiridos não são reembolsáveis, mas podem ser transferidos em casos especiais de migração de conta corporativa.</p>
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-gray-50 dark:bg-[#1a1414] border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-8 rounded-xl transition-all active:scale-95">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};
