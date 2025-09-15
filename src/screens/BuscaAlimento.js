// src/screens/BuscaAlimento.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert, // ✅ Importação do Alert para a validação
} from "react-native";
import tabelaAlimentos from "../data/alimentos.json";

export default function BuscaAlimento({ route, navigation }) {
  const { refeicaoId, adicionarAlimento } = route.params;
  const [busca, setBusca] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [alimentoSelecionado, setAlimentoSelecionado] = useState(null);
  const [gramas, setGramas] = useState("");

  const filtrados = Object.keys(tabelaAlimentos).filter((a) =>
    a.toLowerCase().includes(busca.toLowerCase())
  );

  const confirmarAdicao = () => {
    // ✅ Validação para garantir que a quantidade é um número válido e maior que zero
    const numericGramas = parseFloat(gramas);
    if (isNaN(numericGramas) || numericGramas <= 0) {
      Alert.alert(
        "Erro",
        "Por favor, insira uma quantidade válida em gramas."
      );
      return;
    }

    const infoBase = tabelaAlimentos[alimentoSelecionado];
    const fator = numericGramas / 100;

    // ✅ Arredondamento mais seguro e explícito usando parseFloat
    const alimentoComGramas = {
      nome: alimentoSelecionado,
      gramas: numericGramas,
      kcal: parseFloat((infoBase.kcal * fator).toFixed(1)),
      prot: parseFloat((infoBase.prot * fator).toFixed(1)),
      carb: parseFloat((infoBase.carb * fator).toFixed(1)),
      gord: parseFloat((infoBase.gord * fator).toFixed(1)),
    };

    adicionarAlimento(refeicaoId, alimentoComGramas);
    setGramas("");
    setModalVisible(false);
    navigation.goBack();
  };

  return (
    <>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Pesquisar alimento..."
          value={busca}
          onChangeText={setBusca}
        />

        <FlatList
          data={filtrados}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            const info = tabelaAlimentos[item];
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  setAlimentoSelecionado(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.nome}>{item}</Text>
                <Text style={styles.macros}>
                  {info.kcal} kcal | {info.prot}g prot | {info.carb}g carb |{" "}
                  {info.gord}g gord (por 100g)
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Quantos gramas de {alimentoSelecionado}?
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Ex: 150"
              value={gramas}
              onChangeText={setGramas}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancel]}
                onPress={() => {
                  setModalVisible(false);
                  setGramas("");
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.confirm]}
                onPress={confirmarAdicao}
                disabled={!gramas}
              >
                <Text style={styles.buttonText}>Adicionar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  nome: { fontSize: 16, fontWeight: "bold" },
  macros: { fontSize: 14, color: "#555", marginTop: 3 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  cancel: { backgroundColor: "#ccc" },
  confirm: { backgroundColor: "#4CAF50" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});