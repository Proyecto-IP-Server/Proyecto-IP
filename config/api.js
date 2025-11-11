import { Platform } from 'react-native';

// Configuración de la API
// Tu IP local: 192.168.100.181
// Asegúrate de que tu teléfono esté en la misma red WiFi

const LOCAL_IP = '192.168.100.181'; // Tu IP local
const API_PORT = '8080';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    // Para web usa localhost
    return `http://localhost:${API_PORT}/api`;
  }
  
  // Para dispositivos móviles (Android/iOS) usa la IP local
  return `http://${LOCAL_IP}:${API_PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
export { API_PORT };
