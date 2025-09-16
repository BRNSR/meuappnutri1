import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'; // Importe 'deleteDoc'
import { auth, db } from '../services/firebaseConfig';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Importe um ícone

const screenWidth = Dimensions.get('window').width;

export default function WeightProgressChart() {
    const [loading, setLoading] = useState(true);
    const [weightHistory, setWeightHistory] = useState([]);
    const [goalWeight, setGoalWeight] = useState(null);
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(collection(db, "users", userId, "weightHistory"), orderBy("timestamp", "asc"));
        const unsubscribeWeight = onSnapshot(q, (snapshot) => {
            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    id: doc.id, // ✅ Adiciona o ID do documento
                    peso: data.peso,
                    data: data.data,
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                });
            });
            history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            setWeightHistory(history);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar histórico de peso:", error);
            Alert.alert("Erro", "Não foi possível carregar o histórico de peso.");
            setLoading(false);
        });

        const perfilRef = doc(db, "users", userId, "profile", "data");
        const unsubscribePerfil = onSnapshot(perfilRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGoalWeight(data.metaPeso || null);
            }
        }, (error) => {
            console.error("Erro ao carregar meta de peso:", error);
        });

        return () => {
            unsubscribeWeight();
            unsubscribePerfil();
        };
    }, [userId]);

    // Função para deletar um registro de peso
    const handleDeleteWeight = (recordId) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja deletar este registro de peso? Esta ação não pode ser desfeita.",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Deletar",
                    onPress: async () => {
                        try {
                            if (!userId) {
                                Alert.alert("Erro", "Usuário não autenticado.");
                                return;
                            }
                            const recordRef = doc(db, "users", userId, "weightHistory", recordId);
                            await deleteDoc(recordRef);
                            Alert.alert("Sucesso", "Registro de peso deletado.");

                            // O onSnapshot já vai atualizar o estado weightHistory,
                            // então não precisamos fazer setWeightHistory manualmente aqui.

                            // OPCIONAL: Atualizar o peso atual no perfil se o registro deletado for o mais recente
                            // Esta lógica pode ser mais complexa se precisar recalcular o "peso atual"
                            // com base no penúltimo registro. Por enquanto, não faremos isso automaticamente
                            // para evitar complexidade desnecessária para o TCC, mas é uma consideração.
                            // O usuário pode simplesmente adicionar um novo peso atual.

                        } catch (error) {
                            console.error("Erro ao deletar registro de peso:", error);
                            Alert.alert("Erro", "Não foi possível deletar o registro de peso.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ marginTop: 10 }}>Carregando progresso...</Text>
            </View>
        );
    }

    if (weightHistory.length === 0) {
        return (
            <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Nenhum registro de peso encontrado.</Text>
                <Text style={styles.noDataText}>Adicione seu peso para ver o progresso aqui.</Text>
            </View>
        );
    }

    const labels = weightHistory.map(entry => {
        const dateObj = new Date(entry.data);
        return isNaN(dateObj.getTime()) ? '' : format(dateObj, 'dd/MM');
    });
    const dataPoints = weightHistory.map(entry => entry.peso);

    const chartConfig = {
        backgroundGradientFrom: '#4CAF50',
        backgroundGradientTo: '#66BB6A',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#ffa726"
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: 'rgba(255, 255, 255, 0.3)'
        }
    };

    const chartData = {
        labels: labels,
        datasets: [
            {
                data: dataPoints,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                strokeWidth: 2
            }
        ]
    };

    if (goalWeight !== null) {
        chartData.datasets.push({
            data: new Array(labels.length).fill(goalWeight),
            color: (opacity = 1) => `rgba(255, 200, 0, ${opacity})`,
            strokeWidth: 2,
            dashArray: [5, 5]
        });
    }

    return (
        <View style={styles.chartWrapper}>
            {goalWeight !== null && (
                <Text style={styles.goalText}>Meta de Peso: {goalWeight} kg</Text>
            )}
            <LineChart
                data={chartData}
                width={screenWidth - 80}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
            />
             <View style={styles.historyTable}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Data</Text>
                    <Text style={styles.tableHeaderText}>Peso (kg)</Text>
                    <Text style={styles.tableHeaderText}>Ações</Text> {/* ✅ Nova coluna para o botão */}
                </View>
                {weightHistory.slice().reverse().map((entry) => ( // ✅ Map por entry (item), não por index
                    <View key={entry.id} style={styles.tableRow}> {/* ✅ Usar entry.id como key */}
                        <Text style={styles.tableCell}>{format(new Date(entry.data), 'dd/MM/yyyy')}</Text>
                        <Text style={styles.tableCell}>{entry.peso.toFixed(1)}</Text>
                        <View style={styles.tableCellActions}> {/* ✅ Container para o botão */}
                            <TouchableOpacity
                                onPress={() => handleDeleteWeight(entry.id)} // ✅ Chama a função de exclusão
                                style={styles.deleteButton}
                            >
                                <Icon name="trash-can-outline" size={20} color="#EF5350" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 250,
    },
    noDataContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 250,
        padding: 20,
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    chartWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    goalText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    historyTable: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        width: screenWidth - 80,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#e8f5e9',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    tableHeaderText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#4CAF50',
        flex: 1,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center', // Alinha verticalmente os itens da linha
    },
    tableCell: {
        fontSize: 15,
        color: '#555',
        flex: 1,
        textAlign: 'center',
    },
    tableCellActions: { // Estilo para a célula de ações
        flex: 0.5, // Dá menos espaço para a coluna de ações
        alignItems: 'center',
    },
    deleteButton: {
        padding: 5, // Pequeno padding para o toque
    },
});