import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../services/firebaseService';
import Lobby from '../components/Lobby';
import Settings from '../components/Settings';

const Home = () => {
    const [joinGameId, setJoinGameId] = useState('');
    const [createGameId, setCreateGameId] = useState('');
    const navigate = useNavigate();

    const getUserId = () => {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = Math.random().toString(36).substring(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    const handleCreateGame = async () => {
        const userId = getUserId();
        try {
            // build selected character list (the creator's list) to send to createGame
            let characterList = null;
            try {
                const stored = localStorage.getItem('customCharacterLists');
                const selected = localStorage.getItem('selectedCharacterList');
                if (stored && selected) {
                    const lists = JSON.parse(stored || '{}');
                    const chars = lists[selected];
                    if (Array.isArray(chars) && chars.length) {
                        characterList = chars.map((c, idx) => ({ id: Number(c.id ?? idx + 1), name: c.name, image: c.image || '' }));
                    }
                }
            } catch (e) {
                characterList = null;
            }

            const newGameId = await createGame(userId, createGameId, characterList);
            navigate(`/game/${newGameId}`);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleJoinGame = async () => {
        if (!joinGameId) return;
        const userId = getUserId();
        // joinGame function in firebaseService does not need to be changed
        await joinGame(joinGameId, userId);
        navigate(`/game/${joinGameId}`);
    };

    const [showSettings, setShowSettings] = useState(false);

    return (
        <div>
            <h1>¿Quién es Quién?</h1>
            <button onClick={() => setShowSettings(true)}>Configuración</button>
            <div>
                <input
                    type="text"
                    value={createGameId}
                    onChange={(e) => setCreateGameId(e.target.value)}
                    placeholder="Código de sala personalizado (opcional)"
                />
                <button onClick={handleCreateGame}>Crear Partida</button>
            </div>
            <div>
                <input
                    type="text"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value)}
                    placeholder="Introduce el código de la sala"
                />
                <button onClick={handleJoinGame}>Unirse a Partida Privada</button>
            </div>
            <Lobby />
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </div>
    );
};

export default Home;
