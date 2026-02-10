
import type { ProjectHistoryItem, UserProfile } from '../types';

/**
 * CORTECLOUD REAL API BRIDGE - MODULAR ENHANCED
 * Conecta o motor da Iara ao barramento industrial do CorteCloud, 
 * suportando serviços com módulos parametrizados.
 */

const CORTE_CLOUD_BASE_URL = 'https://api.cortecloud.com.br/v1';

export const syncToCorteCloud = async (project: ProjectHistoryItem, profile: UserProfile) => {
    const config = profile.corteCloudConfig;
    
    if (!config || !config.apiKey || !config.enabled) {
        console.warn("CorteCloud: Integração não configurada. Usando modo simulação.");
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            success: true,
            externalId: `SIM_${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            message: "Simulação de envio concluída. Configure sua API Key para produção."
        };
    }

    if (!project.technicalSpec) throw new Error("Projeto sem especificações técnicas da Iara.");

    // Separa componentes em Peças Soltas e Módulos
    const modules = project.technicalSpec.components.filter(c => c.type === 'module');
    const looseParts = project.technicalSpec.components.filter(c => c.type === 'panel');

    // Mapeamento Inteligente: Prioriza Serviço com Módulos se detectado
    const payload = {
        name: project.name,
        store_id: config.storeId || "DEFAULT",
        // Envio Híbrido: Módulos Parametrizados + Peças Avulsas
        modules: modules.map(m => ({
            module_id: m.moduleId || "GENERIC_CABINET",
            description: m.name,
            width: m.dimensions.w,
            height: m.dimensions.h,
            depth: m.dimensions.d,
            material: m.material,
            quantity: m.quantity
        })),
        parts: looseParts.map(p => ({
            description: p.name,
            width: p.dimensions.w,
            height: p.dimensions.h,
            thickness: p.dimensions.d || 18,
            material: p.material,
            quantity: p.quantity,
            edge_banding: {
                top: true, bottom: true, left: true, right: true
            }
        }))
    };

    try {
        // Nota: O endpoint real varia dependendo da autorização da central para módulos
        const endpoint = modules.length > 0 ? `${CORTE_CLOUD_BASE_URL}/services/modular` : `${CORTE_CLOUD_BASE_URL}/services`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro na comunicação com CorteCloud.");
        }

        const result = await response.json();
        return {
            success: true,
            externalId: result.id,
            message: modules.length > 0 
                ? "Projeto Modular enviado com sucesso. Verifique os parâmetros na sua central." 
                : "Lista de peças enviada com sucesso para o CorteCloud."
        };
    } catch (err: any) {
        console.error("CorteCloud Sync Error:", err);
        throw err;
    }
};
