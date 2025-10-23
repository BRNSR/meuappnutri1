// src/screens/Cadastro.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

// ✅ setHasProfile é recebido como prop direta
export default function Cadastro({ navigation, setHasProfile }) { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCadastro = async () => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // ✅ Passando userId e setHasProfile como prop para ProfileDataScreen
            navigation.replace("ProfileData", { userId: userCredential.user.uid, setHasProfile: setHasProfile });
        } catch (error) {
            let errorMessage = "Erro ao cadastrar.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Este email já está em uso.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Email inválido.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "A senha deve ter pelo menos 6 caracteres.";
            }
            Alert.alert("Erro", errorMessage);
            console.error("Erro de cadastro:", error);
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
            <Text style={styles.title}>Cadastro</Text>
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
            <TouchableOpacity style={styles.button} onPress={handleCadastro}>
                <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>
            {/* ✅ Passando setHasProfile como prop na navegação */}
            <TouchableOpacity onPress={() => navigation.navigate('Login', { setHasProfile: setHasProfile })}> 
                <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
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

    container: { 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffffff'   // 👈 fundo branco
    },
    
});