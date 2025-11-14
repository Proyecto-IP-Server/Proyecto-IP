import { Platform } from 'react-native';


const LOCAL_IP = '192.168.100.181'; 
const API_PORT = '8080';

const getApiBaseUrl = () => {
    if (Platform.OS === 'web') {
        
        return `http://localhost:${API_PORT}/api`;
    }
    
    return `http://${LOCAL_IP}:${API_PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
export { API_PORT };
