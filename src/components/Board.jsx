import { useState, useEffect } from 'react';
import initialCharacters from '../assets/characters.json';
import './Board.css';

const Board = () => {
    const [characters, setCharacters] = useState([]);

    useEffect(() => {
        // Initialize characters with an 'eliminated' status
        setCharacters(initialCharacters.map(c => ({ ...c, eliminated: false })));
    }, []);

    const handleCharacterClick = (clickedCharacter) => {
        const updatedCharacters = characters.map(c =>
            c.id === clickedCharacter.id ? { ...c, eliminated: !c.eliminated } : c
        );
        
        // Sort characters to move eliminated ones to the end
        updatedCharacters.sort((a, b) => a.eliminated - b.eliminated);

        setCharacters(updatedCharacters);
    };

    return (
        <div className="board">
            {characters.map(character => (
                <div
                    key={character.id}
                    className={`character-card ${character.eliminated ? 'eliminated' : ''}`}
                    onClick={() => handleCharacterClick(character)}
                >
                    <img src={character.image} alt={character.name} />
                    <p>{character.name}</p>
                </div>
            ))}
        </div>
    );
};

export default Board;
