import { Pressable, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextTitle from "../../components/TextTitle"
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { useState, useEffect } from 'react';

export default function FAQ() {
    const router = useRouter();

    useEffect(() => {
        //Se ejecuta al montar inicio

    }, []);

    return (
        <View style={styles.container}>
            <TextTitle>FAQ</TextTitle>
            <Text>
                Aquí puedes encontrar respuestas a las preguntas más comunes sobre nuestra aplicación. Si tienes alguna otra duda, no dudes en contactarnos.
            </Text>
            <Pressable style={styles.button} onPress={() => router.push('/Tabs/resenas')}>
                <Text style={styles.buttonText}>Ver Reseñas</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        width:'100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
});