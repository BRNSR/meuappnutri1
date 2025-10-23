import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import WeightProgressChart from '../components/ProgressoPeso';
import CalorieProgressChart from '../components/ProgressoKcal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProgressoScreen() {
    const insets = useSafeAreaInsets();
    
    // ✅ Otimização: Se você estiver usando o Header de Navegação
    // para mostrar o título 'Progresso Geral', você pode remover o insets.top
    // do ScrollView e a tag <Text style={styles.title}>.
    
    return (
        <ScrollView 
            // 💡 Se o Header está ativado, remova o paddingTop: insets.top
            style={styles.scrollView} 
            contentContainerStyle={styles.container}
        >
            {/* Seção de Progresso de Peso */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Progresso de Peso</Text>
                <WeightProgressChart />
            </View>
            {/* Seção de Consumo de Calorias */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Consumo Calórico Diário</Text>
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
        backgroundColor: '#f0f4f7', // Fundo Soft UI mantido
        padding: 20,
        // ✅ Se você removeu o insets.top do ScrollView, pode remover o paddingTop: 0 aqui também
        paddingBottom: 80, 
    },
    
    // 🚀 NOVO ESTILO: Card para o Gráfico (Soft UI Consistente)
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 16, // Mais suave e consistente com Soft UI
        marginBottom: 25,
        padding: 15, // Padding ligeiramente menor no card para compensar o padding do container
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, // Sombra sutil
        shadowRadius: 8, // Sombra espalhada
        elevation: 5,
        alignItems: 'center', // Centraliza o gráfico dentro do card
    },
    // ✅ NOVO: Título dentro do Card (em destaque)
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50', // Destaque na cor primária
        marginBottom: 10,
        alignSelf: 'flex-start', // Alinha o título à esquerda
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        paddingBottom: 8,
        width: '100%', // Linha se estende por toda a largura
        paddingHorizontal: 5, // Espaçamento interno
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