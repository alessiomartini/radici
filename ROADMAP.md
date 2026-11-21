# Roadmap

<!--
Unico file per il futuro e il passato del progetto, letto da Projects Overview
(https://alessiomartini.github.io/projects-overview/). Sezioni:
- "## <fase>": checkbox "- [ ]" / "- [x]", danno la percentuale di avanzamento
- "## Idee": checkbox, mostrate a parte, NON contano nella percentuale
- "## Decisioni e cose provate": prosa (scartato/rimandato e perché, provato e annullato, limiti e bug noti);
  niente checkbox, così non conta. Documenti di progetto lunghi in docs/, con un link da qui
- "## Log": diario, "- AAAA-MM-GG: testo", una riga per giorno, la più recente in alto
-->

## Pilota
- [x] FSRS nel browser (`ts-fsrs`), progressi in localStorage con Esporta/Importa e avviso di backup
- [x] Sito pubblico su GitHub Pages
- [x] Sessione giornaliera: carte piccole + una grande, prerequisiti, interleaving
- [x] Carte pilota: meccanica classica (10) e analisi complessa (9), con soluzioni multiple e connessioni
- [x] Catalogo, calendario degli ultimi 30 giorni, tema chiaro/scuro, feedback
- [ ] Tre settimane di uso quotidiano, poi rivedere limiti (5 nuove/giorno, 1 grande) e formato delle carte
- [ ] Ampliare il pilota a ~15 carte per campo (meccanica: trasformazioni canoniche, corpo rigido, variabili azione-angolo; complessa: Laurent e singolarità, prolungamento analitico, mappe conformi)

## Catalogo
- [ ] Elenco dei fondamentali per ogni corso della sezione Education del sito personale (bachelor, master, seminari)
- [ ] Minimo del fisico teorico da più fonti: Theoretical Minimum di Landau, "How to become a good theoretical physicist" di 't Hooft, The Theoretical Minimum di Susskind, programmi di qualifying exam
- [ ] Teoremi portanti di ogni campo matematico (perché il campo esiste), con albero dei prerequisiti
- [ ] Argomenti nuovi dalla lista di studio: RMT, meccanica statistica fuori equilibrio e grandi deviazioni, informazione classica e quantistica, caos, complessità, teoria dei giochi / economia / finanza
- [ ] Carte ponte esplicite: Wick ⇔ Isserlis, QFT euclidea ⇔ meccanica statistica, Langevin ⇔ MSRJD

## Idee
- [ ] Vista "connessioni": grafo dei campi e dei ponti fra carte
- [ ] Carte "cosa si rompe se tolgo l'ipotesi X" generate per ogni teorema
- [ ] Ottimizzare i parametri FSRS sul mio storico dopo qualche centinaio di voti
- [ ] Modalità per ambiti nuovi (storia, economia...): prima esempi svolti, poi richiamo
- [ ] Import dei mazzi di `anki-decks` per avere tutto in un posto

## Decisioni e cose provate
- Niente Anki a parte: il sito fa anche la ripetizione spaziata, ma lo scheduler è il pacchetto ufficiale `fsrs` (non riscritto a mano).
- Niente passi di apprendimento in minuti (`learning_steps=()`): una sessione al giorno, intervalli in giorni; "Di nuovo" ripropone la carta a fine sessione.
- Prima versione con server Python locale (`fsrs` + `state.json`), sostituita lo stesso giorno: Alessio ha voluto il sito pubblico su GitHub Pages, quindi tutto nel browser. Lo storico in localStorage si perde se si cancellano i dati del browser: per questo Esporta/Importa e l'avviso dopo 7 giorni. Sincronizzazione su D1 rimandata finché il backup a mano basta.
- Gamification minima (calendario, carte consolidate): l'evidenza sugli effetti è debole e gli streak rotti fanno mollare.
- Soluzioni da confrontare invece della correzione di Claude: costa troppo uso ogni giorno.

## Log
- 2026-11-21: sito pubblico su GitHub Pages, FSRS e progressi spostati nel browser
- 2026-11-21: progetto avviato; pilota con server FSRS, sessione, catalogo e 19 carte (meccanica classica, analisi complessa)
