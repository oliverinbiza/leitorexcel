import React, { useState } from 'react';
// Importamos FlatList para listas eficientes
import { Button, Text, View, StyleSheet, Alert, FlatList, SafeAreaView, TouchableOpacity, Modal} from 'react-native';

import * as XLSX from 'xlsx';
// Mantendo o import legacy que funcionou para você
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';



export default function App() {
  // 0 = parado. 0.1 a 1.0 = carregando.
  const [progress, setProgress] = useState(0);
  const [jsonData, setJsonData] = useState<any[]>([]);

  const confirmImport = () => {
    Alert.alert(
      "Importar Lista", // Título
      "Importe o arquivo da lista de demandas para iniciar o seu inventário", // Mensagem
      [
        {
          text: "Cancelar",
          style: "cancel" // Botão que fecha sem fazer nada
        },
        {
          text: "Carregar Arquivo", 
          onPress: () => handleFile() // <--- AQUI é onde a mágica acontece
        }
      ]
    );
  };



  const handleFile = async () => {
    try {
      // ETAPA 1: Iniciando (10%)
      setProgress(0.1);

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*'
      });

      if (result.canceled) {
        setProgress(0); // Cancelou? Zera a barra
        return;
      }

      // ETAPA 2: Arquivo Selecionado -> Lendo Base64 (30%)
      setProgress(0.3);
      
      // Pequena pausa para a barra atualizar visualmente na tela
      await new Promise(resolve => setTimeout(resolve, 100));

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: "base64"
      });

      // ETAPA 3: Leu o arquivo -> Vai processar o Excel (60%)
      setProgress(0.6);
      await new Promise(resolve => setTimeout(resolve, 100)); // Pausa para renderizar

      const workbook = XLSX.read(fileContent, { type: "base64" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // ETAPA 4: Converteu Excel -> Vai salvar no Estado (80%)
      setProgress(0.8);
      await new Promise(resolve => setTimeout(resolve, 50));

      const data: any[] = XLSX.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        Alert.alert("Aviso", "Planilha vazia.");
      } else {
        setJsonData(data);
      }

      // SUCESSO TOTAL (100%)
      setProgress(1);
      
      // Espera meio segundo com a barra cheia antes de sumir
      setTimeout(() => setProgress(0), 500);

    } catch (err) {
      console.log("Erro:", err);
      Alert.alert("Erro", "Falha ao ler o arquivo.");
      setProgress(0); // Deu erro? Zera a barra
    }
  };

  // Função que desenha cada "Cartão" da lista
  const renderItem = ({ item, index }: { item: any, index: number }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.index}>#{index + 1}</Text>
          <Text style={styles.tombamento}>Tomb: {item['Tombamento'] || 'N/A'}</Text>
        </View>
        
        <Text style={styles.label}>Denominação:</Text>
        <Text style={styles.value}>{item['Denominação'] || item['Denominacao'] || '-'}</Text>

        <View style={styles.row}>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Grupo:</Text>
            <Text style={styles.value}>{item['Grupo'] || '-'}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Valor:</Text>
            <Text style={styles.money}>
               {item['Valor (R$)'] ? `R$ ${item['Valor (R$)']}` : '-'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.status}>{item['Estado'] || ''}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventário</Text>
        <TouchableOpacity style={styles.button} onPress={confirmImport}>
        <Text style={styles.buttonText}>
    {jsonData.length > 0 ? "Trocar Arquivo" : "Importar Lista"}
  </Text>
</TouchableOpacity>
      </View>

      

      {jsonData.length > 0 ? (
        <FlatList
          data={jsonData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.placeholder}>Selecione uma planilha para começar</Text>
        </View>
      )}
{/* BLOCO DE LOADING NOVO */}
      {progress > 0 && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>
              Carregando... {Math.round(progress * 100)}%
            </Text>
            
            {/* O TRILHO DA BARRA (CINZA) */}
            <View style={styles.progressBarTrack}>
              {/* A BARRA QUE CRESCE (AZUL) */}
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progress * 100}%` } // Aqui está a mágica
                ]} 
              />
            </View>
          </View>
        </View>
      )}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign:'center' },

button: {
    backgroundColor: '#3A6F78', // <--- MUDE A COR DE FUNDO AQUI
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 0, // <--- ARREDONDAMENTO DAS BORDAS (25 deixa oval)
    marginTop: 10,
    elevation: 3, // Sombra no Android
  },
  
  // O TEXTO DENTRO DO BOTÃO
  buttonText: {
    color: '#fff', // <--- MUDE A COR DO TEXTO AQUI
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign:'center'
  },

  
  list: { padding: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { color: '#999', fontSize: 16 },

  // Estilos do Cartão
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 3, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  index: { color: '#999', fontSize: 12 },
  tombamento: { fontWeight: 'bold', color: '#007AFF' },
  
  label: { fontSize: 10, color: '#666', marginTop: 5, textTransform: 'uppercase' },
  value: { fontSize: 14, color: '#333', fontWeight: '500' },
  money: { fontSize: 14, color: '#27ae60', fontWeight: 'bold' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  status: { marginTop: 10, fontSize: 10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#eee', borderRadius: 4, color: '#555' },

  loadingOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escurecido
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    width: '80%', // A caixa ocupa 80% da largura da tela
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5
  },
  loadingText: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  
  // Estilo do "Trilho" (Fundo cinza)
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden' // Garante que a barra azul não "vaze" nas pontas
  },
  
  // Estilo do "Enchimento" (Barra Azul)
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF', // Azul bonito
    borderRadius: 5
  }
});