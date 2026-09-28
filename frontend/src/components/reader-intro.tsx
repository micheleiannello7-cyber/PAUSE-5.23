// PAUSE — apertura editoriale della lettura (prima schermata, dentro l'unico
// scroll verticale): spazio per la grande copertina (l'immagine vera è il
// livello fisso dietro), titolo grande, i tre dati (tipo · categoria · durata)
// in una riga leggera, occhiello "INTRODUZIONE" con il prologo e, in fondo
// alla prima schermata, il suggerimento "Scorri per iniziare". Nessuna scheda,
// nessun tasto grande: si entra nella storia scorrendo.
// La usa il lettore (deep-dive) e, con la stessa identica geometria, la
// transizione dalla card della Home (story-morph): lì titolo e riga info sono
// "fantasmi" invisibili che segnano dove atterrano gli elementi in movimento.
import { ReactNode, useEffect, useRef } from "react";
import { LayoutChangeEvent, Text, View, ViewStyle } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { AnimatedStyle, SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { StoryPreview } from "@/src/api";
import { makeStyles, spacing, typography, useTheme, withAlpha, ThemeColors } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { HighlightedTitle } from "./highlighted-title";
import { StoryInfoGrid } from "./story-info-grid";
import { READER_MAX_W } from "./reader-section";

export type IntroRect = { x: number; y: number; width: number; height: number };

// Copertina: larga quanto la colonna di lettura meno i margini; alta fino a
// poco più di un quadrato, ma mai oltre metà pagina (deve restare spazio per
// titolo e prologo nella prima schermata).
export function introCoverSize(winW: number, pageH: number) {
  const columnW = Math.min(winW, READER_MAX_W);
  const width = columnW - spacing.xl * 2;
  const height = Math.max(180, Math.min(Math.round(width * 1.06), Math.round(pageH * 0.5)));
  return { width, height, left: (winW - columnW) / 2 + spacing.xl };
}

export function ReaderIntro({
  story, coverH, minHeight, bottomInset = 0, reveal, listen, onLayout, prefix = "deep-dive", ghost = false, partsStyle, onTitleRect, onGridRect, remeasure,
}: {
  story: StoryPreview; coverH: number; minHeight: number; bottomInset?: number; reveal: SharedValue<number>; listen?: ReactNode;
  onLayout?: (height: number) => void; prefix?: string;
  /** Transizione: titolo e riga info invisibili (solo segnaposto), le altre parti seguono `partsStyle`. */
  ghost?: boolean; partsStyle?: AnimatedStyle<ViewStyle>;
  /** Posizione (coordinate finestra) di titolo e riga info, riletta a ogni layout. */
  onTitleRect?: (rect: IntroRect) => void; onGridRect?: (rect: IntroRect) => void;
  /** Quando cambia, titolo e riga info vengono rimisurati. */
  remeasure?: unknown;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const reader = prefix === "deep-dive";
  const titleRef = useRef<View>(null);
  const gridRef = useRef<View>(null);
  const measureTargets = () => {
    if (onTitleRect) titleRef.current?.measureInWindow((x, y, width, height) => onTitleRect({ x, y, width, height }));
    if (onGridRect) gridRef.current?.measureInWindow((x, y, width, height) => onGridRect({ x, y, width, height }));
  };
  const onBlockLayout = (e: LayoutChangeEvent) => {
    const h = Math.ceil(e.nativeEvent.layout.height);
    if (h > 0) onLayout?.(h);
    measureTargets();
  };
  const firstMeasure = useRef(true);
  useEffect(() => {
    if (firstMeasure.current) { firstMeasure.current = false; return; }
    measureTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rimisura solo quando cambia la chiave
  }, [remeasure]);
  return (
    <View style={[styles.intro, { minHeight }]} onLayout={onBlockLayout} testID={`${prefix}-intro`}>
      {/* Spazio della copertina: l'immagine è il livello fisso dietro allo scroll. */}
      <View style={{ height: coverH }} testID={`${prefix}-cover-card`} />
      <View style={styles.column}>
        <View ref={titleRef} style={[styles.titleWrap, ghost && styles.ghost]} collapsable={false}>
          <CoverTitle title={story.title} highlight={story.highlight_words} reveal={reveal} testID={`${prefix}-cover-title`} />
        </View>
        <View ref={gridRef} style={ghost && styles.ghost} collapsable={false}>
          <StoryInfoGrid story={story} minutes={story.deep_dive_time_min} inline testID={reader ? "story-info-grid" : `${prefix}-info-grid`} />
        </View>
        <Animated.View style={[styles.introBlock, partsStyle]}>
          <View style={styles.introEyebrowRow}>
            <View style={[styles.introDot, { backgroundColor: colors.brand, boxShadow: `0px 0px 12px ${withAlpha(colors.brand, 0.85)}` as any }]} />
            <Text style={[styles.introEyebrow, { color: colors.brand }]} testID={reader ? "reader-intro-eyebrow" : `${prefix}-intro-eyebrow`}>{t.deep_intro}</Text>
          </View>
          <Text style={styles.hook} testID={`${prefix}-hook`}>{story.hook}</Text>
          {listen ? <View style={styles.listenRow}>{listen}</View> : null}
        </Animated.View>
      </View>
      <View style={styles.grow} />
      {/* Invito a scorrere: in fondo alla prima schermata, discreto. */}
      <Animated.View style={[styles.hint, { paddingBottom: spacing.sm + bottomInset }, partsStyle]} testID={`${prefix}-scroll-hint`}>
        <Ionicons name="chevron-down" size={16} color={withAlpha(colors.brand, 0.9)} />
        <Text style={[styles.hintText, { color: withAlpha(colors.brand, 0.9) }]}>{t.deep_scroll_hint}</Text>
      </Animated.View>
    </View>
  );
}

// Titolo intero dell'apertura: grande, su più righe, parole chiave nel colore
// del tema. Mai troncato: i titoli lunghi scendono di corpo. Sfuma via mentre
// scorre sotto la barra, dove il titolo compatto è sempre presente.
export function CoverTitle({ title, highlight, reveal, testID = "deep-dive-cover-title" }: { title: string; highlight: string[]; reveal: SharedValue<number>; testID?: string }) {
  const styles = useStyles();
  const fade = useAnimatedStyle(() => ({ opacity: 1 - reveal.value * 0.6 }));
  const n = title.length;
  const fontSize = n > 70 ? 25 : n > 55 ? 28 : n > 40 ? 31 : 34;
  return (
    <Animated.View style={fade}>
      <HighlightedTitle title={title} highlight={highlight} style={[styles.coverTitle, { fontSize, lineHeight: Math.round(fontSize * 1.12) }]} testID={testID} />
    </Animated.View>
  );
}

const useStyles = makeStyles((colors: ThemeColors) => ({
  ghost: { opacity: 0 },
  intro: { width: "100%" },
  grow: { flexGrow: 1 },
  column: { width: "100%", maxWidth: READER_MAX_W, alignSelf: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md + 2 },
  titleWrap: { width: "100%" },
  coverTitle: {
    color: colors.textWarm, fontFamily: typography.displayBold, letterSpacing: -0.8,
    textShadowColor: withAlpha(colors.surface, 0.9), textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14,
  },
  introBlock: { gap: spacing.sm + 2, paddingTop: spacing.sm },
  introEyebrowRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.sm },
  introDot: { width: 8, height: 8, borderRadius: 4 },
  introEyebrow: { fontFamily: typography.bodyBold, fontSize: 11.5, letterSpacing: 2.6 },
  hook: { color: colors.textWarm, fontFamily: typography.body, fontSize: 18, lineHeight: 30, letterSpacing: 0.1 },
  listenRow: { flexDirection: "row", paddingTop: spacing.sm },
  hint: { alignItems: "center", gap: 2, paddingTop: spacing.xl },
  hintText: { fontFamily: typography.bodyMedium, fontSize: 12.5, letterSpacing: 0.3 },
}));
