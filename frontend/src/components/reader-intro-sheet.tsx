// PAUSE — scheda della presentazione del lettore (sotto la card copertina):
// titolo grande, filo di luce, occhiello "INTRODUZIONE" + aggancio, filo,
// griglia info (tipo · categoria · durata) e i tasti Leggi / Ascolta.
// La usa il lettore (deep-dive) e, con la stessa identica geometria, la
// transizione dalla card della Home (story-morph): lì titolo e griglia sono
// "fantasmi" invisibili che segnano dove atterrano gli elementi in movimento.
import { ReactNode, useEffect, useRef } from "react";
import { LayoutChangeEvent, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { AnimatedStyle, SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { StoryPreview } from "@/src/api";
import { makeStyles, spacing, typography, useTheme, withAlpha, ThemeColors } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { HighlightedTitle } from "./highlighted-title";
import { StoryInfoGrid } from "./story-info-grid";
import { IntroCtaButton } from "./intro-cta-button";
import { READER_MAX_W } from "./reader-section";

export type SheetRect = { x: number; y: number; width: number; height: number };

export function ReaderIntroSheet({
  story, compact, reveal, onStart, listen, onLayout, prefix = "deep-dive", ghost = false, partsStyle, onTitleRect, onGridRect, remeasure, flat = false,
}: {
  story: StoryPreview; compact: number; reveal: SharedValue<number>; onStart: () => void; listen: ReactNode;
  onLayout: (height: number) => void; prefix?: string;
  /** Transizione: titolo e griglia invisibili (solo segnaposto), le altre parti seguono `partsStyle`. */
  ghost?: boolean; partsStyle?: AnimatedStyle<ViewStyle>;
  /** Transizione: tasti senza sfocatura (leggeri da animare, identici a occhio). */
  flat?: boolean;
  /** Posizione (coordinate finestra) di titolo e griglia, riletta a ogni layout della scheda. */
  onTitleRect?: (rect: SheetRect) => void; onGridRect?: (rect: SheetRect) => void;
  /** Quando cambia, titolo e griglia vengono rimisurati (la scheda può spostarsi senza un nuovo onLayout). */
  remeasure?: unknown;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const reader = prefix === "deep-dive";
  const titleRef = useRef<View>(null);
  const gridRef = useRef<View>(null);
  const hairline = [withAlpha(colors.onGradient, 0.16), withAlpha(colors.onGradient, 0.06), withAlpha(colors.onGradient, 0)] as const;
  const measureTargets = () => {
    if (onTitleRect) titleRef.current?.measureInWindow((x, y, width, height) => onTitleRect({ x, y, width, height }));
    if (onGridRect) gridRef.current?.measureInWindow((x, y, width, height) => onGridRect({ x, y, width, height }));
  };
  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = Math.ceil(e.nativeEvent.layout.height);
    if (h > 0) onLayout(h);
    measureTargets();
  };
  const firstMeasure = useRef(true);
  useEffect(() => {
    if (firstMeasure.current) { firstMeasure.current = false; return; }
    measureTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rimisura solo quando cambia la chiave
  }, [remeasure]);
  return (
    <View style={styles.sheet} onLayout={onSheetLayout} testID={`${prefix}-sheet`}>
      <View style={styles.sheetInner}>
        <View ref={titleRef} style={[styles.heroTitleWrap, ghost && styles.ghost]} collapsable={false}>
          <CoverTitle title={story.title} highlight={story.highlight_words} reveal={reveal} testID={`${prefix}-cover-title`} />
        </View>
        <Animated.View style={partsStyle}>
          <LinearGradient pointerEvents="none" start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} colors={hairline} locations={[0, 0.6, 1]} style={styles.hairline} testID={`${prefix}-divider-title`} />
        </Animated.View>
        <Animated.View style={[styles.introBlock, partsStyle]}>
          <View style={styles.introEyebrowRow}>
            <View style={styles.introDot} />
            <Text style={styles.introEyebrow} testID={reader ? "reader-intro-eyebrow" : `${prefix}-intro-eyebrow`}>{t.deep_intro}</Text>
          </View>
          <Text style={[styles.hook, compact === 1 && styles.hookCompact, compact === 2 && styles.hookTiny]} testID={`${prefix}-hook`}>{story.hook}</Text>
        </Animated.View>
        <Animated.View style={partsStyle}>
          <LinearGradient pointerEvents="none" start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} colors={hairline} locations={[0, 0.6, 1]} style={styles.hairline} testID={`${prefix}-divider-intro`} />
        </Animated.View>
        <View ref={gridRef} style={ghost && styles.ghost} collapsable={false}>
          <StoryInfoGrid story={story} minutes={story.deep_dive_time_min} testID={reader ? "story-info-grid" : `${prefix}-info-grid`} />
        </View>
        <Animated.View style={[styles.ctaRow, partsStyle]}>
          <IntroCtaButton label={t.deep_start} onPress={onStart} testID={`${prefix}-start`} style={styles.cta} flat={flat} />
          {listen}
        </Animated.View>
      </View>
    </View>
  );
}

