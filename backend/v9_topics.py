"""PAUSE v9 — argomenti curati a mano per riportare in pari le categorie (obiettivo 40 contenuti
per categoria, ~24 curiosità + ~16 mini lezioni) dopo il ritiro dei doppioni (retired_stories.py).

Criteri: niente curiosità banali, mini lezioni utili e concrete, nessuna sovrapposizione con il
catalogo esistente. I testi (6 capitoli IT + EN, 4–5 minuti di lettura) vengono scritti da
generate_v9.py in v9_content.json e caricati da seed_pack_v9.py."""

# category_id -> {"story": [(title_it, title_en), ...], "lesson": [(title_it, title_en), ...]}
TOPICS = {
    "cultura": {
        "story": [
            ("Perché quasi tutte le lingue chiamano la madre 'mamma'?", "Why do almost all languages call mother 'mama'?"),
            ("Da dove vengono i nomi dei giorni della settimana?", "Where do the names of the days of the week come from?"),
            ("Perché il nero è il colore del lutto (ma non ovunque)?", "Why is black the colour of mourning (but not everywhere)?"),
            ("Perché la sposa si veste di bianco?", "Why do brides wear white?"),
            ("Perché mangiamo tre pasti al giorno?", "Why do we eat three meals a day?"),
            ("Perché il tè è 'inglese' se viene dalla Cina?", "Why is tea 'English' if it comes from China?"),
            ("Perché esiste la punteggiatura? Un tempo si scriveva tutto attaccato", "Why does punctuation exist? Writing once had no spaces at all"),
        ],
        "lesson": [
            ("Riconoscere i santi nei dipinti: 6 simboli che li identificano", "Recognising saints in paintings: 6 symbols that identify them"),
            ("Come funziona una lingua dei segni: 6 cose che quasi tutti sbagliano", "How a sign language works: 6 things almost everyone gets wrong"),
            ("Guardare un film con occhi nuovi: 6 scelte del regista da notare", "Watching a film with new eyes: 6 director's choices to notice"),
            ("Il dialetto non è italiano sbagliato: 6 cose da sapere sulle lingue d'Italia", "Dialects aren't 'bad Italian': 6 things to know about the languages of Italy"),
            ("Scrivere un messaggio chiaro: 6 regole da Cicerone alle chat", "Writing a clear message: 6 rules from Cicero to group chats"),
            ("Come funziona la traduzione: 6 passi per capire perché non è mai letterale", "How translation works: 6 steps to understand why it's never literal"),
        ],
    },
    "economia": {
        "story": [
            ("Che cos'è una recessione (e perché arriva a ondate)?", "What is a recession (and why does it come in waves)?"),
            ("Perché esistono i saldi (e chi ci guadagna davvero)?", "Why do sales exist (and who really profits)?"),
            ("Perché le banche non tengono tutti i tuoi soldi in cassaforte?", "Why don't banks keep all your money in the vault?"),
            ("Come fa un'app gratuita a guadagnare miliardi?", "How does a free app make billions?"),
            ("Che cos'è il debito pubblico e perché non si ripaga mai del tutto?", "What is public debt, and why is it never fully repaid?"),
            ("Perché l'oro è prezioso da 5.000 anni?", "Why has gold been precious for 5,000 years?"),
            ("Perché il gratta e vinci conviene solo a chi lo vende? La matematica del gioco", "Why the lottery only pays whoever sells it: the maths of gambling"),
        ],
        "lesson": [
            ("Leggere un estratto conto in 6 passi: cosa controllare ogni mese", "Reading a bank statement in 6 steps: what to check every month"),
            ("Capire un'assicurazione: premio, franchigia e massimale in 6 passi", "Understanding an insurance policy: premium, deductible and cap in 6 steps"),
            ("Leggere una bolletta: 6 voci per capire cosa paghi davvero", "Reading a utility bill: 6 line items to understand what you really pay for"),
            ("Come funziona la pensione: 6 passi per capire i contributi", "How pensions work: 6 steps to understand contributions"),
            ("Negoziare uno stipendio o un prezzo: il metodo in 6 passi", "Negotiating a salary or a price: the 6-step method"),
            ("Riconoscere una truffa finanziaria: 6 segnali che si ripetono", "Spotting a financial scam: 6 warning signs that repeat"),
        ],
    },
    "arte": {
        "story": [
            ("Perché i quadri antichi sono così scuri? Vernici, fumo e restauri", "Why are old paintings so dark? Varnish, smoke and restoration"),
            ("Perché la Torre di Pisa non cade?", "Why doesn't the Leaning Tower of Pisa fall?"),
            ("Perché una canzone pop dura tre minuti?", "Why does a pop song last three minutes?"),
            ("Come si capisce se un quadro è falso?", "How do experts tell if a painting is a fake?"),
            ("Perché le cattedrali gotiche hanno mostri sui tetti?", "Why do Gothic cathedrals have monsters on their roofs?"),
            ("Perché la Venere di Milo non ha le braccia (e nessuno gliele rimette)?", "Why is the Venus de Milo missing her arms (and why no one replaces them)?"),
        ],
        "lesson": [
            ("Disegnare una figura umana proporzionata in 6 passi", "Drawing a well-proportioned human figure in 6 steps"),
            ("Riconoscere le tecniche: affresco, olio, tempera e acquerello in 6 passi", "Recognising techniques: fresco, oil, tempera and watercolour in 6 steps"),
            ("Come nasce un film d'animazione: 6 passi dallo storyboard allo schermo", "How an animated film is made: 6 steps from storyboard to screen"),
            ("Arredare una stanza: 6 principi di design che usano gli architetti", "Furnishing a room: 6 design principles architects use"),
            ("Capire il jazz in 6 passi: cosa ascoltare quando sembra caos", "Understanding jazz in 6 steps: what to listen for when it sounds like chaos"),
            ("Come si legge un fumetto: 6 scelte di regia tra una vignetta e l'altra", "How to read a comic: 6 storytelling choices between panels"),
        ],
    },
    "geografia": {
        "story": [
            ("Perché l'Olanda non è sott'acqua?", "Why isn't the Netherlands underwater?"),
            ("Perché Venezia affonda (e quanto tempo le resta)?", "Why is Venice sinking (and how long does it have)?"),
            ("Perché il 90% delle persone vive nell'emisfero nord?", "Why do 90% of people live in the northern hemisphere?"),
            ("Come nasce un'isola?", "How is an island born?"),
            ("Perché ci sono paesi dentro altri paesi? Enclave ed exclave", "Why are there countries inside other countries? Enclaves and exclaves"),
            ("Perché nel Mar Morto non si affonda?", "Why can't you sink in the Dead Sea?"),
        ],
        "lesson": [
            ("Leggere una previsione meteo: i 6 numeri che contano davvero", "Reading a weather forecast: the 6 numbers that really matter"),
            ("Riconoscere le coste: 6 forme e cosa raccontano", "Recognising coastlines: 6 shapes and what they reveal"),
            ("Prepararsi all'alta quota: 6 passi contro il mal di montagna", "Preparing for high altitude: 6 steps against mountain sickness"),
            ("Venti e correnti: perché le rotte di navi e aerei non sono dritte", "Winds and currents: why ship and plane routes aren't straight lines"),
            ("Perché le persone migrano: 6 fattori dietro ogni grande spostamento", "Why people migrate: 6 factors behind every great movement"),
            ("Orientarsi in una metropoli sconosciuta: 6 trucchi per leggere la mappa dei trasporti", "Finding your way in an unfamiliar metropolis: 6 tricks to read a transit map"),
            ("Leggere un paesaggio a rischio: 6 segni di frane e alluvioni", "Reading a landscape for risk: 6 signs of landslides and floods"),
        ],
    },
    "corpo-umano": {
        "story": [
            ("Perché il cervello non sente dolore (ma il mal di testa sì)?", "Why can't the brain feel pain (but headaches hurt)?"),
            ("Perché le ossa si riparano da sole (e ricrescono più forti)?", "Why do bones heal themselves (and do they grow back stronger)?"),
            ("Perché la nostra voce registrata ci sembra diversa?", "Why does our recorded voice sound different to us?"),
            ("Perché si 'addormenta' un braccio (e cosa sono i formicolii)?", "Why does your arm 'fall asleep' (and what are pins and needles)?"),
        ],
        "lesson": [
            ("Leggere le analisi del sangue: 6 valori da capire", "Reading a blood test: 6 values worth understanding"),
            ("Allenare la forza dopo i 40: 6 principi confermati dalla ricerca", "Strength training after 40: 6 principles backed by research"),
            ("Proteggere gli occhi davanti agli schermi: 6 passi", "Protecting your eyes in front of screens: 6 steps"),
            ("Come funziona un vaccino: 6 passi dall'iniezione alla memoria immunitaria", "How a vaccine works: 6 steps from the shot to immune memory"),
            ("Misurare la pressione a casa: 6 passi per leggerla bene", "Measuring blood pressure at home: 6 steps to read it right"),
        ],
    },
    "natura": {
        "story": [
            ("Perché la grandine cade d'estate e non d'inverno?", "Why does hail fall in summer, not winter?"),
            ("Perché le onde arrivano sempre parallele alla spiaggia?", "Why do waves always arrive parallel to the beach?"),
            ("Perché gli alberi non crescono oltre una certa altezza?", "Why can't trees grow beyond a certain height?"),
            ("Perché in riva al mare il vento si alza sempre di pomeriggio?", "Why does the wind always pick up at the seaside in the afternoon?"),
        ],
        "lesson": [
            ("Cosa fare durante un temporale: 6 regole che salvano la vita", "What to do in a thunderstorm: 6 rules that save lives"),
        ],
    },
    "animali": {
        "story": [
            ("Perché le zanzare pungono proprio te?", "Why do mosquitoes bite you in particular?"),
        ],
        "lesson": [
            ("Capire il tuo cane: leggere il linguaggio del corpo in 6 segnali", "Understanding your dog: reading body language in 6 signals"),
        ],
    },
    "spazio": {
        "story": [
            ("Perché la Luna sembra più grande all'orizzonte?", "Why does the Moon look bigger on the horizon?"),
            ("Perché le stelle brillano a intermittenza e i pianeti no?", "Why do stars twinkle but planets don't?"),
        ],
        "lesson": [],
    },
    "psicologia": {
        "story": [
            ("Perché dimentichiamo cosa volevamo fare appena cambiamo stanza?", "Why do we forget what we came for when we walk through a door?"),
            ("Perché ci sembra che tutti ci guardino? L'effetto riflettore", "Why does it feel like everyone is watching you? The spotlight effect"),
        ],
        "lesson": [],
    },
    "storia": {
        "story": [
            ("I Romani conoscevano il vapore: perché non fecero la rivoluzione industriale?", "The Romans knew about steam power: why didn't they start the Industrial Revolution?"),
            ("Il pomodoro è arrivato in Italia solo nel Cinquecento: la storia della cucina 'italiana'", "Tomatoes only reached Italy in the 1500s: the history of 'Italian' food"),
        ],
        "lesson": [
            ("Leggere una città antica: 6 tracce romane che vedi ancora oggi", "Reading an ancient city: 6 Roman traces you can still see today"),
        ],
    },
}


def all_topics():
    """Flat list in seed order: [(cat_id, kind, title_it, title_en), ...]."""
    out = []
    for cat_id, kinds in TOPICS.items():
        for kind in ("story", "lesson"):
            for title_it, title_en in kinds[kind]:
                out.append((cat_id, kind, title_it, title_en))
    return out
