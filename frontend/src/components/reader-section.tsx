// PAUSE — una sezione (capitolo) della lettura verticale continua: il testo
// vive direttamente sul fondo, senza card. Numero del capitolo grande e quasi
// trasparente come elemento grafico, occhiello "CAPITOLO X" nel colore del
// tema, titolo, corpo in paragrafi brevi. Nessun contenuto extra.
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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

export function ChapterSection({ chapter, story, eyebrow }: { chapter: Chapter; story: Story; eyebrow: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  // Un solo colore per tutti i capitoli di tutte le storie: l'accento del tema
  // corrente dell'app (base = cyan), mai la categoria della storia.
  const tint = colors.brand;
  const number = String(chapter.number).padStart(2, "0");
  return (
    <View style={styles.section} testID={`deep-dive-chapter-${chapter.number}`}>
      {/* Numero grande e quasi trasparente: elemento grafico, non informazione. */}
      <Text style={[styles.bigNumber, { color: withAlpha(tint, 0.13) }]} pointerEvents="none" testID={`reader-chapter-number-${chapter.number}`}>{number}</Text>
      <Text style={[styles.eyebrow, { color: tint }]} testID={`reader-chapter-eyebrow-${chapter.number}`}>{eyebrow.toUpperCase()}</Text>
      <HighlightedTitle
        title={stripStepPrefix(chapter.title)}
        highlight={story.highlight_words}
        highlightColor={tint}
        style={styles.title}
      />
      <View style={styles.body}>
        {splitParagraphs(chapter.body).map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  section: {
    width: "100%", maxWidth: READER_MAX_W, alignSelf: "center",
    paddingHorizontal: spacing.xl, paddingTop: spacing.xxl + spacing.md, paddingBottom: spacing.xl,
    gap: spacing.sm + 2,
  },
  bigNumber: {
    position: "absolute", top: spacing.md, left: spacing.xl - 4,
    fontFamily: typography.displayBold, fontSize: 96, lineHeight: 100, letterSpacing: -4,
  },
  divider: { alignItems: "center", marginBottom: spacing.lg },
  dividerLine: { width: "62%", height: 1, borderRadius: 1 },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 11.5, letterSpacing: 2.8, paddingTop: spacing.xxl },
  title: {
    color: colors.textWarm, fontFamily: typography.displayBold, fontSize: 31, lineHeight: 37, letterSpacing: -0.7,
  },
  body: { gap: spacing.md + 2, marginTop: spacing.sm },
  paragraph: { color: colors.textWarmSecondary, fontFamily: typography.body, fontSize: 17.5, lineHeight: 31, letterSpacing: 0.1 },
}));
