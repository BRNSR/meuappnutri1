import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { Picker } from '@react-native-picker/picker';

const objetivoAjustes = {
    'perder_peso': 'Perder Peso',
    'manter_peso': 'Manter Peso',
    'ganhar_peso': 'Ganhar Peso',
};

const pesoMetaSemanal = {
    '0.5': '0,5 kg/semana',
    '1.0': '1,0 kg/semana',
    '0': 'Nenhuma',
};

export default function ObjetivoScreen({ route, navigation }) {
    const { userId, altura, peso, idade, sexo, nivelAtividade, setHasProfile } = route.params;
    const [objetivo, setObjetivo] = useState('');
    const [metaPeso, setMetaPeso] = useState('');
    const [metaSemanal, setMetaSemanal] = useState('0');
    const [loading, setLoading] = useState(false);

    const atividadeMultiplicadores = {
        'nao_ativa': 1.2,
        'levemente_ativa': 1.375,
        'ativa': 1.55,
        'muito_ativa': 1.725,
    };
    
    const handleSalvarPerfil = async () => {
        if (!objetivo || !metaPeso) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }

        const pesoKg = parseFloat(peso);
        const metaPesoKg = parseFloat(metaPeso);
        const idadeInt = parseInt(idade);
        const alturaCm = parseFloat(altura);

        // Validação de meta de peso
        if (objetivo === 'perder_peso' && metaPesoKg >= pesoKg) {
            Alert.alert("Erro", "Para perder peso, sua meta deve ser menor que o peso atual.");
            return;
        }
        if (objetivo === 'ganhar_peso' && metaPesoKg <= pesoKg) {
            Alert.alert("Erro", "Para ganhar peso, sua meta deve ser maior que o peso atual.");
            return;
        }

        setLoading(true);

        try {
            if (!userId) {
                setLoading(false);
                Alert.alert("Erro de autenticação", "ID de usuário não encontrado.");
                return;
            }

            // Usando a fórmula de Mifflin-St Jeor para TMB
            let tmb;
            if (sexo === 'masculino') {
                tmb = (10 * pesoKg) + (6.25 * alturaCm) - (5 * idadeInt) + 5;
            } else {
                tmb = (10 * pesoKg) + (6.25 * alturaCm) - (5 * idadeInt) - 161;
            }
            
            const gcd = tmb * atividadeMultiplicadores[nivelAtividade];
            let metaCalorica = gcd;

            // Ajuste da meta calórica com base na meta semanal
            const caloriasPorKg = 7700;
            const metaCaloriasSemanal = parseFloat(metaSemanal) * caloriasPorKg;
            const ajusteDiario = metaCaloriasSemanal / 7;

            if (objetivo === 'perder_peso') {
                metaCalorica = gcd - ajusteDiario;
            } else if (objetivo === 'ganhar_peso') {
                metaCalorica = gcd + ajusteDiario;
            }

            // Limites de segurança para a meta calórica
            const faixaMinima = 1200; // Mulheres
            const faixaMinimaHomens = 1500; // Homens
            const limiteMaximo = 4000;

            if (objetivo === 'perder_peso') {
                if (sexo === 'masculino' && metaCalorica < faixaMinimaHomens) {
                    metaCalorica = faixaMinimaHomens;
                } else if (sexo === 'feminino' && metaCalorica < faixaMinima) {
                    metaCalorica = faixaMinima;
                }
            }

            if (metaCalorica > limiteMaximo) {
                metaCalorica = limiteMaximo;
            }

            await setDoc(doc(db, "users", userId, "profile", "data"), {
                altura: alturaCm,
                peso: pesoKg,
                idade: idadeInt,
                sexo: sexo,
                nivelAtividade: nivelAtividade,
                objetivo: objetivo,
                metaPeso: metaPesoKg,
                metaSemanal: parseFloat(metaSemanal),
                imc: pesoKg / ((alturaCm / 100) * (alturaCm / 100)),
                tmb: tmb,
                gcd: gcd,
                metaCalorica: metaCalorica,
                dataRegistro: new Date().toISOString()
            });

            console.log("Perfil atualizado com sucesso!");
            setLoading(false);

            if (typeof setHasProfile === 'function') {
                setHasProfile(true); 
            } else {
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

            {objetivo !== 'manter_peso' && (
                <>
                    <Text style={styles.sectionTitle}>Meta Semanal:</Text>
                    <View style={styles.optionsContainer}>
                        {Object.entries(pesoMetaSemanal).map(([key, value]) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.option, metaSemanal === key && styles.selectedOption]}
                                onPress={() => setMetaSemanal(key)}
                            >
                                <Text style={metaSemanal === key && styles.selectedOptionText}>{value}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

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