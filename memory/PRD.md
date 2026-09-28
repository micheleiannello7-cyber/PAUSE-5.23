# PAUSE — Product Requirements (Preview)

> ⚠️ **OBBLIGATORIO PRIMA DI QUALSIASI INTERVENTO:** leggere e rispettare
> [`/app/memory/CONSTITUTION.md`](./CONSTITUTION.md) — la Costituzione tecnica permanente
> e vincolante di PAUSE (regola "minimum change", niente riscritture, niente rigenerazione
> di contenuti/asset, niente AI a runtime, identità visiva dark-navy/cyan/glass).
> Lingua dell'utente: **italiano**.

## Summary
App mobile Expo (React Native + FastAPI + MongoDB) che trasforma i momenti morti in
curiosità / mini-lezioni, con una "pausa" intenzionale tra le sessioni. Contenuti
pre-generati (storie, capitoli, copertine, audio TTS) distribuiti dal backend.

## Ripristino ambiente da GitHub PAUSE-5.21 (giugno 2026 — sessione corrente)
- Richiesta utente: «Questa è la mia app https://github.com/micheleiannello7-cyber/PAUSE-5.21.git rendi la preview disponibile completa».
- Repo clonato e copiato in `/app` preservando i file di piattaforma (`.git`, `.emergent`,
  `.env` di frontend/backend). Env NON modificati salvo aggiunta chiavi backend.
- **Backend**: FastAPI `:8001`, MongoDB locale, `pip install -r requirements.txt` completato.
  `backend/.env` esteso con `EMERGENT_LLM_KEY` (Universal Key) e `ENFORCE_LIMIT="false"`.
  Seed automatico all'avvio: **12 categorie, 430 storie**. `/api/health` = ok.
- **Frontend**: Expo SDK 57, `yarn install` completato (vector-icons presenti). Metro `:3000`,
  preview attiva. Onboarding + tessere 3D categorie renderizzano correttamente a 390×844.


## Ripristino ambiente da GitHub PAUSE-5.18 (25 settembre 2026 — sessione corrente)
- Richiesta utente: «Questa è la mia app, estrapolala e dammi la preview pronta completa».
- Codice clonato da `github.com/micheleiannello7-cyber/PAUSE-5.18` e copiato in `/app`
  preservando i file di piattaforma (`.git`, `.emergent`, `.env` di frontend/backend).
- **Backend**: FastAPI su `:8001`, MongoDB locale, `requirements.txt` installato
  (con `--extra-index-url` per `emergentintegrations`; aggiunti i pacchetti mancanti
  `emoji`, `elevenlabs`, `fal_client`, ecc.). Seed automatico all'avvio: **430 contenuti**,
  12 categorie. Health `/api/health` = ok.
- **Frontend**: Expo SDK 57. Eseguito `yarn install` (le vector-icons
  `@react-native-vector-icons/*` mancavano nei node_modules del template → bundling
  fallito finché non installate). Metro su `:3000`, preview attiva.
- **Env**: `backend/.env` esteso con `EMERGENT_LLM_KEY` (Universal Key, gratuita) e
  `ENFORCE_LIMIT="false"`. URL/porte nei `.env` NON modificati. Stripe/ElevenLabs
  volutamente non configurati (integrazioni idle).
- **Copertine**: sync all'avvio verso l'Object Storage gestito. La prima sync locale
  era abortita da un 500 transitorio dell'Object Storage sotto carico → aggiunta
  resilienza per-file in `backend/covers_sync.py` (retry ×3 + continue, nessuna
  generazione AI, nessun costo). Resync finale: **58 caricate, 265 già presenti,
  16 senza storia (ritirate), 0 fallite**. Le storie senza copertina generata usano il
  fallback hero Unsplash già previsto.

## Verifica preview (sessione corrente)
- `/api/health` = ok, `/api/categories` e `/api/stories` restituiscono dati.
- Frontend caricato a 390×844: intro cinematica (logo PAUSE, CTA "Start your pause")
  → onboarding "What do you want to read?" (card glass Curiosità / Mini lezioni)
  navigabile. Nessun errore di bundling dopo `yarn install`.

## Architettura
- `backend/server.py`: API `/api/*`, seed idempotente all'avvio, sync asset in background
  (copertine locali + importate, artwork categorie, cache media, adozione audio TTS legacy).
- `backend/storage.py`: helper Object Storage gestito (richiede `EMERGENT_LLM_KEY`).
- `frontend/app/*`: expo-router (intro, onboarding, tabs, browse, playlist, premium,
  stats, deep-dive, ecc.). Tema in `frontend/src/theme.ts`, i18n in `frontend/src/i18n.tsx`.

