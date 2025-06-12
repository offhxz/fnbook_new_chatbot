// server.js

// 1. Importar os módulos usando a sintaxe ES Module
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv'; // Importa o dotenv
import cors from 'cors';     // Importa o cors usando sintaxe ES Module

dotenv.config(); // Carrega variáveis do arquivo .env

// 2. Inicializar o aplicativo Express
const app = express();

// 3. Definir a porta do servidor
const PORT = process.env.NODE_PORT || 3001;

// 4. Configurar a API Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("ERRO: Chave da API Gemini (GEMINI_API_KEY) não encontrada no arquivo .env.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 5. Configurar Middlewares
app.use(express.json());

// **APENAS UMA CONFIGURAÇÃO DE CORS**
// Use o CORS para permitir requisições do seu frontend (http://localhost:5173)
app.use(cors({ 
    origin: 'http://localhost:5173' // **AQUI DEVE SER A PORTA EXATA DO SEU FRONTEND**
}));

// 6. Definir o pre_prompt
const pre_prompt = `
Seu nome é Chatbot, você é um especialista em identificar notícias falsas, especialmente aquelas que circulam no Brasil e se referem a eventos atuais, entretanto pode responder notícias antigas, ou do resto do mundo. Ao receber um texto, analise-o criticamente, considerando os seguintes aspectos:

Não responda a pergunta enviada caso você acredite que não se trata de uma fake news ou uma notícia? Informe ao usuário de que isso foge do escopo do projeto e peça que ele refaça a pergunta tentando mudar os termos caso acredite que seja o caso.

- **Sensacionalismo e Apelo Emocional:** A notícia busca gerar forte emoção (medo, raiva, surpresa exagerada)? As manchetes são excessivamente chamativas ou sensacionalistas?
- Fontes e Credibilidade: A notícia cita fontes confiáveis e verificáveis? O site ou perfil que publicou a notícia é conhecido por divulgar informações precisas? Há links para as fontes originais?
- Erros e Inconsistências: O texto contém erros de gramática, ortografia, formatação incomum ou informações contraditórias?
- Data e Contexto: A notícia é recente ou está sendo compartilhada fora de contexto? Há informações sobre quando e onde o evento supostamente ocorreu?
- Verificação por Outras Fontes: Outros veículos de comunicação confiáveis estão reportando a mesma notícia? Agências de checagem de fatos já se pronunciaram sobre ela?

Com base nessa análise, responda se o texto parece ser uma notícia falsa ou se parece ser uma notícia verdadeira/plausível. Seja conciso na sua resposta, indicando o resultado da sua análise ("Fake News", "Provavelmente Verdadeiro" ou algo similar) e, se possível, um breve motivo para sua conclusão.
`;

// 7. Definir a Rota da API para o Chatbot (/api/analisar)
app.post('/api/analisar', async (req, res) => {
    console.log('Requisição recebida em /api/analisar');
    const { texto } = req.body;

    if (!texto || texto.trim().length < 10) {
        console.log('Erro: Texto inválido ou muito curto.');
        return res.status(400).json({ erro: 'Texto inválido ou muito curto' });
    }

    try {
        const promptCompleto = pre_prompt + "\n\n" + texto;
        console.log('Enviando para Gemini...');
        const result = await model.generateContent(promptCompleto);
        const responseFromGemini = await result.response;
        const resultadoTexto = responseFromGemini.text();
        console.log('Resposta da Gemini recebida.');
        res.json({ resultado: resultadoTexto });
    } catch (error) {
        console.error('Erro ao comunicar com a API Gemini:', error);
        res.status(500).json({ erro: 'Erro ao processar a solicitação com a API Gemini.' });
    }
});

// 8. Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando em http://localhost:${PORT}`);
    console.log(`Endpoint do chatbot (POST): http://localhost:${PORT}/api/analisar`);
});