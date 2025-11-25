import React, { useState, useEffect, useRef } from 'react';
import { Text } from "@react-navigation/elements";
import { StyleSheet, View, ScrollView, Pressable, Animated } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import BlurModal from './BlurModal';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WeeklySchedule() {
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const timeSlots = () => {
        const slots = [];
        for (let hour = 7; hour <= 21; hour++) {
            slots.push(`${hour}:00`);
        }
        return slots;
    };
    
    // Mapeo de días a números (Lunes=1, Martes=2, etc.)
    const dayToNumber = {
        'Lunes': 1,
        'Martes': 2,
        'Miércoles': 3,
        'Jueves': 4,
        'Viernes': 5,
        'Sábado': 6
    };
    
    // Estado para celdas deshabilitadas (bloqueadas)
    const [disabledCells, setDisabledCells] = useState({});
    const [modalLimpiarVisible, setModalLimpiarVisible] = useState(false);
    
    // Estado para mostrar tooltip
    const [showTooltip, setShowTooltip] = useState(false);
    
    // Refs para animaciones
    const cellAnimations = useRef({});
    
    // Cargar celdas deshabilitadas desde AsyncStorage
    useEffect(() => {
        loadDisabledCells();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Función para obtener o crear animación de una celda
    const getCellAnimation = (key) => {
        if (!cellAnimations.current[key]) {
            cellAnimations.current[key] = new Animated.Value(1);
        }
        return cellAnimations.current[key];
    };
    
    // Función para animar el toggle
    const animateToggle = (key) => {
        const anim = getCellAnimation(key);
        Animated.sequence([
            Animated.timing(anim, {
                toValue: 0.7,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(anim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const loadDisabledCells = async () => {
        try {
            const saved = await AsyncStorage.getItem('disabledScheduleCells');
            if (saved === null) {
                await AsyncStorage.setItem('disabledScheduleCells', JSON.stringify([]));
            }
            if (saved) {
                const formattedCells = JSON.parse(saved);
                
                if (Array.isArray(formattedCells)) {
                    const cells = {};
                    const numberToDay = Object.keys(dayToNumber).reduce((acc, day) => {
                        acc[dayToNumber[day]] = day;
                        return acc;
                    }, {});
                    
                    formattedCells.forEach(cell => {
                        if (cell.dia && cell.hora !== undefined) {
                            const day = numberToDay[cell.dia];
                            
                            // Si hora es un string en formato time (HH:MM:SS.mmmmmm), extraer la hora
                            let hourNum;
                            if (typeof cell.hora === 'string' && cell.hora.includes(':')) {
                                hourNum = parseInt(cell.hora.split(':')[0]);
                            } else {
                                // Formato anterior (número)
                                hourNum = cell.hora;
                            }
                            
                            const time = `${hourNum}:00`;
                            const key = getCellKey(day, time);
                            cells[key] = true;
                        }
                    });
                    setDisabledCells(cells);
                } else {
                    // Formato antiguo (objeto directo)
                    setDisabledCells(formattedCells);
                }
            }
        } catch (error) {
            console.error('Error al cargar celdas deshabilitadas:', error);
        }
    };

    const saveDisabledCells = async (cells) => {
        try {
            // Convertir el formato interno a formato {dia: número, hora: time}
            const formattedCells = Object.keys(cells).map(key => {
                const [day, time] = key.split('-');
                const dayNum = dayToNumber[day];
                const hourNum = parseInt(time.split(':')[0]);
                
                // Formato time: HH:MM:SS.mmmmmm
                const timeFormatted = `${hourNum.toString().padStart(2, '0')}:00:00.000000`;
                
                return { dia: dayNum, hora: timeFormatted };
            });
            
            await AsyncStorage.setItem('disabledScheduleCells', JSON.stringify(formattedCells));
            console.log('Celdas guardadas:', formattedCells);
        } catch (error) {
            console.error('Error al guardar celdas deshabilitadas:', error);
        }
    };

    // Función para generar la clave única de una celda
    const getCellKey = (day, time) => `${day}-${time}`;

    // Función para toggle de una celda individual
    const toggleCell = (day, time) => {
        const key = getCellKey(day, time);
        animateToggle(key);
        
        const newDisabledCells = { ...disabledCells };
        
        if (newDisabledCells[key]) {
            delete newDisabledCells[key];
        } else {
            newDisabledCells[key] = true;
        }
        
        setDisabledCells(newDisabledCells);
        saveDisabledCells(newDisabledCells);
    };

    // Función para toggle de toda una columna (día)
    const toggleDay = (day) => {
        const newDisabledCells = { ...disabledCells };
        const times = timeSlots();
        
        // Verificar si todas las celdas del día están deshabilitadas
        const allDisabled = times.every(time => newDisabledCells[getCellKey(day, time)]);
        
        times.forEach(time => {
            const key = getCellKey(day, time);
            animateToggle(key);
            if (allDisabled) {
                delete newDisabledCells[key];
            } else {
                newDisabledCells[key] = true;
            }
        });
        
        setDisabledCells(newDisabledCells);
        saveDisabledCells(newDisabledCells);
    };

    // Función para toggle de toda una fila (hora)
    const toggleTime = (time) => {
        const newDisabledCells = { ...disabledCells };
        
        // Verificar si todas las celdas de la hora están deshabilitadas
        const allDisabled = daysOfWeek.every(day => newDisabledCells[getCellKey(day, time)]);
        
        daysOfWeek.forEach(day => {
            const key = getCellKey(day, time);
            animateToggle(key);
            if (allDisabled) {
                delete newDisabledCells[key];
            } else {
                newDisabledCells[key] = true;
            }
        });
        
        setDisabledCells(newDisabledCells);
        saveDisabledCells(newDisabledCells);
    };

    // Función para limpiar todas las selecciones
    const limpiarTodo = () => {
        setDisabledCells({});
        saveDisabledCells({});
        setModalLimpiarVisible(false);
    };

    // Función para seleccionar horario matutino (excluye 16:00 - 21:00)
    const seleccionarMatutino = () => {
        const newDisabledCells = { ...disabledCells };
        const horasVespertino = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
        
        daysOfWeek.forEach(day => {
            horasVespertino.forEach(time => {
                const key = getCellKey(day, time);
                newDisabledCells[key] = true;
                animateToggle(key);
            });
        });
        
        setDisabledCells(newDisabledCells);
        saveDisabledCells(newDisabledCells);
    };

    // Función para seleccionar horario vespertino (excluye 7:00 - 13:00)
    const seleccionarVespertino = () => {
        const newDisabledCells = { ...disabledCells };
        const horasMatutino = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00'];
        
        daysOfWeek.forEach(day => {
            horasMatutino.forEach(time => {
                const key = getCellKey(day, time);
                newDisabledCells[key] = true;
                animateToggle(key);
            });
        });
        
        setDisabledCells(newDisabledCells);
        saveDisabledCells(newDisabledCells);
    };

    const getCellStyle = (day, time) => {
        const key = getCellKey(day, time);
        const isDisabled = disabledCells[key];
        
        return {
            backgroundColor: isDisabled ? '#adb5bd' : '#ffffff',
            borderColor: isDisabled ? '#6c757d' : '#dee2e6',
            borderWidth: isDisabled ? 1 : 0.5,
        };
    }; 

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
                {/* Controles de horario */}
                <View style={styles.headerControls}>
                    <View style={styles.buttonGroup}>
                        <Pressable 
                            style={[styles.horarioButton, styles.horarioButtonMatutino]}
                            onPress={seleccionarMatutino}
                        >
                            <Image 
                                source={require('@/assets/images/sun_day.svg')}
                                style={styles.horarioButtonIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.horarioButtonText}>Matutino</Text>
                        </Pressable>

                        <Pressable 
                            style={[styles.horarioButton, styles.horarioButtonVespertino]}
                            onPress={seleccionarVespertino}
                        >
                            <Image 
                                source={require('@/assets/images/moon_day.svg')}
                                style={styles.horarioButtonIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.horarioButtonText}>Vespertino</Text>
                        </Pressable>
                        
                        <Pressable 
                            style={styles.limpiarButton}
                            onPress={() => setModalLimpiarVisible(true)}
                        >
                            <Image 
                                source={require('@/assets/images/trash-bin.svg')}
                                style={styles.limpiarButtonIcon}
                                contentFit="contain"
                            />
                            <Text style={styles.limpiarButtonText}>Limpiar</Text>
                        </Pressable>
                    </View>
                    
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>
                            Marca los horarios en los que <Text style={styles.headerTitleEmphasis}>NO</Text> deseas tener clases
                        </Text>
                        <Pressable
                            style={styles.tooltipIconButton}
                            onPress={() => setShowTooltip(!showTooltip)}
                        >
                            <Text style={styles.tooltipIcon}>?</Text>
                        </Pressable>
                    </View>
                    
                    {showTooltip && (
                        <View style={styles.tooltipContainer}>
                            <Pressable 
                                style={styles.tooltipCloseButton}
                                onPress={() => setShowTooltip(false)}
                            >
                                <Text style={styles.tooltipCloseText}>✕</Text>
                            </Pressable>
                            <Text style={styles.tooltipText}>
                                💡 <Text style={styles.tooltipBold}>Tip:</Text> Presiona los encabezados de días (columnas) u horas (filas) para marcar/desmarcar todas las casillas de ese día u hora.
                            </Text>
                        </View>
                    )}
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={styles.horizontalScrollView}
                    contentContainerStyle={styles.horizontalScrollContent}
                >
                    <View style={styles.tableContainer}>
                        {/* Es la vista que contiene los headers de la tabla */}
                        <View style={styles.tableHeader}>
                            <View style={[styles.timeHeaderCell, styles.headerCorner]}>
                                <Text style={styles.headerCornerText}>Hora</Text>
                            </View>
                            {
                                daysOfWeek.map((day, index) =>{
                                    return(
                                        <Pressable 
                                            key={`day-header-${index}`} 
                                            style={[styles.containerCell, styles.dayHeaderCell]}
                                            onPress={() => toggleDay(day)}
                                            android_ripple={{ color: '#0d6efd40' }}
                                        >
                                            <Text style={styles.headerText}>{day}</Text>
                                        </Pressable>
                                    )
                                })
                            }
                        </View>
                        {/* Este ScrollView contiene el contenido de la tabla */}
                        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                    {
                        timeSlots().map((time, timeIndex) =>{
                            // Ingresar los headers
                            let rows = content().filter(row => row.Caracteristicas?.hor === time)
                            return(
                                <View key={`time-row-${timeIndex}`} style={styles.tableRow}>
                                    <Pressable 
                                        style={[styles.containerCell, styles.timeHeaderCell]}
                                        onPress={() => toggleTime(time)}
                                        android_ripple={{ color: '#0d6efd40' }}
                                    >
                                        <Text style={styles.headerText}>{time}</Text>
                                    </Pressable>
                                    {
                                    rows.map((row, rowIndex) =>{ 
                                        const cellKey = getCellKey(row.Caracteristicas.day, time);
                                        const animScale = getCellAnimation(cellKey);
                                        return(
                                        <AnimatedPressable
                                            key={`cell-${timeIndex}-${rowIndex}`}
                                            style={[
                                                styles.containerCell, 
                                                getCellStyle(row.Caracteristicas.day, time),
                                                { transform: [{ scale: animScale }] }
                                            ]}
                                            onPress={() => toggleCell(row.Caracteristicas.day, time)}
                                            android_ripple={{ color: '#0d6efd40' }}
                                        >
                                            <View style={styles.cellContent}>
                                                {disabledCells[cellKey] && (
                                                    <Text style={styles.disabledText}>✕</Text>
                                                )}
                                            </View>
                                        </AnimatedPressable>
                                    )})
                                    }
                                </View>
                            )
                        })
                    }
                        </ScrollView>
                    </View>
                </ScrollView>
            </View>

            {/* Modal de confirmación para limpiar */}
            <BlurModal
                visible={modalLimpiarVisible}
                onClose={() => setModalLimpiarVisible(false)}
                containerStyle={styles.modalContainer}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>¿Limpiar todas las selecciones?</Text>
                    <Text style={styles.modalText}>
                        Esto habilitará todos los horarios nuevamente.
                    </Text>
                    <View style={styles.modalButtons}>
                        <Pressable 
                            style={styles.modalButtonCancel}
                            onPress={() => setModalLimpiarVisible(false)}
                        >
                            <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                        </Pressable>
                        <Pressable 
                            style={styles.modalButtonConfirm}
                            onPress={limpiarTodo}
                        >
                            <Text style={styles.modalButtonTextConfirm}>Limpiar</Text>
                        </Pressable>
                    </View>
                </View>
            </BlurModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 2,
        padding: 16,
    },
    headerControls: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 2,
        borderBottomColor: '#e9ecef',
        gap: 10,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#495057',
        textAlign: 'left',
        flex: 1,
    },
    headerTitleEmphasis: {
        fontSize: 15,
        fontWeight: '800',
        color: '#dc3545',
        textDecorationLine: 'underline',
    },
    tooltipIconButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0056b3',
    },
    tooltipIcon: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    tooltipContainer: {
        backgroundColor: '#fffbe6',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
        marginTop: 8,
        position: 'relative',
    },
    tooltipText: {
        fontSize: 12,
        color: '#555',
        lineHeight: 18,
    },
    tooltipBold: {
        fontWeight: 'bold',
        color: '#333',
    },
    tooltipCloseButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF9800',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    tooltipCloseText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        alignSelf: 'flex-end',
        width: '100%',
        justifyContent: 'flex-end',
    },
    horarioButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    horarioButtonMatutino: {
        backgroundColor: '#F57C00',
    },
    horarioButtonVespertino: {
        backgroundColor: '#5C6BC0',
    },
    horarioButtonIcon: {
        width: 14,
        height: 14,
        tintColor: '#fff',
    },
    horarioButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    limpiarButton: {
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    limpiarButtonIcon: {
        width: 14,
        height: 14,
        tintColor: '#fff',
    },
    limpiarButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e9ecef',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#dee2e6',
    },
    horizontalScrollView: {
        flex: 1,
        width: '100%',
    },
    horizontalScrollContent: {
        flexGrow: 1,
    },
    tableContainer: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flex: 1,
    },
    containerHeder:{
        minHeight: 50,
        width: 60,
        backgroundColor: '#e9ecef',
    },
    headerCorner: {
        backgroundColor: '#dee2e6',
        width: '11.66%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCornerText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6c757d',
        textAlign: 'center',
    },
    dayHeaderCell: {
        backgroundColor: '#e9ecef',
        borderRightWidth: 0.5,
        borderRightColor: '#ced4da',
        width: '14.66%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeHeaderCell: {
        backgroundColor: '#f8f9fa',
        width: '12%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#dee2e6',
        borderWidth: 0.5,
        borderColor: '#dee2e6',
    },
    containerCell:{
        width: '14.66%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#dee2e6',
        margin: 0,
    },
    headerText: {
        fontWeight: '700',
        fontSize: 12,
        color: '#0d6efd',
        textAlign: 'center',
    },
    cellContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledText: {
        fontSize: 24,
        color: '#6c757d',
        fontWeight: 'bold',
    },
    sectionBusy:{
        backgroundColor: '#ffcccc',
    },
    sectionClass:{
        backgroundColor: '#ccffcc',
    },
    containerCellVoid:{
        padding:50
    },
    modalContainer: {
        width: '85%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalContent: {
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButtonCancel: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    modalButtonConfirm: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#ff4444',
        alignItems: 'center',
    },
    modalButtonTextCancel: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonTextConfirm: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
