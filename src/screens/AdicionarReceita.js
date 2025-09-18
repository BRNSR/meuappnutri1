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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const RECEITAS_KEY = '@receitas_usuario';

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

    const handleSalvarReceita = async () => {
        // Validação básica dos campos
        if (!nome || !kcal || !prot || !carb || !gord || !ingredientes || !preparo) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }

        const numericKcal = parseFloat(kcal);
        const numericProt = parseFloat(prot);
        const numericCarb = parseFloat(carb);
        const numericGord = parseFloat(gord);

        if (isNaN(numericKcal) || isNaN(numericProt) || isNaN(numericCarb) || isNaN(numericGord)) {
            Alert.alert("Erro", "Os valores de calorias e macros devem ser números válidos.");
            return;
        }
        
        setLoading(true);

        const novaReceita = {
            id: uuidv4(), // 👈 Adiciona um ID único para a nova receita
            nome,
            kcal: numericKcal,
            prot: numericProt,
            carb: numericCarb,
            gord: numericGord,
            ingredientes: ingredientes.split('\n'),
            preparo,
        };

        try {
            // Pega as receitas existentes do AsyncStorage
            const receitasSalvas = await AsyncStorage.getItem(RECEITAS_KEY);
            const receitasExistentes = receitasSalvas ? JSON.parse(receitasSalvas) : [];

            // Adiciona a nova receita à lista existente
            const novaListaDeReceitas = [...receitasExistentes, novaReceita];

            // Salva a lista atualizada de volta no AsyncStorage
            await AsyncStorage.setItem(RECEITAS_KEY, JSON.stringify(novaListaDeReceitas));

            setLoading(false);
            Alert.alert("Sucesso!", `A receita "${nome}" foi adicionada.`);
            navigation.goBack(); // Volta para a tela anterior
        } catch (error) {
            setLoading(false);
            Alert.alert("Erro", "Não foi possível salvar a receita. Tente novamente.");
            console.error("Erro ao salvar receita:", error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container,]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.title}>Adicionar Receita</Text>
                
                {/* Campos da receita */}
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

                <Text style={styles.label}>Ingredientes (um por linha)</Text>
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
                    placeholder="Ex:&#10;1. Cozinhe o frango.&#10;2. Asse a batata doce..."
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
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    macrosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    macroInput: {
        width: '23%',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        elevation: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});