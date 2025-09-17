// src/screens/LoadingScreen.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

export default function LoadingScreen({ navigation }) {
    useEffect(() => {
        const checkAuthAndProfile = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid, 'profile', 'data');
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        // Navega para as abas principais se o usuário tiver perfil
                        navigation.replace('MainTabs');
                    } else {
                        // Navega para o fluxo de cadastro de perfil se não tiver
                        navigation.replace('AuthStack');
                    }
                } catch (e) {
                    console.error('Erro ao carregar o perfil:', e);
                    navigation.replace('AuthStack');
                }
            } else {
                // Navega para o fluxo de autenticação se não houver usuário logado
                navigation.replace('AuthStack');
            }
        };

        const unsubscribe = onAuthStateChanged(auth, checkAuthAndProfile);
        return unsubscribe; // Limpa o listener
    }, [navigation]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#4CAF50" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});