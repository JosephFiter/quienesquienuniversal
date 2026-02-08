import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicGames, joinGame } from '../services/firebaseService';

const Lobby = () => {
    const [games, setGames] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            const publicGames = await getPublicGames();
            setGames(publicGames);
        };
        fetchGames();
    }, []);

    const getUserId = () => {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = Math.random().toString(36).substring(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    const handleJoinLobbyGame = async (gameId) => {
        const userId = getUserId();
        await joinGame(gameId, userId);
        navigate(`/game/${gameId}`);
    };

    return (
        <div>
            <h2>Lobby Público</h2>
            {games.length === 0 ? (
                <p>No hay partidas públicas disponibles.</p>
            ) : (
                <ul>
                    {games.map((game) => (
                        <li key={game.id}>
                            {game.gameId} - {game.players.length}/2
                            <button onClick={() => handleJoinLobbyGame(game.gameId)}>Unirse</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Lobby;