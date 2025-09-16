// src/screens/NivelAtividadeScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';

const atividadeDetalhes = {
    'nao_ativa': { 
        titulo: 'Não Ativo', 
        descricao: 'Não faz exercícios ou tem um trabalho sedentário.',
        multiplicador: 1.2
    },
    'levemente_ativa': { 
        titulo: 'Levemente Ativo', 
        descricao: 'Exercício leve (1 a 3 dias por semana).',
        multiplicador: 1.375
    },
    'ativa': { 
        titulo: 'Ativo', 
        descricao: 'Exercício moderado (3 a 5 dias por semana).',
        multiplicador: 1.55
    },
    'muito_ativa': { 
        titulo: 'Muito Ativo', 
        descricao: 'Exercício intenso (6 a 7 dias por semana).',
        multiplicador: 1.725
    },
};

export default function NivelAtividadeScreen({ route, navigation }) {
    const { setHasProfile } = route.params; 
    const [sexo, setSexo] = useState('');
    const [nivelAtividade, setNivelAtividade] = useState('');

    const handleNext = () => {
        if (!sexo || !nivelAtividade) {
            Alert.alert("Erro", "Por favor, selecione seu sexo e nível de atividade.");
            return;
        }
        navigation.navigate("Objetivo", {
            ...route.params,
            sexo: sexo,
            nivelAtividade: nivelAtividade,
        });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>2/3 - Nível de Atividade</Text>
            
            <Text style={styles.sectionTitle}>Seu Sexo:</Text>
            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={[styles.option, sexo === 'masculino' && styles.selectedOption]}
                    onPress={() => setSexo('masculino')}
                >
                    <Text style={sexo === 'masculino' && styles.selectedOptionText}>Masculino</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.option, sexo === 'feminino' && styles.selectedOption]}
                    onPress={() => setSexo('feminino')}
                >
                    <Text style={sexo === 'feminino' && styles.selectedOptionText}>Feminino</Text>
                </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>Nível de Atividade:</Text>
            <View style={styles.optionsContainer}>
                {Object.entries(atividadeDetalhes).map(([key, value]) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.option, nivelAtividade === key && styles.selectedOption]}
                        onPress={() => setNivelAtividade(key)}
                    >
                        <Text style={nivelAtividade === key && styles.selectedOptionText}>{value.titulo}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            
            {nivelAtividade ? (
                <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                        {atividadeDetalhes[nivelAtividade].descricao}
                    </Text>
                </View>
            ) : null}

            <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Próximo</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, alignSelf: 'flex-start' },
    optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 15 },
    option: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginRight: 10, marginBottom: 10 },
    selectedOption: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
    selectedOptionText: { color: 'white' },
    descriptionBox: {
        backgroundColor: '#f0f4f7',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        width: '100%',
        alignSelf: 'flex-start'
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
    },
    button: { width: '100%', height: 50, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 20 },
    buttonText: { color: 'white', fontSize: 18 },
});