# Workout Planner

Web app mobile-first per creare schede palestra, assegnare le giornate al calendario e registrare un allenamento. La sezione storico è volutamente esclusa da questa versione.

## Stack

- React + TypeScript
- Vite
- IndexedDB tramite Dexie
- CSS responsive senza framework
- Icone Lucide

Non sono presenti backend, autenticazione, Zustand o Tailwind. IndexedDB è l'unica fonte persistente dei dati.

## Funzioni disponibili

### Schede

- Creazione, modifica, duplicazione ed eliminazione delle schede
- Gestione di personal trainer, date, durata e note
- Aggiunta, modifica, duplicazione, eliminazione e riordinamento delle giornate
- Aggiunta, modifica, duplicazione, eliminazione e riordinamento degli esercizi
- Serie standard oppure piramidali/personalizzate, con ripetizioni e peso per ogni serie
- Recupero, tecnica e note del personal trainer

### Calendario

- Vista settimanale mobile-first
- Calendario mensile espandibile con indicatori degli allenamenti
- Assegnazione di una giornata a una data
- Eliminazione di un allenamento dalla data selezionata
- Creazione di uno snapshot indipendente della giornata
- Azioni rapide: prossima giornata, ripeti ultimo allenamento e copia settimana precedente
- Stato programmato, iniziato, completato o saltato

### Allenamento

- Apertura e continuazione della sessione direttamente dal calendario
- Separazione tra valori programmati e valori realmente eseguiti
- Peso e ripetizioni reali per ogni serie, con tastierino numerico ottimizzato
- Serie completata o saltata
- Modifica degli esercizi della singola sessione
- Passaggio rapido e persistente tra allenamento in corso e timer
- Scelta esplicita tra "solo questo allenamento" e "aggiorna anche la scheda originale"
- Aggiornamento facoltativo del peso consigliato dopo il completamento

### Timer

- Visualizzazione minuti, secondi e millisecondi
- Un tocco avvia il cronometro
- Un secondo tocco lo azzera
- Il tocco successivo lo avvia nuovamente
- Firma minimale con collegamento al profilo GitHub dello sviluppatore

## Avvio locale

Richiede una versione recente di Node.js.

```bash
npm ci
npm run dev
```

Aprire l'indirizzo mostrato da Vite, normalmente `http://localhost:5173`.

## Build di produzione

```bash
npm run build
npm run preview
```

La cartella generata è `dist`.

## Persistenza

Schede e sessioni vengono salvate in IndexedDB nel browser. Restano disponibili dopo la chiusura dell'app, ma sono legate al browser e al dispositivo utilizzati. La cancellazione dei dati del sito elimina anche le schede e le sessioni.

## Limiti attuali

- Nessuna autenticazione
- Nessun backend o sincronizzazione tra dispositivi
- Nessuna sezione storico separata
- Nessuna condivisione con il personal trainer
- Nessuna esportazione o backup

## Correzione compatibilità 0.5.1

La generazione degli ID e la duplicazione dei dati includono fallback per Safari/iOS e per i browser che non espongono `crypto.randomUUID()` o `structuredClone()`. Questo evita il crash della schermata Schede su alcuni telefoni e durante i test tramite indirizzi HTTP locali.

## Aggiornamento 0.5.2

- Header superiore rimosso per aumentare lo spazio utile
- Logo dell’app usato come selettore del tema chiaro/scuro
- Tema scuro nero e viola elettrico, persistente sul dispositivo
- Rimossi nota specifica, difficoltà percepita e nota generale dell’allenamento
- Aggiunto “Powered by @alegio98” nel Timer con link a GitHub


## Aggiornamento 0.6.0

- Tastierino numerico o decimale su serie, ripetizioni, pesi e recuperi
- I campi possono essere svuotati e riscritti senza inserimenti automatici indesiderati
- Input da almeno 16 px per evitare lo zoom automatico di Safari su iPhone
- Serie standard o piramidali/personalizzate con obiettivi diversi per ogni serie
- Migrazione automatica delle schede e sessioni già salvate alla versione 2 di IndexedDB
- Schermata allenamento più leggibile e compatta
- Riepilogo generale “Programmato” sostituito da recupero, tecnica e note dell’esercizio
- Timer ingrandito
- Scorciatoie fisse tra Calendario, Allenamento e Timer

## Versione 0.7.0

- Importazione rapida di una scheda da testo strutturato.
- Riconoscimento automatico di giornate, esercizi, ripetizioni standard e piramidali.
- Testo tra parentesi importato nelle note dell'esercizio.
- Selezione automatica del valore nei campi numerici per sovrascriverlo al primo tocco.
- Modali mobile stabilizzate: pagina sottostante bloccata e scorrimento interno indipendente.
