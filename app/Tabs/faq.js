import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";

// --- Constantes de Estilo ---
const PRIMARY_COLOR = "#007AFF";

// --- Categorías ---
const categoryData = [
  { label: "Todas las Categorías", value: "Todos" },
  { label: "Home", value: "Home" },
  { label: "Reseñas", value: "Reseñas" },
  { label: "FAQ", value: "FAQ" },
  { label: "Soporte", value: "Soporte" },
];

// --- Datos de FAQ ---
const faqData = [
  {
    id: "1",
    category: "Home",
    question: "¿Cómo entro a la app por primera vez?",
    answer:
      "¡Fácil! Solo ingresa tu Centro Universitario, Ciclo y tu Carrera; con eso podrás acceder sin ningún problema.",
  },
  {
    id: "2",
    category: "Home",
    question: "No me deja entrar",
    answer:
      "Revisa si tienes conexión a internet o si el sistema está disponible.",
  },
  {
    id: "3",
    category: "Home",
    question: "¿La app funciona sin internet?",
    answer:
      "Necesitas conexión para poder consultar las materias.",
  },
  {
    id: "4",
    category: "Home",
    question: "¿Cómo se almacenan los datos?",
    answer:
      "Los datos solo se almacenan de forma local.",
  },
  {
    id: "5",
    category: "Reseñas",
    question: "¿Cómo dejo una opinión?",
    answer:
      'En la página de Reseñas selecciona **"+ Escribir Reseña"**. Elige una materia, el profesor que la imparte, asigna una calificación y escribe tu opinión. Para validar la reseña es **¡muy importante!** que utilices tu correo institucional **@alumnos.udg.mx**. Las reseñas son completamente anónimas.',
  },
  {
    id: "6",
    category: "Reseñas",
    question: "¿Puedo subir fotos?",
    answer:
      "¡No! Por el momento no puedes subir fotos.",
  },
  {
    id: "7",
    category: "Reseñas",
    question: "Me equivoqué, ¿puedo editar mi reseña?",
    answer:
      'Solo puedes editar una reseña si eres el autor de la misma. Al confirmar tu correo, si ya existe una reseña tuya esta se modificará; de lo contrario, se publicará una nueva.',
  },
  {
    id: "8",
    category: "Reseñas",
    question: "¿Qué significan las estrellas?",
    answer:
      "Es el promedio de **todas las calificaciones** de los estudiantes. Más estrellas significan una mejor experiencia general.",
  },
  {
    id: "9",
    category: "FAQ",
    question: "¿Qué puedo hacer en esta app?",
    answer:
      "Puedes agregar materias para generar un horario según tus preferencias, seleccionar a tus profesores favoritos, marcar las horas que no quieres tener clases, e incluso existe una función para copiar rápidamente los NRCs de todas las materias del horario ya generado.",
  },
  {
    id: "10",
    category: "FAQ",
    question: "¿La información se actualiza sola?",
    answer:
      "Actualmente estamos trabajando en mejorar la experiencia. La información solo se actualiza al momento de volver a generar un nuevo horario.",
  },
  {
    id: "11",
    category: "Soporte",
    question: "¿Cómo contacto a soporte?",
    answer:
      "Si tienes problemas técnicos, usa el formulario en la pestaña de Soporte o escríbenos a **mihorarioudg@gmail.com**.",
  },
  {
    id: "12",
    category: "Soporte",
    question: "¿Mis datos son privados?",
    answer:
      "Sí. Tus reseñas son públicas, pero tus datos personales se usan solo para validar que eres estudiante. Revisa la **Política de Privacidad**.",
  },
  {
    id: "13",
    category: "Soporte",
    question: "¿Qué contenido está prohibido?",
    answer:
      "Prohibido el **spam**, los **insultos**, el acoso y publicar información privada de otros. Mantengamos una comunidad respetuosa. Si se detecta un comportamiento inusual, puedes ser acreedor a una suspensión de la plataforma.",
  },
];

