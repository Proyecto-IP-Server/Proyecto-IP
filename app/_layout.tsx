import { Stack } from "expo-router";

export default function RootLayout() {
  return( 
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="Tabs/home" options={{ headerShown: false }} />
      <Stack.Screen name="Tabs/GeneratedScheduleView" options={{ headerShown: false }} />
      <Stack.Screen name="Tabs/faq" options={{ headerShown: false}} />
      <Stack.Screen name="Tabs/reviews" options={{ headerShown: false}} />
      <Stack.Screen name="Tabs/suport" options={{ headerShown: false}} />
    </Stack>
  );
}
