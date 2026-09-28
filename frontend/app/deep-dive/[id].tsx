import { useRef, useCallback, useEffect, useState } from "react";
import {
  View, StyleSheet, ActivityIndicator, Share, useWindowDimensions, LayoutChangeEvent, Platform, BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedRef, runOnJS, interpolate, Extrapolation,
} from "react-native-reanimated";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { api } from "@/src/api";
import { makeStyles, useTheme, spacing, ThemeColors } from "@/src/theme";
import { useUserId } from "@/src/session";
import { useStoryActions } from "@/src/hooks/use-story-actions";
import { saveReadingProgress, clearReadingProgress, getReadingProgress, toStoryPreview } from "@/src/reading-progress";
import { SwipeBack } from "@/src/components/swipe-back";
import { ReaderCoverBackdrop, CoverFrame } from "@/src/components/reader-cover-backdrop";
import { ReaderEndingBackdrop } from "@/src/components/reader-ending-backdrop";
import { ReaderAtmosphere } from "@/src/components/reader-atmosphere";
import { ReaderFrame } from "@/src/components/reader-frame";
import { ReaderIntro, introCoverSize } from "@/src/components/reader-intro";
import { StoryAudioProvider, AudioSheet, AudioMiniBadge, IntroListenButton } from "@/src/components/story-audio-player";
import { ReaderHeader, READER_HEADER_H } from "@/src/components/reader-header";
import { ChapterSection, SectionDivider } from "@/src/components/reader-section";
import { ReaderEnding } from "@/src/components/reader-ending";
import { Screen } from "@/src/components/screen";
import { StoryShareCard, SHARE_CARD_WIDTH } from "@/src/components/story-share-card";
import { useMorphHost } from "@/src/components/morph-host";
import { StoryMorph, MorphRect } from "@/src/components/story-morph";
import { useI18n } from "@/src/i18n";
import { CoachTip } from "@/src/coach-tips";

// Cornice della card Home ("x,y,w,h" nell'URL) da cui è partita la transizione.
function parseRect(value?: string): MorphRect | null {
  const n = (value ?? "").split(",").map(Number);
  return n.length === 4 && n.every((v) => Number.isFinite(v)) && n[2] > 0 && n[3] > 0 ? { x: n[0], y: n[1], width: n[2], height: n[3] } : null;
}

