import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Alert, TouchableOpacity, FlatList } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

export default function CalorieProgressChart() {
    const [loading, setLoading] = useState(true);
    const [calorieHistory, setCalorieHistory] = useState([]);
    const [goalCalories, setGoalCalories] = useState(null);
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // A consulta ordena pela data/ID do documento, que no seu caso é o timestamp em formato 'YYYY-MM-DD'
        const q = query(collection(db, "users", userId, "dailyLog"), orderBy("__name__", "asc"));
        const unsubscribeCalories = onSnapshot(q, (snapshot) => {
            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.totais && data.totais.kcal !== undefined) {
                    history.push({
                        id: doc.id,
                        kcal: parseFloat(data.totais.kcal),
                        data: doc.id,
                    });
                }
            });
            setCalorieHistory(history);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar histórico de calorias:", error);
            Alert.alert("Erro", "Não foi possível carregar o histórico de calorias.");
            setLoading(false);
        });

        const perfilRef = doc(db, "users", userId, "profile", "data");
        const unsubscribePerfil = onSnapshot(perfilRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGoalCalories(data.metaCalorica || null);
            }
        }, (error) => {
            console.error("Erro ao carregar meta calórica:", error);
        });

        return () => {
            unsubscribeCalories();
            unsubscribePerfil();
        };
    }, [userId]);

    const handleDeleteCalorieRecord = (docId) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja deletar este registro de calorias? Esta ação não pode ser desfeita.",
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
                            const docRef = doc(db, "users", userId, "dailyLog", docId);
                            await deleteDoc(docRef);
                            Alert.alert("Sucesso", "Registro de calorias deletado.");
                        } catch (error) {
                            console.error("Erro ao deletar registro de calorias:", error);
                            Alert.alert("Erro", "Não foi possível deletar o registro de calorias.");
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
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={{ marginTop: 10 }}>Carregando progresso de calorias...</Text>
            </View>
        );
    }

    if (calorieHistory.length === 0) {
        return (
            <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Nenhum registro de calorias encontrado.</Text>
                <Text style={styles.noDataText}>Adicione alimentos para ver seu progresso aqui.</Text>
            </View>
        );
    }

    const labels = calorieHistory.map(entry => {
        const dateObj = new Date(entry.data);
        return isNaN(dateObj.getTime()) ? '' : format(dateObj, 'dd/MM');
    });
    const dataPoints = calorieHistory.map(entry => entry.kcal);

    const chartConfig = {
        backgroundGradientFrom: '#3498db',
        backgroundGradientTo: '#5DADE2',
        decimalPlaces: 0,
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

    if (goalCalories !== null) {
        chartData.datasets.push({
            data: new Array(labels.length).fill(goalCalories),
            color: (opacity = 1) => `rgba(255, 200, 0, ${opacity})`,
            strokeWidth: 2,
            dashArray: [5, 5]
        });
    }

    const renderItem = ({ item }) => (
        <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
                {/* O seu doc.id é a data 'YYYY-MM-DD', então precisamos parseá-lo para formatar */}
                {format(new Date(item.data), "d 'de' MMMM", { locale: ptBR })}
            </Text>
            <Text style={styles.tableCell}>{item.kcal.toFixed(0)}</Text>
            <View style={styles.tableCellActions}>
                <TouchableOpacity
                    onPress={() => handleDeleteCalorieRecord(item.id)}
                    style={styles.deleteButton}
                >
                    <Icon name="trash-can-outline" size={20} color="#EF5350" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.chartWrapper}>
                {goalCalories !== null && (
                    <Text style={styles.goalText}>Meta Calórica: {goalCalories.toFixed(0)} kcal</Text>
                )}
                <LineChart
                    data={chartData}
                    width={screenWidth - 80}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                />
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Histórico de Calorias</Text>
            </View>

            <View style={styles.historyTable}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Data</Text>
                    <Text style={styles.tableHeaderText}>Kcal</Text>
                    <Text style={styles.tableHeaderText}>Ações</Text>
                </View>
                <FlatList
                    data={calorieHistory.slice().reverse()}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    initialNumToRender={5}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f4f7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: '#3498db',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    listHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 10,
        marginBottom: 10,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
    },
    historyTable: {
        height: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#e6f2ff',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        marginBottom: 5,
    },
    tableHeaderText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#3498db',
        flex: 1,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 15,
        color: '#555',
        flex: 1,
        textAlign: 'center',
    },
    tableCellActions: {
        flex: 0.5,
        alignItems: 'center',
    },
    deleteButton: {
        padding: 5,
    },
});