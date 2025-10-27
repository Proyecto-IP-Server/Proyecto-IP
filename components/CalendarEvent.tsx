import { Pressable, StyleSheet } from "react-native";
import { View } from "react-native";
import TextTitle from "./TextTitle";
import { Label, Text } from "@react-navigation/elements";


export default function CalendarEvent({evento, maestro, lugar, codigo}: {evento: string, maestro: string, lugar: string, codigo: string}) {
    return(
        <Pressable>
            <View style={styles.container}>
                <View style={styles.fieldContainer}>
                    <TextTitle>{evento}</TextTitle>
                </View>
                <View style={styles.fieldContainer}>
                    <Label>Maestro: </Label>
                    <Text>{maestro}</Text>
                </View>
                <View style={styles.fieldContainer}>
                    <Label>Lugar: </Label>
                    <Text>{lugar}   </Text>
                </View>
                <View style={styles.fieldContainer}>
                    <Label>Código: </Label>
                    <Text>{codigo}</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        width: '100%',
        height: '100%',
        // backgroundColor: '#e0e0e0',
    },
    fieldContainer :{
        margin:2,
        flexDirection: "row",
        alignItems: "center",
    },
});
