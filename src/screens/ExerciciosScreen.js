import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Alert,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'; 

// CHAVE EXCLUSIVA para salvar os exercícios no AsyncStorage
const EXERCICIOS_KEY = '@exercicios_usuario';

const DIAS_DA_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function ExerciciosScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    
    // Calcula o dia da semana atual para iniciar
    const getDiaInicial = () => {
        const todayIndex = new Date().getDay(); 
        // 0 (Dom) a 6 (Sáb). Ajusta para Seg=0 a Dom=6
        return DIAS_DA_SEMANA[todayIndex === 0 ? 6 : todayIndex - 1]; 
    };
    
    const [diaSelecionado, setDiaSelecionado] = useState(getDiaInicial());
    const [exerciciosDoDia, setExerciciosDoDia] = useState([]); 

    // Função que carrega e filtra os exercícios do AsyncStorage
    const loadExercises = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(EXERCICIOS_KEY);
            const todosExercicios = jsonValue != null ? JSON.parse(jsonValue) : [];
            
            // Filtra a lista inteira apenas pelos exercícios do dia selecionado
            const filteredExercises = todosExercicios.filter(
                ex => ex.day === diaSelecionado
            );

            // Ordena por data de criação (o mais recente aparece primeiro)
            filteredExercises.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : 0;
                const dateB = b.createdAt ? new Date(b.createdAt) : 0;
                return dateB - dateA;
            });
            
            setExerciciosDoDia(filteredExercises);

        } catch (e) {
            console.error("Erro ao carregar exercícios do AsyncStorage:", e);
            Alert.alert("Erro", "Não foi possível carregar os exercícios salvos.");
        }
    };
    
    // Função para deletar um exercício (Swipe to Delete)
    const handleDeleteExercicio = async (id, nome) => {
        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja remover o exercício "${nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    onPress: async () => {
                        try {
                            const jsonValue = await AsyncStorage.getItem(EXERCICIOS_KEY);
                            const todosExercicios = jsonValue != null ? JSON.parse(jsonValue) : [];
                            
                            // Cria uma nova lista sem o exercício com o ID correspondente
                            const novaLista = todosExercicios.filter(ex => ex.id !== id);
                            
                            // Salva a lista atualizada
                            await AsyncStorage.setItem(EXERCICIOS_KEY, JSON.stringify(novaLista));
                            
                            loadExercises(); // Atualiza a tela
                            Alert.alert("Removido", `"${nome}" foi removido.`);
                        } catch (error) {
                            console.error("Erro ao remover exercício:", error);
                            Alert.alert("Erro", "Não foi possível remover o exercício.");
                        }
                    }
                }
            ]
        );
    };

    // FUNÇÃO: DELETAR TODOS OS TREINOS (Plano Semanal)
    const handleDeleteAllWorkouts = () => {
        Alert.alert(
            "Limpar Plano Semanal Completo",
            "Tem certeza que deseja apagar TODOS os exercícios salvos ?.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "APAGAR TUDO",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Apaga a chave inteira do AsyncStorage
                            await AsyncStorage.removeItem(EXERCICIOS_KEY);
                            setExerciciosDoDia([]); // Limpa o estado local para atualizar a tela
                            Alert.alert("Sucesso", "Todos os planos de treino da semana foram apagados.");
                        } catch (error) {
                            console.error("Erro ao apagar todos os exercícios:", error);
                            Alert.alert("Erro", "Não foi possível apagar os exercícios.");
                        }
                    }
                }
            ]
        );
    };
    
    // Efeito para recarregar os exercícios quando o dia muda OU quando a tela volta ao foco
    useEffect(() => {
        if (isFocused) {
            loadExercises();
        }
    }, [diaSelecionado, isFocused]); 
    
    // Navega para a tela de adicionar exercício
    const handleAddExercicio = () => {
        navigation.navigate('AdicionarExercicio', { diaSelecionado });
    };

    // Renderiza o botão de deletar à DIREITA (arrastar para a esquerda)
    const renderRightActions = (item) => {
        return (
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteExercicio(item.id, item.nome)}
            >
                <Icon name="delete-forever-outline" size={24} color="#fff" />
                <Text style={styles.deleteButtonText}>Remover</Text>
            </TouchableOpacity>
        );
    };

    // Componente para renderizar cada item da lista de exercícios
    const renderExercicioItem = ({ item }) => (
        // Envolve o item com Swipeable para o "Swipe to Delete"
        <Swipeable renderRightActions={() => renderRightActions(item)}>
            <View style={styles.exercicioItem}>
                <Text style={styles.exercicioNome}>{item.nome}</Text>
                <View style={styles.exercicioDetalhes}>
                    <Text style={styles.exercicioInfo}>
                        {item.series}x{item.repeticoes} {item.kg ? item.kg.toFixed(1) : 0}kg
                    </Text>
                </View>
            </View>
        </Swipeable>
    );

    // Renderiza o seletor de dias da semana
    const renderDiaSelector = () => (
        <View style={styles.daysListContainer}>
            {DIAS_DA_SEMANA.map(dia => (
                <TouchableOpacity
                    key={dia}
                    style={[
                        styles.dayButton,
                        diaSelecionado === dia && styles.dayButtonSelected
                    ]}
                    onPress={() => setDiaSelecionado(dia)}
                >
                    <Text 
                        style={[
                            styles.dayText,
                            diaSelecionado === dia && styles.dayTextSelected
                        ]}
                    >
                        {dia}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );


    return (
        // OBRIGATÓRIO: Envolver todo o conteúdo com GestureHandlerRootView
        <GestureHandlerRootView style={{ flex: 1 }}> 
            <View style={[styles.container, { paddingTop: insets.top }]}> 
                
                {/* Seletor de Dias Horizontal */}
                <View style={styles.daysWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.daysScrollViewContent}
                    >
                        {renderDiaSelector()}
                    </ScrollView>
                </View>
                
                {/* BOTÃO: APAGAR TODO O PLANO SEMANAL */}
                <TouchableOpacity 
                    style={styles.deleteAllButton} 
                    onPress={handleDeleteAllWorkouts}
                >
                    <Icon name="trash-can-outline" size={20} color="#e74c3c" />
                    <Text style={styles.deleteAllButtonText}>Limpar Plano Semanal</Text>
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={{ width: '100%' }}> 
                        
                        <View style={styles.card}>
                            <Ionicons name="barbell" size={60} color="#4CAF50" style={styles.icon} />
                            <Text style={styles.title}>Treino de {diaSelecionado}</Text>
                            
                            {exerciciosDoDia.length > 0 ? (
                                <FlatList
                                    data={exerciciosDoDia}
                                    renderItem={renderExercicioItem}
                                    keyExtractor={item => item.id} 
                                    scrollEnabled={false}
                                    contentContainerStyle={styles.exercicioList}
                                />
                            ) : (
                                <View style={styles.exercicioListPlaceholder}>
                                    <Text style={styles.tip}>
                                        Nenhum exercício registrado
                                    </Text>
                                    <Text style={styles.tip}>
                                        Clique no (+) para adicionar seu treino!
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Botão FAB para Adicionar */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleAddExercicio}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>

            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    contentContainer: { alignItems: 'center', padding: 20, paddingTop: 0, paddingBottom: 100 },
    
    // ---------------------------------------------
    // ESTILOS DO SELETOR DE DIAS
    daysWrapper: {
        width: '100%',
        backgroundColor: '#fff', 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 3, 
        elevation: 2,
        paddingVertical: 10,
    },
    daysScrollViewContent: {
        paddingHorizontal: 10, 
        alignItems: 'center',
    },
    daysListContainer: { 
        flexDirection: 'row', 
    },
    dayButton: { 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 8,
        marginHorizontal: 5, 
        alignItems: 'center',
    },
    dayButtonSelected: { 
        backgroundColor: '#4CAF50',
        borderRadius: 10,
    },
    dayText: { fontSize: 16, fontWeight: 'bold', color: '#666' }, 
    dayTextSelected: { color: '#fff' },
    // ---------------------------------------------
    
    // NOVOS ESTILOS PARA O BOTÃO DE APAGAR TUDO (COM MARGEM SUPERIOR ADICIONADA)
    deleteAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff', 
        padding: 10,
        marginHorizontal: 20,
        // 🚨 MUDANÇA APLICADA AQUI
        marginTop: 15, 
        marginBottom: 15, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e74c3c', 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 2, 
        elevation: 1,
    },
    deleteAllButtonText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#e74c3c', 
    },
    // ---------------------------------------------

    // Estilos do Card
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, alignItems: 'center', width: '100%' },
    icon: { marginBottom: 15 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    
    // Estilos da Lista de Exercícios
    exercicioList: { width: '100%', marginTop: 10, paddingHorizontal: 0 }, 
    exercicioItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 15, 
        paddingHorizontal: 10, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        width: '100%',
        backgroundColor: '#fff', 
    },
    exercicioNome: { fontSize: 17, fontWeight: '600', color: '#333', flex: 2 },
    exercicioDetalhes: { flex: 1, alignItems: 'flex-end' },
    exercicioInfo: { fontSize: 15, color: '#4CAF50', fontWeight: 'bold' },

    // Estilos do botão de deletar (Swipe)
    deleteButton: {
        backgroundColor: '#e74c3c', 
        justifyContent: 'center',
        alignItems: 'center',
        width: 80, 
        height: '100%',
        paddingHorizontal: 10,
        marginVertical: 0,
        borderRadius: 0,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 4,
    },
    // Estilos do Placeholder e FAB
    exercicioListPlaceholder: { marginTop: 15, padding: 15, backgroundColor: '#e8f5e9', borderRadius: 8, width: '100%', alignItems: 'center' },
    tip: { fontSize: 14, color: '#4CAF50', fontWeight: '500', textAlign: 'center', marginBottom: 5 },
    fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#4CAF50', borderRadius: 30, elevation: 8, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
});