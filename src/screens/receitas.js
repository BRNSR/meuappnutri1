// screens/Receitas.js

import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator 
} from 'react-native'; 
import { getAuth } from 'firebase/auth'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'; 

// Importa funções do Firebase
import { subscribeToReceitas, deleteReceita } from '../services/firestoreService';
// Importa as receitas padrão (local, não deletáveis)
import receitasPadrao from '../data/receitas.json'; 

export default function Receitas({ navigation }) {
    const insets = useSafeAreaInsets(); 
    const auth = getAuth();
    const [userId, setUserId] = useState(auth.currentUser?.uid || null);
    const [receitasUsuario, setReceitasUsuario] = useState([]); 
    const [todasAsReceitas, setTodasAsReceitas] = useState(receitasPadrao); // Começa com as padrão
    const [loading, setLoading] = useState(true);

    // Monitoramento de Autenticação e Subscription ao Firestore
    useEffect(() => {
        // 1. Monitora o usuário
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            setUserId(user ? user.uid : null);
            if (!user) {
                setLoading(false);
            }
        });
        
        // 2. Subscription do Firestore
        let unsubscribeFirestore = () => {}; 
        
        if (userId) {
            setLoading(true);
            unsubscribeFirestore = subscribeToReceitas(userId, (novasReceitas) => {
                setReceitasUsuario(novasReceitas);
                // Combina as receitas padrão com as do usuário (Firebase)
                setTodasAsReceitas([...receitasPadrao, ...novasReceitas]);
                setLoading(false);
            });
        } else {
             // Se não houver userId, mostra apenas as padrão
             setTodasAsReceitas(receitasPadrao);
        }

        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
        };
    }, [userId]);

    // Função para deletar uma receita
    const handleDelete = async (id, nome) => {
        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para deletar receitas.");
            return;
        }

        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja remover a receita "${nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    onPress: async () => {
                        try {
                            // Chama a função de deletar do Firestore
                            await deleteReceita(userId, id); 
                            Alert.alert("Removido", `"${nome}" foi removido.`);
                            // O estado será atualizado automaticamente pelo listener do Firebase
                        } catch (error) {
                            console.error("Erro ao remover receita:", error);
                            Alert.alert("Erro", "Não foi possível remover a receita.");
                        }
                    }
                }
            ]
        );
    };
    
    // Ações de Swipe (renderRightActions)
    const renderRightActions = (item) => {
        // Checa se a receita foi adicionada pelo usuário (i.e., existe na lista do Firebase)
        const isDeletable = receitasUsuario.some(rec => rec.id === item.id);
        
        if (!isDeletable) {
            return null; // Não mostra o botão para receitas padrão
        }
        
        return (
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.nome)}
            >
                <Icon name="delete-forever-outline" size={24} color="#fff" />
                <Text style={styles.deleteButtonText}>Remover</Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => (
        <Swipeable 
            // O botão de deletar aparecerá ao arrastar para a ESQUERDA
            renderRightActions={() => renderRightActions(item)}
            // Desabilita o swipe se a receita for padrão
            overshootRight={receitasUsuario.some(rec => rec.id === item.id)}
        >
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('ReceitaDetalhes', { receita: item })}
            >
                <View style={styles.content}>
                    <Text style={styles.recipeName}>{item.nome}</Text>
                    <Text style={styles.recipeMacros}>
                        {item.kcal} kcal | {item.prot}g Prot | {item.carb}g Carb | {item.gord}g Gord
                    </Text>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando receitas...</Text>
            </View>
        );
    }
    
    // mostrar se o usuario está logado
    const showLoginWarning = !userId;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}> 
                
                {showLoginWarning && (
                    <View style={styles.warningBox}>
                         <Icon name="information-outline" size={20} color="#e74c3c" />
                         <Text style={styles.warningText}>Faça login para salvar suas próprias receitas na nuvem.</Text>
                    </View>
                )}

                <FlatList
                    data={todasAsReceitas}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={!userId && receitasPadrao.length === 0 ? (
                        <Text style={styles.emptyText}>Adicione sua primeira receita! Você precisa estar logado.</Text>
                    ) : null}
                />

                <TouchableOpacity 
                    style={styles.floatingButton}
                    onPress={() => navigation.navigate('AdicionarReceita')}
                >
                    <Icon name="plus" size={30} color="#fff" />
                </TouchableOpacity>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f0f4f7' 
    },
    listContent: { 
        padding: 20, 
        paddingBottom: 80 
    },
    card: {
        backgroundColor: '#e8f5e9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    content: { 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        alignItems: 'flex-start' 
    },
    recipeName: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#2e7d32', 
        marginBottom: 5 
    },
    recipeMacros: { 
        fontSize: 14, 
        color: '#666' },
    floatingButton: {
        position: 'absolute',
        bottom: 30, right: 30,
        width: 60, height: 60,
        borderRadius: 30,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    deleteButton: {
        backgroundColor: '#e74c3c', 
        justifyContent: 'center',
        alignItems: 'center',
        width: 90,
        height: '100%',
        borderRadius: 10,
        marginLeft: 5, 
        paddingHorizontal: 10,
    },
    deleteButtonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        marginTop: 5 
    },
    centered: { 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        marginTop: 10, 
        fontSize: 16, 
        color: '#4CAF50' 
    },
    emptyText: { 
        textAlign: 'center', 
        marginTop: 50, 
        fontSize: 16, 
        color: '#777' 
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffe0b2', 
        padding: 10,
        marginHorizontal: 20,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800', 
    },
    warningText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#e65100', 
    }
});