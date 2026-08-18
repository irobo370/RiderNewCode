import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import HomeScreen from "../Home/HomeScreen";
import CustomDrawer from "../utils/CustomDrawer";
import SettingScreen from "../DrawerScreen/Setting/SettingScreen";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      id="Drawer"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="HomeDrawer" component={HomeScreen} />
          </Drawer.Navigator>
  );
}
