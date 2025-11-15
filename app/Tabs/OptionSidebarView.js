import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Modal,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import TextTitle from "../../components/TextTitle";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import { useEffect, useState } from "react";
import { useUserData } from "../../hooks/useUserData";
import { API_BASE_URL } from "../../config/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OptionSidebarView({ onClose }) {
  const insets = useSafeAreaInsets();

  const [materias, setMaterias] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [profesores, setProfesores] = useState([]);

  const [materiaValues, setMateriaValues] = useState([]);
  const [maestroValues, setMaestroValues] = useState([]);
  const [horarioValues, setHorarioValues] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados para el modal
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [profesorPreferences, setProfesorPreferences] = useState({});
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  
  // Estado para guardar las materias añadidas
  const [materiasAnadidas, setMateriasAnadidas] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Estado para el modal de opciones de generación
  const [modalOpcionesVisible, setModalOpcionesVisible] = useState(false);
  const [opcionesGeneracion, setOpcionesGeneracion] = useState({
    evitarEmpalmes: true,
    maximizarDiasLibres: false,
    minimizarHuecos: true,
    horarioPreferido: 'cualquiera', // 'matutino', 'vespertino', 'cualquiera'
    numeroHorarios: 5,
  });
  
  // Estado para búsqueda de profesores
  const [searchProfesor, setSearchProfesor] = useState('');

  const { userData, loading } = useUserData();

  // Cargar materias añadidas desde AsyncStorage al inicio
  useEffect(() => {
    loadMateriasAnadidas();
  }, []);

  // Función para cargar las materias guardadas
  const loadMateriasAnadidas = async () => {
    try {
      const materiasGuardadas = await AsyncStorage.getItem('materiasAnadidas');
      if (materiasGuardadas) {
        setMateriasAnadidas(JSON.parse(materiasGuardadas));
        console.log('Materias cargadas desde AsyncStorage:', JSON.parse(materiasGuardadas));
      }
    } catch (error) {
      console.error('Error al cargar materias añadidas:', error);
    }
  };

  // Función para guardar las materias en AsyncStorage
  const saveMateriasAnadidas = async (materias) => {
    try {
      await AsyncStorage.setItem('materiasAnadidas', JSON.stringify(materias));
      console.log('Materias guardadas en AsyncStorage:', materias);
    } catch (error) {
      console.error('Error al guardar materias añadidas:', error);
    }
  };

  // Guardar automáticamente cuando cambian las materias añadidas
  useEffect(() => {
    if (materiasAnadidas.length >= 0) {
      saveMateriasAnadidas(materiasAnadidas);
    }
  }, [materiasAnadidas]);

  /*
    Shema Materias:
    [
  {
    "clave": "string",
    "nombre": "string"
  }
]
  */
  const fetchMaterias = async () => {
    try {
      //materias/?offset=0&limit=1000&ciclo=2025B&carrera=ICOM&centro=CUCEI
      const response = await fetch(
        `${API_BASE_URL}/materias/?offset=0&limit=1000&ciclo=${userData.calendario}&carrera=${userData.carrera}&centro=${userData.centroUniversitario}`
      );
      const materias = await response.json();
      const materiaList = materias
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((materia) => ({
          label: `${materia.clave} - ${materia.nombre}`,
          value: materia.clave,
        }));
      setMaterias(materiaList);
      console.log("Materias obtenidas:", materiaList);
      // Aquí puedes actualizar el estado con las materias obtenidas
    } catch (error) {
      console.error("Error al obtener las materias:", error);
    }
  };

  useEffect(() => {
    if (userData && !loading) {
      fetchMaterias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, loading]);

  /*
    Schema Secciones:
    [
  {
    "numero": "string",
    "nrc": "string",
    "profesor": "string",
    "centro": "string",
    "sesiones": [
      {
        "salon": "string",
        "edificio": "string",
        "fecha_inicio": "2025-11-15",
        "fecha_fin": "2025-11-15",
        "hora_inicio": "05:02:23.362Z",
        "hora_fin": "05:02:23.362Z",
        "dia_semana": 0
      }
    ],
    "cupos": 0,
    "disponibilidad": 0
  }
]
    */

  const fetchSecciones = async (materia) => {
    //materia/IL2020/2025B/secciones
    try {
      setLoadingSecciones(true);
      const response = await fetch(
        `${API_BASE_URL}/materia/${materia}/${userData.calendario}/secciones`
      );
      const data = await response.json();
      setSecciones(data);
      
      // Extraer profesores únicos y ordenarlos alfabéticamente
      const profesoresUnicos = [...new Set(data.map(seccion => seccion.profesor))].sort((a, b) => a.localeCompare(b));
      setProfesores(profesoresUnicos);
      
      // Inicializar preferencias si es nueva materia
      if (editingIndex === null) {
        const initialPreferences = {};
        profesoresUnicos.forEach(profesor => {
          initialPreferences[profesor] = 0; // 0 = neutral por defecto
        });
        setProfesorPreferences(initialPreferences);
      }
      
    } catch (error) {
      console.error("Error al obtener las secciones:", error);
    } finally {
      setLoadingSecciones(false);
    }
  };

  // Función para manejar la selección de preferencia de profesor
  const handleProfesorPreference = (profesor, preference) => {
    setProfesorPreferences(prev => ({
      ...prev,
      [profesor]: prev[profesor] === preference ? 0 : preference
    }));
  };

  // Función para guardar la materia con sus profesores y preferencias
  const handleSaveMateria = () => {
    if (!selectedMateria) return;

    const materiaData = {
      clave: selectedMateria,
      nombreMateria: materias.find(m => m.value === selectedMateria)?.label || '',
      profesores: profesorPreferences
    };

    if (editingIndex !== null) {
      // Editar materia existente
      const nuevasMateriasAnadidas = [...materiasAnadidas];
      nuevasMateriasAnadidas[editingIndex] = materiaData;
      setMateriasAnadidas(nuevasMateriasAnadidas);
      setEditingIndex(null);
    } else {
      // Verificar si la materia ya existe
      const materiaExiste = materiasAnadidas.some(m => m.clave === selectedMateria);
      
      if (materiaExiste) {
        alert('Esta materia ya ha sido añadida. Puedes editarla desde la lista.');
        return;
      }
      
      // Añadir nueva materia
      setMateriasAnadidas([...materiasAnadidas, materiaData]);
    }

    // Limpiar y cerrar modal
    handleCloseModal();
  };

  // Función para cerrar el modal y limpiar estados
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMateria(null);
    setProfesores([]);
    setProfesorPreferences({});
    setSecciones([]);
    setEditingIndex(null);
    setSearchProfesor('');
  };

  // Función para abrir el modal en modo edición
  const handleEditMateria = (index) => {
    const materia = materiasAnadidas[index];
    setSelectedMateria(materia.clave);
    setProfesorPreferences(materia.profesores);
    setEditingIndex(index);
    setModalVisible(true);
    fetchSecciones(materia.clave);
  };

  // Función para eliminar una materia
  const handleDeleteMateria = (index) => {
    const nuevasMateriasAnadidas = materiasAnadidas.filter((_, i) => i !== index);
    setMateriasAnadidas(nuevasMateriasAnadidas);
  };

  // Función para limpiar todas las materias
  const handleLimpiarTodasLasMaterias = async () => {
    try {
      await AsyncStorage.removeItem('materiasAnadidas');
      setMateriasAnadidas([]);
      console.log('Todas las materias han sido eliminadas');
    } catch (error) {
      console.error('Error al limpiar materias:', error);
    }
  };

  // Función para generar horarios
  const handleGenerarHorarios = () => {
    console.log('Generando horarios con opciones:', opcionesGeneracion);
    console.log('Materias para generar:', materiasAnadidas);
    // Aquí irá la lógica de generación de horarios
    alert('Funcionalidad de generación de horarios en desarrollo');
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Leyenda de contexto */}
        {userData && (
          <View style={styles.contextoBanner}>
            <Text style={styles.contextoText}>
              {userData.centroUniversitario} &gt; {userData.calendario} &gt; {userData.carrera}
            </Text>
          </View>
        )}
        
        {/* Encabezado */}
          <View style={styles.header}>
            <TextTitle>Condiciones</TextTitle>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Añadir Materia"
              onPress={() => {
                setModalVisible(true);
              }}
              
            />
          </View>

          {/* Materias añadidas */}
          {materiasAnadidas.length > 0 && (
            <View style={styles.materiasAnadidasContainer}>
              <View style={styles.materiasAnadidasHeader}>
                <Text style={styles.materiasAnadidasTitle}>Materias Añadidas:</Text>
                <Pressable 
                  style={styles.limpiarTodoButton}
                  onPress={handleLimpiarTodasLasMaterias}
                >
                  <Text style={styles.limpiarTodoButtonText}>Limpiar Todo</Text>
                </Pressable>
              </View>
              {materiasAnadidas.map((materia, index) => (
                <View key={index} style={styles.materiaCard}>
                  <Pressable 
                    style={styles.materiaCardContent}
                    onPress={() => handleEditMateria(index)}
                  >
                    <View style={styles.materiaInfo}>
                      <Text style={styles.materiaCardTitle} numberOfLines={2}>
                        {materia.nombreMateria}
                      </Text>
                      <Text style={styles.materiaCardSubtitle}>
                        {Object.keys(materia.profesores).length} profesores seleccionados
                      </Text>
                      
                      {/* Mostrar preferencias resumidas */}
                      <View style={styles.preferenceSummary}>
                        <View style={styles.preferenceSummaryItem}>
                          <Image 
                            source={require('../../assets/images/like_used.svg')}
                            style={styles.preferenceSummaryIcon}
                            contentFit="contain"
                          />
                          <Text style={styles.preferenceSummaryText}>
                            {Object.values(materia.profesores).filter(p => p === 1).length}
                          </Text>
                        </View>
                        <View style={styles.preferenceSummaryItem}>
                          <Image 
                            source={require('../../assets/images/dislike_used.svg')}
                            style={styles.preferenceSummaryIcon}
                            contentFit="contain"
                          />
                          <Text style={styles.preferenceSummaryText}>
                            {Object.values(materia.profesores).filter(p => p === 2).length}
                          </Text>
                        </View>
                        <View style={styles.preferenceSummaryItem}>
                          <View style={styles.neutralCircle} />
                          <Text style={styles.preferenceSummaryText}>
                            {Object.values(materia.profesores).filter(p => p === 0).length}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Pressable 
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteMateria(index);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </Pressable>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Botones de generación de horario */}
          <View style={styles.generarHorarioContainer}>
            <Pressable 
              style={[
                styles.generarHorarioButton,
                materiasAnadidas.length === 0 && styles.generarHorarioButtonDisabled
              ]}
              onPress={handleGenerarHorarios}
              disabled={materiasAnadidas.length === 0}
            >
              <Text style={[
                styles.generarHorarioButtonText,
                materiasAnadidas.length === 0 && styles.generarHorarioButtonTextDisabled
              ]}>
                Generar Horario
              </Text>
            </Pressable>
            
            <Pressable 
              style={styles.opcionesButton}
              onPress={() => setModalOpcionesVisible(true)}
            >
              <Image 
                source={require('../../assets/images/settings.svg')} 
                style={styles.opcionesButtonIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>
      </ScrollView>

      {/* MODAL DE OPCIONES */}
      <Modal transparent={true} visible={modalOpcionesVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalOpcionesContainer}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={styles.modalOpcionesTitle}>Opciones de Generación</Text>
              
              {/* Opción: Evitar empalmes */}
              <View style={styles.opcionItem}>
                <View style={styles.opcionTextos}>
                  <Text style={styles.opcionLabel}>Evitar empalmes de horario</Text>
                  <Text style={styles.opcionDescripcion}>No permitir materias que se traslapen</Text>
                </View>
                <Pressable
                  style={[styles.toggleButton, opcionesGeneracion.evitarEmpalmes && styles.toggleButtonActive]}
                  onPress={() => setOpcionesGeneracion(prev => ({...prev, evitarEmpalmes: !prev.evitarEmpalmes}))}
                >
                  <Text style={styles.toggleButtonText}>
                    {opcionesGeneracion.evitarEmpalmes ? '✓' : ''}
                  </Text>
                </Pressable>
              </View>

              {/* Opción: Maximizar días libres */}
              <View style={styles.opcionItem}>
                <View style={styles.opcionTextos}>
                  <Text style={styles.opcionLabel}>Maximizar días libres</Text>
                  <Text style={styles.opcionDescripcion}>Intentar agrupar clases en menos días</Text>
                </View>
                <Pressable
                  style={[styles.toggleButton, opcionesGeneracion.maximizarDiasLibres && styles.toggleButtonActive]}
                  onPress={() => setOpcionesGeneracion(prev => ({...prev, maximizarDiasLibres: !prev.maximizarDiasLibres}))}
                >
                  <Text style={styles.toggleButtonText}>
                    {opcionesGeneracion.maximizarDiasLibres ? '✓' : ''}
                  </Text>
                </Pressable>
              </View>

              {/* Opción: Minimizar huecos */}
              <View style={styles.opcionItem}>
                <View style={styles.opcionTextos}>
                  <Text style={styles.opcionLabel}>Minimizar huecos entre clases</Text>
                  <Text style={styles.opcionDescripcion}>Reducir tiempos libres entre materias</Text>
                </View>
                <Pressable
                  style={[styles.toggleButton, opcionesGeneracion.minimizarHuecos && styles.toggleButtonActive]}
                  onPress={() => setOpcionesGeneracion(prev => ({...prev, minimizarHuecos: !prev.minimizarHuecos}))}
                >
                  <Text style={styles.toggleButtonText}>
                    {opcionesGeneracion.minimizarHuecos ? '✓' : ''}
                  </Text>
                </Pressable>
              </View>

              {/* Horario preferido */}
              <View style={styles.opcionItemTitulo}>
                <Text style={styles.opcionLabel}>Horario preferido</Text>
              </View>
              <View style={styles.horarioPreferidoContainer}>
                {['cualquiera', 'matutino', 'vespertino'].map(tipo => (
                  <Pressable
                    key={tipo}
                    style={[
                      styles.horarioPreferidoButton,
                      opcionesGeneracion.horarioPreferido === tipo && styles.horarioPreferidoButtonActive
                    ]}
                    onPress={() => setOpcionesGeneracion(prev => ({...prev, horarioPreferido: tipo}))}
                  >
                    <Text style={[
                      styles.horarioPreferidoButtonText,
                      opcionesGeneracion.horarioPreferido === tipo && styles.horarioPreferidoButtonTextActive
                    ]}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Número de horarios a generar */}
              <View style={styles.opcionItemTitulo}>
                <Text style={styles.opcionLabel}>Número de horarios a generar</Text>
              </View>
              <View style={styles.numeroHorariosContainer}>
                {[3, 5, 10, 15].map(num => (
                  <Pressable
                    key={num}
                    style={[
                      styles.numeroHorarioButton,
                      opcionesGeneracion.numeroHorarios === num && styles.numeroHorarioButtonActive
                    ]}
                    onPress={() => setOpcionesGeneracion(prev => ({...prev, numeroHorarios: num}))}
                  >
                    <Text style={[
                      styles.numeroHorarioButtonText,
                      opcionesGeneracion.numeroHorarios === num && styles.numeroHorarioButtonTextActive
                    ]}>
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Botones del modal de opciones */}
            <View style={styles.modalOpcionesButtons}>
              <Button 
                title="Guardar Opciones" 
                onPress={() => {
                  setModalOpcionesVisible(false);
                  console.log('Opciones guardadas:', opcionesGeneracion);
                }}
              />
              <View style={{height: 10}} />
              <Button 
                title="Cerrar" 
                onPress={() => setModalOpcionesVisible(false)}
                color="#888"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* EL POP-UP */}
      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: '90%',
              maxWidth: 500,
              maxHeight: '80%',
              padding: 20,
              backgroundColor: "white",
              borderRadius: 10,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
              >
                {editingIndex !== null ? "Editar Materia" : "Materia a seleccionar"}
              </Text>
              
              <Dropdown
                placeholder="Selecciona una materia"
                data={materias.filter(m => {
                  // Si estamos editando, permitir la materia actual
                  if (editingIndex !== null) {
                    return true;
                  }
                  // Si es nueva, filtrar las ya añadidas
                  return !materiasAnadidas.some(ma => ma.clave === m.value);
                })}
                labelField="label"
                valueField="value"
                style={styles.dropdown}
                maxHeight={200}
                selectedTextStyle={{ color: "black" }}
                placeholderStyle={{ color: "gray" }}
                search
                searchPlaceholder="Buscar..."
                value={selectedMateria}
                onChange={(item) => {
                  console.log("Materia seleccionada:", item);
                  setSelectedMateria(item.value);
                  fetchSecciones(item.value);
                }}
              />

              {/* Loading de secciones */}
              {loadingSecciones && (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={{ marginTop: 10 }}>Cargando profesores...</Text>
                </View>
              )}

              {/* Lista de profesores con botones like/dislike */}
              {!loadingSecciones && profesores.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
                    Selecciona tus preferencias de profesores:
                  </Text>
                  
                  {/* Buscador de profesores */}
                  <TextInput
                    style={styles.searchProfesorInput}
                    placeholder="Buscar profesor..."
                    value={searchProfesor}
                    onChangeText={setSearchProfesor}
                  />
                  
                  {profesores
                    .filter(profesor => 
                      profesor.toLowerCase().includes(searchProfesor.toLowerCase())
                    )
                    .map((profesor, index) => (
                    <View key={index} style={styles.profesorItem}>
                      <Text style={styles.profesorNombre} numberOfLines={2}>
                        {profesor}
                      </Text>
                      
                      <View style={styles.preferenceButtons}>
                        {/* Botón Like */}
                        <Pressable
                          style={[
                            styles.preferenceButton,
                            profesorPreferences[profesor] === 1 && styles.likeActive
                          ]}
                          onPress={() => handleProfesorPreference(profesor, 1)}
                        >
                          <Image 
                            source={profesorPreferences[profesor] === 1 
                              ? require('../../assets/images/like_used.svg')
                              : require('../../assets/images/like.svg')
                            }
                            style={styles.preferenceIcon}
                            contentFit="contain"
                          />
                        </Pressable>

                        {/* Botón Dislike */}
                        <Pressable
                          style={[
                            styles.preferenceButton,
                            profesorPreferences[profesor] === 2 && styles.dislikeActive
                          ]}
                          onPress={() => handleProfesorPreference(profesor, 2)}
                        >
                          <Image 
                            source={profesorPreferences[profesor] === 2 
                              ? require('../../assets/images/dislike_used.svg')
                              : require('../../assets/images/dislike.svg')
                            }
                            style={styles.preferenceIcon}
                            contentFit="contain"
                          />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  
                  {/* Mensaje si no hay resultados */}
                  {profesores.filter(profesor => 
                    profesor.toLowerCase().includes(searchProfesor.toLowerCase())
                  ).length === 0 && searchProfesor.trim() !== '' && (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No se encontraron profesores con &quot;{searchProfesor}&quot;
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Botones del modal */}
            <View style={{ marginTop: 15, gap: 10 }}>
              <Button 
                title={editingIndex !== null ? "Guardar Cambios" : "Guardar Materia"} 
                onPress={handleSaveMateria}
                disabled={!selectedMateria || profesores.length === 0}
              />
              <Button 
                title="Cancelar" 
                onPress={handleCloseModal}
                color="#888"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    borderColor: "black",
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 20,
  },
  contextoBanner: {
    width: "100%",
    marginBottom: 10,
  },
  contextoText: {
    fontSize: 12,
    color: "#666",
    textAlign: "left",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    marginBottom: 10,
  },
  dropdown: {
    padding: 10,
    fontSize: 16,
    borderColor: "black",
    borderWidth: 1,
    marginVertical: 5,
    width: "100%",
  },
  textInputForm: {
    padding: 10,
    fontSize: 16,
    borderColor: "black",
    borderWidth: 1,
    marginBottom: 5,
    width: "100%",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 10,
  },
  // Estilos para materias añadidas
  materiasAnadidasContainer: {
    width: "100%",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  materiasAnadidasHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  materiasAnadidasTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  limpiarTodoButton: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  limpiarTodoButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  materiaCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  materiaCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  materiaInfo: {
    flex: 1,
    marginRight: 10,
  },
  materiaCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  materiaCardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  preferenceSummary: {
    flexDirection: "row",
    gap: 10,
  },
  preferenceSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  preferenceSummaryIcon: {
    width: 16,
    height: 16,
  },
  preferenceSummaryText: {
    fontSize: 14,
    color: "#555",
  },
  neutralCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#999",
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Estilos para el modal de profesores
  profesorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  profesorNombre: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  preferenceButtons: {
    flexDirection: "row",
    gap: 8,
  },
  preferenceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  preferenceIcon: {
    width: 24,
    height: 24,
  },
  likeActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#2E7D32",
  },
  dislikeActive: {
    backgroundColor: "#F44336",
    borderColor: "#C62828",
  },
  // Estilos para búsqueda de profesores
  searchProfesorInput: {
    padding: 10,
    fontSize: 14,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  // Estilos para botones de generación
  generarHorarioContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  generarHorarioButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  generarHorarioButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  generarHorarioButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  generarHorarioButtonTextDisabled: {
    color: "#888",
  },
  opcionesButton: {
    width: 50,
    height: 50,
    backgroundColor: "#555",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  opcionesButtonIcon: {
    width: 28,
    height: 28,
  },
  // Estilos para modal de opciones
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalOpcionesContainer: {
    width: '90%',
    maxWidth: 450,
    maxHeight: '85%',
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalOpcionesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  opcionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  opcionItemTitulo: {
    marginBottom: 12,
  },
  opcionTextos: {
    flex: 1,
    marginRight: 10,
  },
  opcionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  opcionDescripcion: {
    fontSize: 13,
    color: "#666",
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ccc",
  },
  toggleButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#2E7D32",
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  horarioPreferidoContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  horarioPreferidoButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  horarioPreferidoButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#0056b3",
  },
  horarioPreferidoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  horarioPreferidoButtonTextActive: {
    color: "#fff",
  },
  numeroHorariosContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  numeroHorarioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  numeroHorarioButtonActive: {
    backgroundColor: "#FF9800",
    borderColor: "#F57C00",
  },
  numeroHorarioButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  numeroHorarioButtonTextActive: {
    color: "#fff",
  },
  modalOpcionesButtons: {
    marginTop: 15,
  },
});
