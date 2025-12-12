import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    deleteDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    getDocs,
    writeBatch,
    serverTimestamp 
} from 'firebase/firestore';

import { app } from './firebaseConfig'; 

const db = getFirestore(app);


// ------------------------------------------------
// Referências
// ------------------------------------------------

const getExerciciosCollectionRef = (userId) => {
    return collection(db, 'users', userId, 'exercicios');
};

const getDailyLogDocRef = (userId, dataString) => {
    return doc(db, 'users', userId, 'Diario', dataString);
};

const getProfileDocRef = (userId) => {
    return doc(db, 'users', userId, 'profile', 'data'); 
};

const getWeightHistoryCollectionRef = (userId) => {
    return collection(db, 'users', userId, 'HistoricoDePeso');
};

const getReceitasCollectionRef = (userId) => {
    return collection(db, 'users', userId, 'receitas');
};



// ------------------------------------------------
// salvar um novo Exercício
// ------------------------------------------------

export async function saveExercicio(userId, exercicioData) {
    if (!userId) throw new Error("UserID é obrigatório.");
    try {
        await addDoc(getExerciciosCollectionRef(userId), {
            ...exercicioData,
            createdAt: serverTimestamp() 
        });
    } catch (error) {
        console.error("Erro ao salvar exercício:", error);
        throw error;
    }
}

// ------------------------------------------------
// atualizar um exercício existente
// ------------------------------------------------
export async function updateExercicio(userId, exercicioId, data) {
    if (!userId || !exercicioId) throw new Error("UserID e Exercício ID são obrigatórios.");
    try {
        const docRef = doc(getExerciciosCollectionRef(userId), exercicioId);
        
        await updateDoc(docRef, {
            ...data,
            lastUpdated: serverTimestamp() 
        });
        
    } catch (error) {
        console.error("Erro ao atualizar exercício:", error);
        throw error;
    }
}


// ------------------------------------------------
// deletar um Exercício
// ------------------------------------------------
export async function deleteExercicio(userId, exercicioId) {
    if (!userId || !exercicioId) throw new Error("UserID e Exercício ID são obrigatórios.");
    try {
        const docRef = doc(getExerciciosCollectionRef(userId), exercicioId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Erro ao deletar exercício:", error);
        throw error;
    }
}


// ------------------------------------------------
// subscrever-se a Exercícios por Dia 
// ------------------------------------------------
export function subscribeToExercicios(userId, diaDaSemana, callback) {
    if (!userId) return () => {};

    const q = query(
        getExerciciosCollectionRef(userId),
        where("day", "==", diaDaSemana),
        orderBy("createdAt", "desc") 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const exerciciosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(exerciciosList);
    }, (error) => {
        console.error("Erro ao receber snapshot dos exercícios:", error);
        callback([]);
    });

    return unsubscribe;
}



// ------------------------------------------------
// funções de Diário
// ------------------------------------------------

export async function saveDailyLog(userId, dataString, dataToSave) {
    if (!userId) throw new Error("UserID é obrigatório.");
    try {
        const docRef = getDailyLogDocRef(userId, dataString);
        await setDoc(docRef, dataToSave, { merge: true });
    } catch (error) {
        console.error("Erro ao salvar DailyLog:", error);
        throw error;
    }
}

export function subscribeToDailyLog(userId, dataString, callback) {
    if (!userId) return () => {};

    const docRef = getDailyLogDocRef(userId, dataString);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        callback(docSnap); 
    }, (error) => {
        console.error("Erro ao receber snapshot do DailyLog:", error);
        callback(null); 
    });

    return unsubscribe;
}

// ------------------------------------------------
// funções de Perfil
// ------------------------------------------------

export async function saveProfile(userId, profileData) {
    if (!userId) throw new Error("UserID é obrigatório.");
    try {
        const docRef = getProfileDocRef(userId);
        await setDoc(docRef, { 
            ...profileData, 
            lastUpdated: serverTimestamp() 
        }, { merge: true });
    } catch (error) {
        console.error("Erro ao salvar Profile:", error);
        throw error;
    }
}

export function subscribeToProfile(userId, callback) {
    if (!userId) return () => {};

    const perfilRef = getProfileDocRef(userId);
    
    const unsubscribe = onSnapshot(perfilRef, (docSnap) => {
        callback(docSnap); 
    }, (error) => {
        console.error("Erro ao receber snapshot do Perfil:", error);
        callback(null); 
    });

    return unsubscribe;
}

// ------------------------------------------------
// funções de Peso
// ------------------------------------------------

export async function addWeightEntry(userId, weightData) {
    if (!userId) throw new Error("UserID é obrigatório.");
    try {
        const weightRef = getWeightHistoryCollectionRef(userId);
        await addDoc(weightRef, { 
            ...weightData, 
            createdAt: serverTimestamp() 
        });
    } catch (error) {
        console.error("Erro ao adicionar entrada de peso:", error);
        throw error;
    }
}

export function subscribeToWeightHistory(userId, callback) {
    if (!userId) return () => {};

    const q = query(
        getWeightHistoryCollectionRef(userId),
        orderBy("createdAt", "desc") 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(historyList);
    }, (error) => {
        console.error("Erro ao receber snapshot do Histórico de Peso:", error);
        callback([]);
    });

    return unsubscribe;
}

// ------------------------------------------------
// funções de Receitas
// ------------------------------------------------

export async function saveReceita(userId, receitaData) {
    if (!userId) throw new Error("UserID é obrigatório.");
    if (!receitaData.id) throw new Error("Receita ID (uuid) é obrigatório.");
    
    const docId = receitaData.id; 
    
    const { id, ...dataToSave } = receitaData; 

    const dataWithTimestamp = {
        ...dataToSave,
        createdAt: serverTimestamp() 
    };

    try {
        await setDoc(doc(getReceitasCollectionRef(userId), docId), dataWithTimestamp);
    } catch (error) {
        console.error("Erro ao salvar receita:", error);
        throw error;
    }
}

// ------------------------------------------------
// deletar Receita 
// ------------------------------------------------

export async function deleteReceita(userId, receitaId) {
    if (!userId || !receitaId) throw new Error("UserID e Receita ID são obrigatórios.");
    try {
        await deleteDoc(doc(getReceitasCollectionRef(userId), receitaId));
    } catch (error) {
        console.error("Erro ao deletar receita:", error);
        throw error;
    }
}

export function subscribeToReceitas(userId, callback) {
    if (!userId) return () => {}; 
    
    const q = query(
        getReceitasCollectionRef(userId),
        orderBy("createdAt", "desc") 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const receitasList = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        callback(receitasList);
    }, (error) => {
        console.error("Erro ao receber snapshot das receitas:", error);
        callback([]);
    });

    return unsubscribe;
}