require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Jogador = require('./models/Jogador');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexão MongoDB (Coloque sua STRING_MONGODB no .env)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Conectado"))
    .catch(err => console.error("❌ Erro MongoDB:", err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- FASE 2: FUNÇÃO DE XP ---
async function adicionarXP({ nickname, quantidade }) {
    console.log(`🎮 Adicionando ${quantidade} XP para ${nickname}`);
    let jogador = await Jogador.findOne({ nome: nickname });
    
    if (!jogador) {
        jogador = new Jogador({ nome: nickname, xp: quantidade });
    } else {
        jogador.xp += quantidade;
    }
    await jogador.save();
    return { status: "sucesso", novoXP: jogador.xp };
}

// Configuração das Ferramentas (Tools) para a IA
const tools = [
    {
        functionDeclarations: [{
            name: "adicionarXP",
            description: "Adiciona ou remove pontos de experiência (XP) de um jogador.",
            parameters: {
                type: "OBJECT",
                properties: {
                    nickname: { type: "STRING", description: "O apelido do jogador." },
                    quantidade: { type: "NUMBER", description: "A quantidade de XP (positivo para ganhar, negativo para perder)." }
                },
                required: ["nickname", "quantidade"]
            }
        }]
    }
];

// --- FASE 4: ROTA DE RANKING ---
app.get('/api/ranking', async (req, res) => {
    try {
        const top10 = await Jogador.find().sort({ xp: -1 }).limit(10);
        const rankingComTitulos = top10.map(j => ({
            nome: j.xp > 500 ? `⭐ Lenda: ${j.nome}` : j.xp > 100 ? `⚔️ Veterano: ${j.nome}` : `🌱 Novato: ${j.nome}`,
            xp: j.xp
        }));
        res.json(rankingComTitulos);
    } catch (error) {
        res.status(500).json({ erro: "Falha ao buscar ranking" });
    }
});

// --- ROTA DE CHAT ATUALIZADA ---
app.post('/api/chat', async (req, res) => {
    try {
        const { pergunta, nickname } = req.body;
        if (!nickname) return res.status(400).json({ resposta: "Quem é você? Digite um nickname!" });

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash", // Use o modelo que funcionou no seu Render
            tools: tools
        });

        const chat = model.startChat();
        
        // Instrução de Sistema
        const promptSistema = `Você é o Guardião do Cofre de 2026. 
        Sempre proponha charadas sobre computação em nuvem ou programação.
        - Se o usuário acertar: Chame 'adicionarXP' com 50 pontos.
        - Se o usuário errar ou for desrespeitoso: Chame 'adicionarXP' com -10 pontos.
        - Nickname do jogador atual: ${nickname}.
        Não diga o XP atual dele, apenas que ele ganhou ou perdeu.`;

        const result = await chat.sendMessage(promptSistema + "\n" + pergunta);
        
        // Verificar se a IA quer chamar uma função
        const call = result.response.functionCalls()?.[0];
        if (call && call.name === "adicionarXP") {
            const apiResponse = await adicionarXP(call.args);
            // Responder de volta para a IA com o resultado da função
            const finalResult = await chat.sendMessage([{ functionResponse: { name: "adicionarXP", response: apiResponse } }]);
            return res.json({ resposta: finalResult.response.text() });
        }

        res.json({ resposta: result.response.text() });
    } catch (error) {
        res.status(500).json({ resposta: "Erro na Matrix.", erro: error.message });
    }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => console.log(`🚀 Game Engine na porta ${PORTA}`));