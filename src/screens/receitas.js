import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native'; // 👈 Importe o Alert
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'; // 👈 Importe os componentes de Gesture Handler

const receitasPadrao = [
  {
    id: '1',
    nome: 'Omelete com Queijo',
    kcal: 250,
    prot: 20,
    carb: 2,
    gord: 18,
    ingredientes: ['2 ovos', '50g de queijo', 'Sal e pimenta a gosto'],
    preparo: 'Bata os ovos, adicione o queijo e cozinhe em uma frigideira.',
  },
  {
    id: '2',
    nome: 'Salada de Frango com Abacate',
    kcal: 380,
    prot: 35,
    carb: 15,
    gord: 20,
    ingredientes: ['150g de peito de frango desfiado', '1/2 abacate', 'Folhas verdes', 'Tomate cereja'],
    preparo: 'Misture todos os ingredientes em uma tigela e tempere a gosto.',
  },
  {
    id: '3',
    nome: 'Shake de Proteína com Frutas',
    kcal: 220,
    prot: 25,
    carb: 28,
    gord: 3,
    ingredientes: ['1 scoop de whey protein', '1 banana', '200ml de leite vegetal', 'Morangos'],
    preparo: 'Bata todos os ingredientes no liquidificador até obter uma mistura homogênea.',
  },
];

const RECEITAS_KEY = '@receitas_usuario';

export default function Receitas({ navigation }) {
  const insets = useSafeAreaInsets();
  const [todasAsReceitas, setTodasAsReceitas] = useState(receitasPadrao);

  const carregarReceitasDoAsyncStorage = async () => {
    try {
      const receitasSalvas = await AsyncStorage.getItem(RECEITAS_KEY);
      const receitasUsuario = receitasSalvas ? JSON.parse(receitasSalvas) : [];
      setTodasAsReceitas([...receitasPadrao, ...receitasUsuario]);
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
    }
  };

  useEffect(() => {
    carregarReceitasDoAsyncStorage();
    const unsubscribe = navigation.addListener('focus', () => {
      carregarReceitasDoAsyncStorage();
    });
    return unsubscribe;
  }, [navigation]);

  // Função para deletar uma receita
  const handleDelete = async (id, nome) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja remover a receita "${nome}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          onPress: async () => {
            try {
              const receitasSalvas = await AsyncStorage.getItem(RECEITAS_KEY);
              const receitasExistentes = receitasSalvas ? JSON.parse(receitasSalvas) : [];
              
              // Filtra a lista para remover a receita com o ID correspondente
              const novaLista = receitasExistentes.filter(rec => rec.id !== id);
              
              // Salva a nova lista no AsyncStorage
              await AsyncStorage.setItem(RECEITAS_KEY, JSON.stringify(novaLista));
              
              // Atualiza o estado da tela para refletir a exclusão
              setTodasAsReceitas([...receitasPadrao, ...novaLista]);
              Alert.alert("Removido", `"${nome}" foi removido com sucesso.`);
            } catch (error) {
              console.error("Erro ao remover receita:", error);
              Alert.alert("Erro", "Não foi possível remover a receita.");
            }
          }
        }
      ]
    );
  };
  
  // Renderiza o botão de deletar ao arrastar
  const renderRightActions = (item) => {
    // Para evitar que receitas padrão sejam deletadas, você pode adicionar uma validação aqui
    const isDeletable = !receitasPadrao.some(rec => rec.id === item.id);
    
    if (!isDeletable) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.nome)}
      >
        <Icon name="delete-forever-outline" size={24} color="#fff" />
        <Text style={styles.deleteButtonText}>Remover</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ReceitaDetalhes', { receita: item })}
      >
        <View style={styles.content}>
          <Text style={styles.recipeName}>{item.nome}</Text>
          <Text style={styles.recipeMacros}>
            {item.kcal} kcal | {item.prot}g Prot | {item.carb}g Carb | {item.gord}g Gord
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <FlatList
          data={todasAsReceitas}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate('AdicionarReceita')}
        >
          <Icon name="plus" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  content: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recipeMacros: {
    fontSize: 14,
    color: '#666',
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
  // Estilos do botão de deletar
  deleteButton: {
    backgroundColor: '#e74c3c', // Vermelho
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
    borderRadius: 10,
    marginLeft: 5,
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },
});