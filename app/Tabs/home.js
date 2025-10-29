import {  View, StyleSheet, Pressable } from "react-native";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import OptionSidebarView from "./OptionSidebarView";
import { Image } from "react-native-web";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function Home() {
  const router = useRouter()
  const [activOptionSidebar, setActivOptionSidebar] = useState(true)


  return (
    <View
      style={{
        flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
        height:'100%',
        width:'100%',
      }}
    >
      <View style={{height:'5%', width:'100%', padding:5,borderBlockColor: 'black',alignItems: "center", 
        borderWidth: 1, flexDirection: 'row',
        }}>
          <View style={{marginRight:10}}>
            <Pressable onPress={() => router.push('/')}>
              <Image source={{uri:"https://cdn-icons-png.flaticon.com/512/94/94510.png"}} style={{width: 35, height: 35}}/>
            </Pressable>
          </View>
          <View style={{marginRight:10}}>
            <Pressable 
              onPress={()=> {
                setActivOptionSidebar(!activOptionSidebar)
                console.log(activOptionSidebar)
              }}
            >
              <Image source={{uri:"https://images.icon-icons.com/1919/PNG/512/optionscircularbutton_122043.png"}} style={{width: 35, height: 35}}/>
            </Pressable>
          </View>

      </View>

      <View style={{ flex: 1,height:'95%',width:'100%',flexDirection: 'row',}}>
            <View style={{width:'20%', justifyContent: "center", alignItems: "center", display: activOptionSidebar ? 'flex' : 'none'}}>
              <OptionSidebarView></OptionSidebarView>              
            </View>
          
          {/* Condicionar para que cambie entre WeeklySchedule o OptionsWeeklySchedule */}
          <View style={{width:activOptionSidebar?'80%' : '100%', height:'100%'}}>
              <WeeklySchedule></WeeklySchedule>
          </View>
      </View>
    </View>

  );
}


            // <Button
            //     title="regresar"
            //     onPress={() => router.push('/')}
            // />