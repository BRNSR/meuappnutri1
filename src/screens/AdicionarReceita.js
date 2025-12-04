// screens/AdicionarReceita.js

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
import { getAuth } from 'firebase/auth'; // Importa Auth para pegar o ID do usuário
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { saveReceita } from '../services/firestoreService'; // Importa a função do Firebase

export default function AdicionarReceita({ navigation }) {
    const insets = useSafeAreaInsets();
    const [nome, setNome] = useState('');
    const [kcal, setKcal] = useState('');
    const [prot, setProt] = useState('');
    const [carb, setCarb] = useState('');
    const [gord, setGord] = useState('');
    const [ingredientes, setIngredientes] = useState('');
    const [preparo, setPreparo] = useState('');
    const [loading, setLoading] = useState(false);

    // Obtém o ID do usuário logado
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    const handleSalvarReceita = async () => {
        if (!userId) {
            Alert.alert("Erro de Autenticação", "Usuário não logado. Faça login para adicionar receitas.");
            return;
        }
        if (!nome || !kcal || !prot || !carb || !gord || !ingredientes || !preparo) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }

        // Garante que a vírgula é convertida para ponto para parseFloat
        const numericKcal = parseFloat(kcal.replace(',', '.'));
        const numericProt = parseFloat(prot.replace(',', '.'));
        const numericCarb = parseFloat(carb.replace(',', '.'));
        const numericGord = parseFloat(gord.replace(',', '.'));

        if (isNaN(numericKcal) || isNaN(numericProt) || isNaN(numericCarb) || isNaN(numericGord)) {
            Alert.alert("Erro", "Os valores de calorias e macros devem ser números válidos.");
            return;
        }
        
        setLoading(true);

        const novaReceita = {
            id: uuidv4(), // ID único para ser o ID do documento no Firestore
            nome,
            kcal: numericKcal,
            prot: numericProt,
            carb: numericCarb,
            gord: numericGord,
            // Separa ingredientes por linha, removendo linhas vazias
            ingredientes: ingredientes.split('\n').filter(i => i.trim() !== ''), 
            preparo,
        };

        try {
            await saveReceita(userId, novaReceita); 

            setLoading(false);
            Alert.alert("Sucesso!", `A receita "${nome}" foi adicionada ao Firebase.`);
            navigation.goBack(); 
        } catch (error) {
            setLoading(false);
            Alert.alert("Erro", "Não foi possível salvar a receita no Firebase. Tente novamente.");
            console.error("Erro ao salvar receita no Firebase:", error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.title}>Adicionar Receita</Text>
                
                <Text style={styles.label}>Nome da Receita</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Frango com Batata Doce"
                    value={nome}
                    onChangeText={setNome}
                />

                <Text style={styles.label}>Macros (por porção)</Text>
                <View style={styles.macrosContainer}>
                    <TextInput
                        style={[styles.input, styles.macroInput]}
                        placeholder="Kcal"
                        keyboardType="numeric"
                        value={kcal}
                        onChangeText={setKcal}
                    />
                    <TextInput
                        style={[styles.input, styles.macroInput]}
                        placeholder="Prot (g)"
                        keyboardType="numeric"
                        value={prot}
                        onChangeText={setProt}
                    />
                    <TextInput
                        style={[styles.input, styles.macroInput]}
                        placeholder="Carb (g)"
                        keyboardType="numeric"
                        value={carb}
                        onChangeText={setCarb}
                    />
                    <TextInput
                        style={[styles.input, styles.macroInput]}
                        placeholder="Gord (g)"
                        keyboardType="numeric"
                        value={gord}
                        onChangeText={setGord}
                    />
                </View>

                <Text style={styles.label}>Ingredientes </Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ex:&#10;- 200g de peito de frango&#10;- 150g de batata doce&#10;- Temperos a gosto"
                    value={ingredientes}
                    onChangeText={setIngredientes}
                    multiline
                />

                <Text style={styles.label}>Modo de Preparo</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={preparo}
                    onChangeText={setPreparo}
                    multiline
                />

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSalvarReceita}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Salvar Receita</Text>
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
    macrosContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    macroInput: { width: '23%' },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, elevation: 5 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});