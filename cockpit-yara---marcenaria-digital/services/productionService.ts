
import type { ProjectHistoryItem } from '../types';

/**
 * PRODUCTION BRIDGE SERVICE
 * Conecta a inteligência da Iara com o backend legado PHP em marcenapp.com.br
 */

const REMOTE_ENDPOINT = 'https://marcenapp.com.br/api/processar_projeto_ia.php';

export async function syncProjectToLegacySystem(project: ProjectHistoryItem): Promise<{success: boolean, message: string}> {
    try {
        const payload = {
            token: 'IARA_SECURE_TOKEN_2025',
            project_id: project.id,
            external_client_id: project.clientId,
            nome_projeto: project.name,
            cliente_nome: project.clientName,
            briefing: project.description,
            lista_materiais_markdown: project.bom,
            plano_corte_texto: project.cuttingPlan,
            custo_estimado: project.materialCost,
            url_render: project.views3d[project.views3d.length - 1],
            timestamp: new Date().toISOString()
        };

        const response = await fetch(REMOTE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Erro técnico (${response.status})`);

        const result = await response.json();
        
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'IARA_SYNC_SUCCESS',
                legacyUrl: `https://marcenapp.com.br/novo_projeto.php?ia_project=${project.id}`
            }, '*');
        }

        return { success: true, message: result.message || 'Projeto enviado para a produção do site!' };
    } catch (error: any) {
        console.error("Erro na sincronização:", error);
        return { success: false, message: `Falha na ponte: ${error.message}` };
    }
}

/**
 * CAPTURA DE PEDIDO DIRETO DO SITE
 * Extrai briefing e dados do cliente passados via URL pelo seu PHP
 */
export function getExternalContext() {
    // Pega os parâmetros da URL atual onde o app estiver rodando
    const params = new URLSearchParams(window.location.search);
    
    // Tenta pegar 'briefing' ou o apelido 'b'
    const briefing = params.get('briefing') || params.get('b');
    
    let decodedBriefing = briefing;
    try {
        if (briefing && briefing.startsWith('b64:')) {
            decodedBriefing = atob(briefing.replace('b64:', ''));
        }
    } catch(e) {
        console.warn("Falha ao decodificar briefing b64");
    }

    return {
        clientId: params.get('client_id') || params.get('cid') || '',
        projectName: params.get('projeto') || params.get('p') || '',
        clientName: params.get('cliente_nome') || params.get('cn') || '',
        autoBriefing: decodedBriefing || '', 
        origin: params.get('from') || 'direct'
    };
}
