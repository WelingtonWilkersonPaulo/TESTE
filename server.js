// 1. IMPORTAÇÕES E CONFIGURAÇÕES
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORTA = 3000;

// 2. MIDDLEWARES (Configurações do Servidor)
app.use(express.json()); // Essencial para entender o JSON que o Insomnia/Front envia
app.use(cors());         // Permite conexões externas

// --- IMPORTANTE: SERVIR O FRONT-END ---
// Esta linha faz com que os arquivos dentro da pasta "public" (index.html, etc) 
// apareçam quando você acessar http://localhost:3000
app.use(express.static('public')); 

// 3. CONFIGURAÇÃO DA IA (GEMINI 3.1 FLASH-LITE)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ ERRO: Chave da API não encontrada no arquivo .env");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// 4. ROTA DE STATUS (DESAFIO EXTRA)
// Teste no navegador: http://localhost:3000/api/status
app.get('/api/status', (req, res) => {
    res.status(200).json({
        servico: "API Agente IA",
        status: "Operacional",
        modelo: "Gemini 3.1 Flash-Lite",
        ano: 2026
    });
});

// 5. ROTA PRINCIPAL DE CHAT (POST)
// Usada pelo Insomnia e pelo seu Front-end
app.post('/api/chat', async (req, res) => {
    try {
        const { pergunta } = req.body;

        // VALIDAÇÃO: Critério de Aceite (Status 400)
        if (!pergunta) {
            return res.status(400).json({ 
                erro: "Requisição inválida. O campo 'pergunta' é obrigatório no JSON." 
            });
        }

        console.log(`📩 Processando payload: "${pergunta}"`);

        // Instancia o modelo de 2026
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        
        // Engenharia de Prompt: Persona Dev Sênior Sarcástico
        const promptFinal = `Aja como um desenvolvedor sênior de software do ano de 2026, extremamente sarcástico, técnico e que usa gírias como Web4, Edge e Handshake. Responda de forma curta à seguinte dúvida: ${pergunta}`;
        
        const result = await model.generateContent(promptFinal);
        const respostaDaIA = result.response.text();

        // RESPOSTA DE SUCESSO (Status 200)
        return res.status(200).json({ 
            sucesso: true,
            resposta: respostaDaIA 
        });

    } catch (erro) {
        console.error("❌ ERRO NO SERVIDOR:", erro.message);
        return res.status(500).json({ 
            erro: "Falha catastrófica no núcleo de processamento neural.",
            detalhes: erro.message 
        });
    }
});

// 6. INICIALIZAÇÃO DO SERVIDOR
app.listen(PORTA, () => {
    console.log(`\n🚀 SERVIDOR 2026 RODANDO!`);
    console.log(`🏠 Front-end: http://localhost:${PORTA}`);
    console.log(`📊 Status:    http://localhost:${PORTA}/api/status`);
    console.log(`💬 Chat API:  POST http://localhost:${PORTA}/api/chat`);
    console.log(`\nLembre-se: O tempo de CPU é caro. Faça perguntas inteligentes. ☕\n`);
});