import { Pressable, Text } from 'react-native';
import { Button, TextInput, View } from 'react-native-web';
import TextTitle from "../../components/TextTitle"
import DropdownComponent from '@/components/drpdown';
import { Dropdown } from 'react-native-element-dropdown';
import { Image } from 'expo-image';

// Vista que tiene los opciones para agragar condiciones
export default function ConditionalsFormView() {
  // Lista de Materias
  // Lista de Maestros [Scorr]
  return (
    <View>
        {/* Muesta el encabesado */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10}}>

          <TextTitle>Condiciones</TextTitle>
          <Pressable>
            <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/58/58282.png'}} style={{width: 24, height: 24}} />
          </Pressable>
        </View>

        {/* Menu desplegable de nueva condicion*/}
        <View>
          <Pressable>
            <Text>Materias</Text>
          </Pressable>

          <Pressable>
            <Text>Maestro</Text>
          </Pressable>

          <Pressable>
            <Text>Horario</Text>
          </Pressable>
        </View>

        {/* Input que solo aparece si se selecciona una condicion */}
        <View>
          <TextInput placeholder='Escribe aqui...' />
          <Button title='Agregar' /> {/* El action del boton es el que va a cambiar dependiendo la de condicion escojida */}
        </View>


          
    </View>
  );
}