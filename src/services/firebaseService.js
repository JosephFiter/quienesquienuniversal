import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, onSnapshot, query, where, getDocs, runTransaction } from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

const generateId = () => {
    return Math.random().toString(36).substring(2, 8);
}

export const isGameIdAvailable = async (gameId) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
};

export const createGame = async (userId, customGameId, characterList = null) => {
    const gameId = customGameId || generateId();

    if (customGameId) {
        const isAvailable = await isGameIdAvailable(customGameId);
        if (!isAvailable) {
            throw new Error("Game ID not available");
        }
    }

    const gameRef = await addDoc(collection(db, "games"), {
        gameId,
        players: [userId],
        status: "waiting",
        createdAt: new Date(),
        characterList: Array.isArray(characterList) ? characterList : null,
        creatorId: userId,
    });
    return gameId;
};

export const joinGame = async (gameId, userId) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        throw new Error("Game not found");
    }
    const gameDoc = querySnapshot.docs[0];
    const gameData = gameDoc.data();
    if (gameData.players.length >= 2) {
        throw new Error("Game is full");
    }
    await updateDoc(gameDoc.ref, {
        players: [...gameData.players, userId],
        status: "playing",
    });
};

export const getPublicGames = async () => {
    const q = query(collection(db, "games"), where("status", "==", "waiting"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getGame = (gameId, callback) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    return onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            callback(null);
            return;
        }
        const gameDoc = querySnapshot.docs[0];
        callback({ id: gameDoc.id, ...gameDoc.data() });
    });
};

export const updateGameState = async (gameId, newState) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        throw new Error("Game not found");
    }
    const gameDoc = querySnapshot.docs[0];
    await updateDoc(gameDoc.ref, newState);
};

export const sendMessage = async (gameId, message) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        throw new Error("Game not found");
    }
    const gameDoc = querySnapshot.docs[0];
    const gameData = gameDoc.data();
    await updateDoc(gameDoc.ref, {
        chat: [...(gameData.chat || []), message],
    });
};

export const updatePlayerCharacter = async (gameId, userId, character) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        throw new Error("Game not found");
    }
    const gameDoc = querySnapshot.docs[0];
    const gameData = gameDoc.data();
    const playerIndex = gameData.players.indexOf(userId);
    if (playerIndex === -1) {
        throw new Error("Player not found");
    }
    const characters = gameData.characters || {};
    characters[userId] = character;
    await updateDoc(gameDoc.ref, { characters });
};

/** Lista de ids de personajes que este jugador marcó como descartados (para contar "turnos") */
export const updatePlayerEliminatedIds = async (gameId, userId, eliminatedIds) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error("Game not found");
    const gameDoc = querySnapshot.docs[0];
    const gameData = gameDoc.data();
    const playerEliminatedIds = { ...(gameData.playerEliminatedIds || {}), [userId]: eliminatedIds };
    await updateDoc(gameDoc.ref, { playerEliminatedIds });
};

/** Abre la fase de arriesgar para ambos jugadores */
export const startRiskPhase = async (gameId) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error("Game not found");
    const gameDoc = querySnapshot.docs[0];
    await updateDoc(gameDoc.ref, {
        riskPhase: true,
        riskSelections: {},
        riskReady: {},
    });
};

/** Jugador elige qué personaje arriesga (el que cree que tiene el rival) */
export const setRiskSelection = async (gameId, userId, characterId) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error("Game not found");
    const gameDoc = querySnapshot.docs[0];
    const gameData = gameDoc.data();
    const riskSelections = { ...(gameData.riskSelections || {}), [userId]: characterId };
    await updateDoc(gameDoc.ref, { riskSelections });
};

/** Jugador marca "Listo" en la fase de arriesgar. gameDocId = id del documento en Firestore (game.id). */
export const setRiskReady = async (gameDocId, userId) => {
    const gameRef = doc(db, "games", gameDocId);
    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(gameRef);
        if (!snap.exists()) throw new Error("Game not found");
        const gameData = snap.data();
        const riskReady = { ...(gameData.riskReady || {}), [userId]: true };
        transaction.update(gameRef, { riskReady });
    });
};

/** Cierra la fase de arriesgar con resultado: ganador/perdedor/empate. Incluir winnerId, loserId, isTie, loserRevealedCharacter. */
export const finishRiskPhase = async (gameId, payload) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error("Game not found");
    const gameDoc = querySnapshot.docs[0];
    await updateDoc(gameDoc.ref, {
        status: "finished",
        riskPhase: false,
        riskSelections: {},
        riskReady: {},
        ...payload,
    });
};

/** Ambos fallaron: solo cerrar fase de arriesgar y seguir jugando */
export const clearRiskPhase = async (gameId) => {
    const q = query(collection(db, "games"), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error("Game not found");
    const gameDoc = querySnapshot.docs[0];
    await updateDoc(gameDoc.ref, {
        riskPhase: false,
        riskSelections: {},
        riskReady: {},
    });
}
