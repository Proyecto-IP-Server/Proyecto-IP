import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import TextTitle from "../../components/TextTitle";
import { Dropdown } from "react-native-element-dropdown";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config/api"; // Asegúrate de que la ruta sea correcta

export default function Support() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [type, setType] = useState(null);
  const [message, setMessage] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado para manejar mensajes de UI (Éxito o Error)
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const messageTypes = [
    { label: "Comentario", value: "Comentario" },
    { label: "Error", value: "Error" },
    { label: "Sugerencia", value: "Sugerencia" },
  ];

  const showFeedback = (type, msg) => {
    setFeedback({ type, message: msg });
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 5000);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);

        const b64 = asset.base64;

        let mimeType = "image/jpeg";
        const uri = asset.uri.toLowerCase();

        if (uri.endsWith(".png")) {
          mimeType = "image/png";
        } else if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) {
          mimeType = "image/jpeg";
        } else if (asset.mimeType) {

          mimeType = asset.mimeType;
        }

        setImageBase64(`data:${mimeType};base64,${b64}`);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      showFeedback("error", "No se pudo cargar la imagen.");
    }
  };

  const sendFeedback = async () => {
    // 1. Validación
    if (!type || !message) {
      showFeedback(
        "error",
        "Por favor selecciona un tipo de mensaje y escribe tu comentario."
      );
      return;
    }

    setLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      // 2. Preparar Payload
      const payload = {
        nombre: name || "Anónimo",
        tipo: type,
        mensaje: message,
        imagen: imageBase64 || null, // Envía null si no hay imagen
        fecha: new Date().toISOString(),
      };

      // 3. Petición POST
      // NOTA: Ajusta la ruta '/soporte' según tu backend real
      const response = await fetch(`${API_BASE_URL}/soporte`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // 4. Éxito
        showFeedback(
          "success",
          "¡Mensaje enviado correctamente! Gracias por tu opinión."
        );
        // Limpiar formulario
        setName("");
        setType(null);
        setMessage("");
        setImageUri(null);
        setImageBase64(null);
      } else {
        // 5. Error del servidor
        const errorData = await response.json().catch(() => ({}));
        showFeedback(
          "error",
          errorData.message ||
            "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo."
        );
      }
    } catch (error) {
      console.error("Error de red:", error);
      showFeedback("error", "Error de conexión. Verifica tu internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top }, // Respetar Status Bar
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            placeholderTextColor="#999"
          />

          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={messageTypes}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Selecciona tipo de mensaje..."
            value={type}
            onChange={(item) => {
              setType(item.value);
            }}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Escribe tu mensaje..."
            multiline
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#999"
          />

          <Pressable style={styles.attachBtn} onPress={pickImage}>
            <Text style={styles.attachText}>
              {imageUri ? "📷 Cambiar captura" : "📎 Adjuntar captura"}
            </Text>
          </Pressable>

          {imageUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <Pressable
                style={styles.removeBtn}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                }}
              >
                <Text style={styles.removeBtnText}>Eliminar imagen</Text>
              </Pressable>
            </View>
          )}

          {/* Feedback UI (Reemplazo de Alert) */}
          {feedback.message ? (
            <View
              style={[
                styles.feedbackContainer,
                feedback.type === "error"
                  ? styles.feedbackError
                  : styles.feedbackSuccess,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === "error"
                    ? styles.feedbackTextError
                    : styles.feedbackTextSuccess,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#007AFF" size="large" />
              <Text style={styles.loaderText}>Enviando...</Text>
            </View>
          ) : (
            <Pressable
              style={[
                styles.button,
                (!type || !message) && styles.buttonDisabled,
              ]}
              onPress={sendFeedback}
              disabled={!type || !message}
            >
              <Text
                style={[
                  styles.buttonText,
                  (!type || !message) && styles.buttonTextDisabled,
                ]}
              >
                Enviar
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  form: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 14,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#007AFF",
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
    paddingHorizontal: 8,
  },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  dropdown: {
    width: "100%",
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#333",
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  attachBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  attachText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  previewContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: "contain",
  },
  removeBtn: {
    padding: 8,
  },
  removeBtnText: {
    color: "#FF3B30",
    fontWeight: "600",
  },

  // Estilos del Botón Principal
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextDisabled: {
    color: "#999",
  },

  // Estilos de Feedback (Alerts UI)
  feedbackContainer: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  feedbackSuccess: {
    backgroundColor: "#E8F5E9", // Verde muy claro
    borderLeftColor: "#4CAF50", // Verde material
  },
  feedbackError: {
    backgroundColor: "#FFEBEE", // Rojo muy claro
    borderLeftColor: "#F44336", // Rojo material
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  feedbackTextSuccess: {
    color: "#2E7D32",
  },
  feedbackTextError: {
    color: "#C62828",
  },

  // Loader
  loaderContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 8,
    color: "#666",
  },
});