## File protetti (mai modificare)
`frontend/metro.config.js`, campo `main` di `package.json`, URL/porte nei `.env`
(`EXPO_PACKAGER_PROXY_URL`, `EXPO_PACKAGER_HOSTNAME`, `EXPO_PUBLIC_BACKEND_URL`, `MONGO_URL`),
`frontend/eas.json` (gestito da Emergent).

## Backlog / note
- Integrazioni a pagamento (Stripe, ElevenLabs) restano disattivate finché non richieste.
- Nessuna rigenerazione AI di contenuti/copertine/audio senza richiesta esplicita.

## Categorie 3D da riferimento — 25 settembre 2026
- Richiesta esplicita: rigenerare icone categorie fedeli all'allegato, incluse tessere
  dark arrotondate, font e luce inferiore accesa solo alla selezione. Conferma:
  «Si procedi, sii fedele all allegato». Con `all` tutte le luci sono accese.
- Pubblicata famiglia `reference-3d-v6`: 12 categorie reali + cristallo `all`.
  Beuta, Saturno, chip cyan, germoglio, zampa, busto classico, loto/Psicologia,
  testa con cervello/Corpo umano, libro, monete/Economia, tavolozza/Arte, montagna.
  Nessuna categoria aggiunta/rinominata; quelle dell'allegato non presenti ignorate.
- 13 WebP 480px (circa 334KB complessivi) salvati in Object Storage gestito;
  manifest `backend/category_art_manifest.json`. Vecchio manifest conservato in
  `backend/category_art/previous-glossy-3d-v5.json`; vecchi oggetti non cancellati.
  Sorgenti/crop/import report: `backend/category_art/reference-3d-v4/` (nome cartella
  di lavorazione; versione pubblicata v6). Script offline `import_reference_categories.py`.
  Nessuna AI a runtime, né modifiche a storie, copertine, audio, dati degli utenti.
- `CategoryGrid` condiviso da onboarding ed Explore: artwork grande, bordi SVG,
  Manrope Medium (approssimazione del font del riferimento, non identificabile con
  certezza dalla sola immagine), conteggi dinamici preservati, luce SVG/Animated 180ms.
  2 colonne su schermi piccoli, 3 standard, 4 tablet. `category-tile-effects.tsx`
  condiviso anche dalle tessere Home (qui la luce rappresenta il focus del mazzo).
- Palette dedicata in `src/theme.ts`, costante nei temi chiaro/scuro per rispettare
  il riferimento. `CategoryArtwork` ha variante `reference`; cache revision v6 anche
  per i badge. Logica/persistenza filtri invariata: all resta esclusivo.
- Self-test: 12 categorie API con versione v6; preview 390×844 IT/EN; caricamento
  icone, Scienza singola, 13 luci con Qualsiasi e passaggio Qualsiasi→Arte PASS.
  Lint file modificati PASS; nessun errore TypeScript nei file modificati.
- Verifica finale `test_reports/iteration_7.json`: backend 17/17 PASS (13 immagini,
  categorie e cutout badge); onboarding, salvataggio, selezioni, Home, intro storia,
  IT/EN 320/390/430, temi chiaro/scuro, assenza overflow/ID duplicati PASS.
  Test esclusivamente in preview browser; nessun dispositivo nativo disponibile.
  Driver animazione luci nativo iOS/Android, JS web per evitare warning di fallback.
- P0: nessun blocco nel perimetro richiesto.
- P1: validazione visiva dell'utente su dispositivo iOS/Android.
- P2: eventuali ritocchi delle singole icone solo su richiesta.

## Home statica + multi-selezione, barra lettura "Copertina" — 25 settembre 2026
- Richiesta: Home senza scroll (tutto in una schermata); tessere Home = categorie
  scelte in onboarding/Esplora, tutte accese; tocco accende/spegne singolarmente
  (non più esclusivo); il mazzo segue le categorie attive; se si spegne l'ultima
  accesa → avviso "Tieni attiva almeno una categoria" (toast ~2s + haptic errore).
- `discover.tsx`: `ScrollView` → `View` statico; il mazzo occupa lo spazio residuo
  (misurato a layout, `home-deck-area`), card alta = area − 20, clamp 170..width×1.2.
  Stato spente per utente in AsyncStorage `pause.home_off.<uid>` (`src/home-focus.ts`):
  si salvano le SPENTE così una categoria nuova parte accesa; se tutte accese il mazzo
  usa gli interessi originali (comportamento precedente). Chiave i18n `home_min_one_category`.
- Barra lettore (`reader-header.tsx`), variante "Copertina" scelta dall'utente fra 5
  mockup (route temporanea `/dev-header-options`, rimossa): miniatura copertina 42px
  (`StoryHero` thumb), titolo a sinistra mai troncato (corpo 15.5→13.5 per lunghezza,
  max 82 caratteri in DB verificati a 320/390px), occhiello "CAPITOLO n DI N" con icona
  libro (ultima pagina "DA RICORDARE" con segnalibro ambra), filo di progresso 2px a tutta
  larghezza sul bordo inferiore. Nuova prop `story` (+ `labelIcon`); animazioni
  reveal/solid/progress e badge audio (`corner`, centrato in altezza) invariati.
  `READER_HEADER_H` resta 96.
