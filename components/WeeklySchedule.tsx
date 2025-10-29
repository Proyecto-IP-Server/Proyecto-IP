import React from 'react';
import { Background, Text } from "@react-navigation/elements";
import { Button, FlatList, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native";
import CalendarEvent from './CalendarEvent';
import TextTitle from './TextTitle';
import { useRouter } from 'expo-router';


export function WeeklySchedule({carrera, centro, cliclo}:{carrera:string, centro:string, cliclo:string}) {
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const timeSlots = () => {
        const slots = [];
        for (let hour = 7; hour <= 21; hour++) {
            slots.push(`${hour}:00`);
        }
        return slots;
    }
    const getCellStyle = (status) => {
        switch (status) {
            case 'vacio':
            return { backgroundColor: '#ffcccc', };
            case 'Materia':
            return { backgroundColor: '#ccffcc' };
            default:
            return { backgroundColor: '#fff' };
    }};
    // Classes. Los dastos ya tienen que estar procesados
    // osea se tiene que pasar una obsion de los horarios
    const course = [{
            "materia"   :"materia",
            "mestro"    :"mestro",
            "edificio"  :"edificio",
            "NRC"       :"NRC",
            "horario"   :"horario" 
        }]// materia, mestro, edificio, NRC, horario 

    let content = () => {
        const times = timeSlots();
        let rows = [];

        for (let i = 0; i < times.length; i++) {
            for (let j = 0; j < daysOfWeek.length; j++) {
                rows.push({
                    event: { tipe: 'vacio' },
                    Caracteristicas: {
                        day: daysOfWeek[j],
                        hor: times[i]
                    }
                });
            }
        }

        return rows;
    };

    // La tabla del horario se va harmar por filas
    return (
        <View style={{ width: '100%', height: '100%',}}>
            <View style={{height:'100%', width:'100%',padding:1,}}>
                {/* Es la vista que contiene los haaders de la tabla */}
                <View style={{
                    alignItems: 'center',
                    borderBlockColor: 'black',
                    borderWidth: 1,
                    height:'5%',
                    width:'99.12%', // 99.12
                    flexDirection: 'row',
                }}>
                    <View style={[styles.containerHeder,styles.containerCell]}>
                        <Text>Horario</Text>
                    </View>
                    {
                        daysOfWeek.map( day =>{
                            return(
                                <View style={styles.containerCell}>
                                    <Text>{day}</Text>
                                </View>
                            )
                        })
                    }
                </View>
                {/* Este flatlist contiene el contido de la tabla */}
                <ScrollView style={{height:'90%', width:'100%'}}>
                    {
                        timeSlots().map( time =>{
                            // Ingresar los headers
                            let rows = content().filter(row => row.Caracteristicas?.hor === time)
                            return(
                                <View style={{flexDirection: 'row', borderBlockColor: 'black', borderWidth: 1, alignItems: 'center',}}>
                                    <View style={[styles.containerCell,]}>
                                        <Text>{time}</Text>
                                    </View>
                                    {
                                    rows.map(row =>{ return(
                                        <View style={[styles.containerCell,getCellStyle(row.event.tipe)]}>
                                            {/* {row.event.tipe ==='vacio'
                                            } */}
                                            <CalendarEvent
                                                evento={row.event?.tipe}
                                                tipe=''
                                            />
                                        </View>
                                    )})
                                    }
                                </View>
                            )
                        })
                    }
                </ScrollView>
            </View>



        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 2,
        padding: 16,
    },
    containerHeder:{
        height:'100%',
        width:'50%',
    },
    containerCell:{
        flex: 1,
        height:'100%',
        width:'100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBlockColor: 'black',
        borderWidth: 1,
        padding:2
    },
    sectionBusy:{
        backgroundColor: '#ffcccc',
    },
    sectionClass:{
        backgroundColor: '#ccffcc',
    },
    containerCellVoid:{
        padding:50
    }
});
