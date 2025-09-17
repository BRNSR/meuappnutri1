import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { useFocusEffect } from '@react-navigation/native';

export default function Dashboard({ navigation }) {
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = auth.currentUser?.uid;

    useFocusEffect(
        React.useCallback(() => {
            if (!userId) {
                setLoading(false);
                return;
            }
            setLoading(true);

            const perfilRef = doc(db, "users", userId, "profile", "data");
            const unsubscribe = onSnapshot(
                perfilRef,
                (docSnap) => {
                    if (docSnap.exists()) {
                        setPerfil(docSnap.data());
                    } else {
                        setPerfil(null);
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error("Erro ao carregar perfil: ", error);
                    setLoading(false);
                    Alert.alert(
                        "Erro",
                        "Não foi possível carregar os dados do seu perfil."
                    );
                }
            );
            return () => unsubscribe();
        }, [userId])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
            </View>
        );
    }

    if (!perfil) {
        return (
            <View style={styles.noProfileContainer}>
                <Text style={styles.noDataText}>
                    Complete seu perfil para ver o dashboard.
                </Text>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate("ProfileData")}
                >
                    <Text style={styles.actionButtonText}>Começar Agora</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { peso, metaPeso, objetivo, metaCalorica, gcd, tmb, imc } = perfil;
    const imcStatus = (value) => {
        if (value < 18.5) return "Abaixo do peso";
        if (value >= 18.5 && value <= 24.9) return "Peso normal";
        if (value >= 25 && value <= 29.9) return "Sobrepeso";
        return "Obesidade";
    };
    const objetivoTexto = (value) => {
        if (value === "perder_peso") return "Perda de Peso";
        if (value === "manter_peso") return "Manutenção";
        return "Ganho de Peso";
    };

    return (
        // ✅ A principal mudança: 'contentContainerStyle'
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Meu Dashboard</Text>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumo do seu Plano</Text>
                <Text style={styles.infoText}>
                    Objetivo: <Text style={styles.boldText}>{objetivoTexto(objetivo)}</Text>
                </Text>
                <Text style={styles.infoText}>
                    Meta de Peso: <Text style={styles.boldText}>{metaPeso} kg</Text>
                </Text>
                <Text style={styles.infoText}>
                    Meta Calórica Diária:{" "}
                    <Text style={styles.boldText}>{metaCalorica.toFixed(0)} kcal</Text>
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estatísticas do Corpo</Text>
                <View style={styles.statRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statTitle}>Peso Atual</Text>
                        <Text style={styles.statValue}>
                            {perfil.peso ? `${perfil.peso.toFixed(1)} kg` : "N/A"}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statTitle}>IMC</Text>
                        <Text style={styles.statValue}>{imc ? imc.toFixed(2) : 'N/A'}</Text>
                        <Text style={styles.statLabel}>{imcStatus(imc)}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.actionButton, styles.smallButton]}
                    onPress={() => navigation.navigate("AddWeight")}
                >
                    <Text style={[styles.actionButtonText, styles.smallButtonText]}>Adicionar Peso de Hoje</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cálculos Nutricionais</Text>
                <View style={styles.statRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statTitle}>TMB</Text>
                        <Text style={styles.statValue}>{tmb ? `${tmb.toFixed(0)} kcal` : 'N/A'}</Text>
                        <Text style={styles.statLabel}>Taxa Metabólica Basal</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statTitle}>GCD</Text>
                        <Text style={styles.statValue}>{gcd ? `${gcd.toFixed(0)} kcal` : 'N/A'}</Text>
                        <Text style={styles.statLabel}>Gasto Calórico Diário</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("ProfileData")}
            >
                <Text style={styles.actionButtonText}>Atualizar Perfil e Metas</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // ✅ Estilo para o conteúdo, não para o ScrollView
    container: {
        flexGrow: 1, // Permite que o conteúdo se expanda para ocupar a tela
        backgroundColor: "#f0f4f7",
        padding: 20,
        paddingBottom: 80, // A solução para a rolagem
    },
    noProfileContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
        textAlign: "center",
    },
    section: {
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#4CAF50",
        marginBottom: 15,
    },
    infoText: {
        fontSize: 16,
        color: "#555",
        marginBottom: 5,
    },
    boldText: {
        fontWeight: "bold",
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: -5,
    },
    statBox: {
        flex: 1,
        alignItems: "center",
        padding: 15,
        backgroundColor: "#e8f5e9",
        borderRadius: 10,
        marginHorizontal: 5,
    },
    statTitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
        textAlign: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },
    statLabel: {
        fontSize: 12,
        color: "#888",
        textAlign: "center",
        marginTop: 5,
    },
    noDataText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 50,
    },
    actionButton: {
        backgroundColor: "#4CAF50",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 20,
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    smallButton: {
        padding: 12,
        borderRadius: 8,
    },
    smallButtonText: {
        fontSize: 16,
    },
});