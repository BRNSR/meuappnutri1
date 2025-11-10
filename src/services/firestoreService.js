// firestoreService.js

import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    getDocs,
    writeBatch,
    serverTimestamp // Importado para uso ideal de data/hora
} from 'firebase/firestore';

// ✅ CORREÇÃO: Importa 'app' do seu arquivo de configuração
import { app } from './firebaseConfig'; 

const db = getFirestore(app);

// =========================================================
// 1. REFERÊNCIAS DE COLEÇÕES
// =========================================================

const getExerciciosCollectionRef = (userId) => {
    return collection(db, 'users', userId, 'exercicios');
};

const getDailyLogDocRef = (userId, dataString) => {
    return doc(db, 'users', userId, 'Diario', dataString);
};

const getProfileDocRef = (userId) => {
    return doc(db, 'users', userId, 'profile', 'data'); 
};

// Mantendo 'HistoricoDePeso' para consistência com seus dados
const getWeightHistoryCollectionRef = (userId) => {
    return collection(db, 'users', userId, 'HistoricoDePeso');
};

const getReceitasCollectionRef = (userId) => {
    return collection(db, 'users', userId, 'receitas');
};


// =========================================================
// 2. FUNÇÕES CRUD: EXERCÍCIOS
// =========================================================

export async function saveExercicio(userId, exercicioData) {
    if (!userId) throw new Error("UserID é obrigatório.");
    try {
        await addDoc(getExerciciosCollectionRef(userId), {
            ...exercicioData,
            // ✅ MELHORIA: Usando serverTimestamp()
            createdAt: serverTimestamp() 
        });
    } catch (error) {
        console.error("Erro ao salvar exercício:", error);
        throw error;
    }
}

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

export async function deleteAllExercicios(userId) {
    if (!userId) throw new Error("UserID é obrigatório.");
    
    try {
        const exerciciosRef = getExerciciosCollectionRef(userId);
        const snapshot = await getDocs(exerciciosRef);
        
        const batch = writeBatch(db); 

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        console.error("Erro ao apagar todos os exercícios:", error);
        throw error;
    }
}


// =========================================================
// 3. FUNÇÕES CRUD: DAILY LOG
// =========================================================

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

// =========================================================
// 4. FUNÇÕES CRUD: PROFILE
// =========================================================

export async function saveProfile(userId, profileData) {
    if (!userId) throw new Error("UserID é obrigatório.");
    try {
        const docRef = getProfileDocRef(userId);
        await setDoc(docRef, { 
            ...profileData, 
            // ✅ MELHORIA: Usando serverTimestamp() para o último update
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

// =========================================================
// 5. FUNÇÕES CRUD: WEIGHT HISTORY
// =========================================================

export async function addWeightEntry(userId, weightData) {
    if (!userId) throw new Error("UserID é obrigatório.");
    try {
        const weightRef = getWeightHistoryCollectionRef(userId);
        await addDoc(weightRef, { 
            ...weightData, 
            // ✅ MELHORIA: Usando serverTimestamp()
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

// =========================================================
// 6. 🍲 FUNÇÕES CRUD: RECEITAS
// =========================================================

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