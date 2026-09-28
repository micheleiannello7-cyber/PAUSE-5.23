// PAUSE — contatore compatto "storie lette" nell'header della Home: stessa
// grammatica in vetro dark-navy delle tessere categoria (gradiente, bordo
// chiaro, oggetto 3D) in formato pillola. Tocco → riepilogo delle storie lette.
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { makeStyles, radius, typography } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { KindIcon } from "./kind-icon";
import { ONB } from "./onboarding-palette";

export function HomeReadCounter({ count }: { count: number }) {
  const { t } = useI18n();
  const styles = useStyles();
  const router = useRouter();
  const label = `${count} ${count === 1 ? t.stories_read_1 : t.stories_read}`;
  return (
    <Pressable testID="home-read-counter" accessibilityRole="button" accessibilityLabel={label} accessibilityHint={t.pl_recap_title}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }} onPress={() => router.push("/read-stories")}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
      <LinearGradient colors={[ONB.glassTop, ONB.glassBottom]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <KindIcon kind="lessons" size={20} glow={false} testID="home-read-counter-icon" />
      <Text testID="home-read-counter-count" style={styles.count}>{count}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles(() => ({
  pill: {
    height: 32, paddingLeft: 7, paddingRight: 11, flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: radius.pill, borderWidth: 1, borderColor: ONB.glassBorder, overflow: "hidden",
  },
  count: { color: ONB.text, fontFamily: typography.displayBold, fontSize: 14, letterSpacing: -0.2, minWidth: 10, textAlign: "center" },
  pressed: { opacity: 0.8 },
}));
