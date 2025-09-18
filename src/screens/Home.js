import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
} from "react-native";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedCircularProgress } from 'react-native-circular-progress';

// Importe as funções necessárias para manipular a data
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 



const refeicoesIniciais = [
    { id: "cafe", nome: "Café da Manhã", alimentos: [] },
    { id: "almoco", nome: "Almoço", alimentos: [] },
    { id: "lanche", nome: "Lanche", alimentos: [] },
    { id: "jantar", nome: "Jantar", alimentos: [] },
];

export default function Home({ navigation }) {
    const insets = useSafeAreaInsets();
    
    // O estado agora é o que controla a data que está sendo exibida
    const [dataAtual, setDataAtual] = useState(new Date()); 
    const [refeicoes, setRefeicoes] = useState(refeicoesIniciais);
    const [loading, setLoading] = useState(true);
    const [metaCalorica, setMetaCalorica] = useState(0);
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const perfilRef = doc(db, "users", userId, "profile", "data");
        const unsubPerfil = onSnapshot(perfilRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().metaCalorica) {
                setMetaCalorica(docSnap.data().metaCalorica);
            } else {
                setMetaCalorica(0);
            }
        });

        const dataString = format(dataAtual, "yyyy-MM-dd");
        const dailyLogRef = doc(db, "users", userId, "dailyLog", dataString);

        const unsubscribe = onSnapshot(
            dailyLogRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    const dadosSalvos = docSnap.data().refeicoes;
                    setRefeicoes(dadosSalvos);
                } else {
                    setDoc(dailyLogRef, {
                        refeicoes: refeicoesIniciais,
                        totais: { kcal: 0, prot: 0, carb: 0, gord: 0 },
                    }, { merge: true });
                    setRefeicoes(refeicoesIniciais);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Erro no listener do Firestore: ", error);
                Alert.alert(
                    "Erro",
                    "Falha ao carregar dados. Verifique sua conexão e permissões."
                );
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
            unsubPerfil();
        };
    }, [userId, dataAtual]); // <--- A dependência de dataAtual garante que os dados sejam recarregados

    const adicionarAlimento = (refeicaoId, alimento) => {
        const novasRefeicoes = refeicoes.map((r) =>
            r.id === refeicaoId ? { ...r, alimentos: [...r.alimentos, alimento] } : r
        );
        salvarRefeicoes(novasRefeicoes);
    };

    const removerAlimento = (refeicaoId, alimentoIndex) => {
        const novasRefeicoes = refeicoes.map((r) =>
            r.id === refeicaoId
                ? {
                    ...r,
                    alimentos: r.alimentos.filter((_, index) => index !== alimentoIndex),
                }
                : r
        );
        salvarRefeicoes(novasRefeicoes);
    };

    const salvarRefeicoes = async (novasRefeicoes) => {
        if (!userId) return;
        const dataString = format(dataAtual, "yyyy-MM-dd");
        const docRef = doc(db, "users", userId, "dailyLog", dataString);

        const todosOsAlimentos = novasRefeicoes.flatMap(refeicao => refeicao.alimentos);
        
        const totais = todosOsAlimentos.reduce(
            (acc, a) => ({
                kcal: acc.kcal + parseFloat(a.kcal),
                prot: acc.prot + parseFloat(a.prot),
                carb: acc.carb + parseFloat(a.carb),
                gord: acc.gord + parseFloat(a.gord),
            }),
            { kcal: 0, prot: 0, carb: 0, gord: 0 }
        );

        try {
            await setDoc(docRef, { refeicoes: novasRefeicoes, totais }, { merge: true });
        } catch (e) {
            console.error("Erro ao salvar dados: ", e);
            Alert.alert("Erro", "Não foi possível salvar os dados. Tente novamente.");
        }
    };

    const calcularTotais = (alimentos) => {
        return alimentos.reduce(
            (totais, a) => ({
                kcal: totais.kcal + parseFloat(a.kcal),
                prot: totais.prot + parseFloat(a.prot),
                carb: totais.carb + parseFloat(a.carb),
                gord: totais.gord + parseFloat(a.gord),
            }),
            { kcal: 0, prot: 0, carb: 0, gord: 0 }
        );
    };

    // FUNÇÕES PARA AVANÇAR E VOLTAR A DATA
    const handleDiaAnterior = () => {
        setDataAtual(subDays(dataAtual, 1));
    };

    const handleProximoDia = () => {
        setDataAtual(addDays(dataAtual, 1));
    };

    const totaisDoDia = calcularTotais(refeicoes.flatMap((r) => r.alimentos));
    
    const caloriasTotais = totaisDoDia.kcal;
    const caloriasRestantes = metaCalorica - caloriasTotais;
    
    const fillPercentage = metaCalorica > 0 ? (caloriasTotais / metaCalorica) * 100 : 0;
    const progressFill = Math.min(fillPercentage, 100);

    const progressColor = caloriasTotais > metaCalorica ? "#E74C3C" : "#4CAF50";

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={[styles.scrollView, { paddingTop: insets.top }]} 
            contentContainerStyle={styles.container}
        >
            {/* NOVO BLOCO: Seleção de data */}
            <View style={styles.dateSelectorContainer}>
                <TouchableOpacity onPress={handleDiaAnterior}>
                    <Ionicons name="chevron-back" size={30} color="#333" />
                </TouchableOpacity>
                <Text style={styles.dateText}>
                    {format(dataAtual, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Text>
                <TouchableOpacity onPress={handleProximoDia}>
                    <Ionicons name="chevron-forward" size={30} color="#333" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.card}>
                <AnimatedCircularProgress
                    size={180}
                    width={10}
                    fill={progressFill}
                    tintColor={progressColor}
                    backgroundColor="#D3D3D3"
                    lineCap="round"
                    style={styles.kcalChart}
                >
                    {
                        (fill) => (
                            <View style={styles.kcalTextContainer}>
                                <Text style={styles.kcalCount}>{caloriasTotais.toFixed(0)}</Text>
                                <Text style={styles.kcalLabel}>kcal</Text>
                            </View>
                        )
                    }
                </AnimatedCircularProgress>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Meta</Text>
                        <Text style={styles.summaryValue}>{metaCalorica.toFixed(0)} kcal</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Restantes</Text>
                        <Text style={styles.summaryValue}>{Math.max(0, caloriasRestantes).toFixed(0)} kcal</Text>
                    </View>
                </View>

                <View style={styles.separator}></View>
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: "#2ecc71" }]} />
                        <Text style={styles.legendTitle}>Proteínas</Text>
                        <Text style={styles.legendValue}>{totaisDoDia.prot.toFixed(0)}g</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: "#3498db" }]} />
                        <Text style={styles.legendTitle}>Carboidratos</Text>
                        <Text style={styles.legendValue}>{totaisDoDia.carb.toFixed(0)}g</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: "#e67e22" }]} />
                        <Text style={styles.legendTitle}>Gorduras</Text>
                        <Text style={styles.legendValue}>{totaisDoDia.gord.toFixed(0)}g</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={refeicoes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const totais = calcularTotais(item.alimentos);
                    return (
                        <View style={styles.mealCard}>
                            <View style={styles.refeicaoHeader}>
                                <Text style={styles.refeicaoTitulo}>{item.nome}</Text>
                                <TouchableOpacity
                                    style={styles.addMealButton}
                                    onPress={() =>
                                        navigation.navigate("BuscaAlimento", {
                                            refeicaoId: item.id,
                                            adicionarAlimento,
                                        })
                                    }
                                >
                                    <Ionicons name="add-circle" size={30} color="#4CAF50" />
                                </TouchableOpacity>
                            </View>
                            {item.alimentos.map((alimento, index) => (
                                <View key={index} style={styles.alimentoLinha}>
                                    <View>
                                        <Text style={styles.nome}>
                                            {alimento.nome} ({alimento.gramas.toFixed(0)}g)
                                        </Text>
                                        <Text style={styles.macros}>
                                            {parseFloat(alimento.kcal).toFixed(1)} kcal | {parseFloat(alimento.prot).toFixed(1)}g prot | {parseFloat(alimento.carb).toFixed(1)}g carb | {parseFloat(alimento.gord).toFixed(1)}g gord
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removerAlimento(item.id, index)}
                                        style={styles.removeButton}
                                    >
                                        <MaterialCommunityIcons name="delete-forever" size={24} color="#E74C3C" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {item.alimentos.length > 0 && (
                                <Text style={styles.totais}>
                                    Total: {totais.kcal.toFixed(1)} kcal |{" "}
                                    {totais.prot.toFixed(1)}g prot | {totais.carb.toFixed(1)}g carb |{" "}
                                    {totais.gord.toFixed(1)}g gord
                                </Text>
                            )}
                        </View>
                    );
                }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        backgroundColor: "#f0f4f7",
        padding: 20,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    // NOVO ESTILO: Container para o seletor de data
    dateSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateText: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4CAF50",
        marginBottom: 15,
        textAlign: "center",
    },
    kcalChart: {
        marginBottom: 15,
    },
    kcalTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    kcalCount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    kcalLabel: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        width: '100%',
    },
    summaryItem: {
        alignItems: "center",
        paddingHorizontal: 10,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#ccc',
        width: '80%',
        marginVertical: 15,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        width: '100%',
    },
    legendItem: {
        alignItems: 'center',
    },
    legendColor: {
        width: 15,
        height: 15,
        borderRadius: 7.5,
        marginBottom: 5,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    legendValue: {
        fontSize: 14,
        color: '#666',
    },
    mealCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    refeicaoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    refeicaoTitulo: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4CAF50",
    },
    addMealButton: {
        padding: 5,
    },
    alimentoLinha: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 5,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#ccc",
    },
    nome: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    macros: {
        fontSize: 14,
        color: "#666",
    },
    removeButton: {
        padding: 5,
    },
    totais: {
        marginTop: 15,
        fontWeight: "bold",
        color: "#222",
    },
});