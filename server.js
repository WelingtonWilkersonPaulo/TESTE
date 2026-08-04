require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 3. CONFIGURAÇÃO DO NOVO MOTOR
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.get('/api/status', (req, res) => {
    res.json({ 
        status: "Operacional", 
        modelo: "Gemini 3.0 Flash",
        versao: "2026.02.v3" 
    });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { pergunta } = req.body;

        if (!pergunta) {
            return res.status(400).json({ resposta: "Sinal fraco. Mande um payload válido." });
        }

        // --- MODELO MAIS RECENTE (GEMINI 2.0 FLASH) ---
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const promptFinal = `Aja como um Engenheiro de Software Sênior de 2026. 
        Responda de forma curta, técnica e sarcástica. 
        Pergunta do Humano: ${pergunta}`;

        // Executa a geração
        const result = await model.generateContent(promptFinal);
        const response = await result.response;
        const texto = response.text(); // Extração direta do texto

        console.log("✅ Resposta gerada com sucesso via Gemini 2.0");

        // Retorna o JSON com a chave 'resposta' para o Front-end não dar 'undefined'
        res.json({ resposta: texto });

    } catch (error) {
        // Log detalhado no terminal do Render para você ver o erro real
        console.error("❌ ERRO NO SERVIDOR:");
        console.error("Mensagem:", error.message);

        res.status(500).json({ 
            resposta: "Erro 500: Falha na uplink com o Gemini 2.0.",
            debug: error.message 
        });
    }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Core Engine Online na porta ${PORTA}`);
});