// --- Componente de Texto con Negritas ---
const FormattedText = ({ text, style }) => {
  if (!text) return null;
  if (typeof text !== "string") return text;

  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={index} style={{ fontWeight: "bold", color: "#333" }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

// --- Item FAQ ---
const FAQItem = ({ question, answer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={faqStyles.card}>
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={faqStyles.cardHeader}
      >
        <Text style={faqStyles.questionText} numberOfLines={2}>
          {question}
        </Text>
        <Text style={faqStyles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>
      </Pressable>

      {isExpanded && (
        <View style={faqStyles.cardContent}>
          <FormattedText text={answer} style={faqStyles.answerText} />
        </View>
      )}
    </View>
  );
};

export default function FAQView() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Responsive
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const isMobileScreen = screenWidth < 768;
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // --- Navegación ---
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

  // --- Lógica de Filtrado ---
  const filteredFaqs = useMemo(() => {
    let results = faqData;

    if (selectedCategory !== "Todos") {
      results = results.filter((item) => item.category === selectedCategory);
    }

    if (searchText.trim() !== "") {
      const lowercasedSearch = searchText.toLowerCase().trim();
      results = results.filter(
        (item) =>
          item.question.toLowerCase().includes(lowercasedSearch) ||
          item.answer.toLowerCase().includes(lowercasedSearch)
      );
    }
    return results;
  }, [selectedCategory, searchText]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        {/* Botón Izquierdo: Regresar */}
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

        {/* Centro: Título SOLICITADO */}
        <Text
          style={[
            styles.headerTitle,
            // Aplicamos la lógica de tamaño dinámico aquí
            { fontSize: isMobileScreen ? 18 : 22 },
          ]}
        >
          Preguntas Frecuentes
        </Text>

        {/* Botón Derecha: Menú o Navegación */}
        <View
          style={{
            minWidth: isMobileScreen ? 40 : "auto",
            alignItems: "flex-end",
          }}
        >
          {isMobileScreen ? (
            <Pressable
              style={[
                styles.navButton,
                { backgroundColor: mobileMenuVisible ? "#0056b3" : "#007AFF" },
              ]}
              onPress={() => setMobileMenuVisible(true)}
            >
              <Text style={styles.navButtonText}>Menú</Text>
              <Image
                source={require("@/assets/images/hamburger_white.svg")}
                style={styles.iconStyles} // Sin tintColor en el estilo
                contentFit="contain"
              />
            </Pressable>
          ) : (
            <View style={styles.desktopNavContainer}>
              <Pressable
                style={styles.navButton}
                onPress={() => handleNavigation("/Tabs/home")}
              >
                <Image
                  source={require("@/assets/images/home.svg")}
                  style={styles.iconStyles}
                  contentFit="contain"
                />
                <Text style={styles.navButtonText}>Inicio</Text>
              </Pressable>

              <Pressable
                style={styles.navButton}
                onPress={() => handleNavigation("/Tabs/reviews")}
              >
                <Image
                  source={require("@/assets/images/clipboard.svg")}
                  style={styles.iconStyles}
                  contentFit="contain"
                />
                <Text style={styles.navButtonText}>Reseñas</Text>
              </Pressable>

              <Pressable
                style={styles.navButton}
                onPress={() => handleNavigation("/Tabs/suport")}
              >
                <Image
                  source={require("@/assets/images/question.svg")}
                  style={styles.iconStyles}
                  contentFit="contain"
                />
                <Text style={styles.navButtonText}>Soporte</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* --- MENU MÓVIL --- */}
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
            <TouchableOpacity
              style={styles.mobileMenuItem}
              onPress={() => handleNavigation("/Tabs/home")}
            >
              <Text style={styles.mobileMenuText}>Inicio</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.mobileMenuItem}
              onPress={() => handleNavigation("/Tabs/reviews")}
            >
              <Text style={styles.mobileMenuText}>Reseñas</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.mobileMenuItem}
              onPress={() => handleNavigation("/Tabs/suport")}
            >
              <Text style={styles.mobileMenuText}>Soporte</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- CONTENIDO --- */}
      <View style={styles.contentWrapper}>
        <View style={styles.controlsContainer}>
          <Text style={styles.sectionLabel}>Buscador y Filtros</Text>

          <View style={styles.searchContainer}>
            <Image
              source={require("@/assets/images/magnifer_black.svg")}
              style={styles.searchIcon}
              contentFit="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Escribe tu duda aquí..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#888"
            />
          </View>

          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={categoryData}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Todas las Categorías"
            value={selectedCategory}
            onChange={(item) => setSelectedCategory(item.value)}
          />
        </View>

        <ScrollView
          style={styles.scrollview}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredFaqs.map((item) => (
            <FAQItem
              key={item.id}
              question={item.question}
              answer={item.answer}
            />
          ))}

          {filteredFaqs.length === 0 && (
            <Text style={styles.emptyText}>
              No encontramos resultados. Intenta con otra palabra.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const faqStyles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: PRIMARY_COLOR,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    paddingRight: 10,
  },
  expandIcon: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "bold",
  },
  cardContent: {
    width: "100%",
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#fff",
  },
  answerText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
    paddingTop: 12,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
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
  // ESTILO HEADER TITLE SOLICITADO
  headerTitle: {
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center", // Agregado para centrar
  },
  backButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
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
    width: 18,
    height: 18,
    tintColor: "#fff",
  },
  // Menu Movil
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
  // Contenido
  contentWrapper: {
    flex: 1,
    width: "100%",
  },
  controlsContainer: {
    padding: 16,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 4,
    marginBottom: -5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#bbb",
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "#666",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    paddingVertical: 0,
    color: "#333",
  },
  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#666",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  scrollview: {
    width: "100%",
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999",
  },
});
