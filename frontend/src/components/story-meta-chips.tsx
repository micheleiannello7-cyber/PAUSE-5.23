// PAUSE — riga dei badge della card Home: un'unica pillola centrata con tipo
// (Curiosità / Mini lezione) · categoria · durata (orologio 3D). Nel lettore
// le stesse informazioni vivono nella griglia StoryInfoGrid.
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";

import { StoryPreview, isLesson } from "@/src/api";
import { makeStyles, typography } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { CategoryArtMark } from "./category-artwork";
import { KindIcon } from "./kind-icon";

// Stesso orologio 3D della scheda informativa nel lettore.
const CLOCK = require("../../assets/images/kind-clock.png");

export function StoryMetaChips({
  story, minutes, idPrefix, style,
}: {
  story: StoryPreview;
  minutes: number;
  /** Prefix for testIDs: `${idPrefix}-kind`, `-category`, `-duration`. */
  idPrefix: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const { t } = useI18n();
  const lesson = isLesson(story);
  const kind = lesson ? "lessons" : "stories";
  const kindLabel = lesson ? t.lesson_badge : t.curiosity_badge;
  const category = story.category_name.split("·")[0].trim();

  return (
    <View style={[styles.row, style]} testID={`${idPrefix}-meta`}>
      <View style={styles.chips}>
        {story.is_new ? (
          <>
            <View testID={`${idPrefix}-new`} style={styles.newSeg}>
              <Text testID={`${idPrefix}-new-label`} style={styles.newText}>{t.new_badge}</Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}
        <View testID={`${idPrefix}-kind`} style={styles.kind}>
          <KindIcon kind={kind} size={18} glow={false} testID={`${idPrefix}-kind-icon`} />
          <Text testID={`${idPrefix}-kind-label`} style={styles.kindText} numberOfLines={1}>{kindLabel}</Text>
        </View>
        <View style={styles.divider} />
        <View testID={`${idPrefix}-category`} style={styles.category}>
          <CategoryArtMark categoryId={story.category_id} color={story.category_color} size={16} aspect={1.25} plain tight testID={`${idPrefix}-category-icon`} />
          <Text testID={`${idPrefix}-category-label`} style={styles.categoryText} numberOfLines={1}>{category}</Text>
        </View>
        <View style={styles.divider} />
        <View testID={`${idPrefix}-duration`} style={styles.duration}>
          <Image source={CLOCK} style={styles.clock} contentFit="contain" transition={0} testID={`${idPrefix}-duration-icon`} />
          <Text testID={`${idPrefix}-duration-label`} style={styles.durationText}>{minutes} {t.min}</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  // --- sm: card della Home (tipo · categoria · durata in una sola pillola, centrata)
  row: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  chips: { flexShrink: 1, maxWidth: "100%", flexDirection: "row", alignItems: "center", borderRadius: 30, borderWidth: 1, borderColor: colors.glassBorderStrong, backgroundColor: colors.scrim, overflow: "hidden" },
  kind: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 4, paddingRight: 8, minHeight: 26, backgroundColor: colors.cyanGlowSoft, borderRadius: 30 },
  newSeg: { paddingHorizontal: 9, minHeight: 26, justifyContent: "center", backgroundColor: colors.brand, borderRadius: 30 },
  newText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 1, color: colors.onGradient },
  kindText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.6, color: colors.onGradient, flexShrink: 1 },
  divider: { height: 10, width: 1, backgroundColor: colors.glassBorderStrong },
  category: { flexShrink: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 7 },
  categoryText: { flexShrink: 1, color: colors.onGradient, fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.5, textTransform: "uppercase" },
  duration: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 3, paddingLeft: 5, paddingRight: 9, minHeight: 26 },
  clock: { width: 18, height: 18 },
  durationText: { color: colors.onGradient, fontFamily: typography.bodyMedium, fontSize: 10 },
}));