// Titolo intero sulla copertina (prima schermata): grande, su più righe, con
// le parole chiave nel colore del tema. Non viene mai troncato: i titoli
// lunghi scendono di corpo (e la copertina sopra si adatta di conseguenza).
// Sfuma via mentre scorre sotto la barra, dove ricompare in piccolo.
export function CoverTitle({ title, highlight, reveal, testID = "deep-dive-cover-title" }: { title: string; highlight: string[]; reveal: SharedValue<number>; testID?: string }) {
  const styles = useStyles();
  const fade = useAnimatedStyle(() => ({ opacity: 1 - reveal.value }));
  const n = title.length;
  const fontSize = n > 70 ? 21 : n > 55 ? 23 : n > 40 ? 25 : 27;
  return (
    <Animated.View style={fade}>
      <HighlightedTitle title={title} highlight={highlight} style={[styles.coverTitle, { fontSize, lineHeight: Math.round(fontSize * 1.18) }]} testID={testID} />
    </Animated.View>
  );
}

const useStyles = makeStyles((colors: ThemeColors) => ({
  ghost: { opacity: 0 },
  heroTitleWrap: { width: "100%" },
  coverTitle: {
    color: colors.textWarm, fontFamily: typography.displayBold, letterSpacing: -0.6,
    textShadowColor: withAlpha(colors.surface, 0.9), textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14,
  },
  // Filo di luce sottile tra titolo, introduzione e scheda: separa senza pesare.
  hairline: { height: 1, alignSelf: "stretch" },
  sheet: { width: "100%", paddingBottom: spacing.md },
  sheetInner: { width: "100%", maxWidth: READER_MAX_W, alignSelf: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
  introBlock: { gap: spacing.sm },
  // Occhiello "INTRODUZIONE": piccolo e luminoso, sopra l'aggancio.
  introEyebrowRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.sm },
  introDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.intro, boxShadow: `0px 0px 12px ${withAlpha(colors.intro, 0.85)}` as any },
  introEyebrow: {
    color: colors.intro, fontFamily: typography.bodyBold, fontSize: 11.5, letterSpacing: 2.4,
    textShadowColor: withAlpha(colors.surface, 0.7), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  // Aggancio: breve, grande e leggibile anche sopra la copertina che si espande.
  hook: {
    color: colors.textWarm, fontFamily: typography.bodyMedium, fontSize: 17, lineHeight: 27, letterSpacing: 0.1,
    textShadowColor: withAlpha(colors.surface, 0.9), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10,
  },
  hookCompact: { fontSize: 15.5, lineHeight: 24 },
  hookTiny: { fontSize: 14, lineHeight: 21 },
  ctaRow: { flexDirection: "row", alignItems: "stretch", gap: spacing.sm + 2 },
  cta: { flex: 1 },
}));
