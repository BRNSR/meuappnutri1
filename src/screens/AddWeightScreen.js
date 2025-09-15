import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { format } from "date-fns";

// Funções de cálculo (podem ser movidas para um arquivo de utilidades no futuro)
const calcularTMB = (perfil) => {
  const { sexo, peso, altura, idade } = perfil;
  let tmb;

  if (sexo === "masculino") {
    tmb = 88.36 + 13.4 * peso + 4.8 * altura - 5.7 * idade;
  } else {
    tmb = 447.6 + 9.2 * peso + 3.1 * altura - 4.3 * idade;
  }
  return tmb;
};

const calcularGCD = (perfil) => {
  const { nivelAtividade } = perfil;
  const tmb = calcularTMB(perfil);
  let fatorAtividade = 1.2;

  switch (nivelAtividade) {
    case "sedentario":
      fatorAtividade = 1.2;
      break;
    case "levemente_ativo":
      fatorAtividade = 1.375;
      break;
    case "moderadamente_ativo":
      fatorAtividade = 1.55;
      break;
    case "altamente_ativo":
      fatorAtividade = 1.725;
      break;
    case "muito_ativo":
      fatorAtividade = 1.9;
      break;
  }
  return tmb * fatorAtividade;
};

const calcularMetaCalorica = (perfil) => {
  const { objetivo } = perfil;
  const gcd = calcularGCD(perfil);
  let meta = gcd;

  if (objetivo === "perder_peso") {
    meta = gcd - 500;
  } else if (objetivo === "ganhar_peso") {
    meta = gcd + 500;
  }
  return meta;
};

const calcularIMC = (perfil) => {
  const { peso, altura } = perfil;
  const alturaMetros = altura / 100;
  return peso / (alturaMetros * alturaMetros);
};

export default function AddWeightScreen({ navigation }) {
  const [peso, setPeso] = useState("");
  const [loading, setLoading] = useState(false);
  const userId = auth.currentUser?.uid;

  // src/screens/AddWeightScreen.js

const handleSaveWeight = async () => {
  if (!peso || isNaN(parseFloat(peso))) {
    Alert.alert("Erro", "Por favor, insira um peso válido.");
    return;
  }

  setLoading(true);
  const pesoValue = parseFloat(peso);
  const dataString = format(new Date(), "yyyy-MM-dd");
  const userId = auth.currentUser?.uid;

  if (!userId) {
    Alert.alert("Erro", "Usuário não autenticado.");
    setLoading(false);
    return;
  }

  try {
    // Salva o novo peso no histórico
    const weightLogRef = doc(db, "users", userId, "weightHistory", dataString);
    await setDoc(weightLogRef, {
      peso: pesoValue,
      timestamp: new Date(),
    });

    // Busca o perfil atual do usuário
    const perfilRef = doc(db, "users", userId, "profile", "data");
    const perfilSnap = await getDoc(perfilRef);

    if (perfilSnap.exists()) {
      const perfilData = perfilSnap.data();

      // Recalcula as métricas com o novo peso
      const novoPerfil = { ...perfilData, peso: pesoValue };
      const novaTmb = calcularTMB(novoPerfil);
      const novoGcd = calcularGCD(novoPerfil);
      const novaMetaCalorica = calcularMetaCalorica(novoPerfil);
      const novoImc = calcularIMC(novoPerfil);

      // ✅ ATUALIZAÇÃO REVISADA
      await updateDoc(perfilRef, {
        peso: pesoValue,
        tmb: novaTmb,
        gcd: novoGcd,
        metaCalorica: novaMetaCalorica,
        imc: novoImc,
      });

      Alert.alert("Sucesso", "Peso e métricas atualizados com sucesso!");
      navigation.navigate("Dashboard", { screen: "DashboardMain" });
    } else {
      Alert.alert("Erro", "Perfil do usuário não encontrado.");
      navigation.navigate("Registration");
    }
  } catch (e) {
    console.error("Erro ao salvar peso: ", e);
    Alert.alert("Erro", "Não foi possível salvar seu peso. Tente novamente.");
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Peso</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite seu peso em kg"
        keyboardType="numeric"
        value={peso}
        onChangeText={setPeso}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveWeight}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar Peso</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f7",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});