- Test `test_reports/iteration_8.json`: tutto PASS (Home statica 390/375, luci, toggle,
  toast, persistenza, mazzo filtrato, header lettore 320/390, intro→capitolo, fine).

## Lettura: contenitori capitoli dark-glass monocromatici — 25 settembre 2026
- Richiesta (solo raffinamento visivo + scroll, nessuna nuova schermata): miniatura
  header più grande; capitoli in contenitori vetro scuro premium/minimal con UNA sola
  famiglia cromatica per storia (dal tema/categoria) e variazioni lievi tra capitoli;
  fondo lettura dark-navy stabile; copertina solo nell'apertura (esce verso l'alto,
  non più espansa a tutto schermo dietro ai capitoli); schermata finale con lo sfondo
  cinematico dell'onboarding profilo; scroll/snap, barra superiore e pulsanti invariati.
- `src/story-palette.ts`: famiglie per categoria (spazio cyan→blu→viola, scienza/tecnologia
  cyan→blu, natura/geografia turchese→petrolio, storia/cultura/economia/animali ambra-oro,
  psicologia viola, arte magenta, corpo-umano rosa; default cyan). `chapterTint(cat, i, n)`.
  Il `glow_color` casuale dei capitoli nel DB NON è più usato nel lettore (dato intatto).
- `reader-section.tsx`: card 26px, fondo `surfaceDeep` traslucido (0.56–0.74), bordo
  tinta 0.34, riflesso superiore, alone 36px a 0.10, occhiello con quadratino+punto,
  titolo con evidenziazione nella tinta; divider rimosso dai capitoli (resta nel finale);
  fade fuori-fuoco 0.38→0.55 (più leggero). Testo/capitoli identici, nessun extra.
- `reader-cover-backdrop.tsx`: niente morph a sfondo; la card copertina trasla con lo
  scroll (`translateY: -y`, stretch al pull come prima). Prop `morphEnd/screenW/screenH`
  rimosse. `[id].tsx`: velo tinta 0.10→0 in alto sul fondo notte; nuovo
  `reader-ending-backdrop.tsx` (artwork `onboarding-profile-bg.jpg` + veli ONB) che
  compare da 0.55 pagina prima della fine. Header: miniatura 42→56px (raggio 14).
- Sistema di scroll a pagine (spring nativo / snapToOffsets web) NON toccato.
- Test `test_reports/iteration_9.json`: tutto PASS (intro, copertina fuori schermo sui
  capitoli, etichette 1..6, palette spazio/storia, finale con sfondo+pulsanti, 320/390).
- Ritocco su richiesta: contenitori più evidenti (bordo tinta 0.58, alone 48px a 0.22 +
  ombra, riempimento `onSurface` 0.04–0.075 + velo tinta 0.16→0.03 su base `surfaceDeep`
  0.55, riflesso superiore 0.95).

## Bug fix: card Home non si apriva toccando il titolo — 25 settembre 2026
- Causa: in `home-story-card.tsx` la fascia titolo (Reanimated `Animated.View`) aveva
  `pointerEvents: "box-none"` solo nello style → su web ignorato, il click sul titolo veniva
  assorbito e non raggiungeva il `Pressable` a tutta card. Fix: `pointerEvents="box-none"`
  come prop (e `pointerEvents="none"` sul pannello anteprima). Il tasto Ascolta resta attivo.
- Test `test_reports/iteration_10.json`: tap su titolo/angolo/immagine/chip aprono la storia;
  swipe non apre; long-press anteprima ok; tessere e "Vedi tutte" ok.


---

## Restore / Setup Log — 2026-09-26
- Estratta l'app dal repo GitHub `PAUSE-5.19` e ripristinata nell'ambiente di anteprima corrente.
- Backend (FastAPI + MongoDB): dipendenze installate, seed automatico all'avvio → 12 categorie e 430 contenuti; `/api/health` OK (db: true).
- Aggiunta `EMERGENT_LLM_KEY` in `backend/.env` per l'Object Storage delle copertine (init/get/put). Verificato: `/api/category-media/*` e `/api/media/{id}?size=thumb` restituiscono WebP 200. 64 copertine storie presenti + arte categorie.
- Frontend (Expo SDK 57): `yarn install` completato; Metro avviato; intro cinematica + onboarding renderizzati correttamente.
- File `.env` di ambiente (EXPO_PACKAGER_*, MONGO_URL) preservati, non sovrascritti.
- Stripe / TTS ElevenLabs lasciati disattivati come nella configurazione originale.


