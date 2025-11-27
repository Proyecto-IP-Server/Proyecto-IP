import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
  useWindowDimensions,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import TextTitle from "../../components/TextTitle";
import { Dropdown } from "react-native-element-dropdown";
import { Stack, useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config/api";

const PRIMARY_COLOR = "#007AFF";

export default function Support() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // --- Estados del Formulario ---
  const [name, setName] = useState("");
  const [type, setType] = useState(null);
  const [message, setMessage] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // --- Estado Menú Móvil ---
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const messageTypes = [
    { label: "Comentario", value: "Comentario" },
    { label: "Reportar Error (Bug)", value: "Error" },
    { label: "Sugerencia", value: "Sugerencia" },
  ];

  // --- Funciones de Navegación ---
  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleNavigation = (route) => {
    setMobileMenuVisible(false);
    router.push(route);
  };

  // --- Funciones del Formulario ---
  const showFeedback = (type, msg) => {
    setFeedback({ type, message: msg });
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
        if (uri.endsWith(".png")) mimeType = "image/png";
        
        setImageBase64(`data:${mimeType};base64,${b64}`);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      showFeedback("error", "No se pudo cargar la imagen.");
    }
  };

  const sendFeedback = async () => {
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
      const payload = {
        nombre: name || "Anónimo",
        tipo: type,
        mensaje: message,
        imagen: imageBase64 || null,
        fecha: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/soporte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showFeedback(
          "success",
          "¡Recibido! Gracias por ayudarnos a mejorar."
        );
        setName("");
        setType(null);
        setMessage("");
        setImageUri(null);
        setImageBase64(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showFeedback(
          "error",
          errorData.message || "Hubo un problema. Inténtalo de nuevo."
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- HEADER RESPONSIVO --- */}
      <View style={styles.header}>
        {/* Izquierda: Regresar */}
        <View style={{ minWidth: 80 }}>
            <Pressable style={styles.backButton} onPress={handleBack}>
                <Image
                    source={require("@/assets/images/arrow-left.svg")}
                    style={{ width: 18, height: 18 }}
                    contentFit="contain"
                />
                <Text style={styles.backButtonText}>Regresar</Text>
            </Pressable>
        </View>

        {/* Centro: Título */}
        <Text 
            style={[
                styles.headerTitle, 
                { fontSize: isMobile ? 18 : 22 }
            ]}
        >
            Soporte Técnico
        </Text>

        {/* Derecha: Menú */}
        <View style={{ minWidth: isMobile ? 40 : 'auto', alignItems: 'flex-end' }}>
            {isMobile ? (
                <Pressable 
                    style={[styles.navButton, { backgroundColor: mobileMenuVisible ? '#0056b3' : '#007AFF' }]} 
                    onPress={() => setMobileMenuVisible(true)}
                >
                    <Text style={styles.navButtonText}>Menú</Text>
                    <Image 
                        source={require("@/assets/images/hamburger_white.svg")} 
                        style={styles.iconStyles} // Sin tintColor
                        contentFit="contain"
                    />
                </Pressable>
            ) : (
                <View style={styles.desktopNavContainer}>
                    <Pressable style={styles.navButton} onPress={() => handleNavigation("/Tabs/home")}>
                        <Image source={require("@/assets/images/home.svg")} style={styles.iconStylesDesktop} contentFit="contain"/>
                        <Text style={styles.navButtonText}>Inicio</Text>
                    </Pressable>
                    
                    <Pressable style={styles.navButton} onPress={() => handleNavigation("/Tabs/faq")}>
                        <Image source={require("@/assets/images/magnifer.svg")} style={styles.iconStylesDesktop} contentFit="contain"/>
                        <Text style={styles.navButtonText}>FAQ</Text>
                    </Pressable>

                    <Pressable style={styles.navButton} onPress={() => handleNavigation("/Tabs/reviews")}>
                        <Image source={require("@/assets/images/clipboard.svg")} style={styles.iconStylesDesktop} contentFit="contain"/>
                        <Text style={styles.navButtonText}>Reseñas</Text>
                    </Pressable>
                </View>
            )}
        </View>
      </View>

      {/* --- MENÚ MÓVIL MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={mobileMenuVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setMobileMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMobileMenuVisible(false)}
        >
          <View style={[styles.mobileDropdown, { top: insets.top + 55 }]}>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => handleNavigation("/Tabs/home")}>
                <Text style={styles.mobileMenuText}>Inicio</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => handleNavigation("/Tabs/faq")}>
                <Text style={styles.mobileMenuText}>FAQ</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => handleNavigation("/Tabs/reviews")}>
                <Text style={styles.mobileMenuText}>Reseñas</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- CONTENIDO --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <TextTitle style={styles.formTitle}>Cuéntanos</TextTitle>
          <Text style={styles.desc}>
            ¿Encontraste un problema o tienes una sugerencia? ¡Queremos escucharte!
          </Text>

          {/* Feedback UI */}
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
            placeholder="Selecciona el motivo..."
            value={type}
            onChange={(item) => {
              setType(item.value);
            }}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe tu situación o idea..."
            multiline
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#999"
          />

          <Pressable style={styles.attachBtn} onPress={pickImage}>
            <Text style={styles.attachText}>
              {imageUri ? "📷 Cambiar imagen" : "📎 Adjuntar captura (Opcional)"}
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
                Enviar Mensaje
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
    backgroundColor: "#f5f5f7",
  },
  // --- HEADER STYLES ---
  header: {
    padding: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    justifyContent: "space-between",
    height: 60,
  },
  backButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: 'flex-start',
    gap: 5,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  desktopNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  iconStyles: {
    width: 22,
    height: 22,
  },
  iconStylesDesktop: {
    width: 18,
    height: 18,
    tintColor: "#fff",
  },
  // --- MOBILE MENU ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  mobileDropdown: {
    marginRight: 10,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    width: 150,
  },
  mobileMenuItem: {
    padding: 12,
    alignItems: "center",
  },
  mobileMenuText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    width: "100%",
  },

  // --- CONTENIDO DEL FORMULARIO ---
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#333",
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  dropdown: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
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
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  attachText: {
    color: "#555",
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
  button: {
    width: "100%",
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextDisabled: {
    color: "#999",
  },
  feedbackContainer: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  feedbackSuccess: {
    backgroundColor: "#E8F5E9",
    borderLeftColor: "#4CAF50",
  },
  feedbackError: {
    backgroundColor: "#FFEBEE",
    borderLeftColor: "#F44336",
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
  loaderContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 8,
    color: "#666",
  },
});