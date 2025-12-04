
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
// rEMOVIDO: doc, updateDoc, collection, addDoc
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../services/firebaseConfig';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
// funções modulares
import { saveProfile, addWeightEntry } from '../services/firestoreService'; 


export default function AddWeightScreen({ navigation }) {
    const [peso, setPeso] = useState('');
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const userId = auth.currentUser?.uid;

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
    };

    const handleSaveWeight = async () => {
        if (!userId) {
            Alert.alert('Erro', 'Usuário não autenticado.');
            return;
        }
        if (!peso || isNaN(parseFloat(peso))) {
            Alert.alert('Erro', 'Por favor, insira um peso válido.');
            return;
        }

        setLoading(true);
        try {
            const pesoValue = parseFloat(peso);
            const formattedDate = format(date, 'yyyy-MM-dd');

            // 1. Obter os dados atuais do perfil (Leitura direta é aceitável aqui)
            const perfilRef = doc(db, 'users', userId, 'profile', 'data');
            const perfilDoc = await getDoc(perfilRef);
            
            if (!perfilDoc.exists()) {
                Alert.alert('Erro', 'Dados do perfil não encontrados. Por favor, complete seu perfil primeiro.');
                setLoading(false);
                return;
            }
            
            const perfilData = perfilDoc.data();
            const { altura, idade, sexo, nivelAtividade, objetivo, metaSemanal } = perfilData;

            // 2. Recalcular todas as métricas com o novo peso (Lógica de cálculo mantida)
            const alturaM = altura / 100;
            const imc = pesoValue / (alturaM * alturaM);
            
            let tmb;
            if (sexo === 'masculino') {
                tmb = (10 * pesoValue) + (6.25 * altura) - (5 * idade) + 5;
            } else {
                tmb = (10 * pesoValue) + (6.25 * altura) - (5 * idade) - 161;
            }

            const atividadeMultiplicadores = {
                'nao_ativa': 1.2,
                'levemente_ativa': 1.375,
                'ativa': 1.55,
                'muito_ativa': 1.725,
            };
            const gcd = tmb * atividadeMultiplicadores[nivelAtividade];
            
            let metaCalorica = gcd;
            const caloriasPorKg = 7700;
            const metaCaloriasSemanal = metaSemanal * caloriasPorKg;
            const ajusteDiario = metaCaloriasSemanal / 7;

            if (objetivo === 'perder_peso') {
                metaCalorica = gcd - ajusteDiario;
            } else if (objetivo === 'ganhar_peso') {
                metaCalorica = gcd + ajusteDiario;
            }

            const faixaMinima = sexo === 'masculino' ? 1500 : 1200;
            const limiteMaximo = 4000;

            if (objetivo === 'perder_peso' && metaCalorica < faixaMinima) {
                metaCalorica = faixaMinima;
            }
            if (metaCalorica > limiteMaximo) {
                metaCalorica = limiteMaximo;
            }
            
            // 3. ✅ Adicionar o novo peso ao histórico usando a função modularizada
            const weightData = {
                peso: pesoValue,
                data: formattedDate,
                timestamp: new Date().toISOString(),
            };
            await addWeightEntry(userId, weightData); // Usa a função que aponta para 'historicoDePeso'

            // 4. ✅ Atualizar o documento 'profile/data' com todas as métricas recalculadas
            const profileUpdateData = {
                peso: pesoValue,
                imc: imc,
                tmb: tmb,
                gcd: gcd,
                metaCalorica: metaCalorica,
                ultimaAtualizacaoPeso: new Date().toISOString(),
            };
            await saveProfile(userId, profileUpdateData); // Usa a função que aponta para 'profile/data'

            Alert.alert('Sucesso', 'Peso e metas atualizados!');
            navigation.goBack();

        } catch (e) {
            console.error('Erro ao adicionar peso ou atualizar perfil:', e);
            Alert.alert('Erro', 'Não foi possível registrar o peso. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registrar Peso</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.datePickerButtonText}>Data: {format(date, 'dd/MM/yyyy')}</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    testID="datePicker"
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder="Peso (kg)"
                keyboardType="numeric"
                value={peso}
                onChangeText={setPeso}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleSaveWeight}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Salvar Peso e Atualizar Metas</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f4f7',
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 16,
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    datePickerButton: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        alignItems: 'center',
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#555',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});