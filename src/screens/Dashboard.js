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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


export default function Dashboard({ navigation }) {
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = auth.currentUser?.uid;
    const insets = useSafeAreaInsets();

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
             <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Painel do Perfil</Text>

            {/* SEÇÃO 1: METAS DE DESTAQUE */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Minhas Metas</Text>
                
                <View style={styles.goalRow}>
                    {/* Meta Calórica */}
                    <View style={[styles.goalBox, { backgroundColor: '#e8f5e9' }]}>
                        <Ionicons name="flame-outline" size={30} color="#4CAF50" />
                        <Text style={styles.goalValue}>{metaCalorica.toFixed(0)}</Text>
                        <Text style={styles.goalLabel}>Kcal Diárias</Text>
                    </View>
                    
                    {/* Meta de Peso */}
                    <View style={[styles.goalBox, { backgroundColor: '#f0e8f5' }]}>
                        <MaterialCommunityIcons name="target" size={30} color="#8A2BE2" />
                        <Text style={styles.goalValue}>{metaPeso} kg</Text>
                        <Text style={styles.goalLabel}>Meta de Peso</Text>
                    </View>
                </View>

                {/* Objetivo Principal */}
                <View style={styles.infoRow}>
                    <Ionicons name="bulb-outline" size={20} color="#333" />
                    <Text style={styles.infoTextClean}>
                        Objetivo Principal: <Text style={styles.boldText}>{objetivoTexto(objetivo)}</Text>
                    </Text>
                </View>
            </View>

            {/* SEÇÃO 2: ESTATÍSTICAS E AÇÃO DE PESO */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estatísticas do Corpo</Text>
                
                <View style={styles.statRow}>
                    {/* Peso Atual */}
                    <View style={styles.statBoxClean}>
                        <Text style={styles.statTitle}>Peso Atual</Text>
                        <Text style={styles.statValueClean}>
                            {perfil.peso ? `${perfil.peso.toFixed(1)} kg` : "N/A"}
                        </Text>
                    </View>
                    
                    {/* IMC */}
                    <View style={styles.statBoxClean}>
                        <Text style={styles.statTitle}>IMC</Text>
                        <Text style={styles.statValueClean}>{imc ? imc.toFixed(2) : 'N/A'}</Text>
                        <Text style={styles.statLabel}>{imcStatus(imc)}</Text>
                    </View>
                </View>
                
                {/* Botão de Adicionar Peso (Destaque e Localizado) */}
                <TouchableOpacity
                    style={styles.actionButtonSmall}
                    onPress={() => navigation.navigate("AddWeight")}
                >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonTextSmall}>Registrar Peso de Hoje</Text>
                </TouchableOpacity>
            </View>

            {/* SEÇÃO 3: CÁLCULOS NUTRICIONAIS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cálculos Nutricionais (Referência)</Text>
                <View style={styles.statRow}>
                    {/* TMB */}
                    <View style={styles.statBoxClean}>
                        <Text style={styles.statTitle}>TMB</Text>
                        <Text style={styles.statValueClean}>{tmb ? `${tmb.toFixed(0)} kcal` : 'N/A'}</Text>
                        <Text style={styles.statLabel}>Metabólica Basal</Text>
                    </View>
                    {/* GCD */}
                    <View style={styles.statBoxClean}>
                        <Text style={styles.statTitle}>GCD</Text>
                        <Text style={styles.statValueClean}>{gcd ? `${gcd.toFixed(0)} kcal` : 'N/A'}</Text>
                        <Text style={styles.statLabel}>Gasto Diário Total</Text>
                    </View>
                </View>
            </View>

            {/* AÇÃO DE CONFIGURAÇÃO (Fundo da tela) */}
            <TouchableOpacity
                style={styles.configButton}
                onPress={() => navigation.navigate("ProfileData")}
            >
                <Ionicons name="settings-outline" size={20} color="#333" />
                <Text style={styles.configButtonText}>Editar Dados do Perfil e Metas</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#f0f4f7", // Fundo cinza claro
        padding: 20,
        paddingBottom: 80, 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 22, // Um pouco menor para dar espaço
        fontWeight: "bold",
        color: "#333",
        marginBottom: 20,
        textAlign: "center",
    },
    // 🚀 Soft UI Style
    section: {
        backgroundColor: "#fff",
        borderRadius: 16, // Mais suave
        padding: 20,
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, // Sombra sutil
        shadowRadius: 8, // Sombra espalhada
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4CAF50",
        marginBottom: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    boldText: {
        fontWeight: "bold",
        color: "#333",
    },
    
    // --- ESTILOS DE DESTAQUE DE METAS ---
    goalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    goalBox: {
        flex: 1,
        alignItems: "center",
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 5,
    },
    goalValue: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#333",
        marginTop: 5,
    },
    goalLabel: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginTop: 10,
    },
    infoTextClean: {
        fontSize: 15,
        color: "#555",
        marginLeft: 8,
    },

    // --- ESTILOS DE ESTATÍSTICAS LIMPAS ---
    statRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 10,
    },
    statBoxClean: {
        flex: 1,
        alignItems: "center",
        padding: 15,
        marginHorizontal: 5,
        borderRadius: 10,
        backgroundColor: '#fff', // Fundo branco dentro do card branco
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#eee', // Borda sutil para separar
    },
    statTitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 3,
        textAlign: "center",
    },
    statValueClean: {
        fontSize: 20, // Um pouco menor que as metas
        fontWeight: "bold",
        color: "#333",
    },
    statLabel: {
        fontSize: 12,
        color: "#888",
        textAlign: "center",
        marginTop: 5,
    },
    
    // --- BOTÕES DE AÇÃO ---
    actionButtonSmall: {
        backgroundColor: "#4CAF50",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actionButtonTextSmall: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    configButton: {
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc',
    },
    configButtonText: {
        color: "#333",
        fontSize: 16,
        marginLeft: 8,
    },
    // Estilos para telas vazias/erro (mantidos)
    noProfileContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    noDataText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 50,
    },
    // Mantido apenas para a tela de 'no profile'
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
});