import { Text } from 'react-native';
import { Button, TextInput, View } from 'react-native-web';
import TextTitle from "../../components/TextTitle"

export default function LogFormView() {
  return (
    <View>
      <TextTitle>Datos Generales</TextTitle>
        <TextInput placeholder="Centro universitario" />
        <TextInput placeholder="Calendario" />
        <TextInput placeholder="Carrera" />
        <Button title="Siguiente" onPress={() => {}} />
    </View>
  );
}

