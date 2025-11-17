import {
  View,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import TextTitle from "../../components/TextTitle";
import BlurModal from "../../components/BlurModal";
import { Dropdown } from "react-native-element-dropdown";
import { useEffect, useState, useCallback } from "react";
import { useUserData } from "../../hooks/useUserData";
import { API_BASE_URL } from "../../config/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function OptionSidebarView({ onClose }) {
  const insets = useSafeAreaInsets();

  const [materias, setMaterias] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [profesores, setProfesores] = useState([]);

  //const [materiaValues, setMateriaValues] = useState([]);
  //const [maestroValues, setMaestroValues] = useState([]);
  //const [horarioValues, setHorarioValues] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados para el modal
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [profesorPreferences, setProfesorPreferences] = useState({});
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  
  // Estado para guardar las materias añadidas
  const [materiasAnadidas, setMateriasAnadidas] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Estado para el modal de opciones de generación
  const [modalOpcionesVisible, setModalOpcionesVisible] = useState(false);
  const [opcionesGeneracion, setOpcionesGeneracion] = useState({
    // General
    cupos: true,
    periodos: false,
    maxHorarios: 5,
    huecosFinales: -1,
    huecosIntermedios: -1,
    // Orden de los grupos
    prioridadHora: 0,
    prioridadDemanda: 0,
  });
  
  // Estado para mostrar tooltips
  const [tooltipVisible, setTooltipVisible] = useState(null);  // Estado para búsqueda de profesores
  const [searchProfesor, setSearchProfesor] = useState('');
  
  // Estados para modales de confirmación
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [modalConfirmarLimpiar, setModalConfirmarLimpiar] = useState(false);
  const [materiaAEliminar, setMateriaAEliminar] = useState(null);
  const [modalCambioCiclo, setModalCambioCiclo] = useState(false);
  const [cicloAnterior, setCicloAnterior] = useState('');

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

  // Función para confirmar limpiar todas las materias
  const confirmarLimpiarTodasLasMaterias = async () => {
    try {
      await AsyncStorage.removeItem('materiasAnadidas');
      await AsyncStorage.removeItem('cicloMaterias');
      setMateriasAnadidas([]);
      console.log('Todas las materias han sido eliminadas');
    } catch (error) {
      console.error('Error al limpiar materias:', error);
    }
    setModalConfirmarLimpiar(false);
  };

  // Función para verificar si el ciclo cambió
  const verificarCambioCiclo = useCallback(async () => {
    if (!userData || !userData.calendario) return;
    
    try {
      const cicloGuardado = await AsyncStorage.getItem('cicloMaterias');
      
      console.log('Verificando ciclo - Guardado:', cicloGuardado, 'Actual:', userData.calendario);
      
      if (cicloGuardado && cicloGuardado.trim() !== userData.calendario.trim()) {
        // El ciclo cambió - mostrar modal personalizado
        console.log('¡Ciclo diferente detectado!');
        setCicloAnterior(cicloGuardado);
        setModalCambioCiclo(true);
      } else if (!cicloGuardado && materiasAnadidas.length > 0) {
        // No hay ciclo guardado pero hay materias, guardar el ciclo actual
        console.log('Guardando ciclo actual:', userData.calendario);
        await AsyncStorage.setItem('cicloMaterias', userData.calendario);
      }
    } catch (error) {
      console.error('Error al verificar cambio de ciclo:', error);
    }
  }, [userData, materiasAnadidas.length]);

  // Función para mantener materias del ciclo anterior
  const handleMantenerMaterias = async () => {
    try {
      // Actualizar el ciclo del usuario al ciclo de las materias guardadas
      await AsyncStorage.setItem('calendario', cicloAnterior);
      
      // Recargar la página para que se actualicen todos los datos con el ciclo anterior
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
      
      // Cerrar el modal
      setModalCambioCiclo(false);
    } catch (error) {
      console.error('Error al mantener materias:', error);
    }
  };

  // Función para limpiar materias por cambio de ciclo
  const handleLimpiarPorCambioCiclo = async () => {
    try {
      await AsyncStorage.removeItem('materiasAnadidas');
      await AsyncStorage.setItem('cicloMaterias', userData.calendario);
      setMateriasAnadidas([]);
      setModalCambioCiclo(false);
    } catch (error) {
      console.error('Error al limpiar materias:', error);
    }
  };

  // Verificar si el ciclo cambió cuando userData esté disponible
  useEffect(() => {
    if (userData && materiasAnadidas.length > 0) {
      verificarCambioCiclo();
    }
  }, [userData, verificarCambioCiclo, materiasAnadidas.length]);

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
      setLoadingMaterias(true);
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
    } finally {
      setLoadingMaterias(false);
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
  const handleSaveMateria = async () => {
    if (!selectedMateria) return;

    const materiaData = {
      clave: selectedMateria,
      nombreMateria: materias.find(m => m.value === selectedMateria)?.label || '',
      profesores: profesorPreferences
    };
    
    // Guardar el ciclo actual cuando se añade la primera materia
    if (materiasAnadidas.length === 0) {
      await AsyncStorage.setItem('cicloMaterias', userData.calendario);
    }

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

  // Función para mostrar modal de confirmación de eliminación
  const handleDeleteMateria = (index) => {
    setMateriaAEliminar(index);
    setModalConfirmarEliminar(true);
  };
  
  // Función para confirmar eliminación de materia
  const confirmarEliminarMateria = () => {
    if (materiaAEliminar !== null) {
      const nuevasMateriasAnadidas = materiasAnadidas.filter((_, i) => i !== materiaAEliminar);
      setMateriasAnadidas(nuevasMateriasAnadidas);
    }
    setModalConfirmarEliminar(false);
    setMateriaAEliminar(null);
  };

  // Función para mostrar modal de confirmación de limpiar todo
  const handleLimpiarTodasLasMaterias = () => {
    setModalConfirmarLimpiar(true);
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
            <Pressable
              style={styles.anadirMateriaButton}
              onPress={() => {
                setModalVisible(true);
              }}
            >
              <View style={styles.buttonContent}>
                <Image 
                  source={require('../../assets/images/add.svg')}
                  style={styles.anadirMateriaButtonIcon}
                  contentFit="contain"
                />
                <Text style={styles.anadirMateriaButtonText}>Añadir Materia</Text>
              </View>
            </Pressable>
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
                  <View style={styles.buttonContent}>
                    <Image 
                      source={require('../../assets/images/trash-bin.svg')}
                      style={styles.limpiarTodoButtonIcon}
                      contentFit="contain"
                    />
                    <Text style={styles.limpiarTodoButtonText}>Limpiar Todo</Text>
                  </View>
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
                      <Image 
                        source={require('../../assets/images/trash-bin.svg')}
                        style={styles.deleteButtonIcon}
                        contentFit="contain"
                      />
                    </Pressable>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Botón Preferencias Horarios - Solo visible en móviles */}
          {isMobile && (
            <View style={styles.preferenciasHorariosContainer}>
              <Pressable 
                style={styles.preferenciasHorariosButton}
                onPress={onClose}
              >
                <View style={styles.buttonContent}>
                  <Image 
                    source={require('../../assets/images/alarm.svg')}
                    style={styles.preferenciasHorariosButtonIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.preferenciasHorariosButtonText}>
                    Preferencias Horarios
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* Botones de generación de horario */}
          <View style={styles.generarHorarioContainer}>
            <Pressable 
              style={
                materiasAnadidas.length === 0 
                  ? styles.generarHorarioButtonDisabled
                  : styles.generarHorarioButton
              }
              onPress={() => setModalOpcionesVisible(true)}
              disabled={materiasAnadidas.length === 0}
            >
              <View style={styles.buttonContent}>
                <Image 
                  source={require('../../assets/images/calendar-search.svg')}
                  style={styles.generarHorarioButtonIcon}
                  contentFit="contain"
                />
                <Text style={
                  materiasAnadidas.length === 0
                    ? styles.generarHorarioButtonTextDisabled
                    : styles.generarHorarioButtonText
                }>
                  Opciones de Generación
                </Text>
              </View>
            </Pressable>
          </View>
      </ScrollView>

      {/* MODAL DE CONFIRMACIÓN - CAMBIO DE CICLO */}
      <BlurModal
        visible={modalCambioCiclo}
        slideDistance={300}
        containerStyle={styles.modalConfirmacionContainer}
      >
        <Text style={styles.modalConfirmacionTitle}>Cambio de ciclo detectado</Text>
            <Text style={styles.modalConfirmacionText}>
              Las materias guardadas son del ciclo <Text style={{fontWeight: 'bold'}}>{cicloAnterior}</Text>, pero ahora estás en el ciclo <Text style={{fontWeight: 'bold'}}>{userData?.calendario}</Text>.
            </Text>
            <Text style={styles.modalConfirmacionSubtext}>
              Si mantienes las materias, tu ciclo actual cambiará a <Text style={{fontWeight: 'bold'}}>{cicloAnterior}</Text>. No puedes tener materias de diferentes ciclos.
            </Text>
            
            <View style={styles.modalConfirmacionButtons}>
              <Pressable 
                style={[styles.modalConfirmacionButton, styles.modalConfirmacionButtonCancel]}
                onPress={handleMantenerMaterias}
              >
                <Text style={styles.modalConfirmacionButtonTextCancel}>Mantener</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmacionButton, styles.modalConfirmacionButtonConfirm]}
                onPress={handleLimpiarPorCambioCiclo}
              >
                <Text style={styles.modalConfirmacionButtonTextConfirm}>Limpiar</Text>
              </Pressable>
            </View>
      </BlurModal>

      {/* MODAL DE CONFIRMACIÓN - ELIMINAR MATERIA */}
      <BlurModal
        visible={modalConfirmarEliminar}
        slideDistance={300}
        containerStyle={styles.modalConfirmacionContainer}
      >
        <Text style={styles.modalConfirmacionTitle}>¿Eliminar materia?</Text>
            <Text style={styles.modalConfirmacionText}>
              {materiaAEliminar !== null && materiasAnadidas[materiaAEliminar] && 
                `¿Estás seguro de que deseas eliminar "${materiasAnadidas[materiaAEliminar].nombreMateria}"?`
              }
            </Text>
            <Text style={styles.modalConfirmacionSubtext}>Esta acción no se puede deshacer.</Text>
            
            <View style={styles.modalConfirmacionButtons}>
              <Pressable 
                style={[styles.modalConfirmacionButton, styles.modalConfirmacionButtonCancel]}
                onPress={() => {
                  setModalConfirmarEliminar(false);
                  setMateriaAEliminar(null);
                }}
              >
                <Text style={styles.modalConfirmacionButtonTextCancel}>Cancelar</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmacionButton, styles.modalConfirmacionButtonConfirm]}
                onPress={confirmarEliminarMateria}
              >
                <Text style={styles.modalConfirmacionButtonTextConfirm}>Eliminar</Text>
              </Pressable>
            </View>
      </BlurModal>

      {/* MODAL DE CONFIRMACIÓN - LIMPIAR TODO */}
      <BlurModal
        visible={modalConfirmarLimpiar}
        slideDistance={300}
        containerStyle={styles.modalConfirmacionContainer}
      >
        <Text style={styles.modalConfirmacionTitle}>¿Limpiar todas las materias?</Text>
            <Text style={styles.modalConfirmacionText}>
              ¿Estás seguro de que deseas eliminar todas las materias añadidas?
            </Text>
            <Text style={styles.modalConfirmacionSubtext}>
              Se eliminarán {materiasAnadidas.length} {materiasAnadidas.length === 1 ? 'materia' : 'materias'}. Esta acción no se puede deshacer.
            </Text>
            
            <View style={styles.modalConfirmacionButtons}>
              <Pressable 
                style={[styles.modalConfirmacionButton, styles.modalConfirmacionButtonCancel]}
                onPress={() => setModalConfirmarLimpiar(false)}
              >
                <Text style={styles.modalConfirmacionButtonTextCancel}>Cancelar</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmacionButton, styles.modalConfirmacionButtonConfirm]}
                onPress={confirmarLimpiarTodasLasMaterias}
              >
                <Text style={styles.modalConfirmacionButtonTextConfirm}>Limpiar Todo</Text>
              </Pressable>
            </View>
      </BlurModal>

      {/* MODAL DE OPCIONES */}
      <BlurModal
        visible={modalOpcionesVisible}
        slideDistance={1000}
        containerStyle={styles.modalOpcionesContainer}
      >
        <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={styles.modalOpcionesTitle}>Opciones de Generación</Text>
              
              {/* ============== SECCIÓN: GENERAL ============== */}
              <View style={styles.seccionContainer}>
                <Text style={styles.seccionTitle}>General</Text>
                
                {/* Cupos */}
                <View style={styles.opcionItem}>
                  <View style={styles.opcionTextos}>
                    <View style={styles.opcionLabelContainer}>
                      <Text style={styles.opcionLabel}>Solo grupos con cupo</Text>
                      <Pressable
                        style={styles.tooltipIconButton}
                        onPress={() => setTooltipVisible(tooltipVisible === 'cupos' ? null : 'cupos')}
                      >
                        <Text style={styles.tooltipIcon}>?</Text>
                      </Pressable>
                    </View>
                    {tooltipVisible === 'cupos' && (
                      <Text style={styles.tooltipText}>
                        Si se marca, se descartarán todos los grupos cuyo cupo aparezca en 0.
                      </Text>
                    )}
                  </View>
                  <Pressable
                    style={[styles.toggleButton, opcionesGeneracion.cupos && styles.toggleButtonActive]}
                    onPress={() => setOpcionesGeneracion(prev => ({...prev, cupos: !prev.cupos}))}
                  >
                    {opcionesGeneracion.cupos && (
                      <Image 
                        source={require('../../assets/images/check.svg')}
                        style={styles.toggleCheckIcon}
                        contentFit="contain"
                      />
                    )}
                  </Pressable>
                </View>

                {/* Periodos */}
                <View style={styles.opcionItem}>
                  <View style={styles.opcionTextos}>
                    <View style={styles.opcionLabelContainer}>
                      <Text style={styles.opcionLabel}>Evitar conflictos de &quot;Materias Espejo&quot;</Text>
                      <Pressable
                        style={styles.tooltipIconButton}
                        onPress={() => setTooltipVisible(tooltipVisible === 'periodos' ? null : 'periodos')}
                      >
                        <Text style={styles.tooltipIcon}>?</Text>
                      </Pressable>
                    </View>
                    {tooltipVisible === 'periodos' && (
                      <Text style={styles.tooltipText}>
                        Activa esto si cursarás materias que son equivalentes (mismo ID) pero de diferentes periodos. El combinador evitará que se traslapen.
                      </Text>
                    )}
                  </View>
                  <Pressable
                    style={[styles.toggleButton, opcionesGeneracion.periodos && styles.toggleButtonActive]}
                    onPress={() => setOpcionesGeneracion(prev => ({...prev, periodos: !prev.periodos}))}
                  >
                    {opcionesGeneracion.periodos && (
                      <Image 
                        source={require('../../assets/images/check.svg')}
                        style={styles.toggleCheckIcon}
                        contentFit="contain"
                      />
                    )}
                  </Pressable>
                </View>

                {/* Max Horarios */}
                <View style={styles.opcionItemTitulo}>
                  <View style={styles.opcionLabelContainer}>
                    <Text style={styles.opcionLabel}>Límite de horarios a generar:</Text>
                    <Pressable
                      style={styles.tooltipIconButton}
                      onPress={() => setTooltipVisible(tooltipVisible === 'maxHorarios' ? null : 'maxHorarios')}
                    >
                      <Text style={styles.tooltipIcon}>?</Text>
                    </Pressable>
                  </View>
                  {tooltipVisible === 'maxHorarios' && (
                    <Text style={styles.tooltipText}>
                      El programa dejará de buscar una vez que alcance este número de combinaciones válidas. Usa -1 para &quot;infinito&quot;.
                    </Text>
                  )}
                </View>
                <View style={styles.numeroHorariosContainer}>
                  {[3, 5, 10, 15, -1].map(num => (
                    <Pressable
                      key={num}
                      style={[
                        styles.numeroHorarioButton,
                        opcionesGeneracion.maxHorarios === num && styles.numeroHorarioButtonActive
                      ]}
                      onPress={() => setOpcionesGeneracion(prev => ({...prev, maxHorarios: num}))}
                    >
                      <Text style={[
                        styles.numeroHorarioButtonText,
                        opcionesGeneracion.maxHorarios === num && styles.numeroHorarioButtonTextActive
                      ]}>
                        {num === -1 ? 'Infinito' : num}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Huecos Finales */}
                <View style={styles.opcionItemTitulo}>
                  <View style={styles.opcionLabelContainer}>
                    <Text style={styles.opcionLabel}>Máx. de huecos en horario FINAL:</Text>
                    <Pressable
                      style={styles.tooltipIconButton}
                      onPress={() => setTooltipVisible(tooltipVisible === 'huecosFinales' ? null : 'huecosFinales')}
                    >
                      <Text style={styles.tooltipIcon}>?</Text>
                    </Pressable>
                  </View>
                  {tooltipVisible === 'huecosFinales' && (
                    <Text style={styles.tooltipText}>
                      Es el número máximo de horas libres permitidas en una combinación completa. Si un horario tiene más huecos que este número, será descartado.
                    </Text>
                  )}
                </View>
                <View style={styles.numeroHorariosContainer}>
                  {[0, 1, 2, 3, 4, -1].map(num => (
                    <Pressable
                      key={num}
                      style={[
                        styles.numeroHorarioButton,
                        opcionesGeneracion.huecosFinales === num && styles.numeroHorarioButtonActive
                      ]}
                      onPress={() => setOpcionesGeneracion(prev => ({...prev, huecosFinales: num}))}
                    >
                      <Text style={[
                        styles.numeroHorarioButtonText,
                        opcionesGeneracion.huecosFinales === num && styles.numeroHorarioButtonTextActive
                      ]}>
                        {num === -1 ? 'Infinito' : num}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Huecos Intermedios */}
                <View style={styles.opcionItemTitulo}>
                  <View style={styles.opcionLabelContainer}>
                    <Text style={styles.opcionLabel}>Máx. de huecos en horarios PARCIALES:</Text>
                    <Pressable
                      style={styles.tooltipIconButton}
                      onPress={() => setTooltipVisible(tooltipVisible === 'huecosIntermedios' ? null : 'huecosIntermedios')}
                    >
                      <Text style={styles.tooltipIcon}>?</Text>
                    </Pressable>
                  </View>
                  {tooltipVisible === 'huecosIntermedios' && (
                    <Text style={styles.tooltipText}>
                      (Optimización) Número de huecos permitidos mientras se está construyendo un horario. Ayuda a descartar ramas de búsqueda ineficientes.
                    </Text>
                  )}
                </View>
                <View style={styles.numeroHorariosContainer}>
                  {[0, 1, 2, 3, 4, -1].map(num => (
                    <Pressable
                      key={num}
                      style={[
                        styles.numeroHorarioButton,
                        opcionesGeneracion.huecosIntermedios === num && styles.numeroHorarioButtonActive
                      ]}
                      onPress={() => setOpcionesGeneracion(prev => ({...prev, huecosIntermedios: num}))}
                    >
                      <Text style={[
                        styles.numeroHorarioButtonText,
                        opcionesGeneracion.huecosIntermedios === num && styles.numeroHorarioButtonTextActive
                      ]}>
                        {num === -1 ? 'Infinito' : num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ============== SECCIÓN: ORDEN DE LOS GRUPOS ============== */}
              <View style={styles.seccionContainer}>
                <Text style={styles.seccionTitle}>Orden de los grupos</Text>
                <Text style={styles.seccionInstruccion}>
                  Define cómo se ordenarán los grupos al generar horarios
                </Text>

                {/* Prioridad por Hora */}
                <View style={styles.opcionItemTitulo}>
                  <View style={styles.opcionLabelContainer}>
                    <Text style={styles.opcionLabel}>Por Horario:</Text>
                    <Pressable
                      style={styles.tooltipIconButton}
                      onPress={() => setTooltipVisible(tooltipVisible === 'prioridadHora' ? null : 'prioridadHora')}
                    >
                      <Text style={styles.tooltipIcon}>?</Text>
                    </Pressable>
                  </View>
                  {tooltipVisible === 'prioridadHora' && (
                    <Text style={styles.tooltipText}>
                      Controla la preferencia de horario al generar combinaciones. Valores más altos dan mayor prioridad.
                    </Text>
                  )}
                </View>
                <View style={styles.prioridadOpcionesContainer}>
                  {[
                    { value: 2, label: 'Tarde', sublabel: 'Prioridad alta', icon: require('../../assets/images/moon.svg') },
                    { value: 1, label: 'Tarde', sublabel: 'Prioridad baja', icon: require('../../assets/images/cloud-moon.svg') },
                    { value: 0, label: 'Sin orden', sublabel: '', icon: require('../../assets/images/cloud.svg') },
                    { value: -1, label: 'Temprano', sublabel: 'Prioridad baja', icon: require('../../assets/images/cloud-sun.svg') },
                    { value: -2, label: 'Temprano', sublabel: 'Prioridad alta', icon: require('../../assets/images/sun.svg') },
                  ].map(option => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.prioridadOpcionButton,
                        opcionesGeneracion.prioridadHora === option.value && styles.prioridadOpcionButtonActive
                      ]}
                      onPress={() => setOpcionesGeneracion(prev => ({...prev, prioridadHora: option.value}))}
                    >
                      <View style={styles.prioridadOpcionContent}>
                        <Image 
                          source={option.icon}
                          style={styles.prioridadOpcionIcon}
                          contentFit="contain"
                        />
                        <View style={styles.prioridadOpcionTexts}>
                          <Text style={[
                            styles.prioridadOpcionLabel,
                            opcionesGeneracion.prioridadHora === option.value && styles.prioridadOpcionLabelActive
                          ]}>
                            {option.label}
                          </Text>
                          {option.sublabel !== '' && (
                            <Text style={[
                              styles.prioridadOpcionSublabel,
                              opcionesGeneracion.prioridadHora === option.value && styles.prioridadOpcionSublabelActive
                            ]}>
                              {option.sublabel}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>

                {/* Prioridad por Demanda */}
                <View style={styles.opcionItemTitulo}>
                  <View style={styles.opcionLabelContainer}>
                    <Text style={styles.opcionLabel}>Por Disponibilidad:</Text>
                    <Pressable
                      style={styles.tooltipIconButton}
                      onPress={() => setTooltipVisible(tooltipVisible === 'prioridadDemanda' ? null : 'prioridadDemanda')}
                    >
                      <Text style={styles.tooltipIcon}>?</Text>
                    </Pressable>
                  </View>
                  {tooltipVisible === 'prioridadDemanda' && (
                    <Text style={styles.tooltipText}>
                      Controla la preferencia basada en cuántos lugares libres tiene cada grupo. Valores más altos dan mayor prioridad.
                    </Text>
                  )}
                </View>
                <View style={styles.prioridadOpcionesContainer}>
                  {[
                    { value: 2, label: 'Más llenos', sublabel: 'Prioridad alta', icon: require('../../assets/images/graph-up.svg') },
                    { value: 1, label: 'Más llenos', sublabel: 'Prioridad baja', icon: require('../../assets/images/graph-up.svg') },
                    { value: 0, label: 'Sin orden', sublabel: '', icon: require('../../assets/images/graph.svg') },
                    { value: -1, label: 'Más vacíos', sublabel: 'Prioridad baja', icon: require('../../assets/images/graph-down.svg') },
                    { value: -2, label: 'Más vacíos', sublabel: 'Prioridad alta', icon: require('../../assets/images/graph-down.svg') },
                  ].map(option => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.prioridadOpcionButton,
                        opcionesGeneracion.prioridadDemanda === option.value && styles.prioridadOpcionButtonActive
                      ]}
                      onPress={() => setOpcionesGeneracion(prev => ({...prev, prioridadDemanda: option.value}))}
                    >
                      <View style={styles.prioridadOpcionContent}>
                        <Image 
                          source={option.icon}
                          style={styles.prioridadOpcionIcon}
                          contentFit="contain"
                        />
                        <View style={styles.prioridadOpcionTexts}>
                          <Text style={[
                            styles.prioridadOpcionLabel,
                            opcionesGeneracion.prioridadDemanda === option.value && styles.prioridadOpcionLabelActive
                          ]}>
                            {option.label}
                          </Text>
                          {option.sublabel !== '' && (
                            <Text style={[
                              styles.prioridadOpcionSublabel,
                              opcionesGeneracion.prioridadDemanda === option.value && styles.prioridadOpcionSublabelActive
                            ]}>
                              {option.sublabel}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Botones del modal de opciones */}
            <View style={styles.modalOpcionesButtons}>
              <Pressable 
                style={styles.modalOpcionesButtonPrimary}
                onPress={async () => {
                  // Cargar horarios no disponibles desde AsyncStorage
                  try {
                    const disabledCells = await AsyncStorage.getItem('disabledScheduleCells');
                    const horariosNoDisponibles = disabledCells ? JSON.parse(disabledCells) : {};
                    
                    // Preparar datos para enviar
                    const datosGeneracion = {
                      opciones: opcionesGeneracion,
                      materias: materiasAnadidas,
                      horariosNoDisponibles: horariosNoDisponibles,
                      centroUniversitario: userData.centroUniversitario,
                      calendario: userData.calendario,
                      carrera: userData.carrera,
                    };
                    
                    console.log('=== DATOS PARA GENERAR HORARIOS ===');
                    console.log('Opciones de generación:', opcionesGeneracion);
                    console.log('Materias añadidas:', materiasAnadidas);
                    console.log('Horarios NO disponibles:', horariosNoDisponibles);
                    console.log('Datos completos:', datosGeneracion);
                    console.log('===================================');
                    
                    setModalOpcionesVisible(false);
                    // Aquí irá la lógica de generación de horarios
                    alert('Datos enviados a consola. Revisa la consola para ver la información.');
                  } catch (error) {
                    console.error('Error al cargar horarios no disponibles:', error);
                    alert('Error al cargar configuración de horarios');
                  }
                }}
              >
                <View style={styles.buttonContent}>
                  <Image 
                    source={require('../../assets/images/calendar-search.svg')}
                    style={styles.modalOpcionesButtonIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.modalOpcionesButtonTextPrimary}>Generar Horario</Text>
                </View>
              </Pressable>
              
              <View style={{height: 10}} />
              
              <Pressable 
                style={styles.modalOpcionesButtonSecondary}
                onPress={() => setModalOpcionesVisible(false)}
              >
                <Text style={styles.modalOpcionesButtonTextSecondary}>Cancelar</Text>
              </Pressable>
            </View>
      </BlurModal>

      {/* EL POP-UP */}
      <BlurModal
        visible={modalVisible}
        slideDistance={1000}
        fastAnimation={true}
        statusBarTranslucent={false}
        containerStyle={{
          width: '90%',
          maxWidth: 500,
          maxHeight: '80%',
          padding: 20,
          backgroundColor: "white",
          borderRadius: 10,
          shadowColor: "#000000ff",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
              >
                {editingIndex !== null ? "Editar Materia" : "Materia a seleccionar"}
              </Text>
              
              <View style={{ zIndex: 9999, elevation: 9999 }}>
                <Dropdown
                  placeholder="Selecciona una materia"
                  
                  disable={loadingMaterias} 
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
                  maxHeight={300}
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
                  autoScroll={false}
                  dropdownPosition="auto"
                  flatListProps={{
                    nestedScrollEnabled: true,
                  }}
                  

                />
              </View>
              {/* Loading de materias*/}
              {loadingMaterias && (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  <Text style={{ marginTop: 10 }}>Cargando materias...</Text>
                </View>
              )}
              {/* Loading de secciones */}
              {loadingSecciones && (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
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
            <View style={{ marginTop: 15, gap: 10}}>
              <Pressable 
                style={
                  !selectedMateria || profesores.length === 0
                    ? styles.modalButtonDisabled
                    : styles.modalButtonPrimary
                }
                onPress={handleSaveMateria}
                disabled={!selectedMateria || profesores.length === 0}
              >
                <Text style={
                  !selectedMateria || profesores.length === 0
                    ? styles.modalButtonTextDisabled
                    : styles.modalButtonTextPrimary
                }>
                  {editingIndex !== null ? "Guardar Cambios" : "Guardar Materia"}
                </Text>
              </Pressable>
              
              <Pressable 
                style={styles.modalButtonSecondary}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </Pressable>
            </View>
      </BlurModal>
    </View>
  );
}

const PRIMARY_COLOR = "#007AFF";

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
    zIndex: 2000,
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
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  limpiarTodoButton: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  limpiarTodoButtonIcon: {
    width: 14,
    height: 14,
    tintColor: "#fff",
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
  deleteButtonIcon: {
    width: 16,
    height: 16,
    tintColor: "#fff",
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
  // Estilos para el botón Preferencias Horarios (móvil)
  preferenciasHorariosContainer: {
    width: "100%",
    marginTop: 20,
    marginBottom: 10,
  },
  preferenciasHorariosButton: {
    backgroundColor: "#FF9800",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  preferenciasHorariosButtonIcon: {
    width: 21,
    height: 21,
  },
  preferenciasHorariosButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  generarHorarioButtonIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  generarHorarioButtonDisabled: {
    flex: 1,
    backgroundColor: "#999999",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  generarHorarioButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  generarHorarioButtonTextDisabled: {
    color: "#CCCCCC",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Estilos para modal de opciones
  modalOpcionesContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOpcionesTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  seccionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  seccionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginBottom: 12,
    textAlign: "left",
  },
  seccionInstruccion: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  opcionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  opcionItemTitulo: {
    marginBottom: 12,
  },
  opcionTextos: {
    flex: 1,
    marginRight: 10,
  },
  opcionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  opcionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  opcionDescripcion: {
    fontSize: 13,
    color: "#666",
  },
  tooltipIconButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0056b3",
  },
  tooltipIcon: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  tooltipText: {
    fontSize: 12,
    color: "#555",
    backgroundColor: "#fffbe6",
    padding: 10,
    marginTop: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9800",
    lineHeight: 18,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 15,
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
  toggleCheckIcon: {
    width: 30,
    height: 30,
    tintColor: "#fff",
  },
  numeroHorariosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  numeroHorarioButton: {
    flex: 1,
    minWidth: 60,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  numeroHorarioButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: "#0056b3",
  },
  numeroHorarioButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  numeroHorarioButtonTextActive: {
    color: "#fff",
  },
  prioridadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  prioridadButton: {
    flex: 1,
    minWidth: 50,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  prioridadButtonActive: {
    backgroundColor: "#FF9800",
    borderColor: "#F57C00",
  },
  prioridadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  prioridadButtonTextActive: {
    color: "#fff",
  },
  prioridadOpcionesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  prioridadOpcionButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  prioridadOpcionButtonActive: {
    backgroundColor: "#FF9800",
    borderColor: "#F57C00",
    shadowColor: "#FF9800",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  prioridadOpcionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  prioridadOpcionIcon: {
    width: 24,
    height: 24,
  },
  prioridadOpcionTexts: {
    flex: 1,
  },
  prioridadOpcionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  prioridadOpcionLabelActive: {
    color: "#fff",
  },
  prioridadOpcionSublabel: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  prioridadOpcionSublabelActive: {
    color: "#fff",
    opacity: 0.9,
  },
  modalOpcionesButtons: {
    marginTop: 15,
  },
  // Estilos para modales de confirmación
  modalConfirmacionContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalConfirmacionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalConfirmacionText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  modalConfirmacionSubtext: {
    fontSize: 14,
    color: "#999",
    marginBottom: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalConfirmacionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalConfirmacionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmacionButtonCancel: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  modalConfirmacionButtonConfirm: {
    backgroundColor: "#ff4444",
  },
  modalConfirmacionButtonTextCancel: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmacionButtonTextConfirm: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos para botones del modal de materia
  modalButtonPrimary: {
    backgroundColor: PRIMARY_COLOR,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonDisabled: {
    backgroundColor: "#CCCCCC",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#888",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextDisabled: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextSecondary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos para botón "Añadir Materia"
  anadirMateriaButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  anadirMateriaButtonIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  anadirMateriaButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos para botones del modal de opciones
  modalOpcionesButtonPrimary: {
    backgroundColor: PRIMARY_COLOR,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOpcionesButtonIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  modalOpcionesButtonSecondary: {
    backgroundColor: "#888",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOpcionesButtonTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOpcionesButtonTextSecondary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
