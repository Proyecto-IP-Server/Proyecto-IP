import { View, TextInput, Button, StyleSheet } from 'react-native-web';
import { Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import TextTitle from "../../components/TextTitle";
import { MultiSelect } from 'react-native-element-dropdown';
import { useState } from 'react';

export default function OptionSidebarView() {
  // Datos de ejemplo para los dropdowns
  const data = [
    {
      materias: [
        { materia: 'IL-343 Matemáticas', value: '1' },
        { materia: 'IL-543 Programación', value: '2' },
        { materia: 'IL-344 Física', value: '3' },
        { materia: 'IP-455 Bases de Datos', value: '4' },
      ],
      maestros: [
        { maestro: 'Dr. López', value: '1' },
        { maestro: 'Mtra. García', value: '2' },
        { maestro: 'Ing. Torres', value: '3' },
        { maestro: 'Lic. Romero', value: '4' },
      ],
      horarios: [
        { horario: '7:00 - 9:00', value: '1' },
        { horario: '9:00 - 11:00', value: '2' },
        { horario: '11:00 - 13:00', value: '3' },
        { horario: '13:00 - 15:00', value: '4' },
      ],
    },
  ];

  // Estados para selección múltiple
  const [materiaValues, setMateriaValues] = useState([]);
  const [maestroValues, setMaestroValues] = useState([]);
  const [horarioValues, setHorarioValues] = useState([]);

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

      {/* MULTISELECT Materias */}
      <MultiSelect
        placeholder="Materia(s)"
        search
        searchPlaceholder="Buscar materia..."
        data={data[0].materias}
        labelField="materia"
        valueField="value"
        value={materiaValues}
        onChange={item => setMateriaValues(item)}
        style={styles.dropdown}
        maxHeight={300}
        selectedTextStyle={{ color: 'black' }}
        placeholderStyle={{ color: 'gray' }}
      />

      {/* MULTISELECT Maestros */}
      <MultiSelect
        placeholder="Maestro(s)"
        search
        searchPlaceholder="Buscar maestro..."
        data={data[0].maestros}
        labelField="maestro"
        valueField="value"
        value={maestroValues}
        onChange={item => setMaestroValues(item)}
        style={styles.dropdown}
        maxHeight={300}
        selectedTextStyle={{ color: 'black' }}
        placeholderStyle={{ color: 'gray' }}
      />

      {/* MULTISELECT Horarios */}
      <MultiSelect
        placeholder="Horario(s)"
        search
        searchPlaceholder="Buscar horario..."
        data={data[0].horarios}
        labelField="horario"
        valueField="value"
        value={horarioValues}
        onChange={item => setHorarioValues(item)}
        style={styles.dropdown}
        maxHeight={300}
        selectedTextStyle={{ color: 'black' }}
        placeholderStyle={{ color: 'gray' }}
      />

      {/* Campo para escribir y botón Agregar */}
      <View style={{ marginTop: 10 }}>
        <TextInput placeholder="Escribe aquí..." style={styles.textInputForm} />
        <Button
          title="Agregar"
          onPress={() => {
            console.log('Materias:', materiaValues);
            console.log('Maestros:', maestroValues);
            console.log('Horarios:', horarioValues);
          }}
        />
      </View>

      {/* Botón limpiar al final */}
      <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 0 }}>
        <Button
          title="Limpiar"
          onPress={() => {
            setMateriaValues([]);
            setMaestroValues([]);
            setHorarioValues([]);
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
