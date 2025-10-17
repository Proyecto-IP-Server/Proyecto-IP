import { Text } from 'react-native';
export default function TextTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 24,
        fontWeight: "bold",

      }}
    >
      {children}
    </Text>
  );
}