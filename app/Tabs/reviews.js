import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import BlurModal from "@/components/BlurModal";
import { API_BASE_URL } from "../../config/api";

const PRIMARY_COLOR = "#007AFF";

// --- PALETA DE COLORES ---
const AVATAR_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3",
  "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39",
  "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B",
];

// --- HELPERS ---
const getAvatarColor = (name) => {
  if (!name) return PRIMARY_COLOR;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

const getProfInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(",");
  if (parts.length >= 2) {
    const lastNameInitial = parts[0].trim().charAt(0);
    const firstNameInitial = parts[1].trim().charAt(0);
    return (lastNameInitial + firstNameInitial).toUpperCase();
  } else {
    const spaceParts = name.trim().split(" ");
    if (spaceParts.length >= 2) {
      return (spaceParts[0].charAt(0) + spaceParts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
};

export default function ReviewsView() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profesorNombre } = useLocalSearchParams();
  
  // --- RESPONSIVIDAD ---
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // --- Estados de Datos ---
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [materiaCache, setMateriaCache] = useState({});

  // --- Estados Modales y Menú ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [filterMateria, setFilterMateria] = useState("TODAS");
  const [isEditing, setIsEditing] = useState(false);
  const [activeTooltipIndex, setActiveTooltipIndex] = useState(null);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  // --- Listas y Carga ---
  const [carrereasList, setCarrerasList] = useState([]);
  const [materiasList, setMateriasList] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [loadingProfesores, setLoadingProfesores] = useState(false);

  // --- Formulario ---
  const [formData, setFormData] = useState({
    carrera: null,
    materia: null,
    profesor: null,
    contenido: "",
    satisfaccion: 0,
    correo: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageState, setMessageState] = useState({ text: "", type: "error" });

  const getCardWidth = () => {
    if (width < 650) return "100%";
    if (width < 1100) return "48%";
    return "31%";
  };

  const showMessage = (text, type = "error") => {
    setMessageState({ text, type });
    setTimeout(() => {
      setMessageState({ text: "", type: "error" });
    }, 5000);
  };

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

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (addModalVisible) {
      if (!isEditing) fetchCarreras();
    } else {
      setMessageState({ text: "", type: "error" });
    }
  }, [addModalVisible, isEditing]);

  useEffect(() => {
    if (selectedProfesor && detailModalVisible) {
      const materiasUnicas = Array.from(
        new Set(selectedProfesor.reviews.map((r) => r.materia))
      );
      materiasUnicas.forEach((clave) => {
        resolveMateriaName(clave);
      });
      setFilterMateria("TODAS");
      setActiveTooltipIndex(null);
    }
  }, [selectedProfesor, detailModalVisible]);

  const resolveMateriaName = async (clave) => {
    if (materiaCache[clave]) return;
    try {
      const response = await fetch(`${API_BASE_URL}/materia/${clave}`);
      if (response.ok) {
        const data = await response.json();
        setMateriaCache((prev) => ({ ...prev, [clave]: data.nombre }));
      } else {
        setMateriaCache((prev) => ({ ...prev, [clave]: clave }));
      }
    } catch (error) {
      console.error(`Error fetching nombre materia ${clave}`, error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await fetch(
        `${API_BASE_URL}/resenas/?offset=0&limit=100`
      );
      if (!response.ok) {
        setReviews([]);
        return;
      }
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage("No se pudieron cargar las reseñas recientes.");
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchCarreras = async () => {
    try {
      setLoadingCarreras(true);
      const response = await fetch(`${API_BASE_URL}/carreras/`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (Array.isArray(data)) {
        setCarrerasList(
          data
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((c) => ({
              label: `${c.clave} - ${c.nombre}`,
              value: c.clave,
            }))
        );
      }
    } catch (error) {
      showMessage("Error al cargar la lista de carreras.");
    } finally {
      setLoadingCarreras(false);
    }
  };

  const fetchMaterias = async (carreraClave) => {
    try {
      setLoadingMaterias(true);
      setMateriasList([]);
      const response = await fetch(
        `${API_BASE_URL}/materias/?offset=0&limit=1000&carrera=${carreraClave}`
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (Array.isArray(data)) {
        setMateriasList(
          data
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((m) => ({
              label: `${m.clave} - ${m.nombre}`,
              value: m.clave,
            }))
        );
      }
    } catch (error) {
      showMessage("Error al cargar materias.");
    } finally {
      setLoadingMaterias(false);
    }
  };

  const fetchProfesoresByMateria = async (materiaClave) => {
    try {
      setLoadingProfesores(true);
      setProfesoresList([]);
      const response = await fetch(
        `${API_BASE_URL}/profesores/${materiaClave}`
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (Array.isArray(data)) {
        setProfesoresList(
          data
            .map((p) => ({ label: p.nombre, value: p.nombre }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      }
    } catch (error) {
      showMessage("No se pudieron cargar los profesores.");
    } finally {
      setLoadingProfesores(false);
    }
  };

  useEffect(() => {
    if (!loadingReviews && profesorNombre && reviews.length > 0) {
      setSearchQuery(profesorNombre);
      const profesorEncontrado = reviews.find(
        (r) => r.profesor.toLowerCase() === profesorNombre.toLowerCase()
      );
      if (profesorEncontrado) {
        const reviewProfesor = reviews.filter(
          (r) => r.profesor.toLowerCase() === profesorNombre.toLowerCase()
        );
        const totalStars = reviewProfesor.reduce(
          (sum, r) => sum + r.satisfaccion,
          0
        );
        const profObj = {
          nombre: profesorEncontrado.profesor,
          materias: Array.from(new Set(reviewProfesor.map((r) => r.materia))),
          reviews: reviewProfesor,
          average: totalStars / reviewProfesor.length,
        };
        setSelectedProfesor(profObj);
        setFilterMateria("TODAS");
        setDetailModalVisible(true);
      }
    }
  }, [profesorNombre, reviews, loadingReviews]);

  const groupedReviews = useMemo(() => {
    if (!Array.isArray(reviews)) return [];
    const groups = {};
    reviews.forEach((r) => {
      if (
        searchQuery &&
        !r.profesor.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.materia.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return;
      if (!groups[r.profesor]) {
        groups[r.profesor] = {
          nombre: r.profesor,
          materias: new Set(),
          reviews: [],
          totalStars: 0,
        };
      }
      groups[r.profesor].materias.add(r.materia);
      groups[r.profesor].reviews.push(r);
      groups[r.profesor].totalStars += r.satisfaccion;
    });
    return Object.values(groups).map((g) => ({
      ...g,
      materias: Array.from(g.materias),
      average: g.totalStars / g.reviews.length,
    }));
  }, [reviews, searchQuery]);

  const handleEditReview = (review) => {
    setFormData({
      carrera: null,
      materia: review.materia,
      profesor: selectedProfesor?.nombre || review.profesor,
      contenido: review.contenido,
      satisfaccion: review.satisfaccion,
      correo: "",
    });
    setIsEditing(true);
    setAddModalVisible(true);
  };

  const handleSolicitarResena = async () => {
    setMessageState({ text: "", type: "error" });
    if (!formData.materia || !formData.profesor || !formData.contenido) {
      showMessage("Faltan datos de la reseña.");
      return;
    }
    if (formData.satisfaccion === 0) {
      showMessage("Por favor selecciona una calificación.");
      return;
    }
    if (!formData.correo || formData.correo.trim().length === 0) {
      showMessage("Ingresa tu código de alumno.");
      return;
    }
    const fullEmail = `${formData.correo.trim()}@alumnos.udg.mx`;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/resenas/solicitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo_alumno: fullEmail,
          clave_materia: formData.materia,
          nombre_profesor: formData.profesor,
          contenido: formData.contenido,
          satisfaccion: formData.satisfaccion,
        }),
      });
      const res = await response.json();
      if (response.ok) {
        setStep(2);
      } else showMessage(res.detail || "Error al solicitar acción.");
    } catch (error) {
      showMessage("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificarCodigo = async () => {
    setMessageState({ text: "", type: "error" });
    if (!verificationCode) {
      showMessage("Por favor ingresa el código.");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${API_BASE_URL}/resenas/verificar/${verificationCode}?json=true`
      );
      const data = await response.json();
      if (response.ok) {
        setAddModalVisible(false);
        resetForm();
        fetchReviews();
      } else showMessage(data.detail || "Código inválido.");
    } catch (error) {
      showMessage("Error al verificar código.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      carrera: null,
      materia: null,
      profesor: null,
      contenido: "",
      satisfaccion: 0,
      correo: "",
    });
    setVerificationCode("");
    setStep(1);
    setMessageState({ text: "", type: "error" });
    setMateriasList([]);
    setProfesoresList([]);
    setIsEditing(false);
  };

  const MessageBanner = ({ style }) => {
    if (!messageState.text) return null;
    const isError = messageState.type === "error";
    return (
      <View
        style={[
          styles.messageContainer,
          isError ? styles.errorBackground : styles.infoBackground,
          style,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isError ? styles.errorText : styles.infoText,
          ]}
        >
          {messageState.text}
        </Text>
      </View>
    );
  };

  const StarRating = ({ rating, setRating, readOnly = false, size = 20 }) => {
    return (
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            disabled={readOnly}
            onPress={() => setRating && setRating(star)}
          >
            <Image
              source={
                star <= rating
                  ? require("@/assets/images/star_filled.svg")
                  : require("@/assets/images/star.svg")
              }
              style={{ width: size, height: size }}
              contentFit="contain"
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const isFormValid =
    (isEditing ? true : formData.carrera) &&
    formData.materia &&
    formData.profesor &&
    formData.contenido.length > 0 &&
    formData.satisfaccion > 0 &&
    formData.correo;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
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

        <Text 
            style={[
                styles.headerTitle, 
                { fontSize: isMobile ? 18 : 22 }
            ]}
        >
            Reseñas de Profesores
        </Text>

        <View style={{ minWidth: isMobile ? 40 : 'auto', alignItems: 'flex-end' }}>
            {isMobile ? (
                <Pressable 
                    style={[styles.navButton, { backgroundColor: mobileMenuVisible ? '#0056b3' : '#007AFF' }]} 
                    onPress={() => setMobileMenuVisible(true)}
                >
                    <Text style={styles.navButtonText}>Menú</Text>
                    <Image 
                        source={require("@/assets/images/hamburger_white.svg")} 
                        style={styles.iconStyles}
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

                    <Pressable style={styles.navButton} onPress={() => handleNavigation("/Tabs/suport")}>
                        <Image source={require("@/assets/images/question.svg")} style={styles.iconStylesDesktop} contentFit="contain"/>
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
              onPress={() => handleNavigation("/Tabs/faq")}
            >
              <Text style={styles.mobileMenuText}>FAQ</Text>
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

      {!addModalVisible && !detailModalVisible && (
        <MessageBanner style={{ margin: 16 }} />
      )}

      {/* --- CONTROLES Y BÚSQUEDA ---
        SOLUCIÓN ANDROID: Usamos 'width' porcentual explicito en lugar de 'flex: 1' 
        para evitar el colapso del TextInput.
      */}
      <View style={[styles.controlsContainer, { flexDirection: isMobile ? 'column' : 'row' }]}>
        
        {/* Barra de Búsqueda */}
        <View style={[
            styles.searchContainer, 
            { width: isMobile ? "100%" : "70%" } // Ancho explícito
        ]}>
          <Image
            source={require("@/assets/images/magnifer.svg")}
            style={styles.searchIcon}
            contentFit="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar profesor o materia..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        
        {/* Botón */}
        <Pressable
          style={[
              styles.addButton, 
              { width: isMobile ? "100%" : "28%" } // Ancho explícito (70+28=98% + gap)
          ]}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Escribir Reseña</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        {loadingReviews ? (
          <View style={{ alignItems: "center", marginVertical: 20 }}>
            <ActivityIndicator
              size="large"
              color={PRIMARY_COLOR}
              style={{ marginTop: 40 }}
            />
            <Text style={{ marginTop: 10 }}>Cargando profesores...</Text>
          </View>
        ) : groupedReviews.length === 0 ? (
          <Text style={styles.emptyText}>No se encontraron reseñas.</Text>
        ) : (
          <View style={styles.gridWrapper}>
            {groupedReviews.map((prof, index) => {
              const profColor = getAvatarColor(prof.nombre);
              const profInitials = getProfInitials(prof.nombre);
              return (
                <Pressable
                  key={index}
                  style={[styles.card, { width: getCardWidth() }]}
                  onPress={() => {
                    setSelectedProfesor(prof);
                    setDetailModalVisible(true);
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        { backgroundColor: profColor, borderColor: profColor },
                      ]}
                    >
                      <Text style={styles.avatarText}>{profInitials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName} numberOfLines={2}>
                        {prof.nombre}
                      </Text>
                      <StarRating
                        rating={Math.round(prof.average)}
                        readOnly
                        size={14}
                      />
                      <Text style={styles.cardCount}>
                        {prof.reviews.length}{" "}
                        {prof.reviews.length === 1 ? "opinión" : "opiniones"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardMaterias}>
                    <Text style={styles.materiasLabel}>Materias:</Text>
                    <Text style={styles.materiasText} numberOfLines={2}>
                      {prof.materias
                        .map((m) => materiaCache[m] || m)
                        .join(", ")}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* --- MODALES --- */}
      <BlurModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          resetForm();
        }}
        containerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "position"}
          style={{ width: "100%" }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -20}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {step === 1
                ? isEditing
                  ? "Editar Reseña"
                  : "Nueva Reseña"
                : "Verificar Correo"}
            </Text>

            <MessageBanner style={{ marginBottom: 15 }} />

            {isEditing && step === 1 && (
              <View style={styles.warningContainer}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#E65100",
                    textAlign: "center",
                  }}
                >
                  ⚠️ Solo el autor original puede editar esta reseña validando
                  su{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    correo institucional{" "}
                  </Text>
                  . Si no eres el autor, se creará una nueva reseña o se
                  actualizará tu reseña correspondiente.
                </Text>
              </View>
            )}

            {step === 1 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {!isEditing && (
                  <>
                    <Text style={styles.inputLabel}>1. Selecciona Carrera</Text>
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      data={carrereasList}
                      search
                      searchPlaceholder="Buscar carrera..."
                      labelField="label"
                      valueField="value"
                      placeholder="Selecciona carrera"
                      value={formData.carrera}
                      onChange={(item) => {
                        setFormData({
                          ...formData,
                          carrera: item.value,
                          materia: null,
                          profesor: null,
                        });
                        setProfesoresList([]);
                        fetchMaterias(item.value);
                      }}
                      disable={loadingCarreras}
                    />
                    {loadingCarreras && (
                      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                    )}
                  </>
                )}

                <Text style={styles.inputLabel}>
                  {isEditing ? "Materia (Bloqueado)" : "2. Selecciona Materia"}
                </Text>
                {isEditing ? (
                  <View
                    style={[styles.textInput, { backgroundColor: "#f0f0f0" }]}
                  >
                    <Text style={{ color: "#666" }}>
                      {materiaCache[formData.materia] || formData.materia}
                    </Text>
                  </View>
                ) : (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      !formData.carrera && styles.disabledInput,
                    ]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={materiasList}
                    search
                    searchPlaceholder="Buscar materia..."
                    labelField="label"
                    valueField="value"
                    placeholder={
                      formData.carrera
                        ? "Selecciona materia"
                        : "Primero elige carrera"
                    }
                    value={formData.materia}
                    onChange={(item) => {
                      setFormData({
                        ...formData,
                        materia: item.value,
                        profesor: null,
                      });
                      fetchProfesoresByMateria(item.value);
                    }}
                    disable={!formData.carrera || loadingMaterias}
                  />
                )}
                {!isEditing && loadingMaterias && (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                )}

                <Text style={styles.inputLabel}>
                  {isEditing
                    ? "Profesor (Bloqueado)"
                    : "3. Selecciona Profesor"}
                </Text>
                {isEditing ? (
                  <View
                    style={[styles.textInput, { backgroundColor: "#f0f0f0" }]}
                  >
                    <Text style={{ color: "#666" }}>{formData.profesor}</Text>
                  </View>
                ) : (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      !formData.materia && styles.disabledInput,
                    ]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={profesoresList}
                    search
                    searchPlaceholder="Buscar profesor..."
                    labelField="label"
                    valueField="value"
                    placeholder={
                      formData.materia
                        ? "Selecciona profesor"
                        : "Primero elige materia"
                    }
                    value={formData.profesor}
                    onChange={(item) => {
                      setFormData({ ...formData, profesor: item.value });
                    }}
                    disable={!formData.materia || loadingProfesores}
                  />
                )}
                {!isEditing && loadingProfesores && (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                )}

                <Text style={styles.inputLabel}>4. Calificación</Text>
                <View style={{ marginBottom: 15 }}>
                  <StarRating
                    rating={formData.satisfaccion}
                    setRating={(r) =>
                      setFormData({ ...formData, satisfaccion: r })
                    }
                    size={30}
                  />
                </View>

                <Text style={styles.inputLabel}>5. Tu Opinión</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="¿Qué tal te pareció la clase?..."
                  multiline
                  numberOfLines={4}
                  value={formData.contenido}
                  onChangeText={(t) =>
                    setFormData({ ...formData, contenido: t })
                  }
                />

                <Text style={styles.inputLabel}>6. Correo Institucional</Text>
                <View style={styles.emailInputContainer}>
                  <TextInput
                    style={styles.emailPrefixInput}
                    placeholder="correo"
                    autoCapitalize="none"
                    value={formData.correo}
                    onChangeText={(t) =>
                      setFormData({ ...formData, correo: t })
                    }
                  />
                  <Text style={styles.emailDomainText}>@alumnos.udg.mx</Text>
                </View>

                <Pressable
                  style={[
                    styles.modalButton,
                    (!isFormValid || isSubmitting) && styles.disabledButton,
                  ]}
                  onPress={handleSolicitarResena}
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>
                      {isEditing
                        ? "Verificar Autoría y Editar"
                        : "Enviar Código de Verificación"}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setAddModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <View>
                <Text style={styles.verificationText}>
                  Hemos enviado un código a{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {formData.correo}@alumnos.udg.mx
                  </Text>
                  .
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { textAlign: "center", fontSize: 24, letterSpacing: 5 },
                  ]}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
                <Pressable
                  style={[
                    styles.modalButton,
                    isSubmitting && styles.disabledButton,
                  ]}
                  onPress={handleVerificarCodigo}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>
                      Verificar y Publicar
                    </Text>
                  )}
                </Pressable>
                <Pressable style={{ marginTop: 15 }} onPress={() => setStep(1)}>
                  <Text style={{ color: "#666", textAlign: "center" }}>
                    Volver / Corregir correo
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setAddModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cerrar</Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </BlurModal>

      {/* --- MODAL DETALLE DE PROFESOR --- */}
      {selectedProfesor && (
        <BlurModal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false);
            setMessageState({ text: "", type: "error" });
          }}
          containerStyle={styles.detailModalContainer}
        >
          <View style={styles.detailHeader}>
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: getAvatarColor(selectedProfesor.nombre),
                  borderColor: getAvatarColor(selectedProfesor.nombre),
                },
              ]}
            >
              <Text style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}>
                {getProfInitials(selectedProfesor.nombre)}
              </Text>
            </View>
            <Text style={styles.detailName}>{selectedProfesor.nombre}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 5,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                {selectedProfesor.average.toFixed(1)}
              </Text>
              <StarRating
                rating={Math.round(selectedProfesor.average)}
                readOnly
                size={18}
              />
              <Text style={{ color: "#666" }}>
                ({selectedProfesor.reviews.length})
              </Text>
            </View>
          </View>

          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10, gap: 10 }}
            >
              <Pressable
                style={[
                  styles.tabChip,
                  filterMateria === "TODAS" && styles.tabChipActive,
                ]}
                onPress={() => setFilterMateria("TODAS")}
              >
                <Text
                  style={[
                    styles.tabText,
                    filterMateria === "TODAS" && styles.tabTextActive,
                  ]}
                >
                  Todas
                </Text>
              </Pressable>
              {Array.from(
                new Set(selectedProfesor.reviews.map((r) => r.materia))
              ).map((materiaClave) => (
                <Pressable
                  key={materiaClave}
                  style={[
                    styles.tabChip,
                    filterMateria === materiaClave && styles.tabChipActive,
                  ]}
                  onPress={() => setFilterMateria(materiaClave)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      filterMateria === materiaClave && styles.tabTextActive,
                    ]}
                  >
                    {materiaCache[materiaClave] || materiaClave}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.reviewsList}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {selectedProfesor.reviews
              .filter(
                (r) => filterMateria === "TODAS" || r.materia === filterMateria
              )
              .map((review, idx) => {
                const studentName = review.alumno || "Anónimo";
                const studentInitial = studentName.charAt(0).toUpperCase();
                const studentColor = getAvatarColor(studentName);

                return (
                  <View key={idx} style={styles.reviewItem}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View
                        style={[
                          styles.studentAvatar,
                          { backgroundColor: studentColor },
                        ]}
                      >
                        <Text style={styles.studentAvatarText}>
                          {studentInitial}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.authorContainer}>
                            <Text style={styles.reviewAuthor}>
                              {studentName}
                            </Text>
                            <View style={{ position: "relative" }}>
                              <Pressable
                                style={styles.anonHelpButton}
                                onPress={() =>
                                  setActiveTooltipIndex(
                                    activeTooltipIndex === idx ? null : idx
                                  )
                                }
                              >
                                <Text style={styles.anonHelpText}>?</Text>
                              </Pressable>
                              {activeTooltipIndex === idx && (
                                <View
                                  style={[
                                    styles.tooltipBubble,
                                    { zIndex: 9999 },
                                  ]}
                                >
                                  <Text style={styles.tooltipText}>
                                    Nombre generado automáticamente.
                                  </Text>
                                  <View style={styles.tooltipArrow} />
                                </View>
                              )}
                            </View>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <StarRating
                              rating={review.satisfaccion}
                              readOnly
                              size={12}
                            />
                            <Pressable
                              style={styles.preferenceButton}
                              onPress={() => {
                                setDetailModalVisible(false);
                                handleEditReview(review);
                              }}
                            >
                              <Image
                                source={require("@/assets/images/pen.svg")}
                                style={styles.preferenceIcon}
                                contentFit="contain"
                              />
                            </Pressable>
                          </View>
                        </View>
                        <View
                          style={{ alignSelf: "flex-start", marginBottom: 6 }}
                        >
                          <Text style={styles.reviewMateria}>
                            {materiaCache[review.materia] || review.materia}
                          </Text>
                        </View>
                        <Text style={styles.reviewContent}>
                          {review.contenido}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            {selectedProfesor.reviews.filter(
              (r) => filterMateria === "TODAS" || r.materia === filterMateria
            ).length === 0 && (
              <Text
                style={{ textAlign: "center", color: "#999", marginTop: 20 }}
              >
                No hay reseñas para esta materia.
              </Text>
            )}
          </ScrollView>

          <Pressable
            style={styles.closeDetailButton}
            onPress={() => setDetailModalVisible(false)}
          >
            <Text style={styles.closeDetailText}>Cerrar</Text>
          </Pressable>
        </BlurModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  // --- Header Styles ---
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
  // --- Menú Móvil ---
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

  messageContainer: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  errorBackground: {
    backgroundColor: "#ffebee",
    borderLeftColor: "#f44336",
  },
  infoBackground: {
    backgroundColor: "#E3F2FD",
    borderLeftColor: "#2196F3",
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  errorText: {
    color: "#d32f2f",
  },
  infoText: {
    color: "#0D47A1",
  },
  
  // --- CONTROLES Y BÚSQUEDA ---
  controlsContainer: {
    padding: 16,
    gap: 10,
    justifyContent: "space-between",
  },
  searchContainer: {
    // IMPORTANTE: Eliminado flex: 1
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    height: 50, // Altura fija
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: "#666"
  },
  searchInput: {
    flex: 1,
    height: "100%", // Ocupar toda la altura del padre fijo
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    // Eliminado flex
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  gridContainer: {
    padding: 16,
  },
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  cardMaterias: {
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 6,
  },
  materiasLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    marginBottom: 2,
  },
  materiasText: {
    fontSize: 12,
    color: "#444",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  modalContent: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  warningContainer: {
    backgroundColor: "#FFF3E0",
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
    marginTop: 10,
  },
  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    opacity: 0.7,
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  emailInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    height: 50,
  },
  emailPrefixInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
    height: "100%",
    paddingVertical: 0,
  },
  emailDomainText: {
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f7",
    color: "#666",
    fontSize: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    height: "100%",
    textAlignVertical: "center",
    lineHeight: 50,
  },
  modalButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  verificationText: {
    textAlign: "center",
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
    lineHeight: 22,
  },
  detailModalContainer: {
    width: "90%",
    maxWidth: 600,
    height: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  detailHeader: {
    padding: 20,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  detailName: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 8,
    textAlign: "center",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  tabChipActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  reviewsList: {
    padding: 16,
  },
  reviewItem: {
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    zIndex: 1,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  studentAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  anonHelpButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  anonHelpText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "bold",
  },
  tooltipBubble: {
    position: "absolute",
    bottom: 25,
    left: -60,
    width: 140,
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 10,
    textAlign: "center",
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -6,
    left: 64,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#333",
  },
  reviewMateria: {
    fontSize: 11,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  reviewContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  closeDetailButton: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  closeDetailText: {
    color: PRIMARY_COLOR,
    fontWeight: "bold",
    fontSize: 16,  
  },
  preferenceButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginLeft: 4,
  },
  preferenceIcon: {
    width: 16,
    height: 16,
  },
});