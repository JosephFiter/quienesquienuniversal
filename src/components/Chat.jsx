import { useState, useEffect } from 'react';
import { sendMessage, getGame } from '../services/firebaseService';

const Chat = ({ gameId }) => {
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!gameId) return;
        const unsubscribe = getGame(gameId, (gameData) => {
            if (gameData && gameData.chat) {
                setChat(gameData.chat);
            }
        });
        return () => unsubscribe();
    }, [gameId]);

    const handleSendMessage = () => {
        if (!message) return;
        sendMessage(gameId, { userId, message, timestamp: new Date() });
        setMessage('');
    };

    return (
        <div>
            <h2>Chat</h2>
            <div style={{ height: '200px', border: '1px solid black', overflowY: 'scroll' }}>
                {chat.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.userId === userId ? 'Yo' : 'Oponente'}:</strong> {msg.message}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={handleSendMessage}>Enviar</button>
        </div>
    );
};

export default Chat;