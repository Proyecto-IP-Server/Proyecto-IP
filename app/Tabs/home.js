import {  View, StyleSheet, Pressable, Text, Platform, Dimensions, PanResponder } from "react-native";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import OptionSidebarView from "./OptionSidebarView";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useUserData } from "../../hooks/useUserData";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from "react-native-web";

export default function Home() {
  const router = useRouter()
  const insets = useSafeAreaInsets();
  const [activOptionSidebar, setActivOptionSidebar] = useState(true) 
  const [sidebarWidth, setSidebarWidth] = useState(25);
  const [isResizing, setIsResizing] = useState(false);
  const { userData, loading } = useUserData();
  
  // Estado para dimensiones de pantalla (para responsividad en tiempo real)
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobileScreen = screenWidth < 768;

  // Listener para cambios de tamaño de pantalla (responsividad en tiempo real)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      // Si cambia a móvil y el sidebar está cerrado, abrirlo
      if (window.width < 768 && !activOptionSidebar) {
        setActivOptionSidebar(true);
      }
    });

    return () => subscription?.remove();
  }, [activOptionSidebar]);

  // Verificar que el usuario haya completado el login
  useEffect(() => {
    if (!loading && (!userData.centroUniversitario || !userData.calendario || !userData.carrera)) {
      // Si no hay datos guardados, redirigir al login
      router.push('/');
    }else{
      console.log('Datos del usuario cargados:', userData);
    }
  }, [loading, userData, router]);

  // Manejar resize del sidebar en escritorio
  const handleMouseDown = (e) => {
    if (!isMobileScreen) {
      setIsResizing(true);
      e.preventDefault();
    }
  };

  useEffect(() => {
    // Solo ejecutar en web donde document existe
    if (Platform.OS !== 'web') return;

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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isMobileScreen]);


  return (
    <View style={styles.container}>
      {/* Header con safe area */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 5 }
      ]}>
        {/* Botón de regresar - Solo visible en desktop o cuando sidebar está abierto en móvil */}
        {(!isMobileScreen || activOptionSidebar) && (
          <Pressable 
            style={styles.regresarButton}
            onPress={() => router.push('/')}
          >
            <Image 
              source={require('@/assets/images/arrow-left.svg')} 
              style={styles.regresarIcon}
              contentFit="contain"
            />
            <Text style={styles.regresarButtonText}>Regresar</Text>
          </Pressable>
        )}
        
        {/* Botón de opciones - Solo visible en desktop */}
        {!isMobileScreen && (
          <View style={{marginRight:10}}>
            <Pressable 
              onPress={()=> {
                setActivOptionSidebar(!activOptionSidebar)
                
              }}
            >
              <Image source={{uri:"https://images.icon-icons.com/1919/PNG/512/optionscircularbutton_122043.png"}} style={{width: 35, height: 35}}/>
            </Pressable>
          </View>
        )}

        {/* Botón de regreso a opciones - Solo visible en móvil cuando sidebar está cerrado */}
        {isMobileScreen && !activOptionSidebar && (
          <Pressable 
            style={styles.volverOpcionesButton}
            onPress={() => setActivOptionSidebar(true)}
          >
            <Image 
              source={require('@/assets/images/arrow-left.svg')} 
              style={styles.volverOpcionesIcon}
              contentFit="contain"
            />
            <Text style={styles.volverOpcionesButtonText}>Volver a Opciones</Text>
          </Pressable>
        )}
      </View>

      {/* Contenido principal */}
      <View style={styles.contentContainer}>
        {/* Sidebar - Fullscreen en móvil */}
        {activOptionSidebar && (
          <>
            <View style={[
              isMobileScreen ? styles.sidebarMobile : styles.sidebarDesktop,
              !isMobileScreen && { width: `${sidebarWidth}%` }
            ]}>
              <OptionSidebarView onClose={() => setActivOptionSidebar(false)} />              
            </View>
            
            {/* Borde redimensionable solo en escritorio */}
            {!isMobileScreen && (
              <View 
                style={styles.resizeHandle}
                onMouseDown={handleMouseDown}
              >
                <View style={styles.resizeLine} />
              </View>
            )}
          </>
        )}
        
        {/* WeeklySchedule - Solo visible cuando sidebar está cerrado en móvil */}
        {(!isMobileScreen || !activOptionSidebar) && (
          <View style={[
            styles.scheduleContainer,
            { width: (!isMobileScreen && activOptionSidebar) ? `${100 - sidebarWidth}%` : '100%' }
          ]}>
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
    height: '100%',
    width: '100%',
  },
  header: {
    width: '100%',
    padding: 5,
    borderColor: 'black',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
  },
  sidebarDesktop: {
    height: '100%',
    position: 'relative',
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    backgroundColor: '#fff',
  },
  resizeHandle: {
    width: 8,
    height: '100%',
    cursor: 'col-resize',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'auto',
  },
  resizeLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#ccc',
  },
  scheduleContainer: {
    flex: 1,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 10,
  },
  volverOpcionesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volverOpcionesIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  volverOpcionesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  regresarButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regresarIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  regresarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});