
/**
 * WhatsApp Business API Connector
 * Utiliza a Cloud API da Meta (graph.facebook.com)
 */

interface SendMessageParams {
    to: string;
    text: string;
    phoneId: string;
    token: string;
}

export async function sendWhatsAppMessage({ to, text, phoneId, token }: SendMessageParams) {
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    
    // Remove caracteres não numéricos do telefone
    const cleanPhone = to.replace(/\D/g, '');
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: { body: text }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao conectar com API WhatsApp da Meta");
    }

    return await response.json();
}

/**
 * Constrói o link de fallback quando a API não está configurada
 */
export function getWhatsAppWebLink(phone: string, text: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
