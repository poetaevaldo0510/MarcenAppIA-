
import { KitchenIcon, LivingRoomIcon, BedroomIcon, BathroomIcon, ClosetIcon, OfficeIcon, BalconyIcon, PantryIcon, WineCellarIcon } from '../components/Shared';

export const projectTypePresets = [
    { 
        id: 'cozinha', 
        name: 'Cozinha', 
        icon: KitchenIcon, 
        gender: 'f', 
        suggestions: [
            'Cozinha Freijó Elite: Frentes em MDF Louro Freijó com alinhamento de veios vertical, puxadores cava 45º usinados e tamponamento externo de 36mm. Ferragens com amortecimento soft-close e iluminação LED 3000K embutida nos nichos.',
            'Minimalista Milão: Portas em Laca Branca Seda Fosca (PBR), sem puxadores aparentes (fecho-toque), bancada em pedra cinza absoluta com reflexos suaves. Design clean com vãos técnicos milimétricos.',
            'Industrial Luxury: Armários em MDF Grafite Trama, portas superiores em Vidro Canelado com moldura fina em alumínio preto fosco. Prateleiras internas com fita de borda de 2mm e estrutura robusta.',
            'Ilha Gourmet Integrada: Tampo de pedra ultra-realista, base em MDF amadeirado escuro, vãos para torre de tomada e eletros de embutir. Foco em ergonomia e circulação fluida.',
            'Cozinha Provençal Moderna: Portas almofadadas em laca cinza claro, puxadores concha em ouro envelhecido, prateleiras em madeira natural e iluminação cênica de estúdio.'
        ]
    },
    { 
        id: 'sala', 
        name: 'Sala', 
        icon: LivingRoomIcon, 
        gender: 'f', 
        suggestions: [
            'Home Theater Freijó: Painel ripado com continuidade de veio PBR, rack suspenso com cantos chanfrados e iluminação LED linear quente 2700K embutida nos nichos.',
            'Estante Arquiteto: Prateleiras finas com suporte invisível, fundo em palha natural sextavada e texturas de madeira de alta frequência para render 8K.'
        ]
    },
    { 
        id: 'quarto', 
        name: 'Quarto', 
        icon: BedroomIcon, 
        gender: 'm', 
        suggestions: [
            'Dormitório Master Concept: Cabeceira em painéis estofados táticos, mesinhas de cabeceira em MDF Freijó com usinagem 45º e iluminação cênica de revista.',
            'Closet Boutique: Divisórias em MDF Branco TX 18mm, gavetões com frentes de vidro e corrediças ocultas invisíveis. Organização interna inteligente.'
        ]
    }
];

export const stylePresets = [
    'Moderno (Sustentável)',
    'Contemporâneo (Tátil)',
    'Industrial (Reciclado)',
    'Minimalista (Eco-focado)',
    'Escandinavo (Biofílico)'
];
