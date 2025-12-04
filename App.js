import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/services/firebaseConfig';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// icones
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// telas
import Login from './src/screens/Login';
import Cadastro from './src/screens/Cadastro';
import ProfileDataScreen from './src/screens/ProfileDataScreen';
import NivelAtividadeScreen from './src/screens/NivelAtividadeScreen';
import ObjetivoScreen from './src/screens/ObjetivoScreen';
import Home from './src/screens/Home';
import Dashboard from './src/screens/Dashboard';
import BuscaAlimento from './src/screens/BuscaAlimento';
import ProgressoScreen from './src/screens/ProgressoScreen';
import AddWeightScreen from './src/screens/AdicionarPeso';
import MaisMenu from './src/components/MaisMenu';
import Receitas from './src/screens/Receitas';
import ReceitaDetalhes from './src/screens/ReceitaDetalhes';
import AdicionarReceita from './src/screens/AdicionarReceita';
import ExerciciosScreen from './src/screens/ExerciciosScreen'; 
import AdicionarExercicio from './src/screens/AdicionarExercicio';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// parte das abas para navegação 

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
            <Stack.Screen 
                name="AddWeight" 
                component={AddWeightScreen} 
                options={{ 
                    title: 'Adicionar Peso',
                    headerBackTitle: 'Dashboard',
                    headerStyle: { backgroundColor: '#4CAF50' },
                    headerTintColor: '#fff',
                }} 
            />
            <Stack.Screen 
                name="BuscaAlimento" 
                component={BuscaAlimento} 
                options={{
                    headerShown: true,
                    headerTitle: "Buscar Alimento",
                    headerBackTitle: 'Voltar',
                    headerStyle: { backgroundColor: '#4CAF50' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen 
                name="ProfileData" 
                component={ProfileDataScreen} 
                options={{ headerTitle: 'Dados do Perfil' }}
            />

                

            <Stack.Screen 
                name="Objetivo" 
                component={ObjetivoScreen} 
                options={{ headerTitle: 'Meu Objetivo' }}
            />
            <Stack.Screen 
                name="NivelAtividade" 
                component={NivelAtividadeScreen} 
                options={{ headerTitle: 'Nível de Atividade' }}
            />
        </Stack.Navigator>
    );
}

function ProgressoStack() {
    return (
        <Stack.Navigator screenOptions={{ 
            headerStyle: { backgroundColor: '#4CAF50' }, 
            headerTintColor: '#fff',
            headerBackTitle: 'Voltar',
        }}>
            <Stack.Screen 
                name="ProgressoMain" 
                component={ProgressoScreen} 
                options={{ headerTitle: "Progresso" }}
            />
        </Stack.Navigator>
    );
}

function ExerciciosStack() {
    return (
        <Stack.Navigator screenOptions={{ 
            headerStyle: { backgroundColor: '#4CAF50' }, 
            headerTintColor: '#fff',
            headerBackTitle: 'Voltar',
        }}>
            <Stack.Screen 
                name="ExerciciosMain" 
                component={ExerciciosScreen} 
                options={{ headerTitle: "Exercícios" }}
            />
            <Stack.Screen 
                name="AdicionarExercicio" 
                component={AdicionarExercicio} 
                options={{ 
                    headerTitle: "Adicionar Exercício",
                    headerStyle: { backgroundColor: '#4CAF50' }, 
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

function DiarioStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            
            <Stack.Screen 
                name="DiarioMain" 
                component={Home} 
                options={{ 
                    headerShown: true, 
                    headerTitle: "Diário",
                    headerStyle: { backgroundColor: '#4CAF50' },
                    headerTintColor: '#fff',
                }}
            />            
            
            <Stack.Screen 
                name="BuscaAlimento" 
                component={BuscaAlimento} 
                options={{
                    headerShown: true,
                    headerTitle: "Buscar Alimento",
                    headerBackTitle: 'Voltar',
                    headerStyle: { backgroundColor: '#4CAF50' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

function ReceitasStack() {
    return (
        <Stack.Navigator 
            screenOptions={{ 
                headerStyle: { backgroundColor: '#4CAF50' },
                headerTintColor: '#fff',
                headerBackTitle: 'Voltar',
            }}
        >
            <Stack.Screen 
                name="ReceitasMain" 
                component={Receitas} 
                options={{ 
                    headerShown: true,
                    headerTitle: "Receitas",
                }}
            />
            <Stack.Screen 
                name="ReceitaDetalhes" 
                component={ReceitaDetalhes} 
                options={({ route }) => ({
                    headerShown: true,
                    headerTitle: route.params?.receita?.nome || 'Detalhes da Receita',
                })}
            />
            <Stack.Screen 
                name="AdicionarReceita" 
                component={AdicionarReceita} 
                options={{ 
                    headerShown: true, 
                    headerTitle: 'Nova Receita', 
                }} 
            />
        </Stack.Navigator>
    );
}


// navegação Principal por Abas (MainTabs)

function MainTabs() {
    return (
        <Tab.Navigator
        initialRouteName="Diário"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let IconComponent;

                    if (route.name === 'Diário') {
                        IconComponent = Icon; // MaterialCommunityIcons
                        iconName = focused ? 'food-apple' : 'food-apple-outline'; 

                        // Botão Flutuante (FAB) de Destaque Ajustado
                        return (
                            <View style={styles.fabContainerDestacado}>
                                <IconComponent 
                                    name={iconName} 
                                    size={30} // Tamanho fixo ligeiramente maior
                                    color="#fff" // Ícone branco
                                />
                            </View>
                        );
                    } else if (route.name === 'Progresso') {
                        IconComponent = Ionicons;
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Exercícios') {
                        IconComponent = Ionicons;
                        iconName = focused ? 'barbell' : 'barbell-outline';
                    } else if (route.name === 'Receitas') {
                        IconComponent = Icon; // MaterialCommunityIcons
                        iconName = focused ? 'chef-hat' : 'chef-hat';
                    } else if (route.name === 'Dashboard') {
                        IconComponent = Ionicons;
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    }

                    // Renderiza os ícones normais
                    return <IconComponent name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: styles.tabBarComDestaque, // Usando o novo estilo de barra
                tabBarLabelStyle: styles.tabBarLabel,
            })}
        >
            
            <Tab.Screen name="Receitas" component={ReceitasStack} /> 
            <Tab.Screen name="Exercícios" component={ExerciciosStack} /> 
            <Tab.Screen 
                name="Diário" 
                component={DiarioStack} 
                options={{
                    tabBarLabel: '', // remove o texto para o FAB
                }}
            />
            <Tab.Screen name="Progresso" component={ProgressoStack} />
            <Tab.Screen name="Dashboard" component={DashboardStack} />
        </Tab.Navigator>
    );
}

// Pilha de Autenticação (AuthStack) ---

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

// componente Principal (App)

export default function App() {
    const [user, setUser] = useState(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const subscriber = onAuthStateChanged(auth, async (authUser) => {
            setUser(authUser);
            if (authUser) {
                try {
                    // Verifica se o documento de perfil existe
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
            <View style={styles.loadingContainer}>
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

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
    },

    tabBarComDestaque: {
        height: 80, // Ligeiramente mais alta para acomodar o botão
        paddingTop: 5, 
        paddingBottom: 15, 
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    tabBarLabel: {
        fontSize: 12,
        marginBottom: 5,
    },

    // diario circular

    fabContainerDestacado: {
        backgroundColor: '#4CAF50', // Cor de destaque (verde)
        borderRadius: 35, // Formato circular
        padding: 15,
        top: -5, // Eleva para fora da barra, mas não muito
        
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        
        // Garante o tamanho fixo (60x60) e centraliza o conteúdo
        width: 60, 
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
});