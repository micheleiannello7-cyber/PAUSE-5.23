// PAUSE — blocco account nel passo profilo dell'onboarding.
// Ospite: "Accedi con Apple" (solo iOS, bottone nativo richiesto da Apple) +
// "Continua con Google" (tutte le piattaforme). Connesso: riga compatta con
// avatar, nome/email e "Esci". Palette fissa ONB come il resto dell'onboarding.
import React, { useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/src/auth";
import { useI18n } from "@/src/i18n";
import { typography, withAlpha } from "@/src/theme";
import { ONB } from "./onboarding-palette";

const BTN_H = 50;
// Marchio Google: colori fissi (identici nei due temi).
const GOOGLE_G = "#FFFFFF";

export function AuthBlock({ onSignedIn }: { onSignedIn?: () => void }) {
  const { t } = useI18n();
  const { status, user, busy, appleAvailable, signInWithGoogle, signInWithApple, signOut } = useAuth();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState<"google" | "apple" | null>(null);

  const run = async (kind: "google" | "apple") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setError(false);
    setPending(kind);
    const outcome = await (kind === "apple" ? signInWithApple() : signInWithGoogle());
    setPending(null);
    if (outcome === "ok") onSignedIn?.();
    else if (outcome === "error") setError(true);
  };

  if (status === "loading") {
    return (
      <View style={styles.wrap} testID="auth-block-loading">
        <ActivityIndicator color={ONB.cyan} />
      </View>
    );
  }

  if (status === "authenticated" && user) {
    const label = user.name || user.email || t.auth_guest;
    return (
      <View style={styles.wrap} testID="auth-block-connected">
        <View style={styles.connected}>
          <LinearGradient colors={["rgba(8,12,20,0.48)", "rgba(3,7,13,0.56)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {user.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" accessible={false} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{label.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.connectedBody}>
            <Text style={styles.connectedHint}>{t.auth_connected_as}</Text>
            <Text style={styles.connectedName} numberOfLines={1} testID="auth-connected-name">{label}</Text>
            {user.email && user.name ? <Text style={styles.connectedEmail} numberOfLines={1}>{user.email}</Text> : null}
          </View>
          <Pressable onPress={() => signOut()} hitSlop={8} accessibilityRole="button" testID="auth-sign-out" style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
            <Text style={styles.signOutText}>{t.auth_sign_out}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const twoUp = appleAvailable && Platform.OS === "ios";
  return (
    <View style={styles.wrap} testID="auth-block">
      <Text style={styles.hint} testID="auth-hint">{t.auth_save_progress}</Text>
      <View style={[styles.row, twoUp && styles.rowTwoUp]}>
        {twoUp ? (
          <View style={styles.half} testID="auth-apple">
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={BTN_H / 2}
              style={styles.appleBtn}
              onPress={() => run("apple")}
            />
          </View>
        ) : null}
        <Pressable
          onPress={() => run("google")}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t.auth_google}
          testID="auth-google"
          style={({ pressed }) => [styles.googleBtn, twoUp && styles.half, pressed && styles.pressed, busy && { opacity: 0.7 }]}
        >
          <LinearGradient colors={["rgba(14,28,63,0.92)", "rgba(8,17,42,0.92)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {pending === "google" ? (
            <ActivityIndicator color={ONB.cyan} size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={GOOGLE_G} />
              <Text style={styles.googleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {twoUp ? "Google" : t.auth_google}
              </Text>
            </>
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error} testID="auth-error">{t.auth_error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, minHeight: BTN_H },
  hint: {
    color: ONB.textSecondary, fontFamily: typography.body, fontSize: 12.5, lineHeight: 17, textAlign: "center", marginBottom: 10,
    textShadowColor: withAlpha(ONB.bgTop, 0.7), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  row: { gap: 10 },
  rowTwoUp: { flexDirection: "row" },
  half: { flex: 1, minWidth: 0 },
  appleBtn: { height: BTN_H, width: "100%" },
  googleBtn: {
    height: BTN_H, borderRadius: BTN_H / 2, overflow: "hidden",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 16,
    borderWidth: 1.2, borderColor: withAlpha(ONB.cyan, 0.45),
    boxShadow: `0px 0px 18px ${withAlpha(ONB.cyan, 0.18)}` as any,
  },
  googleText: { color: ONB.text, fontFamily: typography.bodyBold, fontSize: 15, includeFontPadding: false },
  pressed: { opacity: 0.85 },
  error: { color: "#FF9AA8", fontFamily: typography.bodyMedium, fontSize: 12.5, textAlign: "center", marginTop: 8 },
  connected: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 26, overflow: "hidden",
    borderWidth: 1.2, borderColor: withAlpha(ONB.cyan, 0.4),
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(ONB.cyan, 0.15) },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: withAlpha(ONB.cyan, 0.4) },
  avatarLetter: { color: ONB.text, fontFamily: typography.bodyBold, fontSize: 17 },
  connectedBody: { flex: 1, minWidth: 0 },
  connectedHint: { color: ONB.muted, fontFamily: typography.body, fontSize: 11.5, lineHeight: 14 },
  connectedName: { color: ONB.text, fontFamily: typography.bodyBold, fontSize: 15, lineHeight: 19, marginTop: 1 },
  connectedEmail: { color: ONB.textSecondary, fontFamily: typography.body, fontSize: 12, lineHeight: 15 },
  signOut: {
    minHeight: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(3,7,13,0.3)", borderWidth: 1, borderColor: withAlpha(ONB.textSecondary, 0.16),
  },
  signOutText: { color: ONB.textSecondary, fontFamily: typography.bodyMedium, fontSize: 13 },
});
