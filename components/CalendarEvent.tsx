import { Pressable, StyleSheet } from "react-native";
import { View } from "react-native-reanimated/lib/typescript/Animated";
import TextTitle from "./TextTitle";
import { Label, Text } from "@react-navigation/elements";


export default function CalendarEvent() {
    return(
        <Pressable>
            <View style={{}}>
                <View style={styles.fieldContainer}>
                    <Label>Evento</Label>
                    <TextTitle>Evento de Calendario</TextTitle>
                </View>
                <View style={styles.fieldContainer}>
                    <Label>Maestro</Label>
                    <Text>Maestro</Text>
                </View>
                <View style={styles.fieldContainer}>
                    <Label>Lugar</Label>
                    <Text>lugar</Text>
                </View>
                <View style={styles.fieldContainer}>
                    <Label>Código</Label>
                    <Text>codigo</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fieldContainer :{
        margin:10,
        flexDirection: "row",
        alignItems: "center",
    },
});
