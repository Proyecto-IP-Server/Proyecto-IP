import { Button, TextInput, View } from 'react-native-web';
import TextTitle from "../../components/TextTitle"
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { useState } from 'react';

export default function Login() {
  const router = useRouter()
  // ingresa los datos de todos los centros unircitarios
  const data = [
    {
      'centroUnivercitario': [
        {centro:"CUCEI", value:'1'},
        {centro:"CUSH", value:'2'},
        {centro:"CUCEA", value:'3'},
      ],
      'calendario':[
        {calendario:'2025B', value:'1'},
        {calendario:'2025A', value:'2'},
        {calendario:'2024B', value:'3'},
        {calendario:'2024A', value:'4'},
      ],
      'codigoCarrera':[
        {carrera:"INCO", value:'1'},
        {carrera:"ICOM", value:'2'},
        {carrera:"QFA", value:'3'},
      ]
    } 
  ]
  const [centroUnivercitarioValue, setCentroUnivercitarioValue] = useState(0);
  const [calendarioValue, setCalendarioValue] = useState(0);
  const [codigoCarreraValue, setCodigoCarreraValue] = useState(0);


  return (
    <View style={styles.container} >
      <TextTitle style={styles.title}>Datos Generales</TextTitle>
        <Dropdown
          placeholder="Centro universitario" // Indica lo que se va a cambiar si elegir un valor
          searchPlaceholder="Search..."
          onChange={item => {
            setCentroUnivercitarioValue(item.centro)
          }}
          // Styles
          style={styles.textInputForm}

          // Config
          // iconStyle={styles.iconStyle} // Indica un icono
          search // Activa busquedas
          data={data[0].centroUnivercitario}
          maxHeight={300}
          labelField="centro"
          valueField="value"
        />
        <Dropdown
          placeholder="Calendario" // Indica lo que se va a cambiar si elegir un valor
          searchPlaceholder="Search..."
          onChange={item => {
            setCalendarioValue(item.calendario)
          }}
          // Styles
          style={styles.textInputForm}

          // Config
          // iconStyle={styles.iconStyle} // Indica un icono
          search // Activa busquedas
          data={data[0].calendario}
          maxHeight={300}
          labelField="calendario"
          valueField="value"
        />

        <Dropdown
          placeholder="Codigo de carrera" // Indica lo que se va a cambiar si elegir un valor
          searchPlaceholder="Search..."
          onChange={(item) => {
            setCodigoCarreraValue(item.carrera)
          }}
          // Styles
          style={styles.textInputForm}

          // Config
          // iconStyle={styles.iconStyle} // Indica un icono
          search // Activa busquedas
          data={data[0].codigoCarrera}
          maxHeight={300}
          labelField="carrera"
          valueField="value"
        />
        <Button  title="Siguiente" 
          style={styles.button}
          onPress={() => {
            console.log("centro: " + centroUnivercitarioValue + " calendaer: " + calendarioValue + " carre: "+ codigoCarreraValue)
            if(centroUnivercitarioValue != '0' && calendarioValue != '0' && codigoCarreraValue != '0'){
              router.push('/Tabs/home')
            }
          }}/>

    </View>
  );
}


const styles = StyleSheet.create({
  container:{
    width:'100%',
    height:"100%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputForm:{
    padding:10,
    fontSize:20,
    borderBlockColor: 'black',
    borderWidth: 1,
    marginBottom:5,
    width:'20%'
  },
  button:{
    // padding:20
  }

});