import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import BlurModal from "@/components/BlurModal";
import GeneratedScheduleSidebar from "./GeneratedScheduleSidebar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

/**
 * Página para visualizar el horario generado
 * Muestra una cuadrícula de horario que se va llenando conforme llegan los resultados
 * del generador, junto con un sidebar que lista las materias
 */
export default function GeneratedScheduleView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sidebarWidth, setSidebarWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  // Estado para múltiples horarios generados
  const [horariosGenerados, setHorariosGenerados] = useState([]);
  const [horarioActual, setHorarioActual] = useState(null);

  // Estado para el modal de detalles
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Estado para controlar la visibilidad del sidebar
  const [activSidebar, setActivSidebar] = useState(true);

  // Estado para dimensiones de pantalla (para responsividad en tiempo real)
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const isMobileScreen = screenWidth < 768;

  // Carga los horarios generados desde AsyncStorage (local storage)
  useEffect(() => {
    async function cargarHorariosGenerados() {
      setLoading(true);
      setGenerando(true);
      try {
        const generatedSchedulesRaw = await AsyncStorage.getItem(
          "tempGeneratedSchedules"
        );
        let generatedSchedules = [];
        if (generatedSchedulesRaw) {
          generatedSchedules = JSON.parse(generatedSchedulesRaw);
        }
        setHorariosGenerados(generatedSchedules);
        setHorarioActual(generatedSchedules[0] || null);
      } catch {
        setHorariosGenerados([]);
        setHorarioActual(null);
      }
      setGenerando(false);
      setLoading(false);
    }
    cargarHorariosGenerados();
  }, []);

  // Listener para cambios de tamaño de pantalla (responsividad en tiempo real)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
      // Si cambia a móvil y el sidebar está cerrado, abrirlo
      if (window.width < 768 && !activSidebar) {
        setActivSidebar(true);
      }
    });

    return () => subscription?.remove();
  }, [activSidebar]);

  const daysOfWeek = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const timeSlots = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  const colorsPalette = [
    "#FFB3BA",
    "#FFDFBA",
    "#FFFFBA",
    "#BAFFC9",
    "#BAE1FF",
    "#FFB3E6",
    "#E6B3FF",
    "#FFD6BA",
    "#C9FFE5",
    "#B3D9FF",
  ];

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2000);
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast("Copiado");
    } catch (_error) {
      showToast("Error al copiar");
    }
  };

  const openMateriaDetails = (materia, colorIndex) => {
    setSelectedMateria({ ...materia, colorIndex });
    setModalVisible(true);
  };

  // Función para obtener la materia en una celda específica
  const getMateriaEnCelda = (dia, hora) => {
    const horaInt = parseInt(hora.split(":")[0]);
    const materias = horarioActual?.materias || [];

    for (let i = 0; i < materias.length; i++) {
      const materia = materias[i];

      for (const horario of materia.horarios) {
        if (horario.dia === dia) {
          const horaInicioInt = parseInt(horario.horaInicio.split(":")[0]);
          const horaFinInt =
            parseInt(horario.horaFin.split(":")[0]) +
            (horario.horaFin.split(":")[1] === "00" ? 0 : 1);

          if (horaInt >= horaInicioInt && horaInt < horaFinInt) {
            return {
              materia,
              color: colorsPalette[i % colorsPalette.length],
              esPrimera: horaInt === horaInicioInt,
              duracion: horaFinInt - horaInicioInt,
            };
          }
        }
      }
    }
    return null;
  };

  // Manejar resize del sidebar
  const handleMouseDown = (e) => {
    if (!isMobileScreen) {
      setIsResizing(true);
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleMouseMove = (e) => {
      if (isResizing && !isMobileScreen) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth >= 15 && newWidth <= 50) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isMobileScreen]);
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        {/* Botón de regresar - Solo visible en desktop o cuando sidebar está abierto en móvil */}
        {(!isMobileScreen || activSidebar) && (
          <Pressable
            style={styles.regresarButton}
            onPress={() => router.push("/Tabs/home")}
          >
            <Image
              source={require("@/assets/images/arrow-left.svg")}
              style={styles.regresarIcon}
              contentFit="contain"
            />
            <Text style={styles.regresarButtonText}>Regresar</Text>
          </Pressable>
        )}

        <Text style={styles.headerTitle}>Horario Generado</Text>

        {generando && (
          <View style={styles.generandoContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.generandoText}>Generando...</Text>
          </View>
        )}

        {/* Botón de opciones - Solo visible en desktop */}
        {!isMobileScreen && (
          <View style={{ marginRight: 10 }}>
            <Pressable
              onPress={() => {
                setActivSidebar(!activSidebar);
              }}
            >
              <Image
                source={{
                  uri: "https://images.icon-icons.com/1919/PNG/512/optionscircularbutton_122043.png",
                }}
                style={{ width: 35, height: 35 }}
              />
            </Pressable>
          </View>
        )}

        {/* Botón de ver horario - Solo visible en móvil cuando sidebar está abierto */}
        {isMobileScreen && activSidebar && (
          <Pressable
            style={styles.verHorarioButton}
            onPress={() => setActivSidebar(false)}
          >
            <Text style={styles.verHorarioButtonText}>Ver Horario</Text>
            <Image
              source={require("@/assets/images/arrow-rigth.svg")}
              style={styles.verHorarioIcon}
              contentFit="contain"
            />
          </Pressable>
        )}

        {/* Botón de volver a opciones - Solo visible en móvil cuando sidebar está cerrado */}
        {isMobileScreen && !activSidebar && (
          <Pressable
            style={styles.volverOpcionesButton}
            onPress={() => setActivSidebar(true)}
          >
            <Image
              source={require("@/assets/images/arrow-left.svg")}
              style={styles.volverOpcionesIcon}
              contentFit="contain"
            />
            <Text style={styles.volverOpcionesButtonText}>
              Volver a Opciones
            </Text>
          </Pressable>
        )}
      </View>

      {/* Contenido principal */}
      <View style={styles.contentContainer}>
        {/* Sidebar - Fullscreen en móvil */}
        {activSidebar && (
          <>
            <View
              style={[
                isMobileScreen ? styles.sidebarMobile : styles.sidebarDesktop,
                !isMobileScreen && { width: `${sidebarWidth}%` },
              ]}
            >
              <GeneratedScheduleSidebar
                horariosGenerados={horariosGenerados}
                horarioActual={horarioActual}
                onSelectHorario={(horario) => setHorarioActual(horario)}
                onClose={() => setActivSidebar(false)}
              />
            </View>

            {/* Borde redimensionable solo en escritorio */}
            {!isMobileScreen && (
              <View style={styles.resizeHandle} onMouseDown={handleMouseDown}>
                <View style={styles.resizeLine} />
              </View>
            )}
          </>
        )}

        {/* Cuadrícula del horario - Solo visible cuando sidebar está cerrado en móvil */}
        {(!isMobileScreen || !activSidebar) && (
          <View
            style={[
              styles.scheduleContainer,
              {
                width:
                  !isMobileScreen && activSidebar
                    ? `${100 - sidebarWidth}%`
                    : "100%",
              },
            ]}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Cargando generador...</Text>
              </View>
            ) : (
              <ScrollView style={styles.scrollView}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.tableContainer}>
                    {/* Header de la tabla */}
                    <View style={styles.tableHeader}>
                      <View style={styles.headerCorner}>
                        <Text style={styles.headerCornerText}>Hora / Día</Text>
                      </View>
                      {daysOfWeek.map((day) => (
                        <View key={day} style={styles.dayHeaderCell}>
                          <Text style={styles.headerText}>{day}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Filas de horarios */}
                    {timeSlots.map((time) => (
                      <View key={time} style={styles.tableRow}>
                        <View style={styles.timeHeaderCell}>
                          <Text style={styles.headerText}>{time}</Text>
                        </View>
                        {daysOfWeek.map((day) => {
                          const celda = getMateriaEnCelda(day, time);

                          return (
                            <View key={`${day}-${time}`} style={styles.cell}>
                              {celda ? (
                                <Pressable
                                  style={[
                                    styles.cellContent,
                                    { backgroundColor: celda.color },
                                  ]}
                                  onPress={() => {
                                    const materias =
                                      horarioActual?.materias || [];
                                    const materiaIndex = materias.findIndex(
                                      (m) => m.nrc === celda.materia.nrc
                                    );
                                    openMateriaDetails(
                                      celda.materia,
                                      materiaIndex
                                    );
                                  }}
                                >
                                  {celda.esPrimera && (
                                    <>
                                      <Text style={styles.cellCodigo}>
                                        {celda.materia.codigo}
                                      </Text>
                                      <Text
                                        style={styles.cellNombre}
                                        numberOfLines={2}
                                      >
                                        {celda.materia.nombre}
                                      </Text>
                                      <Text
                                        style={styles.cellProfesor}
                                        numberOfLines={1}
                                      >
                                        {celda.materia.profesor}
                                      </Text>
                                    </>
                                  )}
                                </Pressable>
                              ) : (
                                <View style={styles.cellEmpty} />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Modal de detalles de materia */}
      {selectedMateria && (
        <BlurModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          containerStyle={styles.modalContainer}
        >
          <View style={styles.modalInnerContent}>
            {/* Header del modal */}
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor:
                    colorsPalette[
                      selectedMateria.colorIndex % colorsPalette.length
                    ],
                },
              ]}
            >
              <Text style={styles.modalCodigo}>{selectedMateria.codigo}</Text>
              <Text style={styles.modalNombre} numberOfLines={2}>
                {selectedMateria.nombre}
              </Text>
            </View>

            {/* Contenido del modal */}
            <View style={styles.modalContent}>
              {/* Fila 1: NRC y Sección */}
              <View style={styles.modalRow}>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>NRC</Text>
                  <View style={styles.nrcContainer}>
                    <Text style={styles.modalValue}>{selectedMateria.nrc}</Text>
                    <Pressable
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(selectedMateria.nrc)}
                    >
                      <Image
                        source={require("@/assets/images/copy.svg")}
                        style={styles.copyIcon}
                        contentFit="contain"
                      />
                    </Pressable>
                  </View>
                </View>

                {selectedMateria.numero && (
                  <View style={styles.modalColumn}>
                    <Text style={styles.modalLabel}>Sección</Text>
                    <Text style={styles.modalValue}>
                      {selectedMateria.numero}
                    </Text>
                  </View>
                )}

                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Créditos</Text>
                  <Text style={styles.modalValue}>
                    {selectedMateria.creditos}
                  </Text>
                </View>
              </View>

              {/* Profesor */}
              <View style={styles.modalFullRow}>
                <Text style={styles.modalLabel}>Profesor</Text>
                <Text style={styles.modalValue} numberOfLines={2}>
                  {selectedMateria.profesor}
                </Text>
              </View>
              {/* Profesor */}
              <View style={styles.modalFullRow}>
                <Text style={styles.modalLabel}>contentContainerStyle</Text>
                <Text style={styles.modalValue} numberOfLines={2}>
                  {selectedMateria.centro}
                </Text>
              </View>

              {/* Horarios */}
              <View style={styles.modalFullRow}>
                <Text style={styles.modalLabel}>Horarios</Text>
                {selectedMateria.horarios.length === 0 ? (
                  <View style={styles.horariosGrid}>
                    <View key={1} style={styles.horarioCompactItem}>
                      <Text style={styles.modalValue}>ASINCRONICA</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.horariosGrid}>
                    {selectedMateria.horarios.map((horario, idx) => (
                      <View key={idx} style={styles.horarioCompactItem}>
                        <Text style={styles.horarioDia}>{horario.dia}</Text>
                        <Text style={styles.horarioHora}>
                          {horario.horaInicio} - {horario.horaFin}
                        </Text>
                        {horario.aula && (
                          <Text style={styles.horarioAula}>{horario.aula}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.modalRow}>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Fecha inicio</Text>
                  <Text style={styles.modalValue}>
                    {selectedMateria.sesiones &&
                    selectedMateria.sesiones[0]?.fecha_inicio
                      ? formatDate(selectedMateria.sesiones[0].fecha_inicio)
                      : ""}
                  </Text>
                </View>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Fecha fin</Text>
                  <Text style={styles.modalValue}>
                    {selectedMateria.sesiones &&
                    selectedMateria.sesiones[0]?.fecha_fin
                      ? formatDate(selectedMateria.sesiones[0].fecha_fin)
                      : ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón </View>de cerrar */}
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </BlurModal>
      )}

      {/* Toast flotante */}
      <Modal
        visible={toastVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  header: {
    width: "100%",
    padding: 5,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  regresarButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  regresarIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  regresarButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: isMobile ? 18 : 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  generandoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  generandoText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  verHorarioButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verHorarioIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  verHorarioButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  volverOpcionesButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volverOpcionesIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  volverOpcionesButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
  },
  sidebarDesktop: {
    height: "100%",
    position: "relative",
  },
  sidebarMobile: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 100,
    backgroundColor: "#fff",
  },
  resizeHandle: {
    width: 8,
    height: "100%",
    cursor: "col-resize",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    pointerEvents: "auto",
  },
  resizeLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#ccc",
  },
  scheduleContainer: {
    flex: 1,
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  tableContainer: {
    padding: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
  },
  headerCorner: {
    backgroundColor: "#dee2e6",
    width: 80,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#dee2e6",
  },
  headerCornerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6c757d",
    textAlign: "center",
  },
  dayHeaderCell: {
    backgroundColor: "#e9ecef",
    width: 140,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#ced4da",
  },
  headerText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#0d6efd",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  timeHeaderCell: {
    backgroundColor: "#f8f9fa",
    width: 80,
    minHeight: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#dee2e6",
  },
  cell: {
    width: 140,
    minHeight: 60,
    borderWidth: 0.5,
    borderColor: "#dee2e6",
  },
  cellContent: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
  },
  cellCodigo: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  cellNombre: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  cellProfesor: {
    fontSize: 9,
    color: "#666",
    fontStyle: "italic",
  },
  cellEmpty: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Estilos del modal
  modalContainer: {
    width: isMobile ? "92%" : "85%",
    maxWidth: 550,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalInnerContent: {
    // Sin flex: 1 para que el contenido determine la altura
  },
  modalHeader: {
    padding: 16,
    alignItems: "center",
  },
  modalCodigo: {
    fontSize: isMobile ? 13 : 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  modalNombre: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  modalContent: {
    padding: 16,
  },
  modalRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  modalColumn: {
    flex: 1,
  },
  modalFullRow: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  modalValue: {
    fontSize: isMobile ? 13 : 14,
    color: "#1c1c1e",
    fontWeight: "500",
  },
  nrcContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  copyIcon: {
    width: 20,
    height: 20,
    tintColor: "#007AFF",
  },
  horariosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  horarioCompactItem: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minWidth: isMobile ? "47%" : "30%",
  },
  horarioDia: {
    fontSize: isMobile ? 12 : 13,
    fontWeight: "700",
    color: "#1c1c1e",
    marginBottom: 2,
  },
  horarioHora: {
    fontSize: isMobile ? 11 : 12,
    color: "#3c3c43",
    marginBottom: 2,
  },
  horarioAula: {
    fontSize: isMobile ? 10 : 11,
    color: "#8e8e93",
  },
  modalCloseButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: isMobile ? 16 : 18,
    fontWeight: "700",
  },
  // ============== TOAST ==============
  toastContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 80,
  },
  toast: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
