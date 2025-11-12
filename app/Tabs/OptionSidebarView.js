import { View, TextInput, Button } from 'react-native-web';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import TextTitle from "../../components/TextTitle";
import { Dropdown } from 'react-native-element-dropdown';
import { useState } from 'react';

export default function OptionSidebarView() {
  // Datos de ejemplo para los dropdowns
  const data = [
    {
      materias: [
        { materia: 'IL-746 Matemáticas', value: '1' },
        { materia: 'IL-346 Programación', value: '2' },
        { materia: 'IL-373 Física', value: '3' },
      ],
      maestros: [
        { maestro: 'Dr. López', value: '1' },
        { maestro: 'Mtra. García', value: '2' },
        { maestro: 'Ing. Torres', value: '3' },
      ],
      horarios: [
        { horario: '7:00 - 9:00', value: '1' },
        { horario: '9:00 - 11:00', value: '2' },
        { horario: '11:00 - 13:00', value: '3' },
      ],
    },
  ];

  // Estados para cada dropdown
  const [materiaValue, setMateriaValue] = useState('');
  const [maestroValue, setMaestroValue] = useState('');
  const [horarioValue, setHorarioValue] = useState('');

  return (
    <View
      style={{
        height: '100%',
        width: '100%',
        padding: 10,
        borderColor: 'black',
        borderWidth: 1,
      }}
    >
      {/* Encabezado */}
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 5,
        }}
      >
        <TextTitle>Condiciones</TextTitle>
        <Pressable>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/58/58282.png' }}
            style={{ width: 24, height: 24 }}
          />
        </Pressable>
      </View>

      {/* Dropdowns de Materia, Maestro y Horario */}
      <Dropdown
        placeholder="Materia"
        search
        searchPlaceholder="Buscar materia..."
        data={data[0].materias}
        labelField="materia"
        valueField="value"
        value={materiaValue}
        onChange={(item) => setMateriaValue(item.materia)}
        style={styles.dropdown}
      />

      <Dropdown
        placeholder="Maestro"
        search
        searchPlaceholder="Buscar maestro..."
        data={data[0].maestros}
        labelField="maestro"
        valueField="value"
        value={maestroValue}
        onChange={(item) => setMaestroValue(item.maestro)}
        style={styles.dropdown}
      />

      <Dropdown
        placeholder="Horario"
        search
        searchPlaceholder="Buscar horario..."
        data={data[0].horarios}
        labelField="horario"
        valueField="value"
        value={horarioValue}
        onChange={(item) => setHorarioValue(item.horario)}
        style={styles.dropdown}
      />

      {/* Input y botón agregar */}
      <View style={{ marginTop: 10 }}>
        <TextInput placeholder="Escribe aquí..." style={styles.textInputForm} />
        <Button title="Agregar" onPress={() => console.log('Agregado')} />
      </View>

      {/* Botón limpiar al final */}
      <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 0 }}>
        <Button
          title="Limpiar"
          onPress={() => {
            setMateriaValue('');
            setMaestroValue('');
            setHorarioValue('');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    padding: 10,
    fontSize: 16,
    borderColor: 'black',
    borderWidth: 1,
    marginVertical: 5,
    width: '100%',
  },
  textInputForm: {
    padding: 10,
    fontSize: 16,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom: 5,
    width: '100%',
  },
});
