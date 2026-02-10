
/**
 * BENTO NESTING ENGINE v3.5 - ULTRA INDUSTRIAL
 * Algoritmo BFDH (Best-Fit Decreasing Height) com compactação de prateleiras.
 * Otimizado para marcenaria real com rotação inteligente e controle de desperdício.
 */

export interface Part {
    id: string | number;
    name: string;
    w: number;
    h: number;
    qtd: number;
    material: 'white' | 'wood';
    uniqueId?: string;
    rotated?: boolean;
    locked?: boolean;
    x?: number;
    y?: number;
}

export interface Sheet {
    id: number;
    usedArea: number;
    items: Part[];
    shelves: { y: number; h: number; usedW: number }[];
}

const SHEET_WIDTH = 2730; 
const SHEET_HEIGHT = 1830; 
const KERF = 3; 
const REFILE = 10; // Margem de segurança nas bordas da chapa

export const calculateSheetEfficiency = (sheet: Sheet): number => {
    if (!sheet || sheet.items.length === 0) return 0;
    const totalArea = SHEET_WIDTH * SHEET_HEIGHT;
    const usedArea = sheet.items.reduce((acc, item) => acc + (item.w * item.h), 0);
    return Math.round((usedArea / totalArea) * 100);
};

export const packParts = (partsInput: Part[]): Sheet[] => {
    const usableW = SHEET_WIDTH - (REFILE * 2);
    const usableH = SHEET_HEIGHT - (REFILE * 2);

    let allPieces: Part[] = [];
    partsInput.forEach(p => {
        for (let i = 0; i < p.qtd; i++) {
            let w = p.w;
            let h = p.h;
            let rotated = false;

            // Se for BRANCO, permitimos rotação livre para otimização
            // Se for AMADEIRADO, o W (largura) é sempre no sentido do veio (sentido maior da chapa original)
            if (p.material === 'white' && w < h) {
                [w, h] = [h, w];
                rotated = true;
            }
            allPieces.push({ ...p, w, h, rotated, uniqueId: `${p.id}-${i}` });
        }
    });

    // Ordenar peças por altura (H) descendente para criar prateleiras estáveis (estratégia BFDH)
    allPieces.sort((a, b) => b.h - a.h || b.w - a.w);

    const sheets: Sheet[] = [];

    const createNewSheet = (id: number): Sheet => ({
        id, usedArea: 0, items: [], shelves: []
    });

    allPieces.forEach(part => {
        let placed = false;

        // 1. Tentar encaixar em chapas já existentes
        for (const sheet of sheets) {
            // Tentar encaixar em prateleiras existentes (Best Fit)
            for (const shelf of sheet.shelves) {
                if (part.h <= shelf.h && (shelf.usedW + part.w + KERF) <= usableW) {
                    part.x = shelf.usedW + REFILE;
                    part.y = shelf.y + REFILE;
                    shelf.usedW += part.w + KERF;
                    sheet.items.push(part);
                    sheet.usedArea += (part.w * part.h);
                    placed = true;
                    break;
                }
            }
            if (placed) break;

            // 2. Se não coube em prateleira existente, tentar criar nova prateleira na chapa atual
            const lastShelf = sheet.shelves[sheet.shelves.length - 1];
            const nextY = lastShelf ? lastShelf.y + lastShelf.h + KERF : 0;
            if (nextY + part.h <= usableH) {
                const newShelf = { y: nextY, h: part.h, usedW: part.w + KERF };
                part.x = REFILE;
                part.y = nextY + REFILE;
                sheet.shelves.push(newShelf);
                sheet.items.push(part);
                sheet.usedArea += (part.w * part.h);
                placed = true;
                break;
            }
        }

        // 3. Se não coube em nenhuma chapa aberta, abre uma nova chapa industrial
        if (!placed) {
            const newSheet = createNewSheet(sheets.length + 1);
            const newShelf = { y: 0, h: part.h, usedW: part.w + KERF };
            part.x = REFILE;
            part.y = REFILE;
            newSheet.shelves.push(newShelf);
            newSheet.items.push(part);
            newSheet.usedArea += (part.w * part.h);
            sheets.push(newSheet);
        }
    });

    return sheets;
};
