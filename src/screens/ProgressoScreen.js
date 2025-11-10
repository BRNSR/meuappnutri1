import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import WeightProgressChart from '../components/ProgressoPeso';
import CalorieProgressChart from '../components/ProgressoKcal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProgressoScreen() {
    const insets = useSafeAreaInsets();
    
    return (
        <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.container}
        >
            
            {/* ⬆️ NOVO: Seção de Consumo de Calorias (AGORA É O PRIMEIRO) */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Consumo Calórico Diário</Text>
                <CalorieProgressChart />
            </View>
            
            {/* ⬇️ NOVO: Seção de Progresso de Peso (AGORA É O SEGUNDO) */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Progresso de Peso</Text>
                <WeightProgressChart />
            </View>
            
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        backgroundColor: '#f0f4f7', // Fundo Soft UI mantido
        padding: 20,
        paddingBottom: 80, 
    },
    
    // Estilos para o Card do Gráfico (mantidos)
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 16, 
        marginBottom: 25,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
        alignItems: 'center', 
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50', // Destaque na cor primária
        marginBottom: 10,
        alignSelf: 'flex-start',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        paddingBottom: 8,
        width: '100%',
        paddingHorizontal: 5,
    },
    tipText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        fontStyle: 'italic',
        paddingHorizontal: 20,
    }
});