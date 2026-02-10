
/**
 * Webhook para MarcenApp (Meta Business)
 * Endereço para configurar no painel de desenvolvedor da Meta
 */

export default function handler(req: any, res: any) {
  // Token de verificação configurado na Meta
  const VERIFY_TOKEN = "marcenapp_iara_2025";

  // Verificação de Veracidade (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // Recebimento de Mensagem (POST)
  if (req.method === "POST") {
    const body = req.body;

    if (body.object === "whatsapp_business_account") {
      // Log do evento para a oficina
      console.log("Evento WhatsApp Recebido:", JSON.stringify(body, null, 2));
      
      // Aqui a Iara processaria a mensagem...
      
      return res.status(200).send("EVENT_RECEIVED");
    }

    return res.status(404).send("Not Found");
  }

  return res.status(405).end();
}