## Account: Google (Emergent Auth) + Apple + Ospite — giugno 2026
- Richiesta: accesso Google su Android (solo Google), Apple + Google su iOS, ospite ovunque;
  integrato nel passo profilo dell'onboarding (nickname/genere/età), non in una schermata a parte.
- Onboarding: `START_STEP = 1` → profilo (con `AuthBlock`) → argomenti (formato saltato, resta nei chip).
  CTA profilo: "Continua come ospite" (ospite) / "Continua" (connesso). Nome account precompila il nickname.
- Frontend: `src/auth.tsx` (`AuthProvider`/`useAuth`: loading|authenticated|guest, Google via
  `auth.emergentagent.com` → `POST /api/auth/session`, Apple via `expo-apple-authentication` →
  `POST /api/auth/apple`, token in SecureStore/localStorage `pause.session_token`, Bearer in `api.ts`).
  Dopo il login l'app adotta lo `user_id` dell'account (`adoptUserId`), al logout nuovo id ospite (`resetUserId`).
  `src/components/auth-block.tsx` (bottoni/"Connesso come"/Esci). Profilo: nome account, riga Accedi/Esci.
- Backend: `backend/auth.py` (router `/api/auth/*`: session, apple, me, logout; collezioni `users`,
  `user_sessions` con indici + TTL). `.env`: `APPLE_AUDIENCES` = bundle id + `host.exp.Exponent`.
  `app.json`: `ios.usesAppleSignIn`, plugin `expo-apple-authentication`.
- Apple verificabile solo su iPhone reale (non Expo Go web/Android). Test: `test_reports/iteration_1.json`.

## Transizione card Home ↔ lettura più fluida — giugno 2026
- Problema: alla fine dell'apertura il livello restava fermo finché scattava il timer di sicurezza
  (il lettore non segnalava mai "pronto" quando la copertina è limitata dal quadrato), poi lo scambio
  "di colpo"; il ritorno faceva la transizione inversa solo dalla presentazione (swipe), mai dai
  capitoli né col tasto indietro Android.
- `story-morph.tsx`: 640ms ease-out quintico; il lettore si monta sotto già a p≥0.6 (fondo opaco);
  la dissolvenza parte solo quando animazione finita E lettore pronto (`MorphHost.ready/markReady`);
  partenza solo con scheda a misura (`sheetStable`). Chiusura da capitolo: `fadeIn` (200ms) poi rientro.
- `deep-dive/[id].tsx`: `markReady` quando la card non cambia più altezza; `morphBack` da ogni sezione;
  `BackHandler` Android → stesso percorso inverso; copertina senza fade d'ingresso se `morph=1`.
- Bug segnalato dall'utente (app "inchiodata" al tap): la partenza aspettava un secondo onLayout della
  scheda che su altezze da telefono (copertina limitata in altezza) non arriva mai (onLayout non si
  ripete per un solo spostamento) → livello fermo a p=0 che assorbiva i tocchi. Fix: niente gate di
  stabilità; `ReaderIntroSheet` prop `remeasure` (rimisura titolo/griglia quando cambia `cardH`), mete
  "taggate" con la card corrente, commit lettore a 40% via setTimeout, `Easing.out(cubic)` 640ms,
  rete di sicurezza assoluta 900ms (commit + dismiss), `markReady` via effect nel lettore, `sheetHint`
  per la chiusura (stessa geometria dal primo fotogramma).
- Test `iteration_2/3` (390×844) e `iteration_4.json` (390×700, 375×667, 390×844, 430×932: partenza
  ≤ ~360ms, fine ≤ ~1.3s, handoff 0px, chiusura da intro e capitolo, nessun overlay bloccato).

- Home: rimosso badge inferiore "Hai già letto X storie" (componente eliminato); nuovo contatore compatto nell'header (`home-read-counter`, icona libri 3D + numero da `completed_story_ids`) → tap apre `/read-stories` (riepilogo esistente della sessione). Card storie Home INVARIATE (tentativo di riduzione annullato su richiesta utente).
- Tab Categorie: griglia a 4 colonne con tessere dense (prop `columns` di CategoryGrid/TopicPicker), tutto in una schermata senza scroll su 390x844. Onboarding non toccato (3 colonne).
- Onboarding: parte direttamente dagli argomenti (`START_STEP = 3` in app/onboarding.tsx), formati preselezionati entrambi; intro/profilo/formato saltati temporaneamente.
- Lettura: contenitori capitoli con un unico colore = accento del tema app (`colors.brand`), identico per tutte le storie e capitoli; rimosso `src/story-palette.ts` (tinte per categoria).
- Test: /app/test_reports/iteration_11.json, iteration_12.json (tutti PASS).
