// src/components/ChatbotPopup/ChatbotPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import './ChatbotPopup.css'; // Vamos criar este arquivo CSS

// Ícones SVG (você pode usar uma biblioteca de ícones ou SVGs inline como antes)
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);


export default function ChatbotPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        // { text: "Olá! Como posso ajudar a verificar sua notícia hoje?", sender: 'bot' } // Mensagem inicial opcional
    ]);
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = useRef(null); // Para rolar para a última mensagem

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleInputChange = (e) => {
        setUserInput(e.target.value);
    };

    const handleSendMessage = async () => {
        const text = userInput.trim();
        if (text === '') return;

        const newUserMessage = { text, sender: 'user' };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setUserInput('');

        const thinkingMessage = { text: 'Analisando...', sender: 'bot', type: 'thinking' };
        setMessages(prevMessages => [...prevMessages, thinkingMessage]);

        try {
            // IMPORTANTE: '/api/analisar' deve ser um endpoint no SEU servidor Node.js
            const response = await fetch('http://localhost:3001/api/analisar', { // Este é o endpoint do seu backend Node.js
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ texto: text }),
            });

            // Remove a mensagem "Analisando..."
            setMessages(prevMessages => prevMessages.filter(msg => msg.type !== 'thinking'));

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ erro: 'Erro na resposta do servidor.' }));
                throw new Error(errorData.erro || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botResponse = { text: data.resultado || 'Não foi possível obter uma resposta.', sender: 'bot' };
            setMessages(prevMessages => [...prevMessages, botResponse]);

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
             // Remove a mensagem "Analisando..." em caso de erro também
            setMessages(prevMessages => prevMessages.filter(msg => msg.type !== 'thinking'));
            const errorMessage = { text: `Erro: ${error.message || 'Não foi possível conectar.'}`, sender: 'bot', type: 'error' };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <>
            <button id="chat-popup-toggle-btn" className="chat-popup-button" onClick={toggleChat}>
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>

            {isOpen && (
                <div id="chatbot-popup-container" className="chatbot-popup-container">
                    <div className="chatbot-header">
                        <span>Analisador de Fake News</span>
                        <button onClick={toggleChat} className="chatbot-close-btn-react">&times;</button>
                    </div>
                    <div id="chatbot-messages" className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message-bubble ${msg.sender === 'user' ? 'user-message' : 'bot-message'} ${msg.type === 'thinking' ? 'thinking' : ''} ${msg.type === 'error' ? 'error' : ''}`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} /> {/* Elemento para ajudar no scroll */}
                    </div>
                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            id="chatbot-user-input"
                            placeholder="Digite sua mensagem..."
                            value={userInput}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                        />
                        <button id="chatbot-send-btn" onClick={handleSendMessage}>
                            <SendIcon />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}