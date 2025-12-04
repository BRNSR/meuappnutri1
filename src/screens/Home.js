
// componentes widgets react native
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";

// IMPORTAÇÕES DO FIREBASE FORAM REMOVIDAS, EXCETO AUTH
// import { doc, onSnapshot, setDoc } from "firebase/firestore";
// auth para pegar o UID

import { auth } from "../services/firebaseConfig";
import { 
    subscribeToProfile, 
    subscribeToDailyLog, 
    saveDailyLog 
} from "../services/firestoreService"; 

// ajusta o layout para o celular
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// grafico circular do controle nutricional
import { AnimatedCircularProgress } from 'react-native-circular-progress';

// formatar datas, avan;ar e voltar dias, idioma
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// icones deletar e do adicionar
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 

// refei;oes do dia
const refeicoesIniciais = [
    { id: "cafe", nome: "Café da Manhã", alimentos: [] },
    { id: "almoco", nome: "Almoço", alimentos: [] },
    { id: "lanche", nome: "Lanche", alimentos: [] },
    { id: "jantar", nome: "Jantar", alimentos: [] },
];

// nucleo funcional da tela
// utilizando use State salvando t udo no firebase
export default function Home({ navigation }) {
    // ajusta a margen superior da tela, evitando texto atras de camera etc
    const insets = useSafeAreaInsets(); 

    const [dataAtual, setDataAtual] = useState(new Date()); 
    const [refeicoes, setRefeicoes] = useState(refeicoesIniciais);
    const [loading, setLoading] = useState(true);
    const [metaCalorica, setMetaCalorica] = useState(0);
    const userId = auth.currentUser?.uid;

    // -----------------------------------------------------------------------------------------------------
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // meta calorica alterando em tempo real no firestore
        const unsubPerfil = subscribeToProfile(userId, (docSnap) => {
            if (docSnap && docSnap.exists() && docSnap.data().metaCalorica) {
                //callback do docSnap ao alterar
                setMetaCalorica(docSnap.data().metaCalorica);
            } else {
                setMetaCalorica(0);
            }
        });
        // formata a data 
        const dataString = format(dataAtual, "yyyy-MM-dd");

        // cria um listener no firestore
        const unsubscribe = subscribeToDailyLog(userId, dataString, (docSnap) => {
            if (docSnap) { 
                // pega as refei;oes
                 if (docSnap.exists()) {
                    const dadosSalvos = docSnap.data().refeicoes;
                    setRefeicoes(dadosSalvos);
                } else {
                    // Se nao existir ira criar automaticamente
                    saveDailyLog(userId, dataString, {
                        refeicoes: refeicoesIniciais,
                        totais: { kcal: 0, prot: 0, carb: 0, gord: 0 },
                    });
                    setRefeicoes(refeicoesIniciais);
                    // ***evita error de documento inexistente.
                }
            }
            setLoading(false); // tira o loading
        });

        // Cleanup  para cancelar os listeners
        return () => {
            unsubscribe();
            unsubPerfil();
        };
        // *** evita gasto descenessario de memorias, callbacks duplicados etc.

    }, [userId, dataAtual]); // executa o useeffect sempre que o id e data mudar e atualiza.
    // -----------------------------------------------------------------------------------------------------

    // faz um .map em todas as refei;oes, padrão do react.
    // *** criando um novo array
    const adicionarAlimento = (refeicaoId, alimento) => {
        const novasRefeicoes = refeicoes.map((r) =>
            // ao encontrar, copia tudo com ...r
            r.id === refeicaoId ? { ...r, alimentos: [...r.alimentos, alimento] } : r
        );
        // envia para o firestore
        salvarRefeicoes(novasRefeicoes);
    };

    // mesma coisa, recebe o id e o alimento
    const removerAlimento = (refeicaoId, alimentoIndex) => {
        const novasRefeicoes = refeicoes.map((r) =>
            r.id === refeicaoId
                ? {
                    ...r,
                    // .filter para remover alimento pelo index
                    alimentos: r.alimentos.filter((_, index) => index !== alimentoIndex),
                }
                : r
        );
        // chama salvarrefeiçoes para gravar no firestore
        salvarRefeicoes(novasRefeicoes);
    };

    // Função para salvar no Firestore (usa saveDailyLog do firestoreService)
    const salvarRefeicoes = async (novasRefeicoes) => {
        // sair caso nao tenha usuario logado.
        if (!userId) return;
        const dataString = format(dataAtual, "yyyy-MM-dd");

        // juntar todos os alimentos do dia.
        // flatMap pega todos os id e transforma em uma lista
        const todosOsAlimentos = novasRefeicoes.flatMap(refeicao => refeicao.alimentos);
        
        // reduce pega tudo e transforma em calorias, prot, gord e carb
        const totais = todosOsAlimentos.reduce(
            (acc, a) => ({
                kcal: acc.kcal + parseFloat(a.kcal),
                prot: acc.prot + parseFloat(a.prot),
                carb: acc.carb + parseFloat(a.carb),
                gord: acc.gord + parseFloat(a.gord),
            }),
            { kcal: 0, prot: 0, carb: 0, gord: 0 }
        );
        // monta o objeto que vai para o firestore
        const dataToSave = { refeicoes: novasRefeicoes, totais };

        try {

            // ***Encontra o caminho do documento, escreve e substitui.
            await saveDailyLog(userId, dataString, dataToSave); 

            // caso usuario esteja sem internet, impede do app de crashar.
        } catch (e) {
            console.error("Erro ao salvar dados: ", e);
            Alert.alert("Erro", "Não foi possível salvar os dados. Tente novamente.");
        }
    };

    // recebe o array alimentos e devolve um objeto com kcal prot carb gord
    const calcularTotais = (alimentos) => {
        // utilizando reduce, bom para acumular dados
        return alimentos.reduce(
            // utiliza o parseFloat para evitar erros como 200 + 50 = 20050, pois valores vieram como string do firestore
            (totais, a) => ({
                kcal: totais.kcal + parseFloat(a.kcal),
                prot: totais.prot + parseFloat(a.prot),
                carb: totais.carb + parseFloat(a.carb),
                gord: totais.gord + parseFloat(a.gord),
            }),
            { kcal: 0, prot: 0, carb: 0, gord: 0 }
        );
    };

    // avançar e voltar data
    // biblioteca date-fns
    // sempre que dataAtual mudar o useEffect é disparado automaticamente.
    const handleDiaAnterior = () => {
        setDataAtual(subDays(dataAtual, 1));
    };
    const handleProximoDia = () => {
        setDataAtual(addDays(dataAtual, 1));
    };

    // pega todas as refeiçoes e soma tudo
    const totaisDoDia = calcularTotais(refeicoes.flatMap((r) => r.alimentos));
    
    // meta kcal de acordo com a meta do usuario.
    const caloriasTotais = totaisDoDia.kcal;
    const caloriasRestantes = metaCalorica - caloriasTotais;
    
    // grafico em circulo
    const fillPercentage = metaCalorica > 0 ? (caloriasTotais / metaCalorica) * 100 : 0;
    const progressFill = Math.min(fillPercentage, 100);

    // grafico em circulo = muda a cor se ultrapassar a meta
    const progressColor = caloriasTotais > metaCalorica ? "#E74C3C" : "#4CAF50";



    // antes de mostrar a tela verifica se esta carregando dados do firestore, se for sim nao rederiza o restante da tela
    if (loading) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
            </View>
        );
    }

    // renderiza toda a interface 
    // insets.top ajusta automaticamente espaços para celulares
    return (
        <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={[
                styles.container, 
                { paddingTop: insets.top + -10 } 
            ]}
        >
            {/* Parte de trocar os dias */}
            <View style={styles.dateSelectorContainer}>
                <TouchableOpacity onPress={handleDiaAnterior}>
                    <Ionicons name="chevron-back" size={30} color="#333" />
                </TouchableOpacity>
                <Text style={styles.dateText}>
                    {format(dataAtual, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Text>
                <TouchableOpacity onPress={handleProximoDia}>
                    <Ionicons name="chevron-forward" size={30} color="#333" />
                </TouchableOpacity>
            </View>
            
            {/* grafico animado das kcal gord prot gord */}
            <View style={styles.card}>
                <AnimatedCircularProgress
                    size={180}
                    width={10}
                    fill={progressFill}
                    tintColor={progressColor}
                    backgroundColor="#D3D3D3"
                    lineCap="round"
                    style={styles.kcalChart}
                >
                    {
                        (fill) => (
                            <View style={styles.kcalTextContainer}>
                                <Text style={styles.kcalCount}>{caloriasTotais.toFixed(0)}</Text>
                                <Text style={styles.kcalLabel}>kcal</Text>
                            </View>
                        )
                    }
                </AnimatedCircularProgress>

                {/* resumo das metas caloricas restantes */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Meta</Text>
                        <Text style={styles.summaryValue}>{metaCalorica.toFixed(0)} kcal</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Restantes</Text>
                        <Text style={styles.summaryValue}>{Math.max(0, caloriasRestantes).toFixed(0)} kcal</Text>
                    </View>
                </View>

                <View style={styles.separator}></View>
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: "#2ecc71" }]} />
                        <Text style={styles.legendTitle}>Proteínas</Text>
                        <Text style={styles.legendValue}>{totaisDoDia.prot.toFixed(0)}g</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: "#3498db" }]} />
                        <Text style={styles.legendTitle}>Carboidratos</Text>
                        <Text style={styles.legendValue}>{totaisDoDia.carb.toFixed(0)}g</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: "#e67e22" }]} />
                        <Text style={styles.legendTitle}>Gorduras</Text>
                        <Text style={styles.legendValue}>{totaisDoDia.gord.toFixed(0)}g</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={refeicoes}
                //keyextractor gera uma key para cada item da lista
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false} // evita que a rolagem interna do flatlist funcione, funcionando apenas o ScrollView .
                renderItem={({ item }) => { //função para cada item
                    const totais = calcularTotais(item.alimentos);
                    return (
                        <View style={styles.mealCard}>
                            <View style={styles.refeicaoHeader}>
                                <Text style={styles.refeicaoTitulo}>{item.nome}</Text>
                                <TouchableOpacity
                                    style={styles.addMealButton}
                                    onPress={() =>
                                        navigation.navigate("BuscaAlimento", {
                                            refeicaoId: item.id,
                                            adicionarAlimento,
                                        })
                                    }
                                >
                                    <Ionicons name="add-circle" size={30} color="#4CAF50" />
                                </TouchableOpacity>
                            </View>
                            {item.alimentos.map((alimento, index) => (
                                <View key={index} style={styles.alimentoLinha}>
                                    <View>
                                        <Text style={styles.nome}>
                                            {alimento.nome} ({alimento.gramas.toFixed(0)}g)
                                        </Text>
                                        <Text style={styles.macros}>
                                            {parseFloat(alimento.kcal).toFixed(1)} kcal | {parseFloat(alimento.prot).toFixed(1)}g prot | {parseFloat(alimento.carb).toFixed(1)}g carb | {parseFloat(alimento.gord).toFixed(1)}g gord
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removerAlimento(item.id, index)}
                                        style={styles.removeButton}
                                    >
                                        <MaterialCommunityIcons name="delete-forever" size={24} color="#E74C3C" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {item.alimentos.length > 0 && (
                                <Text style={styles.totais}>
                                    Total: {totais.kcal.toFixed(1)} kcal |{" "}
                                    {totais.prot.toFixed(1)}g prot | {totais.carb.toFixed(1)}g carb |{" "}
                                    {totais.gord.toFixed(1)}g gord
                                </Text>
                            )}
                        </View>
                    );
                }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        backgroundColor: "#f0f4f7",
        padding: 15,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    dateSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    dateText: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
    },

    // ------------------------------------------------------------------------

    card: {
        backgroundColor: "#fff",
        borderRadius: 16, 
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, 
        shadowRadius: 8, 
        elevation: 5,
        alignItems: "center",
    },
    // ------------------------------------------------------------------------
    kcalChart: {
        marginBottom: 15,
    },
    kcalTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    kcalCount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    kcalLabel: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    // ------------------------------------------------------------------------
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        width: '100%',
    },
    summaryItem: {
        alignItems: "center",
        paddingHorizontal: 10,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    // ------------------------------------------------------------------------
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#ccc',
        width: '80%',
        marginVertical: 15,
    },
    // ------------------------------------------------------------------------
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        width: '100%',
    },
    legendItem: {
        alignItems: 'center',
    },
    legendColor: {
        width: 15,
        height: 15,
        borderRadius: 7.5,
        marginBottom: 5,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    legendValue: {
        fontSize: 14,
        color: '#666',
    },
    // ------------------------------------------------------------------------
    mealCard: {
        backgroundColor: "#fff",
        borderRadius: 16, 
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, 
        shadowRadius: 8, 
        elevation: 5,
    },
    refeicaoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    refeicaoTitulo: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4CAF50",
    },
    addMealButton: {
        padding: 5,
    },
    // ------------------------------------------------------------------------
    alimentoLinha: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 5,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#ccc",
    },
    nome: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    macros: {
        fontSize: 14,
        color: "#666",
    },
    removeButton: {
        padding: 5,
    },
    totais: {
        marginTop: 15,
        fontWeight: "bold",
        color: "#222",
    },
    // ------------------------------------------------------------------------
});