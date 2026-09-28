// PAUSE — copertina del lettore: un solo livello fisso dietro allo scroll con
// la geometria della card arrotondata della presentazione (in alto, staccata
// dai bordi). Appartiene solo all'apertura della storia: scorrendo esce
// naturalmente verso l'alto insieme al contenuto e lascia il fondo dark-navy
// alla lettura (non si espande mai a tutto schermo dietro ai capitoli).
// Solo transform: fluida anche su Android, in entrambe le direzioni.
import { StyleSheet, View } from "react-native";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { Story, isLesson } from "@/src/api";
import { makeStyles, useTheme, withAlpha } from "@/src/theme";
import { StoryHero } from "./story-hero";
import { LessonCover } from "./lesson-cover";

export type CoverFrame = { top: number; left: number; width: number; height: number; radius: number };

export function ReaderCoverBackdrop({ story, scrollY, frame, instant = false }: {
  story: Story; scrollY: SharedValue<number>; frame: CoverFrame;
  /** Arrivo con la transizione dalla card: la foto è già a schermo sopra, niente dissolvenza d'ingresso. */
  instant?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const hasCover = !!story.hero_image_generated || (!isLesson(story) && !!story.hero_image);

  const box = useAnimatedStyle(() => {
    const y = scrollY.value;
    // Tirando verso il basso oltre l'inizio la card segue un po' il dito e si stira.
    const pull = y < 0 ? -y : 0;
    return {
      transform: [
        { translateY: -Math.max(0, y) + pull * 0.45 },
        { scale: 1 + Math.min(0.1, pull / 700) },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.box, { top: frame.top, left: frame.left, width: frame.width, height: frame.height, borderRadius: frame.radius }, box]}
      pointerEvents="none"
      testID="chapter-cover-bg"
    >
      {hasCover ? (
        <StoryHero story={story} style={StyleSheet.absoluteFill} transition={instant ? 0 : 400} />
      ) : (
        <LessonCover color={colors.muted} icon={story.category_icon} iconSize={72} showBadge={false} style={StyleSheet.absoluteFill} />
      )}
      {/* Tinta notte: porta ogni foto verso la stessa temperatura blu-notte. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.nightTint }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.edge, { borderRadius: frame.radius }]} />
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  box: { position: "absolute", overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  edge: { borderWidth: 1, borderColor: withAlpha(colors.onGradient, 0.18) },
}));
