
import { KitchenIcon, LivingRoomIcon, BedroomIcon, BathroomIcon, ClosetIcon, OfficeIcon, BalconyIcon, PantryIcon, WineCellarIcon } from '../components/Shared';

export const projectTypePresets = [
    { id: 'cozinha', name: 'Cozinha', icon: KitchenIcon, suggestions: ['com ilha central', 'cozinha americana', 'armários até o teto', 'torre quente', 'bancada de granito'] },
    { id: 'sala', name: 'Sala', icon: LivingRoomIcon, suggestions: ['com painel ripado', 'home theater', 'rack suspenso', 'estante para livros', 'barzinho integrado'] },
    { id: 'quarto', name: 'Quarto', icon: BedroomIcon, suggestions: ['com cabeceira estofada', 'guarda-roupa de casal', 'penteadeira com espelho', 'painel para TV'] },
    { id: 'banheiro', name: 'Banheiro', icon: BathroomIcon, suggestions: ['gabinete suspenso', 'armário com espelheira', 'nicho para shampoo', 'bancada de mármore'] },
    { id: 'closet', name: 'Closet', icon: ClosetIcon, suggestions: ['com portas de correr', 'sapateira vertical', 'gaveteiros com divisórias', 'iluminação embutida'] },
    { id: 'escritorio', name: 'Escritório', icon: OfficeIcon, suggestions: ['mesa em L', 'estante para documentos', 'gaveteiro com rodízios', 'prateleiras para livros'] },
    { id: 'varanda', name: 'Varanda', icon: BalconyIcon, suggestions: ['área gourmet', 'banco com futon', 'armário para churrasqueira', 'jardim vertical'] },
    { id: 'despensa', name: 'Despensa', icon: PantryIcon, suggestions: ['prateleiras reforçadas', 'armário multiuso', 'nichos para garrafas', 'organizador de potes'] },
    { id: 'adega', name: 'Adega', icon: WineCellarIcon, suggestions: ['nichos para vinhos', 'espaço para taças', 'bancada de degustação', 'climatizada'] },
];

export const stylePresets = [
    'Moderno',
    'Contemporâneo',
    'Industrial',
    'Rústico',
    'Minimalista',
    'Clássico',
    'Escandinavo'
];