import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
  Dimensions,
  Modal,
  TouchableOpacity
} from "react-native";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import OptionSidebarView from "./OptionSidebarView";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useUserData } from "../../hooks/useUserData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-web";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activOptionSidebar, setActivOptionSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(25);
  const [isResizing, setIsResizing] = useState(false);
  
  // Estado para el menú móvil
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const { userData, loading } = useUserData();

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const isMobileScreen = screenWidth < 768;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
      if (window.width < 768 && !activOptionSidebar) {
        setActivOptionSidebar(true);
      }
    });
    return () => subscription?.remove();
  }, [activOptionSidebar]);

  useEffect(() => {
    if (
      !loading &&
      (!userData.centroUniversitario ||
        !userData.calendario ||
        !userData.carrera)
    ) {
      router.push("/");
    } else {
      console.log("Datos del usuario cargados:", userData);
    }
  }, [loading, userData, router]);

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

  const handleNavigation = (route) => {
    setMobileMenuVisible(false); 
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {/* Header con safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        
        {/* --- IZQUIERDA: Botón Regresar u Opciones --- */}
        {(!isMobileScreen || activOptionSidebar) && (
          <Pressable
            style={styles.navButton}
            onPress={() => router.push("/")}
          >
            <Image
              source={require("@/assets/images/arrow-left.svg")}
              style={styles.iconStyles}
              contentFit="contain"
            />
            <Text style={styles.navButtonText}>Regresar</Text>
          </Pressable>
        )}

        {isMobileScreen && !activOptionSidebar && (
          <Pressable
            style={styles.navButton}
            onPress={() => setActivOptionSidebar(true)}
          >
            <Image
              source={require("@/assets/images/arrow-left.svg")}
              style={styles.iconStyles}
              contentFit="contain"
            />
            <Text style={styles.navButtonText}>
              Opciones
            </Text>
          </Pressable>
        )}

        {/* Espaciador */}
        <View style={{ flex: 1 }} />

        {/* --- DERECHA: Menú de Navegación --- */}

        {/* VISTA DE ESCRITORIO */}
        {!isMobileScreen && (
          <View style={styles.desktopNavContainer}>
            <Pressable style={styles.navButton} onPress={() => handleNavigation('/Tabs/faq')}>
               <Image source={require("@/assets/images/magnifer.svg")} style={styles.iconStyles} contentFit="contain"/>
               <Text style={styles.navButtonText}>FAQ</Text>
            </Pressable>
            
            <Pressable style={styles.navButton} onPress={() => handleNavigation('/Tabs/suport')}>
               <Image source={require("@/assets/images/question.svg")} style={styles.iconStyles} contentFit="contain"/>
               <Text style={styles.navButtonText}>Soporte</Text>
            </Pressable>

            <Pressable style={styles.navButton} onPress={() => handleNavigation('/Tabs/reviews')}>
               <Image source={require("@/assets/images/clipboard.svg")} style={styles.iconStyles} contentFit="contain"/>
               <Text style={styles.navButtonText}>Reseñas</Text>
            </Pressable>

            <Pressable onPress={() => setActivOptionSidebar(!activOptionSidebar)}>
              <Image
                source={require("@/assets/images/hamburger.svg")}
                style={{ width: 35, height: 35, marginLeft: 10 }}
              />
            </Pressable>
          </View>
        )}

        {/* VISTA MÓVIL: Botón "Menú" */}
        {isMobileScreen && (
          <Pressable 
            style={[styles.navButton, { backgroundColor: mobileMenuVisible ? '#0056b3' : '#007AFF' }]} 
            onPress={() => setMobileMenuVisible(true)}
          >
            <Text style={styles.navButtonText}>Menú</Text>
            <Image source={require("@/assets/images/hamburger_white.svg")} style={styles.iconStyles} contentFit="contain"/>
          </Pressable>
        )}

      </View>

      {/* --- MODAL PARA EL MENÚ MÓVIL (Corrección para Android) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={mobileMenuVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setMobileMenuVisible(false)}
      >
        {/* Overlay invisible que detecta clicks afuera para cerrar */}
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMobileMenuVisible(false)}
        >
          {/* Contenedor del Dropdown posicionado manualmente */}
          <View style={[styles.mobileDropdown, { top: insets.top + 55 }]}> 
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => handleNavigation('/Tabs/faq')}>
                <Text style={styles.mobileMenuText}>FAQ</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => handleNavigation('/Tabs/suport')}>
                <Text style={styles.mobileMenuText}>Soporte</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => handleNavigation('/Tabs/reviews')}>
                <Text style={styles.mobileMenuText}>Reseñas</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contenido principal */}
      <View style={styles.contentContainer}>
        {activOptionSidebar && (
          <>
            <View
              style={[
                isMobileScreen ? styles.sidebarMobile : styles.sidebarDesktop,
                !isMobileScreen && { width: `${sidebarWidth}%` },
              ]}
            >
              <OptionSidebarView onClose={() => setActivOptionSidebar(false)} />
            </View>
            {!isMobileScreen && (
              <View style={styles.resizeHandle} onMouseDown={handleMouseDown}>
                <View style={styles.resizeLine} />
              </View>
            )}
          </>
        )}

        {(!isMobileScreen || !activOptionSidebar) && (
          <View
            style={[
              styles.scheduleContainer,
              {
                width:
                  !isMobileScreen && activOptionSidebar
                    ? `${100 - sidebarWidth}%`
                    : "100%",
              },
            ]}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
                <Text>Cargando...</Text>
              </View>
            ) : (
              <WeeklySchedule />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  header: {
    width: "100%",
    padding: 5,
    paddingHorizontal: 10, 
    borderColor: "black",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex: 10, // Menor que sidebarMobile, por eso usabamos Modal
    justifyContent: 'space-between',
    elevation: 2, // Sombra sutil en Android para el header
  },
  navButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
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
  desktopNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // ESTILOS DEL MODAL Y DROPDOWN
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Fondo semitransparente para dar foco al menú
    justifyContent: 'flex-start',
    alignItems: 'flex-end', // Alinea el menú a la derecha
  },
  mobileDropdown: {
    marginRight: 10, // Margen derecho
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10, // Elevación alta para estar sobre el overlay
    width: 150,
  },
  mobileMenuItem: {
    padding: 12,
    alignItems: 'center',
  },
  mobileMenuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    width: '100%',
  },

  // Estilos originales
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
    zIndex: 100, // Esto causaba conflicto visual si no usábamos Modal
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
  loader: {
    marginTop: 10,
  },
});