import {  View } from "react-native";
// import ConditionalsFormView from "./Tabs/OptionSideBoart_view";
// import LogFormView from "./Tabs/datos_generales_view_form";
import { WeeklySchedule } from "@/components/WeeklySchedule";


export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <WeeklySchedule />
    </View>
  );
}
