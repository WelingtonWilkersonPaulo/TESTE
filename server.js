// 1. IMPORTAÇÕES
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// 2. MIDDLEWARES (Configurações do Servidor)
app.use(cors()); // Permite que o Front-end (Vercel/GitHub Pages) acesse esta API
app.use(express.json()); // Permite ler o corpo das requisições em JSON
app.use(express.static('public')); // Opcional: Serve o front se ele estiver na mesma pasta

// 3. CONFIGURAÇÃO DA IA DO GOOGLE
// No Render, você vai cadastrar essa chave nas "Environment Variables"
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// 4. ROTA DE STATUS (Para testar se o servidor acordou)
app.get('/api/status', (req, res) => {
    res.json({ 
        status: "Operacional", 
        servidor: "Render Cloud",
        modelo: "Gemini 1.5 Flash" 
    });
});

// 5. ROTA DE CHAT (POST)
app.post('/api/chat', async (req, res) => {
    try {
        const { pergunta } = req.body;

        if (!pergunta) {
            return res.status(400).json({ erro: "A pergunta é obrigatória." });
        }

        // Escolha do modelo
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Engenharia de Prompt (Personalidade Sarcástica de 2026)
        const promptFinal = `Aja como um desenvolvedor sênior sarcástico de 2026. 
        Responda de forma curta e técnica, usando termos como Web4 e Edge Computing. 
        Pergunta: ${pergunta}`;

        const result = await model.generateContent(promptFinal);
        const respostaDaIA = result.response.text();

        // Retorna a resposta para o Front-end
        res.json({ resposta: respostaDaIA });

    } catch (error) {
        console.error("Erro no servidor:", error);
        res.status(500).json({ erro: "Erro interno no servidor de IA." });
    }
});

// 6. INICIALIZAÇÃO DINÂMICA (ESSENCIAL PARA O RENDER)
// O Render define a porta automaticamente. Se não houver (local), usa 3000.
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor decolando na porta ${PORTA}`);
});