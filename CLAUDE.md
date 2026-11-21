# Radici: istruzioni per Claude

Segui il protocollo globale di `ROADMAP.md` (`~/.claude/rules/alessio-preferences.md`, sezione "Every project"). Il `CLAUDE.md` di un progetto contiene solo regole specifiche del progetto.

- Sito statico pubblico su GitHub Pages (repo pubblico). In locale: `python -m http.server 8770` (config `radici` in
  `Projects_Git/.claude/launch.json`). Verifica: `python check.py`, poi la pagina nel browser.
- Scheduling con `ts-fsrs` (ESM da jsDelivr, versione fissata) in `app.js`; progressi in `localStorage` (`radici-state`).
  Nel browser di Alessio sono il suo storico reale: provare l'interfaccia solo nel browser di anteprima, mai cancellare dati suoi.
- Repo pubblico: niente dati personali nei file.
- Contenuto (`content/*.yaml`): correttezza prima della quantità, ogni passaggio verificato. Gli `id` non si cambiano mai.
  Ogni carta grande ha, dove esistono, più soluzioni da campi diversi; i risultati presi da un altro campo vanno in `uses`,
  i ponti in `connections` (Alessio vuole che le connessioni fra campi siano il centro del metodo).
- Le soluzioni sono da confrontare da solo: niente correzione di Claude nella routine quotidiana (costa uso).
- Testi delle carte in italiano.
