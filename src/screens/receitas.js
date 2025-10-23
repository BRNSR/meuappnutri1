import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'; 

// Importa as receitas padrão do novo arquivo JSON
import receitasPadrao from '../data/receitas.json';

const RECEITAS_KEY = '@receitas_usuario';

export default function Receitas({ navigation }) {
    // Mantido por compatibilidade, mas o padding agora é controlado pelo Stack Navigator
    const insets = useSafeAreaInsets(); 
    const [todasAsReceitas, setTodasAsReceitas] = useState([]);

    const carregarReceitasDoAsyncStorage = async () => {
        try {
            const receitasSalvas = await AsyncStorage.getItem(RECEITAS_KEY);
            const receitasUsuario = receitasSalvas ? JSON.parse(receitasSalvas) : [];
            setTodasAsReceitas([...receitasPadrao, ...receitasUsuario]);
        } catch (error) {
            console.error("Erro ao carregar receitas:", error);
        }
    };

    useEffect(() => {
        carregarReceitasDoAsyncStorage();
        const unsubscribe = navigation.addListener('focus', () => {
            carregarReceitasDoAsyncStorage();
        });
        return unsubscribe;
    }, [navigation]);

    // Função para deletar uma receita
    const handleDelete = async (id, nome) => {
        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja remover a receita "${nome}"?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Remover",
                    onPress: async () => {
                        try {
                            const receitasSalvas = await AsyncStorage.getItem(RECEITAS_KEY);
                            const receitasExistentes = receitasSalvas ? JSON.parse(receitasSalvas) : [];
                            
                            // Filtra a lista para remover a receita com o ID correspondente
                            const novaLista = receitasExistentes.filter(rec => rec.id !== id);
                            
                            // Salva a nova lista no AsyncStorage
                            await AsyncStorage.setItem(RECEITAS_KEY, JSON.stringify(novaLista));
                            
                            // Atualiza o estado da tela para refletir a exclusão
                            setTodasAsReceitas([...receitasPadrao, ...novaLista]);
                            Alert.alert("Removido", `"${nome}" foi removido com sucesso.`);
                        } catch (error) {
                            console.error("Erro ao remover receita:", error);
                            Alert.alert("Erro", "Não foi possível remover a receita.");
                        }
                    }
                }
            ]
        );
    };
    
    // --------------------------------------------------------
    // AÇÃO PARA APARECER NO CANTO ESQUERDO (Arrastar para a DIREITA)
    // --------------------------------------------------------
    const renderLeftActions = (item) => {
        // Validação: só permite deletar receitas do usuário, não as padrão
        const isDeletable = !receitasPadrao.some(rec => rec.id === item.id);
        
        if (!isDeletable) {
            return null;
        }
        
        return (
            <TouchableOpacity
                style={styles.deleteButtonLeft} // Usa o novo estilo
                onPress={() => handleDelete(item.id, item.nome)}
            >
                <Icon name="delete-forever-outline" size={24} color="#fff" />
                <Text style={styles.deleteButtonText}>Remover</Text>
            </TouchableOpacity>
        );
    };

    // Função original de renderização para o lado direito (mantida por segurança/referência)
    const renderRightActions = (item) => {
        // Validação: só permite deletar receitas do usuário, não as padrão
        const isDeletable = !receitasPadrao.some(rec => rec.id === item.id);
        
        if (!isDeletable) {
            return null;
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
    // --------------------------------------------------------

    const renderItem = ({ item }) => (
        // ATUALIZADO: Usando renderLeftActions para o botão aparecer no canto esquerdo
        <Swipeable renderRightActions={() => renderRightActions(item)}>
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

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}> 
                <FlatList
                    data={todasAsReceitas}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
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
        backgroundColor: '#f0f4f7',
    },
    listContent: {
        padding: 20,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#e8f5e9', // Verde claro para o fundo
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#4CAF50', // Sombra verde
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#4CAF50', // Borda verde
    },
    content: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    recipeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32', // Cor do texto em verde escuro
        marginBottom: 5,
    },
    recipeMacros: {
        fontSize: 14,
        color: '#666',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
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
    // Estilos do botão de deletar para o lado DIREITO (renderRightActions)
    deleteButton: {
        backgroundColor: '#e74c3c', // Vermelho
        justifyContent: 'center',
        alignItems: 'center',
        width: 90,
        height: '100%',
        borderRadius: 10,
        marginLeft: 5, 
        paddingHorizontal: 10,
    },
    // NOVO ESTILO: Botão de deletar para o lado ESQUERDO (renderLeftActions)
    deleteButtonLeft: {
        backgroundColor: '#e74c3c', // Vermelho
        justifyContent: 'center',
        alignItems: 'center',
        width: 90,
        height: '100%',
        borderRadius: 10,
        marginRight: 5, // Garante que o botão esteja aninhado à esquerda
        paddingHorizontal: 10,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 5,
    },
});
