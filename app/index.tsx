import {  View } from "react-native";
import Login from '../app/Tabs/Login'



export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Login/>
    </View>
  );
}
