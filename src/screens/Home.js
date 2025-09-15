// src/screens/Home.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";

import { PieChart } from "react-native-chart-kit";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const refeicoesIniciais = [
  { id: "cafe", nome: "Café da Manhã", alimentos: [] },
  { id: "almoco", nome: "Almoço", alimentos: [] },
  { id: "lanche", nome: "Lanche", alimentos: [] },
  { id: "jantar", nome: "Jantar", alimentos: [] },
];

export default function Home({ navigation }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [refeicoes, setRefeicoes] = useState(refeicoesIniciais);
  const [loading, setLoading] = useState(true);
  const [metaCalorica, setMetaCalorica] = useState(0); 
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const perfilRef = doc(db, "users", userId, "profile", "data");
    const unsubPerfil = onSnapshot(perfilRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().metaCalorica) {
        setMetaCalorica(docSnap.data().metaCalorica);
      }
    });

    const dataString = format(dataAtual, "yyyy-MM-dd");
    const dailyLogRef = doc(db, "users", userId, "dailyLog", dataString);

    const unsubscribe = onSnapshot(
      dailyLogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const dadosSalvos = docSnap.data().refeicoes;
          setRefeicoes(dadosSalvos);
        } else {
          // Se o documento não existe, cria um novo com refeições iniciais e totais zerados
          setDoc(dailyLogRef, {
            refeicoes: refeicoesIniciais,
            totais: { kcal: 0, prot: 0, carb: 0, gord: 0 },
          });
          setRefeicoes(refeicoesIniciais);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erro no listener do Firestore: ", error);
        Alert.alert(
          "Erro",
          "Falha ao carregar dados. Verifique sua conexão e permissões."
        );
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      unsubPerfil();
    };
  }, [userId, dataAtual]);

  const adicionarAlimento = (refeicaoId, alimento) => {
    const novasRefeicoes = refeicoes.map((r) =>
      r.id === refeicaoId ? { ...r, alimentos: [...r.alimentos, alimento] } : r
    );
    salvarRefeicoes(novasRefeicoes);
  };

  const removerAlimento = (refeicaoId, alimentoIndex) => {
    const novasRefeicoes = refeicoes.map((r) =>
      r.id === refeicaoId
        ? {
            ...r,
            alimentos: r.alimentos.filter((_, index) => index !== alimentoIndex),
          }
        : r
    );
    salvarRefeicoes(novasRefeicoes);
  };

  const salvarRefeicoes = async (novasRefeicoes) => {
    if (!userId) return;
    const dataString = format(dataAtual, "yyyy-MM-dd");
    const docRef = doc(db, "users", userId, "dailyLog", dataString);

    const todosOsAlimentos = novasRefeicoes.flatMap(refeicao => refeicao.alimentos);
    
    const totais = todosOsAlimentos.reduce(
      (acc, a) => ({
        kcal: acc.kcal + parseFloat(a.kcal),
        prot: acc.prot + parseFloat(a.prot),
        carb: acc.carb + parseFloat(a.carb),
        gord: acc.gord + parseFloat(a.gord),
      }),
      { kcal: 0, prot: 0, carb: 0, gord: 0 }
    );

    try {
      await setDoc(docRef, { refeicoes: novasRefeicoes, totais }, { merge: true });
    } catch (e) {
      console.error("Erro ao salvar dados: ", e);
      Alert.alert("Erro", "Não foi possível salvar os dados. Tente novamente.");
    }
  };

  const calcularTotais = (alimentos) => {
    return alimentos.reduce(
      (totais, a) => ({
        kcal: totais.kcal + parseFloat(a.kcal),
        prot: totais.prot + parseFloat(a.prot),
        carb: totais.carb + parseFloat(a.carb),
        gord: totais.gord + parseFloat(a.gord),
      }),
      { kcal: 0, prot: 0, carb: 0, gord: 0 }
    );
  };

  const totaisDoDia = calcularTotais(refeicoes.flatMap((r) => r.alimentos));
  
  const caloriasTotais = totaisDoDia.kcal;
  const caloriasRestantes = metaCalorica - caloriasTotais;

  // ✅ Removidas as conversões para Kcal para o gráfico de pizza.
  //    Os totais de proteína, carboidrato e gordura já estão em gramas.
  //    const caloriasProt = totaisDoDia.prot * 4;
  //    const caloriasCarb = totaisDoDia.carb * 4;
  //    const caloriasGord = totaisDoDia.gord * 9;

  const dadosGrafico = [
    {
      // ✅ ALTERADO: name agora contém SÓ o nome do macro
      // O valor (gramas) será exibido pelo `accessor` e `absolute` no centro do slice.
      name: "Proteínas", 
      calories: Number(totaisDoDia.prot.toFixed(0)), 
      color: "#2ecc71",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
    {
      // ✅ ALTERADO: name agora contém SÓ o nome do macro
      name: "Carboidratos", 
      calories: Number(totaisDoDia.carb.toFixed(0)), 
      color: "#3498db",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
    {
      // ✅ ALTERADO: name agora contém SÓ o nome do macro
      name: "Gorduras", 
      calories: Number(totaisDoDia.gord.toFixed(0)), 
      color: "#e67e22",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
  ];

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.dateText}>
        {format(dataAtual, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </Text>
      <View style={styles.resumo}>
        <Text style={styles.resumoTxt}>
          Meta: {metaCalorica.toFixed(0)} kcal | Consumidas: {caloriasTotais.toFixed(0)} kcal | Restantes: {Math.max(0, caloriasRestantes).toFixed(0)} kcal
        </Text>
      </View>
      
      {caloriasTotais > 0 && ( // Só mostra o gráfico se houver calorias consumidas
        <View style={styles.chartContainer}>
          {/* ✅ Título do gráfico agora indica "em Gramas" */}
          <Text style={styles.chartTitle}>Distribuição de Macros (em Gramas)</Text>
          <PieChart
            data={dadosGrafico}
            width={Dimensions.get("window").width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor={"calories"} // O acessor ainda aponta para 'calories', mas o valor agora é em gramas
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 10]}
            absolute
          />
        </View>
      )}

      <FlatList
        data={refeicoes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const totais = calcularTotais(item.alimentos);
          return (
            <View style={styles.refeicao}>
              <View style={styles.refeicaoHeader}>
                <Text style={styles.refeicaoTitulo}>{item.nome}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("BuscaAlimento", {
                      refeicaoId: item.id,
                      adicionarAlimento,
                    })
                  }
                >
                  <Text style={styles.addBtn}> + </Text>
                </TouchableOpacity>
              </View>
              {item.alimentos.map((alimento, index) => (
                <View key={index} style={styles.alimentoLinha}>
                  <View>
                    <Text style={styles.nome}>
                      {alimento.nome} ({alimento.gramas}g)
                    </Text>
                    <Text style={styles.macros}>
                      {alimento.kcal.toFixed(1)} kcal | {alimento.prot.toFixed(1)}g prot | {alimento.carb.toFixed(1)}g carb | {alimento.gord.toFixed(1)}g gord
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removerAlimento(item.id, index)}
                  >
                    <Text style={styles.removerBtn}>❌</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {item.alimentos.length > 0 && (
                <Text style={styles.totais}>
                  Total: {totais.kcal.toFixed(1)} kcal |{" "}
                  {totais.prot.toFixed(1)}g prot | {totais.carb.toFixed(1)}g carb |{" "}
                  {totais.gord.toFixed(1)}g gord
                </Text>
              )}
            </View>
          );
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resumo: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  resumoTxt: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  refeicao: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  refeicaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refeicaoTitulo: { fontSize: 18, fontWeight: "bold" },
  addBtn: { fontSize: 24, color: "green" },
  alimentoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  nome: { fontSize: 16, fontWeight: "bold" },
  macros: { fontSize: 14, color: "#555" },
  removerBtn: { fontSize: 22, color: "red", fontWeight: "bold" },
  totais: { marginTop: 8, fontWeight: "bold", color: "#222" },
});