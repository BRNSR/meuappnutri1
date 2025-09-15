// src/screens/ProgressoScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import WeightProgressChart from '../components/WeightProgressChart';

export default function ProgressoScreen() {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Progresso de Peso</Text>
            <View style={styles.chartSection}>
                <WeightProgressChart />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    chartSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
    },
});