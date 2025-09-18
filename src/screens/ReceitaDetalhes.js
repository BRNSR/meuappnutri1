import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ReceitaDetalhes({ route, navigation }) {
  const { receita } = route.params;
  
  // Agora a tela depende da barra de navegação fornecida pelo Stack.Navigator
  // O título será definido no arquivo de navegação (ex: App.js)
  // com base no nome da receita.

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macros e Calorias</Text>
          <Text style={styles.macrosText}>
            <Text style={styles.boldText}>Calorias:</Text> {receita.kcal} kcal
          </Text>
          <Text style={styles.macrosText}>
            <Text style={styles.boldText}>Proteínas:</Text> {receita.prot}g
          </Text>
          <Text style={styles.macrosText}>
            <Text style={styles.boldText}>Carboidratos:</Text> {receita.carb}g
          </Text>
          <Text style={styles.macrosText}>
            <Text style={styles.boldText}>Gorduras:</Text> {receita.gord}g
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredientes</Text>
          {receita.ingredientes.map((ingrediente, index) => (
            <Text key={index} style={styles.itemText}>- {ingrediente}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo de Preparo</Text>
          <Text style={styles.prepText}>{receita.preparo}</Text>
        </View>
      </ScrollView>

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  macrosText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  prepText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});
