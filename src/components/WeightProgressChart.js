import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function WeightProgressChart() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchWeightData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const weightHistoryRef = collection(
          db,
          "users",
          userId,
          "weightHistory"
        );
        const q = query(weightHistoryRef, orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);

        const labels = [];
        const data = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          // Formata a data para um formato mais legível no gráfico
          labels.push(docData.timestamp.toDate().toLocaleDateString());
          data.push(docData.peso);
        });

        // Só renderiza o gráfico se houver pelo menos 2 pontos
        if (data.length > 1) {
          setChartData({
            labels,
            datasets: [{ data }],
          });
        }
      } catch (e) {
        console.error("Erro ao buscar histórico de peso: ", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWeightData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  if (chartData.labels.length < 2) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>
          Adicione mais pesagens para ver seu progresso.
        </Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: "#fff",
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Verde
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  noDataContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});