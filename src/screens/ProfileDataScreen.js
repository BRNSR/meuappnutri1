import { auth } from "../services/firebaseConfig";
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';

export default function ProfileDataScreen({ route, navigation, setHasProfile }) { 
    const userId = auth.currentUser?.uid;
    const [altura, setAltura] = useState('');
    const [peso, setPeso] = useState('');
    const [idade, setIdade] = useState('');

    const handleNext = () => {
        if (!altura || !peso || !idade) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }

        // garantir que os valores são numéricos
        if (isNaN(parseFloat(altura)) || isNaN(parseFloat(peso)) || isNaN(parseInt(idade))) {
            Alert.alert("Erro", "Por favor, insira valores numéricos válidos.");
            return;
        }

        navigation.navigate("NivelAtividade", {
            userId: userId,
            altura: altura,
            peso: peso,
            idade: idade,
            setHasProfile: setHasProfile, 
        });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Dados Pessoais</Text>
            <TextInput
                style={styles.input}
                placeholder="Altura (cm)"
                keyboardType="numeric"
                value={altura}
                onChangeText={setAltura}
            />
            <TextInput
                style={styles.input}
                placeholder="Peso (kg)"
                keyboardType="numeric"
                value={peso}
                onChangeText={setPeso}
            />
            <TextInput
                style={styles.input}
                placeholder="Idade"
                keyboardType="numeric"
                value={idade}
                onChangeText={setIdade}
            />
            <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Próximo</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, borderRadius: 8 },
    button: { width: '100%', height: 50, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    buttonText: { color: 'white', fontSize: 18 },


    container: { 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffffff'
    },

});