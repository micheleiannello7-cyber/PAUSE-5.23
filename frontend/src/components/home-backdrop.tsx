// Stesso asset del passo nome: resta fisso e attenuato dietro la Home.
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, withAlpha } from "@/src/theme";

const ARTWORK = require("../../assets/images/onboarding-profile-bg.jpg");

export function HomeBackdrop() {
  const { colors, scheme } = useTheme();
  return (
    <View pointerEvents="none" style={styles.frame} testID="home-backdrop">
      <Image source={ARTWORK} contentFit="cover" contentPosition="center" transition={0}
        cachePolicy="memory-disk" accessible={false} testID="home-backdrop-artwork"
        style={[styles.frame, scheme === "dark" ? styles.darkArt : styles.lightArt]} />
      <LinearGradient pointerEvents="none" testID="home-backdrop-veil"
        colors={[withAlpha(colors.surface, 0.2), withAlpha(colors.surface, 0.4), withAlpha(colors.surface, 0.58), withAlpha(colors.surface, 0.94)]}
        locations={[0, 0.4, 0.75, 1]} style={styles.frame} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  darkArt: { opacity: 0.5 },
  lightArt: { opacity: 0.2 },
});