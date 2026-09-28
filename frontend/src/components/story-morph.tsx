// PAUSE — transizione card Home → lettura. La copertina non cambia schermata:
// resta ferma e si allarga fino alla cornice della presentazione del lettore;
// la pillola dei badge scende e diventa la griglia info; il titolo esce dalla
// card e si posa sotto la copertina; introduzione e tasti compaiono al loro
// posto. Finita l'animazione (livello fermo, già identico alla presentazione)
// si apre il lettore sotto senza animazione nativa e, appena è disegnato,
// questo livello si dissolve sopra di lui: nessun lavoro pesante mentre
// qualcosa si muove. Il ritorno (direction="close") è lo stesso percorso,
// all'indietro, verso la cornice reale della card misurata sulla Home.
// Solo trasformazioni e opacità sugli elementi in movimento (niente layout a
// ogni frame): fluido anche su Android e sul web.
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { Easing, Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { StoryPreview } from "@/src/api";
import { makeStyles, spacing, typography, useTheme, withAlpha } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { StoryHero } from "./story-hero";
import { StoryMetaChips } from "./story-meta-chips";
import { StoryInfoGrid } from "./story-info-grid";
import { HighlightedTitle } from "./highlighted-title";
import { IntroCtaButton } from "./intro-cta-button";
import { ReaderPage } from "./reader-page";
import { ReaderIntroSheet, CoverTitle, SheetRect } from "./reader-intro-sheet";
import { READER_MAX_W } from "./reader-section";
import { useMorphHost } from "./morph-host";

export type MorphRect = SheetRect;

export const MORPH_DURATION = 760;
// Decelerazione continua (ease-out): niente coda quasi ferma alla fine, che
// faceva sembrare la transizione "bloccata" prima dello scambio.
export const MORPH_EASING = Easing.out(Easing.cubic);
// Dissolvenza d'ingresso del livello quando si chiude da un capitolo (la
// schermata sotto non è la presentazione): prima si torna alla copertina, poi
// tutto rientra nella card.
const FADE_IN_MS = 240;
// Chiusura con swipe: prima la presentazione torna al suo posto (lo spostamento
// del dito si annulla), poi parte il percorso inverso — l'esatto contrario
// dell'apertura. Il rientro nella card parte quando lo scorrimento è quasi
// concluso (70%: resta meno del 3% della strada) per non sembrare due passi.
const SLIDE_BACK_MS = 220;
// Frazione della durata dopo la quale la corsa (ease-out cubico) è visivamente
// conclusa — resta lo 0,3% della strada, meno di mezzo pixel: da qui il lettore
// vero può montarsi sotto senza che un fotogramma perso si veda.
const COMMIT_AT = 0.85;
// Ritorno: attesa massima perché la Home, tornata sotto il livello, abbia il
// layout definitivo (es. la card "riprendi" che compare e restringe il mazzo);
// poi si misura la card reale e vi si rientra. Se la Home tace, si parte comunque.
const HOME_SETTLE_MAX_MS = 240;
// Geometria della card Home (home-story-card): bordo, padding di badge e titolo,
// larghezza del tasto cuffie (44 + gap 10), raggio della card e della copertina.
const CARD_BORDER = 1, CARD_PAD = 16, CHIP_INSET = 14, CHIP_H = 28, LISTEN_W = 54, CARD_RADIUS = 19, COVER_RADIUS = 22;
const sameRect = (a: MorphRect, b: MorphRect) =>
  Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;
const CLAMP = Extrapolation.CLAMP;
const noop = () => {};
const lerp = (p: number, a: number, b: number) => { "worklet"; return a + (b - a) * p; };

export function StoryMorph({ story, from: fromProp, premium, ready, onCommit, direction = "open", offsetX = 0, fadeIn = false, sheetHint }: {
  story: StoryPreview;
  /** Cornice della card nella Home (coordinate finestra). */
  from: MorphRect;
  premium: boolean;
  /** Apertura: storia completa in cache, il lettore si apre solo quando c'è. */
  ready?: Promise<unknown>;
  /** Apertura: apre il lettore (già identico sotto). Chiusura: torna alla Home (sotto il livello). */
  onCommit: () => void;
  /** "close": il percorso inverso, dalla presentazione del lettore alla card della Home. */
  direction?: "open" | "close";
  /** Chiusura da swipe: spostamento orizzontale della schermata al rilascio, riassorbito durante il ritorno. */
  offsetX?: number;
  /** Chiusura da un capitolo: il livello (presentazione) compare in dissolvenza prima di rientrare nella card. */
  fadeIn?: boolean;
  /** Chiusura: altezza della scheda già misurata dal lettore (stessa geometria dal primo fotogramma). */
  sheetHint?: number;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const host = useMorphHost();
  const closing = direction === "close";
  // Chiusura: la cornice d'arrivo è quella reale della card sulla Home, riletta
  // appena la Home è tornata sotto (può essere cambiata mentre si leggeva).
  const [from, setFrom] = useState(fromProp);
  const p = useSharedValue(closing ? 1 : 0);
  const veil = useSharedValue(closing && fadeIn ? 0 : 1);
  // Spostamento orizzontale lasciato dallo swipe: si annulla prima del rientro.
  const slideX = useSharedValue(offsetX);
  const still = useSharedValue(0);

  // Stessa geometria della presentazione del lettore (deep-dive/[id]).
  const columnW = Math.min(winW, READER_MAX_W);
  const cardW = columnW - spacing.xl * 2;
  const coverTop = insets.top + spacing.lg;
  const pageBottom = insets.bottom + spacing.lg;
  const [sheetH, setSheetH] = useState(sheetHint ?? 430);
  const [sheetMeasured, setSheetMeasured] = useState(false);
  const cardH = Math.max(150, Math.min(Math.round(cardW * 1.02), winH - coverTop - pageBottom - sheetH));
  const to: MorphRect = { x: (winW - columnW) / 2 + spacing.xl, y: coverTop, width: cardW, height: cardH };

  // Dove atterrano titolo e griglia: misurati sui segnaposto della scheda. Quando
  // la card cambia altezza la scheda si sposta senza un nuovo onLayout: la scheda
  // rimisura (prop `remeasure`) e si accettano solo le misure prese con la card
  // corrente (`cardHRef`), così le mete sono sempre quelle della geometria finale.
  type Target = MorphRect & { forCardH: number };
  const [titleTo, setTitleTo] = useState<Target | null>(null);
  const [gridTo, setGridTo] = useState<Target | null>(null);
  const cardHRef = useRef(cardH);
  cardHRef.current = cardH;
  const acceptTitle = (r: MorphRect) => { if (cardH === cardHRef.current) setTitleTo({ ...r, forCardH: cardH }); };
  const acceptGrid = (r: MorphRect) => { if (cardH === cardHRef.current) setGridTo({ ...r, forCardH: cardH }); };
  const [cardTitleH, setCardTitleH] = useState(0);
  const inset = CARD_BORDER + CARD_PAD;
  const titleW = from.width - inset * 2 - (premium ? LISTEN_W : 0);
  const titleFrom = { x: from.x + inset, y: from.y + from.height - inset - cardTitleH };
  const chipsFrom: MorphRect = { x: from.x + CARD_BORDER + CHIP_INSET, y: from.y + CARD_BORDER + CHIP_INSET, width: from.width - (CARD_BORDER + CHIP_INSET) * 2, height: CHIP_H };
  const cardFont = Math.min(31, Math.max(20, winW * (story.title.length > 65 ? 0.056 : 0.062)));
  // Gli elementi in movimento stanno fermi nella posizione finale e si spostano
  // solo con una traslazione: finché la meta non è misurata, la meta è la partenza.
  const titleAt = titleTo ?? titleFrom;
  const gridBox = gridTo ?? chipsFrom;
  const titleShift = { x: titleFrom.x - titleAt.x, y: titleFrom.y - titleAt.y };
  const gridShift = {
    x: chipsFrom.x + chipsFrom.width / 2 - (gridBox.x + gridBox.width / 2),
    y: chipsFrom.y + chipsFrom.height / 2 - (gridBox.y + gridBox.height / 2),
  };
  const coverShift = { x: from.x + from.width / 2 - (to.x + to.width / 2), y: from.y + from.height / 2 - (to.y + to.height / 2) };
  const coverScale = { x: from.width / to.width, y: from.height / to.height };

  const measured = sheetMeasured && titleTo?.forCardH === cardH && gridTo?.forCardH === cardH && cardTitleH > 0;
  const [animDone, setAnimDone] = useState(false);
  // La storia in cache non provoca ri-render a metà corsa (su nativo un
  // ri-render riapplica gli stili delle viste animate): si annota in un ref e
  // si sveglia il livello solo se la corsa è già finita.
  const dataReadyRef = useRef(!ready);
  const animDoneRef = useRef(false);
  const [dataWake, setDataWake] = useState(0);
  const started = useRef(false);
  const committed = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const arrived = () => { dataReadyRef.current = true; if (animDoneRef.current) setDataWake((n) => n + 1); };
    ready.then(arrived, arrived);
  }, [ready]);
  // Apre il lettore sotto (una volta sola). Rete di sicurezza: se il lettore
  // non si presenta, il livello non resta a bloccare l'app.
  const { dismiss: hostDismiss } = host;
  const safetyDismiss = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitOpen = useRef(() => {});
  commitOpen.current = () => {
    if (committed.current) return;
    committed.current = true;
    onCommit();
    safetyDismiss.current = setTimeout(hostDismiss, 2500);
  };
  // Il livello se ne va: la rete di sicurezza non deve colpire un livello successivo (es. il ritorno).
  useEffect(() => () => { if (safetyDismiss.current) clearTimeout(safetyDismiss.current); }, []);
  // Apertura: parte appena si sa dove atterrano titolo e griglia. Il lettore
  // vero si monta solo quando la corsa è visivamente conclusa (COMMIT_AT:
  // resta meno di mezzo pixel di strada) e la storia è in cache: il montaggio
  // — il lavoro più pesante — non può togliere fotogrammi a nulla che si muove.
  useEffect(() => {
    if (closing || !measured || started.current) return;
    started.current = true;
    const finishOpen = () => { animDoneRef.current = true; setAnimDone(true); };
    p.value = withTiming(1, { duration: MORPH_DURATION, easing: MORPH_EASING }, (done) => { if (done) runOnJS(finishOpen)(); });
    const early = setTimeout(() => { if (dataReadyRef.current) commitOpen.current(); }, MORPH_DURATION * COMMIT_AT);
    return () => clearTimeout(early);
  }, [closing, measured, p]);
  useEffect(() => {
    if (closing || !animDone || !dataReadyRef.current) return;
    commitOpen.current();
  }, [closing, animDone, dataWake]);
  // Scambio solo quando il lettore sotto è disegnato e stabile (host.ready):
  // dissolvenza breve tra due schermate identiche, mai un salto.
  useEffect(() => {
    if (closing || !animDone || !host.ready) return;
    host.dismiss();
  }, [closing, animDone, host.ready, host.dismiss]);
  // Rete di sicurezza assoluta: se la geometria non arriva (layout mai stabile),
  // si passa comunque di là e il livello si toglie: mai un'app bloccata.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      committed.current = true;
      onCommit();
      host.dismiss();
    }, 900);
    return () => clearTimeout(timer);
  }, [onCommit, host.dismiss]);
  // Chiusura: il livello è già identico alla presentazione (o vi si dissolve
  // sopra, arrivando da un capitolo); sotto si torna alla Home (senza
  // animazione nativa), si aspetta che la Home abbia il layout definitivo, si
  // rilegge la cornice reale della card e poi tutto vi rientra — mentre la
  // Home fa rientrare logo e categorie con lo stesso passo.
  const { armHomeSettle, waitHomeSettled, homeCard: homeCardRef, homeReturn: homeReturnRef, clear: hostClear } = host;
  useEffect(() => {
    if (!closing || !measured || started.current) return;
    started.current = true;
    const lead = fadeIn ? FADE_IN_MS : 0;
    if (fadeIn) veil.value = withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.quad) });
    const slideLead = offsetX !== 0 ? Math.round(SLIDE_BACK_MS * 0.7) : 0;
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      homeReturnRef.current?.();
      p.value = withTiming(0, { duration: MORPH_DURATION, easing: MORPH_EASING }, (done) => { if (done) runOnJS(hostClear)(); });
    };
    const commit = setTimeout(async () => {
      if (offsetX !== 0) slideX.value = withTiming(0, { duration: SLIDE_BACK_MS, easing: Easing.out(Easing.cubic) });
      armHomeSettle();
      onCommit();
      await Promise.all([waitHomeSettled(HOME_SETTLE_MAX_MS), new Promise((resolve) => setTimeout(resolve, slideLead))]);
      let fresh: MorphRect | null = null;
      try { fresh = (await homeCardRef.current?.()) ?? null; } catch { fresh = null; }
      if (cancelled) return;
      if (fresh && fresh.width > 0 && fresh.height > 0 && !sameRect(fresh, fromProp)) {
        // Nuova meta: si applica a livello fermo (p = 1, nessun elemento dipende
        // ancora dalla cornice) e si parte al fotogramma successivo.
        setFrom(fresh);
        requestAnimationFrame(() => requestAnimationFrame(start));
      } else {
        start();
      }
    }, lead);
    const safety = setTimeout(hostClear, lead + SLIDE_BACK_MS + HOME_SETTLE_MAX_MS + MORPH_DURATION + 1500);
    return () => { cancelled = true; clearTimeout(commit); clearTimeout(safety); };
  }, [closing, measured, fadeIn, offsetX, onCommit, p, veil, slideX, fromProp, armHomeSettle, waitHomeSettled, homeCardRef, homeReturnRef, hostClear]);
  // In chiusura titolo e griglia restano quelli della scheda finché non si sa
  // dove stanno: poi, nello stesso istante, passano agli elementi in movimento.
  const floatingReady = !closing || measured;

  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 0.55], [0, 1], CLAMP) }));
  // Copertina: cornice del lettore che, all'inizio, è schiacciata e spostata
  // sulla card; l'immagine dentro è contro-scalata (mai deformata) e copre sempre il ritaglio.
  const coverStyle = useAnimatedStyle(() => {
    const sx = lerp(p.value, coverScale.x, 1);
    const sy = lerp(p.value, coverScale.y, 1);
    return {
      borderRadius: lerp(p.value, CARD_RADIUS, COVER_RADIUS),
      transform: [{ translateX: coverShift.x * (1 - p.value) }, { translateY: coverShift.y * (1 - p.value) }, { scaleX: sx }, { scaleY: sy }],
    };
  });
  const coverImageStyle = useAnimatedStyle(() => {
    const sx = lerp(p.value, coverScale.x, 1);
    const sy = lerp(p.value, coverScale.y, 1);
    const u = Math.max(sx, sy);
    return { transform: [{ scaleX: u / sx }, { scaleY: u / sy }] };
  });
  const homeSkin = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 0.5], [1, 0], CLAMP) }));
  const readerSkin = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0.25, 0.75], [0, 1], CLAMP) }));
  const titleMove = useAnimatedStyle(() => ({
    transform: [{ translateX: titleShift.x * (1 - p.value) }, { translateY: titleShift.y * (1 - p.value) }],
  }));
  const cardTitleFade = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0.05, 0.45], [1, 0], CLAMP) }));
  const readerTitleFade = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0.4, 0.85], [0, 1], CLAMP) }));
  const gridMove = useAnimatedStyle(() => ({
    transform: [{ translateX: gridShift.x * (1 - p.value) }, { translateY: gridShift.y * (1 - p.value) }],
  }));
  const chipsFade = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0.1, 0.5], [1, 0], CLAMP) }));
  const gridFade = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.45, 0.9], [0, 1], CLAMP),
    transform: [{ scale: interpolate(p.value, [0.3, 1], [0.9, 1], CLAMP) }],
  }));
  const partsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.5, 1], [0, 1], CLAMP),
    transform: [{ translateY: interpolate(p.value, [0.5, 1], [22, 0], CLAMP) }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, veilStyle]} testID="story-morph">
      {/* Fondo del lettore: compare mentre la Home fa spazio. */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <LinearGradient colors={[colors.surface, colors.surfaceDeep]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[withAlpha(colors.brand, 0.10), withAlpha(colors.brand, 0.03), withAlpha(colors.brand, 0)]} locations={[0, 0.35, 0.65]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Tutto ciò che "è" la schermata (scheda, copertina, titolo, badge) può
          arrivare spostato da uno swipe e rientra al suo posto durante il ritorno. */}
      <Animated.View style={[StyleSheet.absoluteFill, slide]}>
      {/* Scheda della presentazione, identica al lettore: titolo e griglia sono segnaposto invisibili. */}
      <View style={[styles.page, { width: winW, height: winH }]} pointerEvents="none">
        <ReaderPage height={winH} paddingTop={coverTop} paddingBottom={pageBottom} center={false} testID="story-morph-page">
          {(compact) => (<>
            <View style={{ height: cardH, width: cardW, alignSelf: "center" }} />
            <ReaderIntroSheet story={story} compact={compact} reveal={still} onStart={noop} prefix="story-morph" ghost={floatingReady} partsStyle={partsStyle} flat
              listen={premium ? <IntroCtaButton icon="headphones" label={t.audio_listen_short} onPress={noop} testID="story-morph-listen" style={styles.cta} flat /> : null}
              onLayout={(h) => { if (h !== sheetH) setSheetH(h); setSheetMeasured(true); }} remeasure={cardH} onTitleRect={acceptTitle} onGridRect={acceptGrid} />
          </>)}
        </ReaderPage>
      </View>

      {/* Copertina: ferma al suo posto, cresce fino alla cornice del lettore. */}
      <Animated.View style={[styles.cover, { left: to.x, top: to.y, width: to.width, height: to.height }, coverStyle]} testID="story-morph-cover">
        <Animated.View style={[StyleSheet.absoluteFill, coverImageStyle]}>
          <StoryHero story={story} style={StyleSheet.absoluteFill} iconSize={64} transition={0} />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.nightTint }, readerSkin]} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, homeSkin]}>
          <LinearGradient colors={[withAlpha(colors.artworkSurface, 0.62), withAlpha(colors.artworkSurface, 0)]} locations={[0, 1]} style={styles.topScrim} />
          <LinearGradient colors={[withAlpha(colors.artworkSurface, 0), withAlpha(colors.artworkSurface, 0.1), withAlpha(colors.artworkSurface, 0.86), withAlpha(colors.artworkSurface, 0.97)]}
            locations={[0, 0.42, 0.74, 1]} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.homeEdge, homeSkin]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.readerEdge, readerSkin]} />
      </Animated.View>
      {premium ? (
        <Animated.View style={[styles.listen, { left: from.x + from.width - inset - 44, top: from.y + from.height - inset - 44 }, homeSkin]} pointerEvents="none">
          <Ionicons name="headset-outline" size={19} color={colors.cyan} />
        </Animated.View>
      ) : null}

      {/* Titolo: dal fondo della card a sotto la copertina (dissolvenza tra i due corpi). */}
      <Animated.View style={[styles.floating, { left: titleAt.x, top: titleAt.y }, !floatingReady && styles.hidden, titleMove]} testID="story-morph-title">
        <Animated.View style={[{ width: titleW }, cardTitleFade]} onLayout={(e) => { const h = e.nativeEvent.layout.height; if (h > 0 && h !== cardTitleH) setCardTitleH(h); }}>
          <HighlightedTitle title={story.title} highlight={story.highlight_words} style={[styles.cardTitle, { fontSize: cardFont, lineHeight: cardFont * 1.14 }]}
            numberOfLines={4} adjustsFontSizeToFit minimumFontScale={0.8} />
        </Animated.View>
        {titleTo ? (
          <Animated.View style={[styles.floating, { left: 0, top: 0, width: titleTo.width }, readerTitleFade]}>
            <CoverTitle title={story.title} highlight={story.highlight_words} reveal={still} testID="story-morph-cover-title" />
          </Animated.View>
        ) : null}
      </Animated.View>

      {/* Badge: la pillola scende (centro su centro) e diventa la griglia info. */}
      <Animated.View style={[styles.floating, { left: gridBox.x, top: gridBox.y, width: gridBox.width, height: gridBox.height }, !floatingReady && styles.hidden, gridMove]} testID="story-morph-badges">
        <Animated.View style={[StyleSheet.absoluteFill, styles.centered, chipsFade]}>
          <StoryMetaChips story={story} minutes={story.reading_time_min} idPrefix="story-morph" style={{ width: chipsFrom.width }} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, gridFade]}>
          <StoryInfoGrid story={story} minutes={story.deep_dive_time_min} testID="story-morph-grid" />
        </Animated.View>
      </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  page: { position: "absolute", left: 0, top: 0 },
  floating: { position: "absolute" },
  hidden: { opacity: 0 },
  centered: { alignItems: "center", justifyContent: "center" },
  cover: { position: "absolute", overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  topScrim: { position: "absolute", top: 0, left: 0, right: 0, height: "30%" },
  homeEdge: { borderWidth: 1, borderColor: withAlpha(colors.cyanSoft, 0.42) },
  readerEdge: { borderWidth: 1, borderColor: withAlpha(colors.onGradient, 0.18) },
  listen: {
    position: "absolute", width: 44, height: 44, borderRadius: 24,
    borderWidth: 1, borderColor: colors.glassBorderStrong, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center",
  },
  cardTitle: {
    color: colors.onGradient, fontFamily: typography.displayBold, letterSpacing: -0.6,
    textShadowColor: withAlpha(colors.artworkSurface, 0.85), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  cta: { flex: 1 },
}));
