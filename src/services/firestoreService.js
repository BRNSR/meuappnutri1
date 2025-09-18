import { getFirestore, collection, addDoc, onSnapshot, query, where, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Variáveis globais de configuração do Firebase, fornecidas pelo ambiente.
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Assina o token de autenticação inicial para login automático.
// Se o token não for fornecido, faz login anônimo.
if (initialAuthToken) {
  auth.signInWithCustomToken(initialAuthToken).catch(console.error);
} else {
  auth.signInAnonymously().catch(console.error);
}

/**
 * Salva uma nova receita para o usuário atual.
 * @param {object} recipe A receita a ser salva.
 * @returns {Promise<string>} O ID da receita salva.
 */
export const saveRecipe = async (recipe) => {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    // O caminho do documento é público para ser compartilhado
    const docPath = `/artifacts/${appId}/public/data/recipes`;
    
    // Adiciona o userId e o appId à receita antes de salvar
    const recipeData = {
      ...recipe,
      userId: userId,
      appId: appId,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, docPath), recipeData);
    console.log("Receita salva com o ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar a receita:", error);
    throw error;
  }
};

/**
 * Obtém as receitas de um usuário específico e monitora mudanças em tempo real.
 * @param {string} userId O ID do usuário.
 * @param {function} callback A função a ser chamada com a lista de receitas atualizada.
 * @returns {function} Uma função para desinscrever o listener.
 */
export const subscribeToRecipes = (userId, callback) => {
  const docPath = `/artifacts/${appId}/public/data/recipes`;
  const q = query(collection(db, docPath), where("userId", "==", userId));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const recipes = [];
    querySnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() });
    });
    callback(recipes);
  }, (error) => {
    console.error("Erro ao obter receitas:", error);
  });

  return unsubscribe;
};

/**
 * Deleta uma receita do Firestore.
 * @param {string} recipeId O ID da receita a ser deletada.
 */
export const deleteRecipe = async (recipeId) => {
  try {
    const docPath = `/artifacts/${appId}/public/data/recipes/${recipeId}`;
    await deleteDoc(doc(db, docPath));
    console.log("Receita deletada com o ID: ", recipeId);
  } catch (error) {
    console.error("Erro ao deletar a receita:", error);
    throw error;
  }
};
