// PAUSE — una sezione (capitolo) della lettura verticale: contenitore in
// vetro scuro (quasi nero, traslucido) con bordo sottile e alone morbidissimo
// nel colore d'accento del tema dell'app; dentro: occhiello "CAPITOLO X", titolo,
// corpo in paragrafi brevi. Nessun contenuto extra.
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { SharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { Chapter, Story } from "@/src/api";
import { makeStyles, useTheme, spacing, typography, withAlpha } from "@/src/theme";
import { HighlightedTitle } from "@/src/components/highlighted-title";

// Larghezza di lettura controllata: su tablet il testo non si allarga oltre
// una riga confortevole, su telefono usa tutta la larghezza meno i margini.
export const READER_MAX_W = 640;
const LONG_PARAGRAPH = 520;

// Solo presentazione: il testo resta identico, ma un capitolo molto lungo
// viene mostrato in due paragrafi spezzati alla fine di una frase.
export function splitParagraphs(body: string): string[] {
  const lines = body.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  const text = lines[0] ?? "";
  if (text.length <= LONG_PARAGRAPH) return [text];
  const mid = text.length / 2;
  let cut = -1;
  const re = /[.!?»"”]\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].length;
    if (cut < 0 || Math.abs(end - mid) < Math.abs(cut - mid)) cut = end;
  }
  if (cut <= 0 || cut >= text.length - 40) return [text];
  return [text.slice(0, cut).trim(), text.slice(cut).trim()];
}

export function SectionDivider({ color }: { color?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tint = color ?? colors.cyan;
  return (
    <View style={styles.divider} pointerEvents="none">
      <LinearGradient
        colors={[withAlpha(tint, 0), withAlpha(tint, 0.55), withAlpha(tint, 0)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.dividerLine}
      />
    </View>
  );
}

// Solo presentazione: le mini lezioni numerano i passi nel titolo
// ("Passo 3 — Osserva"): nel lettore il numero non serve, resta il titolo.
export function stripStepPrefix(title: string): string {
  return title.replace(/^\s*(passo|step)\s*\d+\s*[—–\-:·]\s*/i, "").trim() || title;
}

export function ChapterSection({
  chapter, story, eyebrow, current, compact = 0,
}: { chapter: Chapter; story: Story; eyebrow: string; current: SharedValue<number>; /** 0 normale · 1 · 2 = tipografia più compatta per stare in una pagina. */ compact?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  // Un solo colore per tutti i capitoli di tutte le storie: l'accento del tema
  // corrente dell'app (base = cyan), mai la categoria della storia.
  const tint = colors.brand;
  // La pagina corrente è piena; quella che entra/esce durante il passaggio
  // resta appena attenuata finché non è al centro (fade leggerissimo).
  const focus = useAnimatedStyle(() => ({
    opacity: withTiming(current.value === chapter.number ? 1 : 0.55, { duration: 260 }),
  }));
  return (
    <Animated.View style={[styles.section, focus]} testID={`deep-dive-chapter-${chapter.number}`}>
      {/* Vetro scuro illuminato appena dal colore del tema: fondo quasi nero
          traslucido, bordo sottile tinto, riflesso in alto, alone diffuso. */}
      <View style={[styles.card, { borderColor: withAlpha(tint, 0.58), boxShadow: `0px 0px 48px ${withAlpha(tint, 0.22)}, 0px 8px 24px ${withAlpha(colors.surfaceDeep, 0.6)}` as any }]} testID={`deep-dive-chapter-card-${chapter.number}`}>
        <LinearGradient
          pointerEvents="none"
          colors={[withAlpha(colors.onSurface, 0.075), withAlpha(colors.onSurface, 0.04), withAlpha(colors.onSurface, 0.06)]}
          locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[withAlpha(tint, 0.16), withAlpha(tint, 0.05), withAlpha(tint, 0.03)]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[withAlpha(tint, 0), withAlpha(tint, 0.95), withAlpha(tint, 0)]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.cardHighlight}
        />
        <View style={styles.eyebrowRow}>
          <View style={[styles.mark, { borderColor: withAlpha(tint, 0.7), backgroundColor: withAlpha(tint, 0.14) }]}>
            <View style={[styles.markDot, { backgroundColor: tint }]} />
          </View>
          <Text style={[styles.eyebrow, { color: tint }]} testID={`reader-chapter-eyebrow-${chapter.number}`}>{eyebrow}</Text>
        </View>
        <HighlightedTitle
          title={stripStepPrefix(chapter.title)}
          highlight={story.highlight_words}
          highlightColor={tint}
          style={[styles.title, compact === 1 && styles.titleCompact, compact === 2 && styles.titleTiny]}
        />
        <View style={styles.body}>
          {splitParagraphs(chapter.body).map((p, i) => (
            <Text key={i} style={[styles.paragraph, compact === 1 && styles.paragraphCompact, compact === 2 && styles.paragraphTiny]}>{p}</Text>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  section: {
    width: "100%", maxWidth: READER_MAX_W, alignSelf: "center",
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  card: {
    borderRadius: 26, borderWidth: 1, overflow: "hidden",
    backgroundColor: withAlpha(colors.surfaceDeep, 0.55),
    paddingHorizontal: spacing.lg + 4, paddingTop: spacing.lg + 4, paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  cardHighlight: { position: "absolute", top: 0, left: 24, right: 24, height: 1 },
  divider: { alignItems: "center", marginBottom: spacing.lg },
  dividerLine: { width: "62%", height: 1, borderRadius: 1 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  mark: { width: 18, height: 18, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  markDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 11, letterSpacing: 2 },
  title: {
    color: colors.textWarm, fontFamily: typography.displayBold, fontSize: 27, lineHeight: 34, letterSpacing: -0.5,
  },
  titleCompact: { fontSize: 24, lineHeight: 30 },
  titleTiny: { fontSize: 22, lineHeight: 27 },
  body: { gap: spacing.md + 2, marginTop: spacing.xs },
  paragraph: { color: colors.textWarmSecondary, fontFamily: typography.body, fontSize: 17.5, lineHeight: 31, letterSpacing: 0.1 },
  paragraphCompact: { fontSize: 16, lineHeight: 27 },
  paragraphTiny: { fontSize: 14.5, lineHeight: 24 },
}));
