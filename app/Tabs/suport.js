import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  Image, 
  FlatList, 
  Platform 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TextTitle from "../../components/TextTitle";
import { Picker } from '@react-native-picker/picker'; // Dropdown

export default function Support() {
  const [name, setName] = useState("");
  const [type, setType] = useState(""); // Comentario, Error o Sugerencia
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("Todos"); // Filtro: Todos, Comentario, Error, Sugerencia

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("supportHistory");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  };

  const saveHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem("supportHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error guardando historial:", error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const sendFeedback = () => {
    if (!type || !message) {
      alert("Por favor selecciona tipo de mensaje y escribe tu mensaje.");
      return;
    }

    setLoading(true);

    const newMessage = {
      id: Date.now().toString(),
      name,
      type,
      message,
      image,
      date: new Date().toLocaleString(),
    };

    const newHistory = [newMessage, ...history];
    setHistory(newHistory);
    saveHistory(newHistory);

    setTimeout(() => {
      alert("¡Mensaje enviado correctamente!");
      setName("");
      setType("");
      setMessage("");
      setImage(null);
      setLoading(false);
    }, 1000);
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyDate}>{item.date}</Text>
      {item.name ? <Text style={styles.historyName}>De: {item.name}</Text> : null}
      <Text style={styles.historyType}>Tipo: {item.type}</Text>
      <Text style={styles.historyMessage}>{item.message}</Text>
      {item.image && <Image source={{ uri: item.image }} style={styles.historyImage} />}
    </View>
  );

  // Filtrar historial según el filtro seleccionado
  const filteredHistory = history.filter(item => 
    filter === "Todos" ? true : item.type === filter
  );

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextTitle style={styles.title}>Soporte</TextTitle>
        <Text style={styles.desc}>
          ¿Quieres ayudarnos a mejorar tu experiencia? 🛠️✨
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Tu nombre (opcional)"
          value={name}
          onChangeText={setName}
        />

        {/* Selector tipo dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Selecciona tipo de mensaje..." value="" />
            <Picker.Item label="Comentario" value="Comentario" />
            <Picker.Item label="Error" value="Error" />
            <Picker.Item label="Sugerencia" value="Sugerencia" />
          </Picker>
        </View>

        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Escribe tu mensaje..."
          multiline
          value={message}
          onChangeText={setMessage}
        />

        <Pressable style={styles.attachBtn} onPress={pickImage}>
          <Text style={styles.attachText}>📎 Adjuntar captura</Text>
        </Pressable>

        {image && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image }} style={styles.preview} />
            <Pressable onPress={() => setImage(null)}>
              <Text style={styles.removeImg}>❌</Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color="#007AFF" size="small" style={{ marginTop: 10 }} />
        ) : (
          <Pressable style={styles.button} onPress={sendFeedback}>
            <Text style={styles.buttonText}>Enviar</Text>
          </Pressable>
        )}
      </View>

      {/* Historial de mensajes con scroll */}
      {history.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Historial de mensajes</Text>

          <View style={styles.filterContainer}>
            {["Todos","Comentario","Error","Sugerencia"].map(f => (
              <Pressable
                key={f}
                style={[
                  styles.filterBtn,
                  filter === f && styles.filterBtnActive
                ]}
                onPress={() => setFilter(f)}
              >
                <Text style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive
                ]}>{f}</Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={filteredHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ maxHeight: 300 }} // Máximo alto, se puede scrollear
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    width:'100%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    alignItems: "center",
  },
  form:{
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom:20,
    ...Platform.select({
      ios:{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
      android:{ elevation: 4 }
    })
  },
  title:{
    fontSize:26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#007AFF"
  },
  desc:{
    fontSize:14,
    textAlign:"center",
    marginBottom:18,
    color:"#333",
    paddingHorizontal:8
  },
  input:{
    width:'100%',
    borderWidth:1.5,
    borderColor:'#e0e0e0',
    borderRadius:8,
    paddingHorizontal:16,
    paddingVertical:10,
    fontSize:16,
    marginBottom:12,
    backgroundColor:'#fafafa'
  },
  textarea:{
    height:100,
    textAlignVertical:'top'
  },
  pickerContainer:{
    width:'100%',
    borderWidth:1.5,
    borderColor:'#e0e0e0',
    borderRadius:8,
    marginBottom:12,
    overflow:'hidden',
    backgroundColor:'#fafafa'
  },
  picker:{
    width:'100%',
  },
  attachBtn:{
    backgroundColor:'#007AFF',
    paddingHorizontal:16,
    paddingVertical:10,
    borderRadius:8,
    marginBottom:12
  },
  attachText:{
    color:'#fff',
    fontWeight:'bold',
    textAlign:'center'
  },
  previewContainer:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:12,
    gap:8
  },
  preview:{
    width:80,
    height:80,
    borderRadius:8
  },
  removeImg:{
    fontSize:20
  },
  button:{
    width:'100%',
    backgroundColor:'#007AFF',
    padding:16,
    borderRadius:8,
    alignItems:'center',
    justifyContent:'center',
    marginTop:10
  },
  buttonText:{
    color:'#fff',
    fontSize:16,
    fontWeight:'bold'
  },
  historyContainer:{
    width:'100%',
    maxWidth:500,
    backgroundColor:'#fff',
    borderRadius:14,
    padding:15,
    ...Platform.select({
      ios:{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6 },
      android:{ elevation:2 }
    })
  },
  historyTitle:{
    fontSize:18,
    fontWeight:'bold',
    marginBottom:10,
    color:'#007AFF',
    textAlign:'center'
  },
  filterContainer:{
    flexDirection:'row',
    justifyContent:'space-around',
    marginBottom:10
  },
  filterBtn:{
    paddingHorizontal:12,
    paddingVertical:6,
    borderRadius:8,
    backgroundColor:'#e0e0e0'
  },
  filterBtnActive:{
    backgroundColor:'#007AFF'
  },
  filterText:{
    color:'#333',
    fontWeight:'500'
  },
  filterTextActive:{
    color:'#fff'
  },
  historyItem:{
    borderBottomWidth:1,
    borderBottomColor:'#e0e0e0',
    paddingVertical:8
  },
  historyDate:{
    fontSize:12,
    color:'#888'
  },
  historyName:{
    fontSize:14,
    fontWeight:'600',
    color:'#333'
  },
  historyType:{
    fontSize:14,
    fontWeight:'600',
    color:'#007AFF'
  },
  historyMessage:{
    fontSize:14,
    color:'#333',
    marginVertical:4
  },
  historyImage:{
    width:120,
    height:120,
    borderRadius:8,
    marginTop:4
  }
});
