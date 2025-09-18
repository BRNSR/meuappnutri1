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
    const [selectedPeriod, setSelectedPeriod] = useState('7-d');
    const [goalCalories, setGoalCalories] = useState(null);
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
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
                { text: "Cancelar", style: "cancel" },
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

    const periodLimit = selectedPeriod === '7-d' ? 7 : 30;
    const historyForChart = calorieHistory.slice(-periodLimit);

    const labels = historyForChart.map(entry => {
        const dateObj = new Date(entry.data);
        if (selectedPeriod === '7-d') {
            // Alteração aqui: mostra o número do dia
            return isNaN(dateObj.getTime()) ? '' : format(dateObj, 'd');
        }
        return isNaN(dateObj.getTime()) ? '' : format(dateObj, 'dd/MM');
    });

    const dataPoints = historyForChart.map(entry => entry.kcal);

    const adjustedLabels = labels.map((label, index) => {
        if (selectedPeriod === '30-d' && index % 5 !== 0) {
            return '';
        }
        return label;
    });
    
    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(68, 68, 68, ${opacity})`,
        propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#3498db"
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#e6e6e6'
        }
    };

    const finalChartData = {
        labels: adjustedLabels,
        datasets: [{ data: dataPoints }]
    };

    if (goalCalories !== null) {
        finalChartData.datasets.push({
            data: new Array(adjustedLabels.length).fill(goalCalories),
            color: (opacity = 1) => `rgba(243, 156, 18, ${opacity})`,
            strokeWidth: 2,
            strokeDasharray: [5, 5]
        });
    }

    const renderItem = ({ item }) => (
        <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
                {format(new Date(item.data), "d 'de' MMMM", { locale: ptBR })}
            </Text>
            <Text style={styles.tableCell}>{item.kcal.toFixed(0)}</Text>
            <View style={styles.tableCellActions}>
                <TouchableOpacity
                    onPress={() => handleDeleteCalorieRecord(item.id)}
                    style={styles.deleteButton}
                >
                    <Icon name="delete-forever" size={20} color="#EF5350" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.periodSelector}>
                <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === '7-d' && styles.activePeriodButton]}
                    onPress={() => setSelectedPeriod('7-d')}
                >
                    <Text style={[styles.periodText, selectedPeriod === '7-d' && styles.activePeriodText]}>7 dias</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === '30-d' && styles.activePeriodButton]}
                    onPress={() => setSelectedPeriod('30-d')}
                >
                    <Text style={[styles.periodText, selectedPeriod === '30-d' && styles.activePeriodText]}>30 dias</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.chartWrapper}>
                {goalCalories !== null && (
                    <Text style={[styles.goalText, { color: '#3498db' }]}>Meta Calórica: {goalCalories.toFixed(0)} kcal</Text>
                )}
                <LineChart
                    data={finalChartData}
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
                <View style={[styles.tableHeader, { backgroundColor: '#f9f9f9' }]}>
                    <Text style={[styles.tableHeaderText, { color: '#3498db' }]}>Data</Text>
                    <Text style={[styles.tableHeaderText, { color: '#3498db' }]}>Kcal</Text>
                    <Text style={[styles.tableHeaderText, { color: '#3498db' }]}>Ações</Text>
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
    periodSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignSelf: 'stretch',
        borderWidth: 1,
        borderColor: '#e6e6e6',
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    activePeriodButton: {
        backgroundColor: '#3498db',
    },
    periodText: {
        fontSize: 16,
        color: '#888',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    activePeriodText: {
        color: '#fff',
    },
    chartWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    goalText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
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
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        marginBottom: 5,
    },
    tableHeaderText: {
        fontWeight: 'bold',
        fontSize: 16,
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