// src/screens/Login.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// ✅ setHasProfile é recebido como prop direta
export default function Login({ navigation, setHasProfile }) { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const docRef = doc(db, "users", user.uid, "profile", "data");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Usuário logado e com perfil existente.");
                // O App.js detectará o login e a existência do perfil
                // e navegará para a AppStack automaticamente.
            } else {
                console.log("Usuário logado, mas sem perfil. Redirecionando para cadastro de perfil.");
                // ✅ Passando userId e setHasProfile como prop para ProfileDataScreen
                navigation.replace("ProfileData", { userId: user.uid, setHasProfile: setHasProfile });
            }

        } catch (error) {
            let errorMessage = "Erro ao fazer login.";
            if (error.code === 'auth/invalid-email') {
                errorMessage = "Email inválido.";
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Email ou senha incorretos.";
            }
            Alert.alert("Erro", errorMessage);
            console.error("Erro de login:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Senha"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
            {/* ✅ Passando setHasProfile como prop na navegação */}
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro', { setHasProfile: setHasProfile })}> 
                <Text style={styles.linkText}>Não tem uma conta? Cadastre-se</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
    input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, borderRadius: 8 },
    button: { width: '100%', height: 50, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginBottom: 15 },
    buttonText: { color: 'white', fontSize: 18 },
    linkText: { color: '#4CAF50', marginTop: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});