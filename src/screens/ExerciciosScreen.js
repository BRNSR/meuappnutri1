// ExerciciosScreen.js (COMPLETO E OTIMIZADO)

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

// DIAS CURTOS (usados para o filtro e salvamento no Firestore)
const DIAS_DA_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_COMPLETO_MAP = {
    'Dom': 'Domingo', 'Seg': 'Segunda', 'Ter': 'Terça', 'Qua': 'Quarta', 
    'Qui': 'Quinta', 'Sex': 'Sexta', 'Sáb': 'Sábado'
};

export default function ExerciciosScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const auth = getAuth();
    
    // Função para calcular o dia inicial
    const getDiaInicialCurto = () => DIAS_DA_SEMANA_CURTO[new Date().getDay()]; 
    
    const [diaSelecionadoCurto, setDiaSelecionadoCurto] = useState(getDiaInicialCurto());
    const [exerciciosDoDia, setExerciciosDoDia] = useState([]); 
    const [userId, setUserId] = useState(auth.currentUser?.uid || null);
    const [loading, setLoading] = useState(true);

    const diaCompleto = useMemo(() => DIAS_COMPLETO_MAP[diaSelecionadoCurto], [diaSelecionadoCurto]);
    
    // 1. EFEITO: Monitora o ID do usuário
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

    // 2. EFEITO: ASSINATURA EM TEMPO REAL NO FIRESTORE
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return () => {}; 
        }

        setLoading(true);

        // Se o userId está pronto, inicia a escuta (subscription)
        const unsubscribe = subscribeToExercicios(userId, diaSelecionadoCurto, (novosExercicios) => {
            console.log(`Exercícios para ${diaSelecionadoCurto}:`, novosExercicios.length); // DEBUG
            setExerciciosDoDia(novosExercicios);
            setLoading(false);
        });

        // Cleanup: Limpa o listener ao mudar de dia ou ao sair da tela
        return () => unsubscribe();
    }, [userId, diaSelecionadoCurto]); // Dependências: Roda quando o userId ou o dia muda
    
    // Função para deletar um exercício
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

    // Navega para a tela de adicionar exercício
    const handleAddExercicio = () => {
        if (!userId) {
            Alert.alert("Erro", "Você precisa estar logado para adicionar exercícios.");
            return;
        }
        navigation.navigate('AdicionarExercicio', { diaSelecionadoCurto }); 
    };

    // Renderiza o botão de deletar (Swipe)
    const renderRightActions = (item) => (
        <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteExercicio(item.id, item.nome)}
        >
            <Icon name="delete-forever-outline" size={24} color="#fff" />
            <Text style={styles.deleteButtonText}>Remover</Text>
        </TouchableOpacity>
    );

    // Renderiza cada item da lista
    const renderExercicioItem = ({ item }) => (
        <Swipeable renderRightActions={() => renderRightActions(item)} key={item.id}>
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

    // Renderiza o seletor de dias
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
    
    // Tratamento de Loading e Não-Logado
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

    // Tela Principal
    return (
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
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    contentContainer: { alignItems: 'center', padding: 20, paddingTop: 0, paddingBottom: 100 },
    
    // SELETOR DE DIAS
    daysWrapper: { width: '100%', backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, paddingVertical: 10, marginBottom: 15, },
    daysScrollViewContent: { paddingHorizontal: 10, alignItems: 'center', },
    daysListContainer: { flexDirection: 'row', },
    dayButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, marginHorizontal: 5, alignItems: 'center', },
    dayButtonSelected: { backgroundColor: '#4CAF50', borderRadius: 10, },
    dayText: { fontSize: 16, fontWeight: 'bold', color: '#666' }, 
    dayTextSelected: { color: '#fff' },
    
    // BOTÃO DE APAGAR TUDO
    deleteAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 10, marginHorizontal: 20, marginTop: 15, marginBottom: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e74c3c', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1, },
    deleteAllButtonText: { marginLeft: 10, fontSize: 14, fontWeight: 'bold', color: '#e74c3c', },
    disabledButton: { opacity: 0.5, },
    
    // CARD E LISTA
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, alignItems: 'center', width: '100%' },
    icon: { marginBottom: 15 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    exercicioList: { width: '100%', marginTop: 10, paddingHorizontal: 0 }, 
    exercicioItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%', backgroundColor: '#fff', },
    exercicioNome: { fontSize: 17, fontWeight: '600', color: '#333', flex: 2 },
    exercicioDetalhes: { flex: 1, alignItems: 'flex-end' },
    exercicioInfo: { fontSize: 15, color: '#4CAF50', fontWeight: 'bold' },
    deleteButton: { backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', paddingHorizontal: 10, marginVertical: 0, borderRadius: 0, },
    deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginTop: 4, },
    exercicioListPlaceholder: { marginTop: 15, padding: 15, backgroundColor: '#e8f5e9', borderRadius: 8, width: '100%', alignItems: 'center' },
    tip: { fontSize: 14, color: '#4CAF50', fontWeight: '500', textAlign: 'center', marginBottom: 5 },
    fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: '#4CAF50', borderRadius: 30, elevation: 8, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
});