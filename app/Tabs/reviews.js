import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import BlurModal from "@/components/BlurModal";
import TextTitle from "@/components/TextTitle";
import { useUserData } from "../../hooks/useUserData";
import { API_BASE_URL } from "../../config/api";

const { width } = Dimensions.get("window");
const isMobile = width < 768;
const PRIMARY_COLOR = "#007AFF";

export default function ReviewsView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData } = useUserData();

  // --- Estados de Datos ---
  const [reviews, setReviews] = useState([]); // Inicializado como array vacío
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Estados Modal Agregar Reseña ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  
  const [materiasList, setMateriasList] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [loadingProfesores, setLoadingProfesores] = useState(false);
  
  const [formData, setFormData] = useState({
    materia: null,
    profesor: null,
    contenido: "",
    satisfaccion: 0,
    correo: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Estados Modal Detalles ---
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProfesor, setSelectedProfesor] = useState(null);

  useEffect(() => {
    fetchReviews();
    if (userData && addModalVisible) {
      fetchMaterias();
    }
  }, [userData, addModalVisible]);

  // --- SOLUCIÓN ERROR forEach: Validación de respuesta ---
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await fetch(`${API_BASE_URL}/resenas/?offset=0&limit=100`);
      
      if (!response.ok) {
        console.error("Error en respuesta API:", response.status);
        setReviews([]); // Si falla, asegurar array vacío
        return;
      }

      const data = await response.json();
      
      // Validar estrictamente que sea un array
      if (Array.isArray(data)) {
        setReviews(data);
      } else {
        console.error("Formato de reseñas inválido (no es array):", data);
        setReviews([]); 
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]); // En caso de excepción, asegurar array vacío
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchMaterias = async () => {
    if (!userData) return;
    try {
      setLoadingMaterias(true);
      const response = await fetch(
        `${API_BASE_URL}/materias/?offset=0&limit=1000&ciclo=${userData.calendario}&carrera=${userData.carrera}&centro=${userData.centroUniversitario}`
      );
      if (!response.ok) throw new Error("Error fetching materias");
      
      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted = data
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .map((m) => ({
            label: `${m.clave} - ${m.nombre}`,
            value: m.clave,
          }));
        setMateriasList(formatted);
      }
    } catch (error) {
      console.error("Error fetching materias:", error);
    } finally {
      setLoadingMaterias(false);
    }
  };

  const fetchProfesoresByMateria = async (materiaClave) => {
    try {
      setLoadingProfesores(true);
      setProfesoresList([]);
      
      const response = await fetch(`${API_BASE_URL}/profesores/${materiaClave}`);
      
      if (!response.ok) throw new Error("Error al obtener profesores");

      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formatted = data
          .map((p) => ({ label: p.nombre, value: p.nombre }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setProfesoresList(formatted);
      }
    } catch (error) {
      console.error("Error fetching profesores:", error);
      Alert.alert("Error", "No se pudieron cargar los profesores.");
    } finally {
      setLoadingProfesores(false);
    }
  };

  // --- SOLUCIÓN ERROR forEach: Safety Check en useMemo ---
  const groupedReviews = useMemo(() => {
    // Si por alguna razón reviews no es array, retorna vacío y evita el crash
    if (!Array.isArray(reviews)) return [];

    const groups = {};
    reviews.forEach((r) => {
      // Filtrar por búsqueda
      if (
        searchQuery &&
        !r.profesor.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.materia.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return;
      }

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

  const handleSolicitarResena = async () => {
    if (!formData.materia || !formData.profesor || !formData.contenido) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }
    if (formData.satisfaccion === 0) {
      Alert.alert("Error", "Por favor selecciona una calificación");
      return;
    }
    if (!formData.correo.endsWith("@alumnos.udg.mx")) {
      Alert.alert("Error", "El correo debe ser institucional (@alumnos.udg.mx)");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        correo_alumno: formData.correo,
        clave_materia: formData.materia,
        nombre_profesor: formData.profesor,
        contenido: formData.contenido,
        satisfaccion: formData.satisfaccion,
      };

      const response = await fetch(`${API_BASE_URL}/resenas/solicitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await response.json();
      
      if (response.ok) {
        setStep(2);
      } else {
        Alert.alert("Error", res.detail || "Error al solicitar reseña");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (!verificationCode) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${API_BASE_URL}/resenas/verificar/${verificationCode}?json=true`
      );
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Éxito", "Tu reseña ha sido publicada");
        setAddModalVisible(false);
        resetForm();
        fetchReviews();
      } else {
        Alert.alert("Error", data.detail || "Código inválido");
      }
    } catch (error) {
      Alert.alert("Error", "Error al verificar código");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      materia: null,
      profesor: null,
      contenido: "",
      satisfaccion: 0,
      correo: "",
    });
    setVerificationCode("");
    setStep(1);
    setProfesoresList([]);
  };

  // --- CORRECCIÓN IMÁGENES: Nombres correctos de SVG ---
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
                  ? require("@/assets/images/star_filled.svg") // Corregido
                  : require("@/assets/images/star.svg")        // Corregido
              }
              style={{ width: size, height: size, tintColor: star <= rating ? "#FFD700" : "#ccc" }}
              contentFit="contain"
            />
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
             <Image
              source={require("@/assets/images/arrow-left.svg")}
              style={{ width: 20, height: 20, tintColor: "#fff" }}
              contentFit="contain"
            />
          <Text style={styles.backButtonText}>Regresar</Text>
        </Pressable>
        <TextTitle style={styles.headerTitle}>Reseñas de Profesores</TextTitle>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Image
             source={require("@/assets/images/calendar-search.svg")}
             style={styles.searchIcon}
             contentFit="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar profesor o materia..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Escribir Reseña</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        {loadingReviews ? (
          <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 40 }} />
        ) : groupedReviews.length === 0 ? (
          <Text style={styles.emptyText}>No se encontraron reseñas.</Text>
        ) : (
          <View style={styles.gridWrapper}>
            {groupedReviews.map((prof, index) => (
              <Pressable
                key={index}
                style={[styles.card, isMobile ? styles.cardMobile : styles.cardDesktop]}
                onPress={() => {
                  setSelectedProfesor(prof);
                  setDetailModalVisible(true);
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{prof.nombre.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName} numberOfLines={2}>{prof.nombre}</Text>
                    <StarRating rating={Math.round(prof.average)} readOnly size={14} />
                    <Text style={styles.cardCount}>
                      {prof.reviews.length} {prof.reviews.length === 1 ? "opinión" : "opiniones"}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardMaterias}>
                  <Text style={styles.materiasLabel}>Materias:</Text>
                  <Text style={styles.materiasText} numberOfLines={2}>
                    {prof.materias.join(", ")}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* --- MODAL AGREGAR RESEÑA --- */}
      <BlurModal
        visible={addModalVisible}
        onClose={() => { setAddModalVisible(false); resetForm(); }}
        containerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {step === 1 ? "Nueva Reseña" : "Verificar Correo"}
          </Text>

          {step === 1 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>1. Selecciona Materia</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={materiasList}
                search
                searchPlaceholder="Buscar materia..."
                labelField="label"
                valueField="value"
                placeholder="Selecciona materia"
                value={formData.materia}
                onChange={(item) => {
                  setFormData({ ...formData, materia: item.value, profesor: null });
                  fetchProfesoresByMateria(item.value);
                }}
                disable={loadingMaterias}
              />

              <Text style={styles.inputLabel}>2. Selecciona Profesor</Text>
              <Dropdown
                style={[styles.dropdown, !formData.materia && styles.disabledInput]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={profesoresList}
                search
                searchPlaceholder="Buscar profesor..."
                labelField="label"
                valueField="value"
                placeholder={formData.materia ? "Selecciona profesor" : "Primero elige materia"}
                value={formData.profesor}
                onChange={(item) => {
                  setFormData({ ...formData, profesor: item.value });
                }}
                disable={!formData.materia || loadingProfesores}
              />
              {loadingProfesores && <ActivityIndicator size="small" color={PRIMARY_COLOR} />}

              <Text style={styles.inputLabel}>3. Calificación</Text>
              <View style={{ marginBottom: 15 }}>
                <StarRating rating={formData.satisfaccion} setRating={(r) => setFormData({ ...formData, satisfaccion: r })} size={30} />
              </View>

              <Text style={styles.inputLabel}>4. Tu Opinión</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="¿Qué tal te pareció la clase? (Contenido, asistencia, dificultad...)"
                multiline
                numberOfLines={4}
                value={formData.contenido}
                onChangeText={(t) => setFormData({ ...formData, contenido: t })}
              />

              <Text style={styles.inputLabel}>5. Correo Institucional</Text>
              <TextInput
                style={styles.textInput}
                placeholder="codigo@alumnos.udg.mx"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.correo}
                onChangeText={(t) => setFormData({ ...formData, correo: t })}
              />

              <Pressable
                style={[styles.modalButton, isSubmitting && styles.disabledButton]}
                onPress={handleSolicitarResena}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Enviar Código de Verificación</Text>
                )}
              </Pressable>
            </ScrollView>
          ) : (
            <View>
              <Text style={styles.verificationText}>
                Hemos enviado un código a <Text style={{fontWeight: 'bold'}}>{formData.correo}</Text>.
                Introduce el código abajo o haz clic en el enlace del correo.
              </Text>

              <TextInput
                style={[styles.textInput, { textAlign: 'center', fontSize: 24, letterSpacing: 5 }]}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />

              <Pressable
                style={[styles.modalButton, isSubmitting && styles.disabledButton]}
                onPress={handleVerificarCodigo}
                disabled={isSubmitting}
              >
                 {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Verificar y Publicar</Text>
                )}
              </Pressable>
              
              <Pressable style={{marginTop: 15}} onPress={() => setStep(1)}>
                  <Text style={{color: '#666', textAlign: 'center'}}>Volver / Corregir correo</Text>
              </Pressable>
            </View>
          )}
        </View>
      </BlurModal>

      {/* --- MODAL DETALLE DE PROFESOR --- */}
      {selectedProfesor && (
        <BlurModal
          visible={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          containerStyle={styles.detailModalContainer}
        >
          <View style={styles.detailHeader}>
            <View style={[styles.avatarPlaceholder, { width: 60, height: 60, borderRadius: 30 }]}>
                 <Text style={{fontSize: 24, fontWeight: 'bold', color: PRIMARY_COLOR}}>
                    {selectedProfesor.nombre.charAt(0)}
                 </Text>
            </View>
            <Text style={styles.detailName}>{selectedProfesor.nombre}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5}}>
                <Text style={{fontSize: 18, fontWeight: 'bold'}}>{selectedProfesor.average.toFixed(1)}</Text>
                <StarRating rating={Math.round(selectedProfesor.average)} readOnly size={18} />
                <Text style={{color: '#666'}}>({selectedProfesor.reviews.length})</Text>
            </View>
          </View>

          <ScrollView style={styles.reviewsList}>
            {selectedProfesor.reviews.map((review, idx) => (
                <View key={idx} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                        <Text style={styles.reviewMateria}>{review.materia}</Text>
                        <StarRating rating={review.satisfaccion} readOnly size={12} />
                    </View>
                    <Text style={styles.reviewContent}>{review.contenido}</Text>
                    <Text style={styles.reviewAuthor}>Alumno: {review.alumno.substring(0, 8)}...</Text> 
                </View>
            ))}
          </ScrollView>

          <Pressable style={styles.closeDetailButton} onPress={() => setDetailModalVisible(false)}>
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
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 15
  },
  backButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  headerTitle: {
    fontSize: isMobile ? 18 : 22,
  },
  controlsContainer: {
    padding: 16,
    flexDirection: isMobile ? 'column' : 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 45,
  },
  searchIcon: {
    width: 20, 
    height: 20, 
    marginRight: 8, 
    tintColor: '#999'
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // --- GRID STYLES ---
  gridContainer: {
    padding: 16,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMobile: {
    width: '100%',
  },
  cardDesktop: {
    width: '31%', // Aprox 3 por fila
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cardMaterias: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
  },
  materiasLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 2,
  },
  materiasText: {
    fontSize: 12,
    color: '#444',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  // --- MODAL STYLES ---
  modalContainer: {
    width: isMobile ? '90%' : 500,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
    marginTop: 10,
  },
  dropdown: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
    lineHeight: 22,
  },
  // --- DETAIL MODAL ---
  detailModalContainer: {
    width: isMobile ? '90%' : 600,
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailHeader: {
    padding: 20,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'center',
  },
  reviewsList: {
    padding: 16,
  },
  reviewItem: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewMateria: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  reviewContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  closeDetailButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  closeDetailText: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    fontSize: 16,
  }
});