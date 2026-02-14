
import React, { useState, useEffect } from 'react';
import { User, Coins, Loader2, Globe, LayoutDashboard } from 'lucide-react';
import { ModuleType } from './types';
import { Dashboard } from './modules/Dashboard';
import { Studio3D } from './modules/Studio3D';
import { BudgetManager } from './modules/BudgetManager';
import { CRMManager } from './modules/CRMManager';
import { Settings } from './modules/Settings';
import { Login } from './modules/Login';
import { Onboarding } from './modules/Onboarding';
import { PaymentCheckout } from './modules/PaymentCheckout';
import { ValuationHub } from './modules/admin/ValuationHub';
import { EcosystemPanel } from './modules/EcosystemPanel';
import { Marketplace } from './modules/Marketplace';
import { CuttingPlan } from './modules/CuttingPlan';
import { TechnicalDrawing } from './modules/TechnicalDrawing';
import { LegalAssistant } from './modules/LegalAssistant';
import { ProductionManager } from './modules/ProductionManager';
import { AssemblyManual } from './modules/AssemblyManual';
import { MarketingHub } from './modules/MarketingHub';
import { VideoShowroom } from './modules/VideoShowroom';
import { BusinessIntelligence } from './modules/BusinessIntelligence';
import { FiscalManager } from './modules/FiscalManager';
import { FintechHub } from './modules/FintechHub';
import { DistributorPortal } from './modules/DistributorPortal';
import { ServiceMarketplace } from './modules/ServiceMarketplace';
import { ProjectAlbum } from './modules/ProjectAlbum';
import { ExportManager } from './modules/ExportManager';
import { BottomNav } from './components/layout/BottomNav';
import { Logo } from './components/Logo';
import { useProjectStore } from './store/useProjectStore';
import { LiveAssistant } from './components/LiveAssistant';

export const App: React.FC = () => {
  const { isAuthorized, credits, isAdmin, userEmail, hasSeenOnboarding, completeOnboarding, projects, activeProjectId } = useProjectStore();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    setAppReady(true);
    if (isAuthorized && userEmail?.toLowerCase() === 'evaldo@marcenapp.com.br' && activeModule === 'dashboard') {
      setActiveModule('ecosystem');
    } else if (isAuthorized && !hasSeenOnboarding) {
      setActiveModule('onboarding');
    }
  }, [isAuthorized, userEmail]);

  if (!appReady) return (
    <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#0d1418]">
       <Loader2 className="text-indigo-500 animate-spin mb-4" size={48} />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-600">Sincronizando Ecossistema...</p>
    </div>
  );

  if (!isAuthorized) return <Login />;

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeDNA = activeProject?.environments[0]?.dna;

  const renderModule = () => {
    switch(activeModule) {
      /* Updated onNavigate props to fix Dispatch type compatibility errors */
      case 'dashboard': return <Dashboard onNavigate={setActiveModule} />;
      case 'ecosystem': return <EcosystemPanel onNavigate={setActiveModule} />;
      case 'studio': return <Studio3D onNavigate={setActiveModule} />;
      case 'budget': return activeDNA ? <BudgetManager project={activeDNA} onUpdate={() => {}} onNavigate={setActiveModule} /> : <Dashboard onNavigate={setActiveModule}/>;
      case 'cutting': return activeDNA ? <CuttingPlan project={activeDNA} parts={[]} onUpdateParts={() => {}} /> : <Dashboard onNavigate={setActiveModule}/>;
      case 'blueprint': return activeDNA ? <TechnicalDrawing project={activeDNA} onNavigate={setActiveModule} /> : <Dashboard onNavigate={setActiveModule}/>;
      case 'crm': return <CRMManager />;
      case 'settings': case 'profile': return <Settings />;
      case 'valuation': return <ValuationHub />;
      /* marketplace is now a valid ModuleType */
      case 'marketplace': return <Marketplace />;
      case 'legal': return <LegalAssistant />;
      case 'production': return activeDNA ? <ProductionManager project={activeDNA} onNavigate={setActiveModule} /> : <Dashboard onNavigate={setActiveModule}/>;
      case 'assembly': return <AssemblyManual onNavigate={setActiveModule} />;
      case 'marketing': return <MarketingHub />;
      case 'showroom': return <VideoShowroom />;
      case 'bi': return <BusinessIntelligence />;
      case 'fiscal': return <FiscalManager />;
      case 'fintech': return <FintechHub />;
      /* distributors is now a valid ModuleType */
      case 'distributors': return <DistributorPortal />;
      case 'services': return <ServiceMarketplace />;
      case 'album': return <ProjectAlbum />;
      case 'export': return activeDNA ? <ExportManager project={activeDNA} onNavigate={setActiveModule} /> : <Dashboard onNavigate={setActiveModule}/>;
      case 'onboarding': return <Onboarding onFinish={() => { completeOnboarding(); setActiveModule('dashboard'); }} />;
      case 'checkout': return <PaymentCheckout />;
      default: return <Dashboard onNavigate={setActiveModule} />;
    }
  };

  const isFullFrame = ['onboarding', 'studio', 'valuation', 'ecosystem', 'checkout', 'showroom'].includes(activeModule);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0d1418] text-[#e9edef] overflow-hidden">
      {!isFullFrame && (
        <header className="px-6 h-16 shrink-0 flex items-center justify-between border-b border-white/5 z-[70] bg-[#202c33]/80 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule(isAdmin ? 'ecosystem' : 'dashboard')}>
            <Logo size={32} />
            <h1 className="text-base font-black uppercase tracking-tighter">Marcena<span className="text-indigo-400">PP</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#2a3942] px-3 py-1.5 rounded-xl border border-white/5">
               <Coins size={14} className="text-amber-500" />
               <span className="text-[10px] font-black text-amber-50 italic">{isAdmin ? '∞' : credits}</span>
            </div>
            <div className="w-10 h-10 bg-[#3b4a54] rounded-xl flex items-center justify-center text-[#8696a0] cursor-pointer hover:bg-indigo-600 hover:text-white transition-all" onClick={() => setActiveModule('profile')}>
              <User size={20} />
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 relative overflow-y-auto scrollbar-hide ${!isFullFrame ? 'pt-1' : ''}`}>
        <div className={isFullFrame ? 'h-full w-full' : 'max-w-7xl mx-auto p-4 pb-32'}>
          {renderModule()}
        </div>
      </main>

      {activeModule !== 'onboarding' && <LiveAssistant />}
      {!isFullFrame && (
        <BottomNav activeModule={activeModule} onNavigate={setActiveModule} />
      )}
    </div>
  );
};
