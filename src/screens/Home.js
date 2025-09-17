// src/screens/Home.js
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

import { PieChart } from "react-native-chart-kit";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import Ionicons from 'react-native-vector-icons/Ionicons';

const refeicoesIniciais = [
    { id: "cafe", nome: "Café da Manhã", alimentos: [] },
    { id: "almoco", nome: "Almoço", alimentos: [] },
    { id: "lanche", nome: "Lanche", alimentos: [] },
    { id: "jantar", nome: "Jantar", alimentos: [] },
];

export default function Home({ navigation }) {
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
                    });
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
    }, [userId, dataAtual]);

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

    const totaisDoDia = calcularTotais(refeicoes.flatMap((r) => r.alimentos));
    
    const caloriasTotais = totaisDoDia.kcal;
    const caloriasRestantes = metaCalorica - caloriasTotais;

    const dadosGrafico = [
        {
            name: "Proteínas",
            calories: Number(totaisDoDia.prot.toFixed(0)),
            color: "#2ecc71",
            legendFontColor: "#7F7F7F",
            legendFontSize: 15,
        },
        {
            name: "Carboidratos",
            calories: Number(totaisDoDia.carb.toFixed(0)),
            color: "#3498db",
            legendFontColor: "#7F7F7F",
            legendFontSize: 15,
        },
        {
            name: "Gorduras",
            calories: Number(totaisDoDia.gord.toFixed(0)),
            color: "#e67e22",
            legendFontColor: "#7F7F7F",
            legendFontSize: 15,
        },
    ];

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.container}
        >
            <Text style={styles.dateText}>
                {format(dataAtual, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </Text>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumo do Dia</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Meta</Text>
                        <Text style={styles.summaryValue}>{metaCalorica.toFixed(0)} kcal</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Consumidas</Text>
                        <Text style={styles.summaryValue}>{caloriasTotais.toFixed(0)} kcal</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Restantes</Text>
                        <Text style={styles.summaryValue}>{Math.max(0, caloriasRestantes).toFixed(0)} kcal</Text>
                    </View>
                </View>
            </View>

            {caloriasTotais > 0 && (
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Distribuição de Macros (em Gramas)</Text>
                    <PieChart
                        data={dadosGrafico}
                        width={Dimensions.get("window").width - 40}
                        height={220}
                        chartConfig={chartConfig}
                        accessor={"calories"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[10, 10]}
                        absolute
                    />
                </View>
            )}

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
                                            {alimento.nome} ({alimento.gramas}g)
                                        </Text>
                                        <Text style={styles.macros}>
                                            {parseFloat(alimento.kcal).toFixed(1)} kcal | {parseFloat(alimento.prot).toFixed(1)}g prot | {parseFloat(alimento.carb).toFixed(1)}g carb | {parseFloat(alimento.gord).toFixed(1)}g gord
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removerAlimento(item.id, index)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#E74C3C" />
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
    dateText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
        textAlign: "center",
    },
    summaryCard: {
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
    summaryTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4CAF50",
        marginBottom: 10,
        textAlign: "center",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryItem: {
        flex: 1,
        alignItems: "center",
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
    chartCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: "center",
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#4CAF50",
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