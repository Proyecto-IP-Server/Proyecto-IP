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
            <TextTitle text="Reseñas" />
            <Pressable style={styles.button} onPress={() => router.push('/Tabs/faq')}>
                <Text style={styles.buttonText}>Ver Preguntas Frecuentes</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        width:'100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    button: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007bff',
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});