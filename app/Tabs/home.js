import {  View, StyleSheet, Pressable, Text, Platform, Dimensions, PanResponder } from "react-native";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import OptionSidebarView from "./OptionSidebarView";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useUserData } from "../../hooks/useUserData";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function Home() {
  const router = useRouter()
  const insets = useSafeAreaInsets();
  const [activOptionSidebar, setActivOptionSidebar] = useState(true) // Inicia abierto
  const [sidebarWidth, setSidebarWidth] = useState(20); // Porcentaje inicial (20%)
  const [isResizing, setIsResizing] = useState(false);
  const { userData, loading } = useUserData();
  

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
    if (!isMobile) {
      setIsResizing(true);
      e.preventDefault();
    }
  };

  useEffect(() => {
    // Solo ejecutar en web donde document existe
    if (Platform.OS !== 'web') return;

    const handleMouseMove = (e) => {
      if (isResizing && !isMobile) {
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
  }, [isResizing]);


  return (
    <View style={styles.container}>
      {/* Header con safe area */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 5 }
      ]}>
        <View style={{marginRight:10}}>
          <Pressable onPress={() => router.push('/')}>
            <Image source={{uri:"https://cdn-icons-png.flaticon.com/512/94/94510.png"}} style={{width: 35, height: 35}}/>
          </Pressable>
        </View>
        <View style={{marginRight:10}}>
          <Pressable 
            onPress={()=> {
              setActivOptionSidebar(!activOptionSidebar)
              
            }}
          >
            <Image source={{uri:"https://images.icon-icons.com/1919/PNG/512/optionscircularbutton_122043.png"}} style={{width: 35, height: 35}}/>
          </Pressable>
        </View>
      </View>

      {/* Contenido principal */}
      <View style={styles.contentContainer}>
        {/* Sidebar - Fullscreen en móvil */}
        {activOptionSidebar && (
          <>
            <View style={[
              isMobile ? styles.sidebarMobile : styles.sidebarDesktop,
              !isMobile && { width: `${sidebarWidth}%` }
            ]}>
              <OptionSidebarView onClose={() => setActivOptionSidebar(false)} />              
            </View>
            
            {/* Borde redimensionable solo en escritorio */}
            {!isMobile && (
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
        {(!isMobile || !activOptionSidebar) && (
          <View style={[
            styles.scheduleContainer,
            { width: (!isMobile && activOptionSidebar) ? `${100 - sidebarWidth}%` : '100%' }
          ]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text>Cargando...</Text>
              </View>
            ) : (
              <WeeklySchedule 
                carrera={userData.carrera}
                centro={userData.centroUniversitario}
                ciclo={userData.calendario}
              />
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
  }
});