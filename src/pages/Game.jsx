import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getGame, updatePlayerCharacter, switchTurn } from '../services/firebaseService';
import characters from '../assets/characters.json';
import Board from '../components/Board';
import Chat from '../components/Chat';

const Game = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [myCharacter, setMyCharacter] = useState(null);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = getGame(gameId, (gameData) => {
            setGame(gameData);
            if (gameData && gameData.players.length === 2 && !myCharacter) {
                const playerIndex = gameData.players.indexOf(userId);
                if (gameData.characters && gameData.characters[userId]) {
                    setMyCharacter(gameData.characters[userId]);
                } else {
                    const character = characters[Math.floor(Math.random() * characters.length)];
                    setMyCharacter(character);
                    updatePlayerCharacter(gameId, userId, character);
                }
            }
        });

        return () => unsubscribe();
    }, [gameId, userId, myCharacter]);

    const handleSwitchTurn = () => {
        switchTurn(gameId);
    }

    if (!game) {
        return <div>Cargando...</div>;
    }

    if (game.status === 'waiting') {
        return <div>Esperando a otro jugador... El código de la sala es: {game.gameId}</div>;
    }

    return (
        <div>
            <h1>Partida: {game.gameId}</h1>
            {myCharacter && <h2>Tu personaje: {myCharacter.name}</h2>}
            <p>Turno de: {game.turn === userId ? "Ti" : "Tu oponente"}</p>
            {game.turn === userId && <button onClick={handleSwitchTurn}>Terminar mi turno</button>}
            <Board />
            <Chat gameId={gameId} />
        </div>
    );
};

export default Game;