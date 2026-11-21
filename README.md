# Radici

Metodo e sito **locale** per ripassare e consolidare ciò che ho studiato (fisica teorica e matematica, poi altri ambiti) e imparare cose nuove.
Gira sul PC, alla scrivania: niente app sul telefono.

## Avvio

```powershell
pip install -r requirements.txt
python serve.py
```

Poi apri http://localhost:8770. Test: `python serve.py --test` (scheduler + validazione del contenuto).

## Come funziona

Una sessione al giorno, 20–30 minuti:

1. **Carte piccole** (definizioni, proposizioni, formule): quelle in scadenza più al massimo 5 nuove.
2. **Una carta grande** (teorema o derivazione), a carta e penna, poi confronto con una o più soluzioni.

Dopo ogni carta dai un voto (1 Di nuovo, 2 Difficile, 3 Bene, 4 Facile; tastiera: spazio e 1–4). Il voto va a
[FSRS](https://github.com/open-spaced-repetition/py-fsrs) (lo scheduler di Anki), che decide quando rivederla.
Le carte nuove arrivano solo quando i loro prerequisiti sono già stati visti, alternando i campi (interleaving).

Perché così (evidenza): retrieval practice e ripetizione spaziata sono le tecniche più efficaci nella review di
Dunlosky et al. 2013; sessioni brevi e distribuite battono quelle lunghe (Cepeda et al. 2006); mescolare i campi
aiuta soprattutto in matematica (Brunmair & Richter 2019).

## Dati

- `content/*.yaml`: le carte, una lista per campo. È la fonte di verità.
- `state.json`: lo storico delle ripetizioni (stato FSRS di ogni carta + log di ogni voto). Scritto dal server in modo atomico,
  **committato nel repo** (privato) come backup. Mai cancellarlo: perderlo vuol dire perdere mesi di ripassi.

### Schema di una carta

```yaml
- id: cm-el                 # stabile per sempre: lo storico è legato all'id
  field: Meccanica classica
  kind: derivazione         # definizione | proposizione | formula | teorema | derivazione
  title: Equazioni di Eulero-Lagrange
  prereq: [cm-azione]       # id che devono essere già visti
  prompt: Deriva ...        # testo con matematica $...$ / $$...$$ (KaTeX)
  answer: ...
  solutions:                # una o più vie, anche da campi diversi
    - label: Variazione dell'azione
      steps: |
        ...
      uses:                 # risultati importanti presi da un altro campo
        - field: Analisi
          result: Lemma fondamentale del calcolo delle variazioni
  connections:              # ponti verso altri campi
    - field: QFT
      note: ...
```

Feedback: il bottone in basso a destra manda le note al Worker `site-notes` (sito `radici`).
