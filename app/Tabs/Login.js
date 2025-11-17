import { Pressable, View, Text, StyleSheet, ActivityIndicator, Platform, Dimensions, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextTitle from "../../components/TextTitle"
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

console.log('API_BASE_URL:', API_BASE_URL);

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function Login() {
  const router = useRouter()
  
  // Estados para los valores seleccionados
  const [centroUnivercitarioValue, setCentroUnivercitarioValue] = useState(null);
  const [calendarioValue, setCalendarioValue] = useState(null);
  const [codigoCarreraValue, setCodigoCarreraValue] = useState(null);
  
  // Estados para los datos de la API
  const [centros, setCentros] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [carreras, setCarreras] = useState([]);
  
  // Estados de carga
  const [loadingCentros, setLoadingCentros] = useState(true);
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  const [loadingCarreras, setLoadingCarreras] = useState(false);
  const [loadingValidacion, setLoadingValidacion] = useState(false);
  
  // Estado para mensajes de error
  const [errorMessage, setErrorMessage] = useState('');


  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage('');
    }, 10000);
  };

  // Cargar centros, ciclos y datos guardados al montar el componente
  useEffect(() => {
    fetchCentros();
    fetchCiclos();
    loadSavedData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar datos guardados del AsyncStorage
  const loadSavedData = async () => {
    try {
      const savedCentro = await AsyncStorage.getItem('centroUniversitario');
      const savedCalendario = await AsyncStorage.getItem('calendario');
      const savedCarrera = await AsyncStorage.getItem('carrera');
      
      if (savedCentro) setCentroUnivercitarioValue(savedCentro);
      if (savedCalendario) setCalendarioValue(savedCalendario);
      if (savedCarrera) setCodigoCarreraValue(savedCarrera);
    } catch (error) {
      console.error('Error al cargar datos guardados:', error);
    }
  };

  // Guardar datos en AsyncStorage
  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem('centroUniversitario', centroUnivercitarioValue);
      await AsyncStorage.setItem('calendario', calendarioValue);
      await AsyncStorage.setItem('carrera', codigoCarreraValue);
      console.log('Datos guardados correctamente');
    } catch (error) {
      console.error('Error al guardar datos:', error);
    }
  };

  // Cargar carreras cuando se seleccionen centro y ciclo
  useEffect(() => {
    if (centroUnivercitarioValue && calendarioValue) {
      fetchCarreras(calendarioValue, centroUnivercitarioValue);
    } else {
      setCarreras([]);
      setCodigoCarreraValue(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centroUnivercitarioValue, calendarioValue]);

  const fetchCentros = async () => {
    try {
      setLoadingCentros(true);
      const response = await fetch(`${API_BASE_URL}/centros/`);
      const data = await response.json();
      const formattedData = data.map((centro, index) => ({
        centro: centro,
        value: centro
      }));
      setCentros(formattedData);
    } catch (error) {
      const mensajeError = [{centro: 'Error de consulta, actualiza la página', value: ''}];
      setCentros(mensajeError);

      console.error('Error al cargar centros:', error);
      showError('No se pudieron cargar los centros universitarios');
    } finally {
      setLoadingCentros(false);
    }
  };

  const fetchCiclos = async () => {
    try {
      setLoadingCiclos(true);
      const response = await fetch(`${API_BASE_URL}/ciclos/`);
      const data = await response.json();
      const formattedData = data.map((ciclo) => ({
        calendario: ciclo,
        value: ciclo
      }));
      setCiclos(formattedData);
    } catch (error) {
      console.error('Error al cargar ciclos:', error);
      showError('No se pudieron cargar los ciclos');
    } finally {
      setLoadingCiclos(false);
    }
  };

  const fetchCarreras = async (ciclo, centro) => {
    try {
      setLoadingCarreras(true);
      const response = await fetch(`${API_BASE_URL}/carreras/${ciclo}/${centro}`);
      const data = await response.json();
      const formattedData = data.map((carrera) => ({
        carrera: `${carrera.clave} - ${carrera.nombre}`,
        value: carrera.clave
      }));
      if(formattedData.length === 0){
        formattedData.push({carrera: 'No hay carreras disponibles. Para ese ciclo escolar.', value: ''})
      }
      setCarreras(formattedData);
    } catch (error) {
      console.error('Error al cargar carreras:', error);
      showError('No se pudieron cargar las carreras. Inentalo de nuevo.');
      setCarreras([]);
    } finally {
      setLoadingCarreras(false);
    }
  };

  if (loadingCentros || loadingCiclos) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <StatusBar barStyle="dark-content"/>
      <View style={styles.formContainer}>
        <TextTitle style={styles.title}>Datos Generales</TextTitle>
        
        <View style={styles.inputWrapper}>
          <Dropdown
            placeholder="Centro universitario"
            searchPlaceholder="Buscar..."
            onChange={item => {
              setCentroUnivercitarioValue(item.value)
            }}
            style={styles.textInputForm}
            containerStyle={styles.dropdownContainer}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            search
            data={centros}
            maxHeight={300}
            labelField="centro"
            valueField="value"
            value={centroUnivercitarioValue}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Dropdown
            placeholder="Calendario"
            searchPlaceholder="Buscar..."
            onChange={item => {
              setCalendarioValue(item.value)
            }}
            style={styles.textInputForm}
            containerStyle={styles.dropdownContainer}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            search
            data={ciclos}
            maxHeight={300}
            labelField="calendario"
            valueField="value"
            value={calendarioValue}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Dropdown
            placeholder="Carrera"
            searchPlaceholder="Buscar..."
            
            onChange={(item) => {
              setCodigoCarreraValue(item.value)
            }}
            
            style={styles.textInputForm}
            containerStyle={styles.dropdownContainer}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            search
            data={carreras}
            value={codigoCarreraValue}
            maxHeight={300}
            labelField="carrera"
            valueField="value"
            autoScroll={false}
            dropdownPosition='top'
            flatListProps={{
                    nestedScrollEnabled: true,
                  }}
            disable={!centroUnivercitarioValue || !calendarioValue || loadingCarreras}
          />
          {loadingCarreras && (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
              <Text style={{ marginTop: 10 }}>Cargando carreras...</Text>
            </View>
          )}
        </View>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {loadingValidacion ? (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
            <Text style={styles.loadingText}>Validando datos, por favor espera...</Text>
          </View>
        ) : null
        }

        <Pressable 
          style={
            !centroUnivercitarioValue || !calendarioValue || !codigoCarreraValue || loadingCarreras || loadingValidacion
              ? styles.buttonDisabled
              : styles.button
          }
          onPress={async () => {
            console.log("centro: " + centroUnivercitarioValue + " calendario: " + calendarioValue + " carrera: " + codigoCarreraValue)
            
            if(!centroUnivercitarioValue || !calendarioValue || !codigoCarreraValue){
              showError('Por favor, completa todos los campos antes de continuar.');
              return;
            }
            
            // Validar que la carrera seleccionada exista en la lista de carreras disponibles
            const carreraExiste = carreras.some(carrera => carrera.value === codigoCarreraValue && carrera.value !== '');
            if (!carreraExiste) {
              setCodigoCarreraValue(null);
              await AsyncStorage.removeItem('carrera');
              return;
            }
            
            
            // Validacion a fuerza bruta porque dios mio los problemas que dio esto
            setLoadingValidacion(true);
            const response = await fetch(`${API_BASE_URL}/carreras/${calendarioValue}/${centroUnivercitarioValue}`);
            const data = await response.json();
            try {
              const carreraValida = data.some(carrera => carrera.clave === codigoCarreraValue);
              if (!carreraValida) {
                showError('La carrera seleccionada no es válida. Por favor, selecciona una carrera válida.');
                setCodigoCarreraValue(null);
                await AsyncStorage.removeItem('carrera');
                return;
              }
            } catch (error) {
              console.error('Error durante la validación de la carrera:', error);
              showError('Ocurrió un error durante la validación. Por favor, intenta de nuevo.');
              setCodigoCarreraValue(null);
              await AsyncStorage.removeItem('carrera');
              return;
            } finally {
              setLoadingValidacion(false);
            }

            await saveUserData();
            router.push('/Tabs/home')
          }}
          disabled={!centroUnivercitarioValue||!calendarioValue||!codigoCarreraValue|| loadingCarreras || loadingValidacion}
        >
          <Text style={
            !centroUnivercitarioValue || !calendarioValue || !codigoCarreraValue || loadingCarreras || loadingValidacion
              ? styles.buttonTextDisabled
              : styles.buttonText
          }>
            Siguiente
          </Text>
        </Pressable>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container:{
    flex: 1,
    width:'100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: isMobile ? '100%' : 500,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: isMobile ? 20 : 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    marginBottom: 30,
    fontSize: isMobile ? 24 : 28,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  textInputForm:{
    width: '100%',
    height: 50,
    paddingHorizontal: 16,
    borderColor: '#e0e0e0',
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: isMobile ? 16 : 18,
    backgroundColor: '#fafafa',
  },
  dropdownContainer: {
    borderRadius: 8,
    borderColor: '#e0e0e0',
  },
  placeholderStyle: {
    fontSize: isMobile ? 16 : 18,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: isMobile ? 16 : 18,
    color: '#333',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: isMobile ? 16 : 18,
    borderRadius: 8,
  },
  button:{
    width: '100%',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonDisabled: {
    width: '100%',
    backgroundColor: '#CCCCCC',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: '#999',
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: isMobile ? 16 : 18,
    color: '#666',
  },
  loader: {
    marginTop: 10,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: isMobile ? 14 : 16,
    fontWeight: '500',
    textAlign: 'center',
  }

});