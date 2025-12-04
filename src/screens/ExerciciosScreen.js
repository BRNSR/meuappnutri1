import React, { useState, useEffect, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Alert,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

import { getAuth } from 'firebase/auth'; 
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'; 

import { 
    subscribeToExercicios, 
    deleteExercicio 
} from '../services/firestoreService'; 


const DIAS_DA_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_COMPLETO_MAP = {
    'Dom': 'Domingo', 'Seg': 'Segunda', 'Ter': 'Terça', 'Qua': 'Quarta', 
    'Qui': 'Quinta', 'Sex': 'Sexta', 'Sáb': 'Sábado'
};

export default function ExerciciosScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const auth = getAuth();
    
    const getDiaInicialCurto = () => DIAS_DA_SEMANA_CURTO[new Date().getDay()]; 
    
    const [diaSelecionadoCurto, setDiaSelecionadoCurto] = useState(getDiaInicialCurto());
    const [exerciciosDoDia, setExerciciosDoDia] = useState([]); 
    const [userId, setUserId] = useState(auth.currentUser?.uid || null);
    const [loading, setLoading] = useState(true);

    const diaCompleto = useMemo(() => DIAS_COMPLETO_MAP[diaSelecionadoCurto], [diaSelecionadoCurto]);
    
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            setUserId(user ? user.uid : null);
            if (!user) {
                setLoading(false); 
                setExerciciosDoDia([]);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return () => {}; 
        }

        setLoading(true);

        const unsubscribe = subscribeToExercicios(userId, diaSelecionadoCurto, (novosExercicios) => {
            console.log(`Exercícios para ${diaSelecionadoCurto}:`, novosExercicios.length); // DEBUG
            setExerciciosDoDia(novosExercicios);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, diaSelecionadoCurto]); 
    
    // deletar um exercício
    const handleDeleteExercicio = async (id, nome) => {
        if (!userId) return Alert.alert("Erro", "Usuário não autenticado.");

        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja remover o exercício "${nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteExercicio(userId, id);
                            Alert.alert("Removido", `"${nome}" foi removido.`);
                        } catch (error) {
                            console.error("Erro ao remover exercício do Firestore:", error);
                            Alert.alert("Erro", "Não foi possível remover o exercício. Tente novamente.");
                        }
                    }
                }
            ]
        );
    };

    // lida com a navegação para a tela de edição
    const handleEditExercicio = (exercicio) => {
        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para editar exercícios.");
            return;
        }
        // Navega para 'AdicionarExercicio', passando o objeto do exercício
        navigation.navigate('AdicionarExercicio', { 
            diaSelecionadoCurto, 
            exercicioParaEditar: exercicio 
        });
    };

    // Navega para a tela de adicionar exercício (criação)
    const handleAddExercicio = () => {
        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para adicionar exercícios.");
            return;
        }
        navigation.navigate('AdicionarExercicio', { diaSelecionadoCurto }); 
    };

    // renderiza o botão de deletar ao arrastar SWIPE
    const renderRightActions = (item) => (
        <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteExercicio(item.id, item.nome)}
        >
            <Icon name="delete-forever-outline" size={24} color="#fff" />
            <Text style={styles.deleteButtonText}>Remover</Text>
        </TouchableOpacity>
    );

    // tornar o item clicável para edição
    const renderExercicioItem = ({ item }) => (
        <Swipeable renderRightActions={() => renderRightActions(item)} key={item.id}>
            <TouchableOpacity 
                style={{ width: '100%' }} // Permite o clique na área inteira
                onPress={() => handleEditExercicio(item)} // Chama a função de edição
            >
                <View style={styles.exercicioItem}>
                    <Text style={styles.exercicioNome}>{item.nome}</Text>
                    <View style={styles.exercicioDetalhes}>
                        <Text style={styles.exercicioInfo}>
                            {item.series}x{item.repeticoes} {item.kg ? item.kg.toFixed(1) : 0}kg
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    // renderDiaSelector e tratamento de loading/não-logado permanecem os mesmos)
    
    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Carregando treinos de {diaCompleto}...</Text>
            </View>
        );
    }
    
    if (!userId) {
        return (
            <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
                <Icon name="account-alert" size={50} color="#e74c3c" />
                <Text style={styles.loadingText}>Faça login para ver seu plano de treino.</Text>
            </View>
        );
    }

    const renderDiaSelector = () => (
        <View style={styles.daysListContainer}>
            {DIAS_DA_SEMANA_CURTO.map(dia => (
                <TouchableOpacity
                    key={dia}
                    style={[
                        styles.dayButton,
                        diaSelecionadoCurto === dia && styles.dayButtonSelected
                    ]}
                    onPress={() => setDiaSelecionadoCurto(dia)} 
                >
                    <Text 
                        style={[
                            styles.dayText,
                            diaSelecionadoCurto === dia && styles.dayTextSelected
                        ]}
                    >
                        {dia}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
    
    return (
        <GestureHandlerRootView style={{ flex: 1 }}> 
            <View style={[styles.container, { paddingTop: insets.top }]}> 
                
                {/* seletor de Dias Horizontal */}
                <View style={styles.daysWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.daysScrollViewContent}
                    >
                        {renderDiaSelector()}
                    </ScrollView>
                </View>
                                
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={styles.card}>
                        <Ionicons name="barbell" size={60} color="#4CAF50" style={styles.icon} />
                        <Text style={styles.title}>Treino de {diaCompleto}</Text>
                        
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
                                    Nenhum exercício registrado para {diaCompleto}
                                </Text>
                                <Text style={styles.tip}>
                                    Clique no (+) para adicionar seu treino!
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* botão FAB para Adicionar */}
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
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    contentContainer: { alignItems: 'center', padding: 20, paddingTop: 0, paddingBottom: 100 },
    
    // aba dos dias da semana
    daysWrapper: { width: '100%', backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, paddingVertical: 10, marginBottom: 15, },
    daysScrollViewContent: { paddingHorizontal: 10, alignItems: 'center', },
    daysListContainer: { flexDirection: 'row', },
    dayButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, marginHorizontal: 5, alignItems: 'center', },
    dayButtonSelected: { backgroundColor: '#4CAF50', borderRadius: 10, },
    dayText: { fontSize: 16, fontWeight: 'bold', color: '#666' }, 
    dayTextSelected: { color: '#fff' },
    
    
    // card
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 25, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 5, 
        elevation: 3, 
        alignItems: 'center', 
        width: '100%' 
    },

    icon: { 
        marginBottom: 15 
    },

    title: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 15 
    },

    exercicioList: { 
        width: '100%', 
        marginTop: 10, 
        paddingHorizontal: 0 
    }, 

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
    
    exercicioNome: { 
        fontSize: 17, 
        fontWeight: '600', 
        color: '#333', 
        flex: 2 
    },

    exercicioDetalhes: { 
        flex: 1, 
        alignItems: 'flex-end' 
    },

    exercicioInfo: { 
        fontSize: 15, 
        color: '#4CAF50', 
        fontWeight: 'bold' 
    },

    deleteButton: { backgroundColor: '#e74c3c', 
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
      
    exercicioListPlaceholder: { 
        marginTop: 15, 
        padding: 15, 
        backgroundColor: '#e8f5e9', 
        borderRadius: 8, 
        width: '100%', 
        alignItems: 'center' 
    },

    tip: { fontSize: 14, 
        color: '#4CAF50', 
        fontWeight: '500', 
        textAlign: 'center', 
        marginBottom: 5 
    },

    fab: { position: 'absolute', 
        width: 60, 
        height: 60, 
        alignItems: 'center', 
        justifyContent: 'center', 
        right: 30, 
        bottom: 30, 
        backgroundColor: '#4CAF50', 
        borderRadius: 30, 
        elevation: 8, 
        zIndex: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 4 
    },
});