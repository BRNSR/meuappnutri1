// AdicionarExercicio.js (CÓDIGO FINAL E LIMPO)

import React, { useState, useMemo } from 'react'; 
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth } from 'firebase/auth'; 
// Não precisa mais de Ionicons neste arquivo, mas deixarei o import.
// import Ionicons from 'react-native-vector-icons/Ionicons'; 

import { saveExercicio } from '../services/firestoreService'; 

// Lista de dias da semana (Curto: para salvar no Firestore)
const DIAS_DA_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// Mapa de tradução (Curto para Completo: para exibição)
const DIAS_COMPLETO_MAP = {
    'Dom': 'Domingo', 'Seg': 'Segunda-feira', 'Ter': 'Terça-feira', 
    'Qua': 'Quarta-feira', 'Qui': 'Quinta-feira', 'Sex': 'Sexta-feira', 
    'Sáb': 'Sábado'
};

export default function AdicionarExercicio({ route, navigation }) {
    const insets = useSafeAreaInsets();
    
    const { diaSelecionadoCurto } = route.params || { diaSelecionadoCurto: DIAS_DA_SEMANA_CURTO[1] }; 

    // ✅ Uso correto do useMemo para obter o nome completo sem recálculo
    const diaCompleto = useMemo(() => DIAS_COMPLETO_MAP[diaSelecionadoCurto] || 'Dia Indefinido', [diaSelecionadoCurto]);

    const [nome, setNome] = useState('');
    const [series, setSeries] = useState('');
    const [repeticoes, setRepeticoes] = useState('');
    const [kg, setKg] = useState('');
    const [loading, setLoading] = useState(false);
    
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    const handleSalvarExercicio = async () => {
        if (!userId) {
            Alert.alert("Erro de Autenticação", "Usuário não logado. Faça login para adicionar exercícios.");
            return;
        }

        if (!nome || !series || !repeticoes) {
            Alert.alert("Erro", "Por favor, preencha o Nome, Séries e Repetições.");
            return;
        }

        const parsedSeries = parseInt(series);
        const parsedRepeticoes = parseInt(repeticoes);
        const parsedKg = parseFloat((kg || '0').replace(',', '.')); 

        if (isNaN(parsedSeries) || isNaN(parsedRepeticoes) || isNaN(parsedKg)) {
            Alert.alert("Erro", "Séries, Repetições e Carga devem ser números válidos.");
            return;
        }
        
        setLoading(true);

        const novoExercicioData = {
            day: diaSelecionadoCurto, 
            nome,
            series: parsedSeries,
            repeticoes: parsedRepeticoes,
            kg: parsedKg,
        };

        try {
            await saveExercicio(userId, novoExercicioData); 

            setLoading(false);
            navigation.goBack(); 
        } catch (error) {
            setLoading(false);
            Alert.alert("Erro", "Não foi possível salvar o exercício no Firebase.");
            console.error("Erro ao salvar exercício:", error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                
                {/* TÍTULO CORRETO / Dia do treino */}
                <Text style={styles.title}> {diaCompleto}</Text>
                
                <Text style={styles.label}>Nome do Exercício</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Supino Reto"
                    value={nome}
                    onChangeText={setNome}
                />

                <Text style={styles.label}>Detalhes do Treino</Text>
                <View style={styles.rowContainer}>
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Séries (Ex: 3)"
                        keyboardType="numeric"
                        value={series}
                        onChangeText={setSeries}
                        maxLength={2}
                    />
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Repetições (Ex: 12)"
                        keyboardType="numeric"
                        value={repeticoes}
                        onChangeText={setRepeticoes}
                        maxLength={2}
                    />
                </View>
                
                <Text style={styles.label}>Carga (Kg)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 40.5 (opcional, use 0 se não tiver peso)"
                    keyboardType="numeric"
                    value={kg}
                    onChangeText={setKg}
                />

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSalvarExercicio}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Salvar Exercício</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    scrollViewContent: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 5, marginTop: 10 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    rowContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, elevation: 5 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});