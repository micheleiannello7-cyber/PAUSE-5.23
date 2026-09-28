// PAUSE — barra superiore del lettore verticale ("Copertina", scelta
// dall'utente): miniatura della copertina a sinistra, titolo di ciò che si sta
// leggendo (mai troncato: i titoli lunghi scendono di corpo) e sotto
// l'occhiello "CAPITOLO 3 DI 7"; un filo di progresso corre lungo tutto il
// bordo inferiore. Le azioni già esistenti (badge Ascolta) restano a destra.
// Il fondo è un vetro molto trasparente che compare solo quando la copertina
// è scorsa via.
import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { StoryPreview } from "@/src/api";
import { makeStyles, useTheme, spacing, typography, withAlpha } from "@/src/theme";
import { HighlightedTitle } from "@/src/components/highlighted-title";
import { StoryHero } from "@/src/components/story-hero";

export const READER_HEADER_H = 96;

type Props = {
  topInset: number;
  /** Storia in lettura: copertina in miniatura. */
  story: StoryPreview;
  /** Titolo della storia: parole chiave nel colore del tema, come nella Home. */
  title: string;
  highlight: string[];
  label: string;
  /** Colore dell'etichetta (pervinca per l'introduzione, ambra per "Da ricordare", azzurro per i capitoli). */
  labelColor?: string;
  /** Icona dell'occhiello (libro per i capitoli, segnalibro per "Da ricordare"). */
  labelIcon?: string;
  /** 0..1, continuous through the whole story (drives the thin bar). */
  progress: SharedValue<number>;
  /** 0..1, opacity of the glass background (1 once the cover is scrolled away). */
  solid: SharedValue<number>;
  /** 0..1: il titolo nella barra compare solo quando il titolo grande della copertina è scorso via. */
  reveal: SharedValue<number>;
  /** Badge piccolo (es. riapri il player): a destra, centrato in altezza, mai sopra il titolo. */
  corner?: ReactNode;
};

export function ReaderHeader({
  topInset, story, title, highlight, label, labelColor, labelIcon = "book-outline", progress, solid, reveal, corner,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const bg = useAnimatedStyle(() => ({ opacity: solid.value }));
  const show = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: (1 - reveal.value) * 8 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: reveal.value }));
  // Solo transform (niente larghezza animata → nessun layout per frame).
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.001, Math.min(1, progress.value)) }] }));
  const n = title.length;
  const titleSize = n > 70 ? styles.titleXs : n > 55 ? styles.titleSm : n > 40 ? styles.titleMd : null;

  return (
    <View style={[styles.wrap, { paddingTop: topInset }]} testID="reader-header">
      {/* Scrim leggero sulla foto, per la leggibilità di titolo e pulsanti:
          compare solo insieme alla barra, così la copertina dell'introduzione
          resta pulita fino in alto. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, scrim]}>
        <LinearGradient
          colors={[withAlpha(colors.surface, 0.92), withAlpha(colors.surface, 0.62), withAlpha(colors.surface, 0)]}
          locations={[0, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Fondo in vetro, molto trasparente, che appare scorrendo oltre la copertina. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.solid, bg]} />
      <Animated.View style={[styles.row, corner ? styles.rowWithCorner : null, show]} pointerEvents="none" testID="reader-progress">
        <View style={styles.thumb} testID="reader-header-thumb">
          <StoryHero story={story} style={StyleSheet.absoluteFill} size="thumb" iconSize={20} transition={0} />
        </View>
        <View style={styles.copy}>
          {/* Mai troncato: i titoli lunghi scendono di corpo e restano dentro l'altezza della barra. */}
          <HighlightedTitle title={title} highlight={highlight} style={[styles.title, titleSize]} testID="reader-header-title" />
          {label ? (
            <View style={styles.eyebrowRow}>
              <Ionicons name={labelIcon as any} size={11} color={labelColor ?? colors.cyan} />
              <Text style={[styles.label, labelColor ? { color: labelColor } : null]} numberOfLines={1} testID="deep-dive-page-label">{label}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
      {corner ? <View style={styles.corner}>{corner}</View> : null}
      {/* Filo di progresso lungo tutto il bordo inferiore della barra. */}
      <Animated.View style={[styles.track, show]} accessibilityRole="progressbar" pointerEvents="none">
        <Animated.View style={[styles.fillWrap, fill]}>
          <LinearGradient
            colors={[colors.brandSecondary, colors.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
            testID="reader-progress-fill"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
  solid: {
    backgroundColor: withAlpha(colors.surface, 0.94),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  row: {
    minHeight: READER_HEADER_H - 2, flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  // Con il badge a destra il testo gli lascia spazio (il badge è centrato in altezza).
  rowWithCorner: { paddingRight: spacing.lg + 44 },
  thumb: {
    width: 56, height: 56, borderRadius: 14, overflow: "hidden",
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.glassBorderStrong,
  },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  title: {
    color: colors.textWarm, fontFamily: typography.displayBold, fontSize: 15.5, lineHeight: 19, letterSpacing: -0.2,
    textShadowColor: withAlpha(colors.surface, 0.75), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  titleMd: { fontSize: 15, lineHeight: 18 },
  titleSm: { fontSize: 14, lineHeight: 17 },
  titleXs: { fontSize: 13.5, lineHeight: 16.5 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 2 },
  track: { height: 2, backgroundColor: withAlpha(colors.onSurface, 0.10) },
  fillWrap: { width: "100%", height: 2, overflow: "hidden", transformOrigin: "left center", boxShadow: `0px 0px 10px ${colors.cyanGlow}` as any },
  fill: { flex: 1 },
  corner: { position: "absolute", right: spacing.lg, top: 0, bottom: 0, justifyContent: "center", alignItems: "center", paddingTop: spacing.sm - spacing.md },
}));
