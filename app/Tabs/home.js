import {  View, StyleSheet } from "react-native";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import OptionSidebarView from "./OptionSidebarView";

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
        height:'100%',
        width:'100%',
        flexDirection: 'row',
      }}
    >
        <View style={{width:'30%', justifyContent: "center",
        alignItems: "center",}}>
            <OptionSidebarView></OptionSidebarView>
        </View>
        {/* Condicionar para que cambie entre WeeklySchedule o OptionsWeeklySchedule */}
        {/* <View style={{width:'70%', height:'100%'}}>
            <WeeklySchedule></WeeklySchedule>
        </View> */}
    </View>
  );
}
