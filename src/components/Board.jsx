import { useMemo } from 'react';
import initialCharacters from '../assets/characters.json';
import './Board.css';

const Board = ({ eliminatedIds = [], onEliminatedChange, selectMode = false, selectedId, onSelect, selectionLocked = false, characters = null }) => {
    const idsSet = useMemo(() => new Set(eliminatedIds), [eliminatedIds]);

    const handleCharacterClick = (clickedCharacter) => {
        if (selectionLocked) return;
        if (selectMode && onSelect) {
            onSelect(clickedCharacter.id);
            return;
        }
        if (!onEliminatedChange) return;
        const newIds = idsSet.has(clickedCharacter.id)
            ? eliminatedIds.filter((id) => id !== clickedCharacter.id)
            : [...eliminatedIds, clickedCharacter.id];
        onEliminatedChange(newIds);
    };

    const sortedCharacters = useMemo(() => {
        const chars = Array.isArray(characters) && characters.length ? characters : initialCharacters;
        const list = chars.map((c) => ({
            ...c,
            eliminated: idsSet.has(c.id),
            selected: selectMode && selectedId === c.id,
        }));
        list.sort((a, b) => a.eliminated - b.eliminated);
        return list;
    }, [idsSet, selectMode, selectedId]);

    return (
        <div className={`board ${selectionLocked ? 'board-locked' : ''}`}>
            {sortedCharacters.map((character) => (
                <div
                    key={character.id}
                    className={`character-card ${character.eliminated ? 'eliminated' : ''} ${character.selected ? 'selected' : ''}`}
                    onClick={() => handleCharacterClick(character)}
                >
                    {character.image ? <img src={character.image} alt={character.name} /> : null}
                    <p>{character.name}</p>
                </div>
            ))}
        </div>
    );
};

export default Board;
