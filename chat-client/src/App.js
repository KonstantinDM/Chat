import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'ws://localhost:8081';
    console.log('Attempting to connect to:', serverUrl);
    const ws = new WebSocket(serverUrl);

    ws.onopen = () => {
      console.log('Successfully connected to server');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    ws.onclose = (event) => {
      console.log('Disconnected from server. Code:', event.code, 'Reason:', event.reason);
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.error('Error details:', error.message);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleSend = () => {
    if (socket && input.trim() && isUsernameSet) {
      const message = {
        username,
        text: input,
        timestamp: new Date().toISOString()
      };
      socket.send(JSON.stringify(message));
      setInput('');
    }
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="App">
        <div className="username-form">
          <h2>Введите ваше имя</h2>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ваше имя"
            />
            <button type="submit">Продолжить</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <span className="username">{msg.username}: </span>
              <span className="text">{msg.text}</span>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Введите сообщение..."
          />
          <button onClick={handleSend} disabled={!isConnected}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}

export default App; 