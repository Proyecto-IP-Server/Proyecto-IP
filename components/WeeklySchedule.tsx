import React from 'react';
import { Background, Text } from "@react-navigation/elements";
import { FlatList, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native";
import CalendarEvent from './CalendarEvent';


export function WeeklySchedule() {
    const daysOfWeek = ['','Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const timeSlots = () => {
        const slots = [];
        for (let hour = 7; hour <= 21; hour++) {
            slots.push(`${hour}:00`);
        }
        return slots;
    }
    // Es la representación de las actividades en la semana
    const sections = () =>{
        const sections = [];
        const numSections = daysOfWeek.length * timeSlots().length; 
        
        for (let i = 1; i < daysOfWeek.length; i++) {
            for (let j = 0; j < timeSlots().length; j++) {
                sections.push({id: daysOfWeek[i] + timeSlots()[j], day: daysOfWeek[i], hour: timeSlots()[j], event: 'Vacio'});
                // Evento = {clase, ocupado, null}
                // event se ira modificando segun las clases que se vayan agregando
            }
        }
        sections.sort((a, b) => {
            const hourA = parseInt(a.hour.split(':')[0]);
            const hourB = parseInt(b.hour.split(':')[0]);
            return hourA - hourB;
        });
        console.log(sections);
        return sections;
    }


    // La tabla del horario se va harmar por filas
    return (
        <View style={{ width: '100%', height: '100%',}}>
            <Text>Horario Semanal</Text>
            <View style={{flexDirection: "column", width: '100%', height: '100%', borderBlockColor: 'black', borderWidth: 1}}>

                {/* Headers */}
                <View style={{flexDirection: "row", width: '100%', height: '2.5%',borderBlockColor: 'black', borderWidth: 1}}>
                    {daysOfWeek.map((day) => (
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', borderBlockColor: 'black', borderWidth: 1}}>
                            <Text>{day}</Text>
                        </View>
                    ))}
                </View>
                {/* Cuerpo de la tabla */}
                <View style={{width: '100%', height: '95%'}}>

                    <FlatList
                        data={timeSlots()}
                        renderItem={({ item: hour }) => (
                            <View style={{flexDirection: 'row', borderBlockColor: 'black', borderWidth: 1}}>
                                    {daysOfWeek.map((day) => {
                                        // Buscar la sección correspondiente al día y la hora Para no repetir datos
                                        const section = sections().find(s => s.day === day && s.hour === hour);
                                        return (
                                            section?.event === "Clase"
                                            ?
                                                <View style={{}} >
                                                        <CalendarEvent evento={section?.event} maestro={"juan"} lugar={"lugar"} codigo={section?.id}/>
                                                </View>
                                            :
                                            <View style={section?.event==="Clase"? styles.sectionClass:styles.sectionFree} >
                                                {section?.event === 'Vacio' ?    
                                                    <Text></Text>
                                                :
                                                    <CalendarEvent evento={section?.event} maestro={"juan"} lugar={"lugar"} codigo={section?.id}/>
                                                }
                                            </View>
                                            
                                            
                                                
                                        );
                                    })}
                            </View>
                        )}
                        style={{height: '100%', width: '100%'}}
                    />
                    
                </View>

                   
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
    sectionBusy:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBlockColor: 'black',
        borderWidth: 1,
        backgroundColor: '#ffcccc',
    },
    sectionClass:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBlockColor: 'black',
        borderWidth: 1,
        backgroundColor: '#ccffcc',
    },
    sectionFree:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBlockColor: 'black',
        borderWidth: 1,
    },

});
