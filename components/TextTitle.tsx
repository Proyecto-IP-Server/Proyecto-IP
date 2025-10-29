import { Text } from 'react-native';
export default function TextTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 35,
        fontWeight: "bold",
        paddingTop:10,
        paddingBottom:20
      }}>
      {children}
    </Text>
  );
}