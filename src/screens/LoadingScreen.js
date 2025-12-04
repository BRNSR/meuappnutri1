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
                        // aqui navega para as abas principais se o usuário ja tiver perfil
                        navigation.replace('MainTabs');
                    } else {
                        // navega para o fluxo de cadastro de perfil se não tiver
                        navigation.replace('AuthStack');
                    }
                } catch (e) {
                    console.error('Erro ao carregar o perfil:', e);
                    navigation.replace('AuthStack');
                }
            } else {
                // navega para o fluxo de autenticacao se não houver usuário logado
                navigation.replace('AuthStack');
            }
        };

        const unsubscribe = onAuthStateChanged(auth, checkAuthAndProfile);
        return unsubscribe; // limpa o listener
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