import React, { useEffect, useState, useRef } from 'react';
import { Message, ChatState } from '../types';
import './Chat.css';

const SERVER_URL = 'ws://89.169.153.146:8081';

export const Chat: React.FC = () => {
    const [state, setState] = useState<ChatState>({
        messages: [],
        connected: false,
        error: null
    });
    const [inputMessage, setInputMessage] = useState('');
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const socket = new WebSocket(SERVER_URL);
        socketRef.current = socket;

        socket.onopen = () => {
            setState(prev => ({ ...prev, connected: true, error: null }));
        };

        socket.onmessage = (event) => {
            const message: Message = {
                text: event.data,
                sender: 'other',
                timestamp: Date.now()
            };
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, message]
            }));
        };

        socket.onerror = (error) => {
            setState(prev => ({ ...prev, error: 'Ошибка подключения к серверу' }));
        };

        socket.onclose = () => {
            setState(prev => ({ ...prev, connected: false }));
        };

        return () => {
            socket.close();
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [state.messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !socketRef.current) return;

        const message: Message = {
            text: inputMessage,
            sender: 'me',
            timestamp: Date.now()
        };

        socketRef.current.send(inputMessage);
        setState(prev => ({
            ...prev,
            messages: [...prev.messages, message]
        }));
        setInputMessage('');
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Чат</h2>
                <div className={`connection-status ${state.connected ? 'connected' : 'disconnected'}`}>
                    {state.connected ? 'Подключено' : 'Отключено'}
                </div>
            </div>
            
            {state.error && (
                <div className="error-message">
                    {state.error}
                </div>
            )}

            <div className="messages-container">
                {state.messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.sender === 'me' ? 'message-mine' : 'message-other'}`}
                    >
                        <div className="message-text">{message.text}</div>
                        <div className="message-time">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="input-form">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    disabled={!state.connected}
                />
                <button type="submit" disabled={!state.connected}>
                    Отправить
                </button>
            </form>
        </div>
    );
}; 