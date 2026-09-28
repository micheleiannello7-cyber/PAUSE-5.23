// PAUSE — cornice luminosa della lettura: una linea sottilissima nel colore
// d'accento del tema corrente (cyan di base; viola, verde, arancio… con gli
// altri temi) che corre lungo il perimetro dello schermo, con un alone
// leggerissimo verso l'interno e verso l'esterno. Sopra a tutto, mai toccabile.
import { StyleSheet, View } from "react-native";

import { makeStyles, useTheme, withAlpha } from "@/src/theme";

export function ReaderFrame({ opacity = 1 }: { opacity?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  // Linea nel colore del tema; l'alone verso l'interno resta cyan (identità PAUSE).
  const tint = colors.brand;
  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, { opacity }]} pointerEvents="none" testID="reader-frame">
      <View
        style={[
          StyleSheet.absoluteFill, styles.line,
          { borderColor: withAlpha(tint, 0.55), boxShadow: `0px 0px 14px 0px ${withAlpha(tint, 0.26)}, inset 0px 0px 16px 0px ${withAlpha(colors.cyan, 0.12)}` as any },
        ]}
      />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: { zIndex: 40, elevation: 40 },
  line: { borderWidth: 1, borderRadius: 30 },
}));
