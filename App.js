import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/services/firebaseConfig';
import { ActivityIndicator, View } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Login from './src/screens/Login';
import Cadastro from './src/screens/Cadastro';
import ProfileDataScreen from './src/screens/ProfileDataScreen';
import NivelAtividadeScreen from './src/screens/NivelAtividadeScreen';
import ObjetivoScreen from './src/screens/ObjetivoScreen';
import Home from './src/screens/Home';
import Dashboard from './src/screens/Dashboard';
import BuscaAlimento from './src/screens/BuscaAlimento';
import ProgressoScreen from './src/screens/ProgressoScreen';
import AddWeightScreen from './src/screens/AddWeightScreen';
import MaisMenu from './src/components/MaisMenu';
import Receitas from './src/screens/receitas';
import ReceitaDetalhes from './src/screens/ReceitaDetalhes';
import AdicionarReceita from './src/screens/AdicionarReceita';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack para a aba Dashboard e suas telas aninhadas
function DashboardStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="DashboardMain" 
                component={Dashboard}
                options={({ navigation }) => ({
                    headerShown: true, 
                    headerTitle: "Dashboard",
                    headerRight: () => <MaisMenu navigation={navigation} />,
                    headerStyle: {
                        backgroundColor: '#4CAF50',
                    },
                    headerTintColor: '#fff',
                })}
            />
            <Stack.Screen name="AddWeight" component={AddWeightScreen} />
            <Stack.Screen name="BuscaAlimento" component={BuscaAlimento} />
            <Stack.Screen name="ProfileData" component={ProfileDataScreen} />
            <Stack.Screen name="Objetivo" component={ObjetivoScreen} />
            <Stack.Screen name="NivelAtividade" component={NivelAtividadeScreen} />
        </Stack.Navigator>
    );
}

// Stack para a aba Progresso e suas telas aninhadas
function ProgressoStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProgressoMain" component={ProgressoScreen} />
        </Stack.Navigator>
    );
}

// Stack para a aba Diário e suas telas aninhadas
function DiarioStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DiarioMain" component={Home} />
            <Stack.Screen name="BuscaAlimento" component={BuscaAlimento} />
        </Stack.Navigator>
    );
}

// Stack para a aba Receitas e suas telas aninhadas
function ReceitasStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ReceitasMain" component={Receitas} />
            <Stack.Screen name="ReceitaDetalhes" component={ReceitaDetalhes} />
            <Stack.Screen name="AdicionarReceita" component={AdicionarReceita} options={{ headerShown: true, headerTitle: 'Adicionar Receita', headerStyle: { backgroundColor: '#4CAF50' }, headerTintColor: '#fff' }} />
        </Stack.Navigator>
    );
}


function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let IconComponent;

                    if (route.name === 'Diário') {
                        IconComponent = Icon;
                        iconName = focused ? 'food-apple' : 'food-apple-outline';
                    } else if (route.name === 'Progresso') {
                        IconComponent = Ionicons;
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Receitas') {
                        IconComponent = Icon;
                        iconName = focused ? 'chef-hat' : 'chef-hat';
                    } else if (route.name === 'Dashboard') {
                        IconComponent = Ionicons;
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    }

                    return <IconComponent name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Diário" component={DiarioStack} />
            <Tab.Screen name="Progresso" component={ProgressoStack} />
            <Tab.Screen name="Receitas" component={ReceitasStack} />
            <Tab.Screen name="Dashboard" component={DashboardStack} />
        </Tab.Navigator>
    );
}

function AuthStack({ setHasProfile }) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
                {(props) => <Login {...props} setHasProfile={setHasProfile} />}
            </Stack.Screen>
            <Stack.Screen name="Cadastro">
                {(props) => <Cadastro {...props} setHasProfile={setHasProfile} />}
            </Stack.Screen>
            <Stack.Screen name="ProfileData">
                {(props) => <ProfileDataScreen {...props} setHasProfile={setHasProfile} />}
            </Stack.Screen>
            <Stack.Screen name="NivelAtividade">
                {(props) => <NivelAtividadeScreen {...props} setHasProfile={setHasProfile} />}
            </Stack.Screen>
            <Stack.Screen name="Objetivo">
                {(props) => <ObjetivoScreen {...props} setHasProfile={setHasProfile} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

export default function App() {
    const [user, setUser] = useState(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const subscriber = onAuthStateChanged(auth, async (authUser) => {
            setUser(authUser);
            if (authUser) {
                try {
                    const docRef = doc(db, "users", authUser.uid, "profile", "data");
                    const docSnap = await getDoc(docRef);
                    setHasProfile(docSnap.exists());
                } catch (e) {
                    console.error("Erro ao carregar o perfil:", e);
                    setHasProfile(false);
                }
            } else {
                setHasProfile(false);
            }
            setLoading(false);
        });
        return subscriber;
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                hasProfile ? <MainTabs /> : <AuthStack setHasProfile={setHasProfile} />
            ) : (
                <AuthStack setHasProfile={setHasProfile} />
            )}
        </NavigationContainer>
    );
}