// src/components/MaisMenu.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../services/firebaseConfig';
import { signOut } from 'firebase/auth';

const { width } = Dimensions.get('window');

export default function MaisMenu({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);

    const handleLogout = async () => {
        setModalVisible(false);
        try {
            await signOut(auth);
            // ✅ A navegação que funciona com a sua estrutura atual
            navigation.replace('Login');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            Alert.alert("Erro", "Não foi possível sair. Tente novamente.");
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(false)}
                >
                    <View style={styles.modalView}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                            <Text style={styles.menuText}>Sair</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            setModalVisible(false);
                            Alert.alert('Funcionalidade', 'em breve!');
                        }}>
                            <Text style={styles.menuText}>Configurações</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginRight: 15,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'flex-end',
        paddingTop: 80,
        paddingRight: 10,
    },
    modalView: {
        backgroundColor: "white",
        borderRadius: 8,
        padding: 10,
        width: width * 0.4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    menuItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    menuText: {
        fontSize: 16,
    },
});