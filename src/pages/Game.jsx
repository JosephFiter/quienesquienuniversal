import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    getGame,
    updatePlayerCharacter,
    updatePlayerEliminatedIds,
    startRiskPhase,
    setRiskSelection,
    setRiskReady,
    finishRiskPhase,
    clearRiskPhase,
} from '../services/firebaseService';
import defaultCharacters from '../assets/characters.json';
import Board from '../components/Board';
import Chat from '../components/Chat';

const Game = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [myCharacter, setMyCharacter] = useState(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const riskResolvedRef = useRef(false);
    const userId = localStorage.getItem('userId');

    const myEliminatedIds = (game?.playerEliminatedIds && game.playerEliminatedIds[userId]) || [];
    const opponentId = game?.players?.find((p) => p !== userId);
    const opponentEliminatedIds = (game?.playerEliminatedIds && game.playerEliminatedIds[opponentId]) || [];
    const sameTurnCount = myEliminatedIds.length === opponentEliminatedIds.length;
    const riskSelection = game?.riskSelections?.[userId];
    const riskReady = game?.riskReady || {};
    const bothRiskReady = game?.players?.length === 2 && game.players.every((p) => riskReady[p]);

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = getGame(gameId, (gameData) => {
            setGame(gameData);
            if (gameData && gameData.players?.length === 2 && !myCharacter) {
                if (gameData.characters?.[userId]) {
                    setMyCharacter(gameData.characters[userId]);
                } else {
                    const pool = (Array.isArray(gameData.characterList) && gameData.characterList.length)
                        ? gameData.characterList
                        : (() => {
                            try {
                                const stored = localStorage.getItem('customCharacterLists');
                                const selected = localStorage.getItem('selectedCharacterList');
                                if (!stored || !selected) return defaultCharacters;
                                const lists = JSON.parse(stored || '{}');
                                const chars = lists[selected];
                                if (!Array.isArray(chars)) return defaultCharacters;
                                return chars.map((c, idx) => ({ id: Number(c.id ?? idx + 1), name: c.name, image: c.image || '' }));
                            } catch (e) {
                                return defaultCharacters;
                            }
                        })();
                    const character = pool[Math.floor(Math.random() * pool.length)];
                    setMyCharacter(character);
                    updatePlayerCharacter(gameId, userId, character);
                }
            }
        });

        return () => unsubscribe();
    }, [gameId, userId, myCharacter]);

    useEffect(() => {
        if (game?.riskPhase) riskResolvedRef.current = false;
    }, [game?.riskPhase]);

    useEffect(() => {
        if (!game || !game.riskPhase || !userId || riskResolvedRef.current) return;
        const players = game.players || [];
        const ready = game.riskReady || {};
        const bothReady = players.length === 2 && players.every((p) => Boolean(ready[p]));
        if (!bothReady) return;

        const myGuess = game.riskSelections?.[userId];
        const oppId = players.find((p) => p !== userId);
        const oppGuess = game.riskSelections?.[oppId];
        const myChar = game.characters?.[userId] ?? myCharacter;
        const oppChar = game.characters?.[oppId];

        if (myGuess == null || oppGuess == null || !myChar || !oppChar) return;

        riskResolvedRef.current = true;
        const num = (v) => (typeof v === 'number' ? v : Number(v));
        const iGuessedRight = num(myGuess) === num(oppChar.id);
        const oppGuessedRight = num(oppGuess) === num(myChar.id);

        if (iGuessedRight && oppGuessedRight) {
            finishRiskPhase(gameId, { isTie: true, tieMessage: 'Empate: los dos adivinaron.' });
        } else if (iGuessedRight && !oppGuessedRight) {
            finishRiskPhase(gameId, {
                winnerId: userId,
                loserId: oppId,
                loserRevealedCharacter: oppChar,
            });
        } else if (!iGuessedRight && oppGuessedRight) {
            finishRiskPhase(gameId, {
                winnerId: oppId,
                loserId: userId,
                loserRevealedCharacter: myChar,
            });
        } else {
            clearRiskPhase(gameId);
        }
    }, [game, gameId, userId, myCharacter]);

    const handleEliminatedChange = (newIds) => {
        updatePlayerEliminatedIds(gameId, userId, newIds);
    };

    const handleArriesgarClick = () => {
        setShowWarningModal(true);
    };

    const handleWarningConfirm = () => {
        setShowWarningModal(false);
        startRiskPhase(gameId);
    };

    const handleRiskSelect = (characterId) => {
        setRiskSelection(gameId, userId, characterId);
    };

    const handleRiskListo = () => {
        if (game?.id) setRiskReady(game.id, userId);
    };

    if (!game) {
        return <div className="game-loading">Cargando...</div>;
    }

    if (game.status === 'waiting') {
        return (
            <div className="game-waiting">
                Esperando a otro jugador... El código de la sala es: <strong>{game.gameId}</strong>
            </div>
        );
    }

    if (game.status === 'finished') {
        const iWon = game.winnerId === userId;
        const iLost = game.loserId === userId;
        const revealed = game.loserRevealedCharacter;
        const oppId = game.players?.find((p) => p !== userId);
        const opponentChar = (game.characters && oppId && game.characters[oppId]) || revealed || null;

        return (
            <div className="game-finished">
                <h1>Partida finalizada</h1>
                {game.isTie ? (
                    <p className="result-message result-tie">{game.tieMessage || 'Empate: los dos adivinaron.'}</p>
                ) : iWon ? (
                    <p className="result-message result-win">¡Ganaste!</p>
                ) : iLost ? (
                    <div className="result-message result-lose">
                        <p>Perdiste.</p>
                        {opponentChar && (
                            <p className="revealed-character">
                                El personaje del otro jugador era: <strong>{opponentChar.name}</strong>
                            </p>
                        )}
                    </div>
                ) : null}
            </div>
        );
    }

    const inRiskPhase = game.riskPhase && game.players?.length === 2;

    return (
        <div className="game-container">
            <h1>Partida: {game.gameId}</h1>
            {myCharacter && <h2>Tu personaje: {myCharacter.name}</h2>}

            <div className="game-toolbar">
                <button type="button" className="btn-arriesgar" onClick={handleArriesgarClick}>
                    Arriesgar
                </button>
            </div>

            <Board
                eliminatedIds={myEliminatedIds}
                onEliminatedChange={handleEliminatedChange}
                characters={(Array.isArray(game?.characterList) && game.characterList.length) ? game.characterList : defaultCharacters}
            />

            <Chat gameId={gameId} />

            {showWarningModal && (
                <div className="modal-overlay" onClick={() => setShowWarningModal(false)}>
                    <div className="modal modal-warning" onClick={(e) => e.stopPropagation()}>
                        <h3>Antes de arriesgar</h3>
                        <p>
                            Estas seguro que quieres arriesgar?
                           
                        </p>
                        <p>¿Deseas continuar?</p>
                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowWarningModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="btn-confirm" onClick={handleWarningConfirm}>
                                Sí
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {inRiskPhase && (
                <div className="modal-overlay modal-risk-overlay">
                    <div className="modal modal-risk">
                        <h3>Arriesgar: elige el personaje del rival</h3>
                        <p className="risk-hint">
                            Los que tenés descartados se ven marcados, pero podés elegir cualquiera.
                        </p>
                        <Board
                            eliminatedIds={myEliminatedIds}
                            selectMode
                            selectedId={riskSelection}
                            onSelect={riskReady[userId] ? undefined : handleRiskSelect}
                            selectionLocked={riskReady[userId]}
                            characters={(Array.isArray(game?.characterList) && game.characterList.length) ? game.characterList : defaultCharacters}
                        />
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-listo"
                                onClick={handleRiskListo}
                                disabled={riskReady[userId] || riskSelection == null}
                            >
                                {riskReady[userId] ? 'Listo (esperando al otro)' : riskSelection == null ? 'Elegí un personaje' : 'Listo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
