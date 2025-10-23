import React, { useState } from 'react';
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
// Importação do AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Adicionei a importação para ícones, caso você os use

// CHAVE EXCLUSIVA para salvar os exercícios no AsyncStorage
const EXERCICIOS_KEY = '@exercicios_usuario';

// Lista de dias da semana para a navegação (necessária para associar o dia)
const DIAS_DA_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function AdicionarExercicio({ route, navigation }) { // Nome do componente: AdicionarExercicio
    const insets = useSafeAreaInsets();
    
    // Pega o dia selecionado da tela anterior (ExerciciosScreen)
    const { diaSelecionado } = route.params || { diaSelecionado: DIAS_DA_SEMANA[0] };

    const [nome, setNome] = useState('');
    const [series, setSeries] = useState('');
    const [repeticoes, setRepeticoes] = useState('');
    const [kg, setKg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSalvarExercicio = async () => {
        if (!nome || !series || !repeticoes || !kg) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }

        const parsedSeries = parseInt(series);
        const parsedRepeticoes = parseInt(repeticoes);
        const parsedKg = parseFloat(kg.replace(',', '.'));

        if (isNaN(parsedSeries) || isNaN(parsedRepeticoes) || isNaN(parsedKg)) {
            Alert.alert("Erro", "Séries, Repetições e Carga devem ser números válidos.");
            return;
        }
        
        setLoading(true);

        const novoExercicio = {
            id: uuidv4(),
            day: diaSelecionado, // CRÍTICO: Salva o dia da semana
            nome,
            series: parsedSeries,
            repeticoes: parsedRepeticoes,
            kg: parsedKg,
            createdAt: new Date().toISOString()
        };

        try {
            const exerciciosSalvos = await AsyncStorage.getItem(EXERCICIOS_KEY);
            const exerciciosExistentes = exerciciosSalvos ? JSON.parse(exerciciosSalvos) : [];

            const novaListaDeExercicios = [...exerciciosExistentes, novoExercicio];

            await AsyncStorage.setItem(EXERCICIOS_KEY, JSON.stringify(novaListaDeExercicios));

            setLoading(false);
            Alert.alert("Sucesso!", `O exercício "${nome}" foi adicionado para ${diaSelecionado}.`);
            navigation.goBack(); 
        } catch (error) {
            setLoading(false);
            Alert.alert("Erro", "Não foi possível salvar o exercício. Tente novamente.");
            console.error("Erro ao salvar exercício:", error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.title}>Adicionar Treino: {diaSelecionado}</Text>
                
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
                        placeholder="Séries"
                        keyboardType="numeric"
                        value={series}
                        onChangeText={setSeries}
                    />
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Repetições"
                        keyboardType="numeric"
                        value={repeticoes}
                        onChangeText={setRepeticoes}
                    />
                </View>
                
                <Text style={styles.label}>Carga (Kg)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 40.5"
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