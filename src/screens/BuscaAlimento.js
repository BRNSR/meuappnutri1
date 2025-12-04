import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import tabelaAlimentos from "../data/alimentos.json";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const RECENTES_KEY = '@alimentos_recentes';
const FAVORITOS_KEY = '@alimentos_favoritos';
const CUSTOM_FOODS_KEY = '@alimentos_custom';

export default function BuscaAlimento({ route, navigation }) {
  const { refeicaoId, adicionarAlimento } = route.params;
  const [busca, setBusca] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [alimentoSelecionado, setAlimentoSelecionado] = useState(null);
  const [gramas, setGramas] = useState("");
  const [viewMode, setViewMode] = useState("buscar");
  const [recentes, setRecentes] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [customFoods, setCustomFoods] = useState({});
  const [newFoodModalVisible, setNewFoodModalVisible] = useState(false);

  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodKcal, setNewFoodKcal] = useState('');
  const [newFoodProt, setNewFoodProt] = useState('');
  const [newFoodCarb, setNewFoodCarb] = useState('');
  const [newFoodGord, setNewFoodGord] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const recentesData = await AsyncStorage.getItem(RECENTES_KEY);
      const favoritosData = await AsyncStorage.getItem(FAVORITOS_KEY);
      const customFoodsData = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
      
      if (recentesData) setRecentes(JSON.parse(recentesData));
      if (favoritosData) setFavoritos(JSON.parse(favoritosData));
      if (customFoodsData) setCustomFoods(JSON.parse(customFoodsData));
    } catch (error) {
      console.error("Erro ao carregar dados do AsyncStorage:", error);
    }
  };

  const saveRecente = async (alimento) => {
    try {
      const novaLista = [alimento, ...recentes.filter(item => item !== alimento)];
      const limitedList = novaLista.slice(0, 10);
      setRecentes(limitedList);
      await AsyncStorage.setItem(RECENTES_KEY, JSON.stringify(limitedList));
    } catch (error) {
      console.error("Erro ao salvar recente:", error);
    }
  };

  const toggleFavorito = async (alimento) => {
    try {
      let novaLista;
      if (favoritos.includes(alimento)) {
        novaLista = favoritos.filter(item => item !== alimento);
      } else {
        novaLista = [...favoritos, alimento];
      }
      setFavoritos(novaLista);
      await AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(novaLista));
    } catch (error) {
      console.error("Erro ao salvar favorito:", error);
    }
  };

  const handleDelete = async (alimento) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja remover "${alimento}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          onPress: async () => {
            const updatedFavoritos = favoritos.filter(item => item !== alimento);
            setFavoritos(updatedFavoritos);
            await AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(updatedFavoritos));
            
            const updatedRecentes = recentes.filter(item => item !== alimento);
            setRecentes(updatedRecentes);
            await AsyncStorage.setItem(RECENTES_KEY, JSON.stringify(updatedRecentes));

            const updatedCustomFoods = { ...customFoods };
            delete updatedCustomFoods[alimento];
            setCustomFoods(updatedCustomFoods);
            await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updatedCustomFoods));
          }
        }
      ]
    );
  };

  const addNewFood = async () => {
    const isNameValid = newFoodName.trim() !== '';
    const areMacrosValid = [newFoodKcal, newFoodProt, newFoodCarb, newFoodGord].every(
      (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0
    );

    if (!isNameValid || !areMacrosValid) {
      Alert.alert("Erro", "Por favor, preencha todos os campos com valores válidos (números >= 0).");
      return;
    }

    const newFood = {
      [newFoodName]: {
        kcal: parseFloat(newFoodKcal),
        prot: parseFloat(newFoodProt),
        carb: parseFloat(newFoodCarb),
        gord: parseFloat(newFoodGord),
      }
    };

    const updatedCustomFoods = { ...customFoods, ...newFood };
    setCustomFoods(updatedCustomFoods);
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updatedCustomFoods));
    
    setNewFoodName('');
    setNewFoodKcal('');
    setNewFoodProt('');
    setNewFoodCarb('');
    setNewFoodGord('');
    setNewFoodModalVisible(false);
    
    Alert.alert("Sucesso", `"${newFoodName}" adicionado(a) com sucesso!`);
  };

  const confirmarAdicao = () => {
    const numericGramas = parseFloat(gramas);
    if (isNaN(numericGramas) || numericGramas <= 0) {
      Alert.alert(
        "Erro",
        "Por favor, insira uma quantidade válida em gramas."
      );
      return;
    }

    const combinedTabela = { ...tabelaAlimentos, ...customFoods };
    const infoBase = combinedTabela[alimentoSelecionado];
    const fator = numericGramas / 100;

    const alimentoComGramas = {
      nome: alimentoSelecionado,
      gramas: numericGramas,
      kcal: parseFloat((infoBase.kcal * fator).toFixed(1)),
      prot: parseFloat((infoBase.prot * fator).toFixed(1)),
      carb: parseFloat((infoBase.carb * fator).toFixed(1)),
      gord: parseFloat((infoBase.gord * fator).toFixed(1)),
    };

    adicionarAlimento(refeicaoId, alimentoComGramas);
    saveRecente(alimentoSelecionado);
    setGramas("");
    setModalVisible(false);
    navigation.goBack();
  };

  const renderRightActions = (item) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Icon name="delete-forever-outline" size={24} color="#fff" />
        <Text style={styles.deleteButtonText}>Remover</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const combinedTabela = { ...tabelaAlimentos, ...customFoods };
    const info = combinedTabela[item];
    if (!info) return null;
    const isFavorito = favoritos.includes(item);
    
    const isDeletable = Object.keys(customFoods).includes(item) || favoritos.includes(item);

    return (
      <Swipeable
        renderRightActions={isDeletable ? () => renderRightActions(item) : null}
        rightThreshold={40}
      >
        <View style={styles.itemContainer}>
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
          <TouchableOpacity onPress={() => toggleFavorito(item)} style={styles.favoritoButton}>
            <Icon
              name={isFavorito ? "star" : "star-outline"}
              size={24}
              color={isFavorito ? "#FFD700" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  const getFilteredData = () => {
    const combinedKeys = [...new Set([...Object.keys(tabelaAlimentos), ...Object.keys(customFoods)])];
    
    if (viewMode === "recentes") {
      return recentes;
    }
    if (viewMode === "favoritos") {
      return favoritos;
    }
    return combinedKeys.filter((a) =>
      a.toLowerCase().includes(busca.toLowerCase())
    );
  };

  const filteredData = getFilteredData();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, viewMode === "buscar" && styles.activeTab]}
            onPress={() => setViewMode("buscar")}
          >
            <Text style={[styles.tabText, viewMode === "buscar" && styles.activeTabText]}>
              Buscar
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, viewMode === "recentes" && styles.activeTab]}
            onPress={() => setViewMode("recentes")}
          >
            <Text style={[styles.tabText, viewMode === "recentes" && styles.activeTabText]}>
              Recentes
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, viewMode === "favoritos" && styles.activeTab]}
            onPress={() => setViewMode("favoritos")}
          >
            <Text style={[styles.tabText, viewMode === "favoritos" && styles.activeTabText]}>
              Favoritos
            </Text>
          </Pressable>
        </View>

        {viewMode === "buscar" && (
          <TextInput
            style={styles.input}
            placeholder="Pesquisar alimento..."
            value={busca}
            onChangeText={setBusca}
          />
        )}

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {viewMode === "buscar" ? "Nenhum alimento encontrado." : `Nenhum alimento ${viewMode} encontrado.`}
            </Text>
          }
        />
        
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setNewFoodModalVisible(true)}
        >
          <Icon name="plus" size={30} color="#fff" />
        </TouchableOpacity>
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
      
      <Modal transparent={true} visible={newFoodModalVisible} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Adicionar Novo Alimento</Text>
              <Text style={styles.modalLabel}>Nome do Alimento</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Salada de Frutas"
                value={newFoodName}
                onChangeText={setNewFoodName}
              />
              <Text style={styles.modalLabel}>Valores por 100g</Text>
              <View style={styles.macrosContainer}>
                <TextInput
                  style={[styles.modalInput, styles.macroInput]}
                  keyboardType="numeric"
                  placeholder="Kcal"
                  value={newFoodKcal}
                  onChangeText={setNewFoodKcal}
                />
                <TextInput
                  style={[styles.modalInput, styles.macroInput]}
                  keyboardType="numeric"
                  placeholder="Prot"
                  value={newFoodProt}
                  onChangeText={setNewFoodProt}
                />
                <TextInput
                  style={[styles.modalInput, styles.macroInput]}
                  keyboardType="numeric"
                  placeholder="Carb"
                  value={newFoodCarb}
                  onChangeText={setNewFoodCarb}
                />
                <TextInput
                  style={[styles.modalInput, styles.macroInput]}
                  keyboardType="numeric"
                  placeholder="Gord"
                  value={newFoodGord}
                  onChangeText={setNewFoodGord}
                />
              </View>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.cancel]}
                  onPress={() => setNewFoodModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.confirm]}
                  onPress={addNewFood}
                >
                  <Text style={styles.buttonText}>Adicionar</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginTop: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  activeTabText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: '#fff',
  },
  item: {
    flex: 1,
    paddingVertical: 15,
    paddingRight: 10,
  },
  nome: { fontSize: 16, fontWeight: "bold" },
  macros: { fontSize: 14, color: "#555", marginTop: 3 },
  favoritoButton: {
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
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
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 10 
  },
  modalLabel: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#555', 
    marginTop: 10 
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalButtons: {
  flexDirection: "row",
  justifyContent: "space-between", //  'flex-end' p 'space-between'
  width: '100%', // Garanta que a view ocupe toda a largura
  marginTop: 20, // Adiciona um espaçamento acima dos botões
},
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  cancel: { backgroundColor: "#ccc" },
  confirm: { backgroundColor: "#4CAF50" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  macroInput: {
    width: '48%',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },
});