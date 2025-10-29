import { Pressable, Text } from 'react-native';
import { Button, TextInput, View } from 'react-native-web';
import TextTitle from "../../components/TextTitle"
import { Image } from 'expo-image';
import { useState } from 'react';


// Vista que tiene los opciones para agragar condiciones
export default function OptionSidebarView() {
  const [activeFilter, setActiveFilter] = useState([false,false,false])
  const filters= [
    {filter:'Materias', value:"1"},
    {filter:'Maestro', value:"2"},
    {filter:'Horario', value:"3"},

  ]

  return (
    <View style={{height:'100%', width:'100%', padding:10,
        borderBlockColor: 'black',
        borderWidth: 1,
        }}>

        {/* Muesta el encabesado */}
        <View style={{width:'100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 5}}>
          <TextTitle>Condiciones</TextTitle>
          <Pressable>
            <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/58/58282.png'}} style={{width: 24, height: 24}} />
          </Pressable>
        </View>

        {/* Menu desplegable de nueva condicion*/}

        {/* Input que solo aparece si se selecciona una condicion */}
        <View>
          <TextInput placeholder='Escribe aqui...' />
          <Button title='Agregar' /> {/* El action del boton es el que va a cambiar dependiendo la de condicion escojida */}
        </View>


          
    </View>
  );
}