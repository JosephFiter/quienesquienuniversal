import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../services/firebaseService';
import Lobby from '../components/Lobby';

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
            const newGameId = await createGame(userId, createGameId);
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

    return (
        <div>
            <h1>¿Quién es Quién?</h1>
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
        </div>
    );
};

export default Home;