// Lettura editoriale continua: un'unica pagina verticale — grande copertina,
// titolo, tre dati, introduzione, poi i capitoli uno dopo l'altro direttamente
// sul fondo (nessuna card) e la conclusione. Le "sezioni" (0 = intro,
// 1..n = capitoli, n+1 = fine) usano la stessa scala di sempre, così il
// progresso di lettura salvato resta compatibile; la sezione corrente è quella
// che attraversa la linea di lettura (≈ un terzo della schermata dall'alto).
export default function DeepDive() {
  // `start=1` (dalla Home "Leggi la curiosità"): si apre direttamente sul
  // primo capitolo, senza l'introduzione.
  const { id, start, listen, morph, rect } = useLocalSearchParams<{ id: string; start?: string; listen?: string; morph?: string; rect?: string }>();
  const insets = useSafeAreaInsets();
  const { height: winH, width: winW } = useWindowDimensions();
  const router = useRouter();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const userId = useUserId();
  // Arrivo con la transizione dalla card della Home (morph=1): la schermata è
  // entrata senza animazione nativa sotto il livello di transizione, che qui
  // viene congedato appena l'apertura è disegnata. Il ritorno indietro
  // (senza percorso inverso) resta una dissolvenza: l'opzione si imposta solo
  // quando il livello è sparito, così il ri-render del navigatore non cade
  // mai dentro l'animazione.
  const morphHost = useMorphHost();
  useEffect(() => {
    if (morph !== "1") return;
    const safety = setTimeout(morphHost.dismiss, 1800);
    return () => clearTimeout(safety);
  }, [morph, morphHost.dismiss]);
  useEffect(() => {
    if (morph === "1" && !morphHost.active) navigation.setOptions({ animation: "fade", animationDuration: 260 });
  }, [morph, morphHost.active, navigation]);
  const completedRef = useRef<string | null>(null);
  const shareRef = useRef<View>(null);
  const startedAtRef = useRef<number>(Date.now());
  const [section, setSection] = useState(0);
  const [audioOpen, setAudioOpen] = useState(listen === "1");
  // Il badge che riapre il player compare solo dopo il primo tocco su "Ascolta".
  const [listenStarted, setListenStarted] = useState(listen === "1");
  const openAudio = () => { setListenStarted(true); setAudioOpen(true); };
  // Il progresso di lettura si salva solo dopo un vero gesto del lettore
  // (non per la posizione su cui si è aperta la storia automaticamente).
  const touchedRef = useRef(false);
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();

  const { data: story, isLoading } = useQuery({
    queryKey: ["story", id],
    queryFn: () => api.story(id!),
    enabled: !!id,
  });
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.user(userId!),
    enabled: !!userId,
  });
  const { toggle } = useStoryActions(userId, id);
  const isPremium = !!user?.is_premium;

  // Sezioni: intro · una per capitolo · conclusione ("Da ricordare" + prossima storia).
  const chapterCount = story?.chapters.length ?? 0;
  const sectionCount = chapterCount + 2;
  const lastSection = sectionCount - 1;

  // --- Scroll continuo: un solo ScrollView, nessuna pagina ---
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  const headerSolid = useSharedValue(0);
  // Il titolo grande dell'apertura si attenua mentre scorre sotto la barra.
  const headerReveal = useSharedValue(0);
  const currentSV = useSharedValue(-1);
  const headerTop = insets.top + spacing.xs;
  const headerBottom = headerTop + READER_HEADER_H;
  // Altezza reale dello ScrollView, misurata a layout.
  const [pageH, setPageH] = useState(winH);
  const pageHSV = useSharedValue(winH);
  // Grande copertina dell'apertura: sotto la barra, staccata dai bordi. Lo
  // stesso livello fisso dietro allo scroll (ReaderCoverBackdrop) ha questa
  // geometria ed esce verso l'alto, scurendosi, con lo scroll.
  const coverTop = headerBottom + spacing.sm;
  const size = introCoverSize(winW, pageH);
  const cover: CoverFrame = { top: coverTop, left: size.left, width: size.width, height: size.height, radius: 26 };
  const [introMeasured, setIntroMeasured] = useState(false);
  // Arrivo dalla card della Home: dopo il primo layout dell'apertura la
  // geometria è quella definitiva ed è stata disegnata → il livello di
  // transizione sopra può dissolversi. Si aspetta che resti ferma per un paio
  // di fotogrammi: la dissolvenza avviene sempre tra due schermate identiche.
  useEffect(() => {
    if (morph !== "1" || !introMeasured) return;
    const timer = setTimeout(morphHost.markReady, 32);
    return () => clearTimeout(timer);
  }, [morph, introMeasured, cover.height, morphHost.markReady]);
  // Quota (nello scroll) del titolo grande: da qui in su la barra resta pulita.
  const bigTitleY = coverTop + cover.height + spacing.lg;
  const bigTitleSV = useSharedValue(bigTitleY);
  useEffect(() => { bigTitleSV.value = bigTitleY; }, [bigTitleY, bigTitleSV]);
  // Ultimo scroll programmatico (apertura su un capitolo, ripresa): solo un
  // movimento del lettore oltre quel punto conta come "gesto" per salvare.
  const autoY = useSharedValue(0);
  const touchedSV = useSharedValue(false);
  const markTouched = () => { touchedRef.current = true; touchedSV.value = true; };

  // Inizio di ogni sezione nello scroll (capitoli, poi la fine), misurato a layout.
  const topsRef = useRef<number[]>([]);
  const topsSV = useSharedValue<number[]>([]);
  const endTopSV = useSharedValue(0);
  const pendingSection = useRef<{ index: number; animated: boolean } | null>(null);
  const jumpTo = useCallback((index: number, animated: boolean) => {
    const tops = topsRef.current;
    const target = index <= 0 ? 0 : index > tops.length ? -1 : Math.max(0, tops[index - 1] - headerBottom + spacing.sm);
    if (target < 0 || !Number.isFinite(target)) return false;
    autoY.value = target;
    scrollRef.current?.scrollTo({ y: target, animated });
    return true;
  }, [headerBottom, scrollRef, autoY]);
  const onSectionLayout = (index: number, e: LayoutChangeEvent) => {
    const y = Math.round(e.nativeEvent.layout.y);
    const tops = topsRef.current.slice();
    if (tops[index] === y) return;
    tops[index] = y;
    topsRef.current = tops;
    topsSV.value = tops;
    if (index === chapterCount) endTopSV.value = Math.max(0, y - headerBottom);
    const pending = pendingSection.current;
    if (pending && pending.index - 1 <= index && jumpTo(pending.index, pending.animated)) pendingSection.current = null;
  };
  const scrollToSection = useCallback((i: number, animated = true) => {
    if (!jumpTo(i, animated)) pendingSection.current = { index: i, animated };
  }, [jumpTo]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      if (!touchedSV.value && Math.abs(y - autoY.value) > 48) {
        touchedSV.value = true;
        runOnJS(markTouched)();
      }
      // Titolo grande sotto la barra → si attenua; la barra diventa vetro quando la copertina è quasi uscita.
      const titleTop = bigTitleSV.value - headerBottom;
      headerReveal.value = interpolate(y, [titleTop - 40, titleTop + 48], [0, 1], Extrapolation.CLAMP);
      headerSolid.value = interpolate(y, [cover.height * 0.45, cover.height * 0.95], [0, 1], Extrapolation.CLAMP);
      // Sezione corrente: l'ultima il cui inizio ha superato la linea di lettura
      // (un terzo della schermata sotto la barra); in fondo alla pagina si è alla fine.
      const line = y + headerBottom + (pageHSV.value - headerBottom) * 0.35;
      const tops = topsSV.value;
      let idx = 0;
      for (let i = 0; i < tops.length; i++) if (tops[i] > 0 && line >= tops[i]) idx = i + 1;
      const maxY = e.contentSize.height - e.layoutMeasurement.height;
      if (maxY > 0 && y >= maxY - 2 && tops.length >= sectionCount - 1) idx = sectionCount - 1;
      idx = Math.max(0, Math.min(sectionCount - 1, idx));
      if (idx !== currentSV.value) {
        currentSV.value = idx;
        runOnJS(setSection)(idx);
      }
    },
  });

  const onScrollLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== pageH) { setPageH(h); pageHSV.value = h; }
  };
  // Apertura diretta su un capitolo (`start=1`): posiziona senza animazione.
  const startedAtChapter = useRef(false);
  useEffect(() => {
    if (start === "1" && story && !startedAtChapter.current) {
      startedAtChapter.current = true;
      requestAnimationFrame(() => scrollToSection(1, false));
    }
  }, [start, story, scrollToSection]);

  // Riprende dalla sezione in cui il lettore aveva lasciato questa storia.
  useEffect(() => {
    if (!userId || !id || !story) return;
    getReadingProgress(userId).then((p) => {
      if (p && p.story.id === id && p.page > 0 && p.page < lastSection) {
        setSection(p.page);
        requestAnimationFrame(() => scrollToSection(p.page, false));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id, !!story]);

  // Mark as completed once: when the reader reaches the end (or taps "next").
  // Nota: "completata" qui vale per limiti e statistiche (scatta dopo 5 s di
  // permanenza); il segnalibro "riprendi" resta finché non si arriva in fondo.
  const markComplete = useCallback(async () => {
    if (!userId || !id || completedRef.current === id) return;
    completedRef.current = id;
    try {
      const secs = Math.round((Date.now() - startedAtRef.current) / 1000);
      await api.complete(userId, id, story?.deep_dive_time_min ?? 2, secs);
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["limit"] });
    } catch {}
  }, [userId, id, story?.deep_dive_time_min, qc]);

  // A curiosity is counted as soon as it's opened — but only after a 5s dwell,
  // so backing out within 5 seconds (misclick / quick peek) does NOT consume
  // one of the session's stories. Leaving the screen clears the timer.
  const markCompleteRef = useRef(markComplete);
  markCompleteRef.current = markComplete;
  useEffect(() => {
    if (!userId || !id) return;
    const timer = setTimeout(() => markCompleteRef.current(), 5000);
    return () => clearTimeout(timer);
  }, [userId, id]);

  // Narration is resolved lazily by the audio player (status → persistent
  // URL); nothing is generated until the listener taps play.

  useEffect(() => {
    if (!story) return;
    const ratio = lastSection > 0 ? section / lastSection : 0;
    if (section >= lastSection) {
      if (userId) clearReadingProgress(userId);
      markComplete();
      return;
    }
    // Remember genuine mid-read positions only (skip the intro).
    if (userId && section > 0 && touchedRef.current) {
      saveReadingProgress(userId, { story: toStoryPreview(story), page: section, progress: ratio, updatedAt: Date.now() });
    }
  }, [section, story, lastSection, userId, id, markComplete]);

  // Tasto indietro di sistema (Android): stesso percorso inverso della card,
  // quando possibile (vedi morphBack più sotto). Hook prima del ritorno anticipato.
  const morphBackRef = useRef<(x: number) => boolean>(() => false);
  useEffect(() => {
    if (Platform.OS !== "android" || morph !== "1") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => morphBackRef.current(0));
    return () => sub.remove();
  }, [morph]);

  if (isLoading || !story) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const bookmarked = user?.bookmarked_story_ids.includes(story.id) ?? false;
  const liked = user?.liked_story_ids.includes(story.id) ?? false;

  const onNext = async () => {
    await markComplete();
    try {
      // 5 storie → pausa di 4 ore: se il limite è scattato, mostra la schermata di pausa.
      if (userId) {
        const limit = await api.limitCheck(userId);
        if (limit.blocked) {
          router.replace("/pause-limit");
          return;
        }
      }
      const next = await api.nextStory(story.id, userId ?? undefined);
      router.replace(`/deep-dive/${next.id}`);
    } catch {}
  };

  // Share a ready-made image card (cover + title + hook + brand). Falls back
  // to a plain text share where image sharing isn't available (e.g. web).
  const onShare = async () => {
    try {
      if (shareRef.current && (await Sharing.isAvailableAsync())) {
        const uri = await captureRef(shareRef, { format: "png", quality: 1, result: "tmpfile" });
        await Sharing.shareAsync(uri, { dialogTitle: t.share, mimeType: "image/png", UTI: "public.png" });
        return;
      }
    } catch {}
    Share.share({ message: `${story.title} — ${t.share_suffix}` }).catch(() => {});
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/discover"));
  // Ritorno dal lettore (arrivati con la transizione dalla card): la schermata
  // "rientra" nella card della Home con il percorso inverso. Se si è già
  // scorso (anche di poco), il livello (apertura) compare prima in dissolvenza
  // sopra la pagina, poi rientra. Senza cornice: ritorno di sempre.
  const backRect = parseRect(rect);
  const morphBack = (x: number) => {
    if (morph !== "1" || !backRect || morphHost.active || !router.canGoBack()) return false;
    navigation.setOptions({ animation: "none" });
    morphHost.show(<StoryMorph direction="close" story={story} from={backRect} premium={isPremium} offsetX={x} fadeIn={scrollY.value > 8} onCommit={() => router.back()} />);
    return true;
  };
  morphBackRef.current = morphBack;
  const onBackPress = () => { if (!morphBack(0)) goBack(); };

  return (
    <Screen style={styles.container} animated={morph !== "1"}>
      <SwipeBack onBack={goBack} onRelease={morphBack}>
      {/* Atmosfera: fondo notte + traccia sfocata della copertina che si attenua nei capitoli. */}
      <ReaderAtmosphere story={story} scrollY={scrollY} fadeOver={pageH * 0.9} />
      {/* Grande copertina dell'apertura: esce verso l'alto e si dissolve con lo scroll. */}
      <ReaderCoverBackdrop story={story} scrollY={scrollY} frame={cover} instant={morph === "1"} />
      {/* Schermata finale: sfondo cinematico dell'onboarding, compare solo in fondo. */}
      <ReaderEndingBackdrop scrollY={scrollY} pageH={pageHSV} endTop={endTopSV} />
      <StoryAudioProvider key={story.id} storyId={story.id} autoplay={listen === "1" && isPremium}>
        <ReaderHeader
          topInset={headerTop}
          title={story.title}
          highlight={story.highlight_words}
          current={section}
          total={chapterCount}
          solid={headerSolid}
          onBack={onBackPress}
          corner={isPremium && listenStarted && !audioOpen ? <AudioMiniBadge visible onPress={() => setAudioOpen(true)} /> : null}
        />

        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={markTouched}
          onLayout={onScrollLayout}
          contentContainerStyle={{ paddingTop: coverTop }}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          testID="deep-dive-scroll"
        >
          {/* Apertura (sezione 0): spazio per la copertina (l'immagine vera è il
              livello fisso dietro), titolo, tre dati, introduzione e l'invito a
              scorrere in fondo alla prima schermata. */}
          <ReaderIntro story={story} coverH={cover.height} minHeight={pageH - coverTop} bottomInset={insets.bottom} reveal={headerReveal}
            listen={isPremium ? <IntroListenButton onListen={openAudio} style={styles.listen} /> : null}
            onLayout={() => setIntroMeasured(true)} />

          {story.chapters.map((c, i) => (
            <View key={c.number} onLayout={(e) => onSectionLayout(i, e)} testID={`deep-dive-page-chapter-${c.number}`}>
              {i > 0 ? <SectionDivider color={colors.brand} /> : null}
              <ChapterSection chapter={c} story={story} eyebrow={`${t.chapter} ${c.number}`} />
            </View>
          ))}

          <View onLayout={(e) => onSectionLayout(chapterCount, e)} style={[styles.ending, { minHeight: pageH - headerBottom }]} testID="deep-dive-page-end">
            <ReaderEnding
              story={story}
              liked={liked}
              onLike={() => toggle("like")}
              bookmarked={bookmarked}
              onBookmark={() => toggle("bookmark")}
              onShare={onShare}
              onNext={onNext}
              bottomInset={insets.bottom}
            />
          </View>
        </Animated.ScrollView>

        {section === 1 ? (
          <CoachTip id="reader" text={t.tip_reader} icon="book-outline" style={{ top: headerBottom + spacing.md }} />
        ) : null}
        {isPremium ? <AudioSheet visible={audioOpen} onClose={() => setAudioOpen(false)} /> : null}
      </StoryAudioProvider>
      </SwipeBack>
      {/* Cornice luminosa nel colore del tema, lungo i bordi dello schermo. */}
      <ReaderFrame />
      {/* Off-screen share card, captured as PNG on demand. */}
      <View style={styles.shareHidden}>
        <View ref={shareRef} collapsable={false}>
          <StoryShareCard story={story} />
        </View>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors: ThemeColors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  shareHidden: { position: "absolute", left: -4000, top: 0, width: SHARE_CARD_WIDTH, pointerEvents: "none" },
  listen: { alignSelf: "flex-start", minWidth: 180 },
  ending: { paddingTop: spacing.xl },
}));
