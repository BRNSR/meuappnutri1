import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const objetivoAjustes = {
    'perder_peso': 'Perder Peso',
    'manter_peso': 'Manter Peso',
    'ganhar_peso': 'Ganhar Peso',
};

// Make sure you are receiving the setHasProfile function here
export default function ObjetivoScreen({ route, navigation }) {
    const { userId, altura, peso, idade, sexo, nivelAtividade, setHasProfile } = route.params;
    const [objetivo, setObjetivo] = useState('');
    const [metaPeso, setMetaPeso] = useState('');
    const [loading, setLoading] = useState(false);

    const atividadeMultiplicadores = {
        'nao_ativa': 1.2,
        'levemente_ativa': 1.375,
        'ativa': 1.55,
        'muito_ativa': 1.725,
    };
    
    const objetivoCaloricoAjustes = {
        'perder_peso': -500,
        'manter_peso': 0,
        'ganhar_peso': 500,
    };

    const handleSalvarPerfil = async () => {
        if (!objetivo || !metaPeso) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }

        setLoading(true);

        try {
            if (!userId) {
                setLoading(false);
                Alert.alert("Erro de autenticação", "ID de usuário não encontrado. Por favor, faça login novamente.");
                return;
            }
            
            const pesoKg = parseFloat(peso);
            const alturaM = parseFloat(altura) / 100;
            const imc = pesoKg / (alturaM * alturaM);

            let tmb;
            if (sexo === 'masculino') {
                tmb = (13.397 * pesoKg) + (4.799 * parseFloat(altura)) - (5.677 * parseInt(idade)) + 88.362;
            } else {
                tmb = (9.247 * pesoKg) + (3.098 * parseFloat(altura)) - (4.330 * parseInt(idade)) + 447.593;
            }
            
            const gcd = tmb * atividadeMultiplicadores[nivelAtividade];
            const metaCalorica = gcd + objetivoCaloricoAjustes[objetivo];
            
            await setDoc(doc(db, "users", userId, "profile", "data"), {
                altura: parseFloat(altura),
                peso: pesoKg,
                idade: parseInt(idade),
                sexo: sexo,
                nivelAtividade: nivelAtividade,
                objetivo: objetivo,
                metaPeso: parseFloat(metaPeso),
                imc: imc,
                tmb: tmb,
                gcd: gcd,
                metaCalorica: metaCalorica,
                dataRegistro: new Date().toISOString()
            });

            console.log("Perfil atualizado com sucesso!");
            setLoading(false);

            // ✅ THIS IS THE KEY PART
            // The setHasProfile function, when called, will trigger a re-render
            // of the entire app, changing the navigator to MainTabs.
            if (typeof setHasProfile === 'function') {
                setHasProfile(true); 
            } else {
                // If the function is missing, we can navigate back to the dashboard.
                // This is a fallback, but the first method is preferred.
                navigation.navigate('Dashboard', { screen: 'DashboardMain' });
            }

        } catch (error) {
            setLoading(false);
            console.error("Erro ao salvar perfil: ", error);
            Alert.alert("Erro", "Não foi possível salvar seu perfil: " + error.message);
        }
    };
    
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }
    
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>3/3 - Objetivo</Text>
            <Text style={styles.sectionTitle}>Seu Objetivo:</Text>
            <View style={styles.optionsContainer}>
                {Object.entries(objetivoAjustes).map(([key, value]) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.option, objetivo === key && styles.selectedOption]}
                        onPress={() => setObjetivo(key)}
                    >
                        <Text style={objetivo === key && styles.selectedOptionText}>{value}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            
            <TextInput
                style={styles.input}
                placeholder="Meta de Peso (kg)"
                keyboardType="numeric"
                value={metaPeso}
                onChangeText={setMetaPeso}
            />

            <TouchableOpacity style={styles.button} onPress={handleSalvarPerfil}>
                <Text style={styles.buttonText}>Finalizar Cadastro</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, alignSelf: 'flex-start' },
    input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, borderRadius: 8 },
    optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 15 },
    option: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginRight: 10, marginBottom: 10 },
    selectedOption: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
    selectedOptionText: { color: 'white' },
    button: { width: '100%', height: 50, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 20 },
    buttonText: { color: 'white', fontSize: 18 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});