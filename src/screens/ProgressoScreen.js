import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import WeightProgressChart from '../components/ProgressoPeso';
import CalorieProgressChart from '../components/ProgressoKcal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProgressoScreen() {
    const insets = useSafeAreaInsets();
    return (
        <ScrollView 
            style={[styles.scrollView, { paddingTop: insets.top }]}
            contentContainerStyle={styles.container}
        >
            <Text style={styles.title}>Progresso Geral</Text>
            
            <Text style={styles.subtitle}>Progresso de Peso</Text>
            <View style={styles.chartSection}>
                <WeightProgressChart />
            </View>

            <Text style={styles.subtitle}>Consumo de Calorias</Text>
            <View style={styles.chartSection}>
                <CalorieProgressChart />
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
        backgroundColor: '#f0f4f7',
        padding: 20,
        paddingBottom: 80, // Garante que o conteúdo não seja escondido pela barra de navegação
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 10,
        marginTop: 10,
    },
    chartSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        paddingVertical: 10,
    },
});