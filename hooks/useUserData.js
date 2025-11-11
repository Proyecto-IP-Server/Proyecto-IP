import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook personalizado para obtener y gestionar los datos del usuario
 * almacenados en AsyncStorage
 */
export const useUserData = () => {
  const [userData, setUserData] = useState({
    centroUniversitario: null,
    calendario: null,
    carrera: null,
  });
  const [loading, setLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const centro = await AsyncStorage.getItem('centroUniversitario');
      const calendario = await AsyncStorage.getItem('calendario');
      const carrera = await AsyncStorage.getItem('carrera');
      
      setUserData({
        centroUniversitario: centro,
        calendario: calendario,
        carrera: carrera,
      });
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (newData) => {
    try {
      if (newData.centroUniversitario) {
        await AsyncStorage.setItem('centroUniversitario', newData.centroUniversitario);
      }
      if (newData.calendario) {
        await AsyncStorage.setItem('calendario', newData.calendario);
      }
      if (newData.carrera) {
        await AsyncStorage.setItem('carrera', newData.carrera);
      }
      
      setUserData(prev => ({ ...prev, ...newData }));
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
    }
  };

  const clearUserData = async () => {
    try {
      await AsyncStorage.multiRemove(['centroUniversitario', 'calendario', 'carrera']);
      setUserData({
        centroUniversitario: null,
        calendario: null,
        carrera: null,
      });
    } catch (error) {
      console.error('Error al limpiar datos del usuario:', error);
    }
  };

  return {
    userData,
    loading,
    loadUserData,
    updateUserData,
    clearUserData,
  };
};
