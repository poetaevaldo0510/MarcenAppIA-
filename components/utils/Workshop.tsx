// Workshop.tsx
import { callIara, callCopilot, callRender } from "./utils/iaraPipeline";

const runPipeline = async (text: string, image: string | null = null) => {
  if (!text && !image) return;
  if (!store.user) return notify("Erro: Autenticação Requerida.");

  const cost = (image || text.toLowerCase().includes("render")) ? 60 : 10;
  if (!consumeCredits(cost)) return notify("Créditos Insuficientes.");

  const time = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Mensagens UX
  const userMsg = { id: Date.now(), from: "user", text: String(text || "[Mídia]"), type: image ? "user-image" : "text", src: image, time: time() };
  updateStore("messages", [...store.messages, userMsg]);
  updateStore("loadingAI", true);

  try {
    updateStore("aiStep", "Iara: Mapeando Geometria...");
    const dna = await callIara(text, image);
    if (!dna) throw new Error("Falha ao gerar DNA");

    updateStore("projectDNA", { ...store.projectDNA, projeto: dna.projeto });

    updateStore("aiStep", "Copiloto: Auditoria Estratégica...");
    const auditReport = await callCopilot(dna.projeto, financeiro);

    updateStore("aiStep", "Yara: Renderizando rascunho...");
    const quickRender = await callRender(dna.projeto, image, true);

    // Render final 4K opcional
    updateStore("aiStep", "Yara: Renderizando final 4K...");
    const finalRender = await callRender(dna.projeto, image, false);

    const finalMsg = {
      id: Date.now() + 5,
      from: "iara",
      type: "master-delivery",
      render: finalRender || quickRender,
      text: String(dna.comentario || "DNA estruturado."),
      venda: financeiro.venda,
      lucro: financeiro.lucro,
      report: auditReport,
      time: time()
    };

    updateStore("messages", [...store.messages, finalMsg]);

    if (store.activeProjectId && db) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', store.activeProjectId), {
        messages: [...store.messages, finalMsg],
        updatedAt: serverTimestamp()
      });
    }

  } catch (e) {
    console.error("Pipeline Error:", e);
    notify("Falha no Motor Industrial.");
  } finally {
    updateStore("loadingAI", false);
    updateStore("aiStep", "Pronto");
  }
};
