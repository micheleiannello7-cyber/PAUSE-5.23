// PAUSE — atmosfera della lettura: livello fisso dietro allo scroll, uguale
// per ogni tema nella struttura (fondo quasi nero, grandi luci morbidissime
// verso angoli e bordi, centro più scuro e calmo per il testo) e diverso solo
// nella tonalità, presa dal tema corrente (atmosBase / atmosTint /
// atmosSecondary / atmosGlow in theme.ts). Sopra, la stessa copertina molto
// scura e sfocata che si fonde col fondo: piena durante l'apertura, poi solo
// una traccia appena percettibile dietro ai capitoli. Le luci respirano
// lentissimamente (solo trasformazioni), ferme con "riduci movimento".
// Mai immagini forti né colori accesi dietro al testo: il contrasto resta massimo.
import { useEffect } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing, Extrapolation, cancelAnimation, interpolate, SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from "react-native-reanimated";

import { StoryPreview, heroUrl } from "@/src/api";
import { useTheme, withAlpha } from "@/src/theme";

// Opacità della copertina sfocata: apertura → capitoli.
const ATMOS_INTRO = 0.34, ATMOS_CHAPTERS = 0.10;
// Respiro delle luci: un ciclo ogni ~22 s, spostamenti di pochi punti.
const BREATH_MS = 22000;

type Light = { x: number; y: number; size: number; color: string; alpha: number; dx: number; dy: number };

export function ReaderAtmosphere({ story, scrollY, fadeOver, animated = true }: {
  story: StoryPreview;
  /** Respiro delle luci (false nel livello di transizione: lì tutto è già in movimento). */
  animated?: boolean;
  /** Scroll della pagina: la traccia della copertina si attenua scorrendo. Assente = ferma sull'apertura. */
  scrollY?: SharedValue<number>;
  /** Distanza di scroll su cui avviene l'attenuazione (≈ altezza della prima schermata). */
  fadeOver?: number;
}) {
  const { colors } = useTheme();
  const { width: w, height: h } = useWindowDimensions();
  const zero = useSharedValue(0);
  const y = scrollY ?? zero;
  const over = Math.max(1, fadeOver ?? 1);
  const trace = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, over], [ATMOS_INTRO, ATMOS_CHAPTERS], Extrapolation.CLAMP),
  }));
  // Le luci si attenuano appena entrando nei capitoli: l'ambiente resta, più calmo.
  const lightsDim = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, over], [1, 0.78], Extrapolation.CLAMP),
  }));
  const reducedMotion = useReducedMotion();
  const breath = useSharedValue(0);
  useEffect(() => {
    // Sul web ridisegnare aloni così larghi a ogni fotogramma costa troppo: lì l'atmosfera è ferma.
    if (reducedMotion || !animated || Platform.OS === "web") { breath.value = 0; return; }
    breath.value = withRepeat(withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => { cancelAnimation(breath); };
  }, [reducedMotion, animated, breath]);

  const big = Math.max(w, h);
  // Stessa composizione per ogni tema: due luci principali (tinta) in alto a
  // sinistra e in basso a destra, due secondarie negli angoli opposti, un
  // filo di accento (glow) sul bordo alto. Il centro resta libero.
  const lights: Light[] = [
    { x: -big * 0.55, y: -big * 0.5, size: big * 1.3, color: colors.atmosTint, alpha: 0.95, dx: 14, dy: 10 },
    { x: w - big * 0.7, y: h - big * 0.7, size: big * 1.3, color: colors.atmosTint, alpha: 0.9, dx: -12, dy: -14 },
    { x: w - big * 0.55, y: -big * 0.6, size: big * 1.05, color: colors.atmosSecondary, alpha: 0.85, dx: -10, dy: 12 },
    { x: -big * 0.6, y: h - big * 0.55, size: big * 1.05, color: colors.atmosSecondary, alpha: 0.8, dx: 12, dy: -8 },
    { x: w * 0.5 - big * 0.4, y: -big * 0.6, size: big * 0.8, color: colors.atmosGlow, alpha: 0.12, dx: 8, dy: 6 },
  ];
  const uri = heroUrl(story, "thumb");
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.atmosBase, overflow: "hidden" }]} pointerEvents="none" testID="reader-atmosphere">
      <Animated.View style={[StyleSheet.absoluteFill, lightsDim]}>
        {lights.map((l, i) => <AmbientLight key={i} light={l} breath={breath} />)}
      </Animated.View>
      {uri ? (
        <Animated.View style={[StyleSheet.absoluteFill, trace]}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={40} transition={0} cachePolicy="memory-disk" accessible={false} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(colors.atmosBase, 0.5) }]} />
        </Animated.View>
      ) : null}
      {/* Protezione del testo: la fascia centrale resta più scura, i bordi respirano. */}
      <LinearGradient
        colors={[withAlpha(colors.atmosBase, 0.05), withAlpha(colors.atmosBase, 0.36), withAlpha(colors.atmosBase, 0.36), withAlpha(colors.atmosBase, 0.15)]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[withAlpha(colors.atmosBase, 0), withAlpha(colors.atmosBase, 0.30), withAlpha(colors.atmosBase, 0)]}
        locations={[0, 0.5, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// Una luce: un solo disco radiale (PNG bianco che sfuma a zero) tinto con il
// colore del tema — un livello composito leggerissimo, niente ombre da
// ridisegnare — che si sposta di pochi punti con il respiro. Solo trasformazioni.
const GLOW = require("../../assets/images/reader-glow.png");

function AmbientLight({ light, breath }: { light: Light; breath: SharedValue<number> }) {
  const move = useAnimatedStyle(() => ({
    transform: [{ translateX: light.dx * breath.value }, { translateY: light.dy * breath.value }],
  }));
  return (
    <Animated.View style={[styles.light, move, { left: light.x, top: light.y, width: light.size, height: light.size, opacity: light.alpha }]}>
      <Image source={GLOW} style={StyleSheet.absoluteFill} contentFit="fill" tintColor={light.color} transition={0} cachePolicy="memory" accessible={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  light: { position: "absolute" },
});
