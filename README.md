# Workout Planner

Workout Planner è una Progressive Web App mobile-first sviluppata con React, TypeScript e Vite.

Il progetto permette di creare e importare schede di allenamento, pianificare le sessioni nel calendario, registrare serie, ripetizioni e pesi e utilizzare un timer integrato.

L’applicazione segue un approccio **local-first**: i dati vengono salvati nel browser tramite IndexedDB e restano disponibili anche offline dopo il primo caricamento.

## Demo

https://alegio98.github.io/workout-planner-ale/

## Screenshot

<p align="center">
  <img src="docs/screenshots/calendar.png" width="220" alt="Calendario">
  <img src="docs/screenshots/plans.png" width="220" alt="Schede">
  <img src="docs/screenshots/workout.png" width="220" alt="Allenamento">
</p>

<p align="center">
  <img src="docs/screenshots/import.png" width="220" alt="Importazione scheda">
  <img src="docs/screenshots/timer.png" width="220" alt="Timer">
</p>

## Stack tecnologico

- React
- TypeScript
- Vite
- Dexie
- IndexedDB
- CSS
- Service Worker
- Web App Manifest
- GitHub Actions
- GitHub Pages

## Architettura

L’applicazione è composta da tre livelli principali:

```text
Interfaccia React
      ↓
Logica applicativa TypeScript
      ↓
Dexie / IndexedDB
```

Non è presente un backend remoto.

Tutti i dati vengono salvati localmente nel browser dell’utente.

Il database IndexedDB utilizzato dall’app si chiama:

```text
WorkoutPlannerDB
```

Dexie viene utilizzato come wrapper TypeScript per semplificare lettura, scrittura e aggiornamento dei dati.

## Struttura del progetto

```text
workout-planner-ale/
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── components/
│   │   └── NumericInput.tsx
│   ├── App.tsx
│   ├── db.ts
│   ├── main.tsx
│   ├── planTextParser.ts
│   ├── styles.css
│   └── types.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## File principali

### `src/App.tsx`

Contiene il componente principale e gestisce:

- navigazione tra calendario, schede e timer;
- creazione e modifica delle schede;
- assegnazione degli allenamenti;
- gestione delle sessioni;
- importazione delle schede da testo;
- tema chiaro e scuro;
- logica del timer.

### `src/db.ts`

Contiene la configurazione Dexie e la definizione del database IndexedDB.

Gestisce principalmente:

- schede di allenamento;
- sessioni assegnate al calendario;
- migrazioni del database;
- persistenza locale.

### `src/types.ts`

Contiene le interfacce TypeScript utilizzate dall’applicazione:

- schede;
- giornate;
- esercizi;
- serie programmate;
- sessioni;
- risultati eseguiti.

### `src/planTextParser.ts`

Contiene il parser per importare una scheda da testo strutturato.

Esempio:

```text
Giorno A - Petto
1) Panca piana, 10 8 8 6 (recupero 90 secondi)
2) Croci ai cavi, 8 8 8 8

Giorno B - Schiena
1) Lat machine, 12 10 8 8
```

Il parser riconosce:

- nome della giornata;
- nome dell’esercizio;
- ripetizioni;
- numero delle serie;
- serie standard o piramidali;
- note tra parentesi.

### `src/components/NumericInput.tsx`

Componente riutilizzabile per i campi numerici.

Gestisce:

- tastierino numerico su mobile;
- tastierino decimale per i pesi;
- selezione automatica del valore;
- cancellazione temporanea del contenuto;
- normalizzazione del valore al termine della modifica.

### `public/sw.js`

Service worker della PWA.

Gestisce:

- cache dei file statici;
- avvio offline;
- aggiornamento delle versioni;
- pulizia delle vecchie cache.

Quando viene pubblicata una nuova versione, il nome della cache deve essere aggiornato.

Esempio:

```js
const CACHE_NAME = "workout-planner-v0.7.1";
```

### `public/manifest.webmanifest`

Contiene la configurazione PWA:

- nome dell’app;
- icone;
- colori;
- modalità standalone;
- URL iniziale.

## Modello dati

Il progetto distingue tra scheda originale e sessione programmata.

### Scheda

La scheda è il modello modificabile dell’utente.

```text
WorkoutPlan
 └── PlanDay[]
      └── PlanExercise[]
           └── PlannedSet[]
```

### Sessione

Quando una giornata viene assegnata al calendario, viene creata una copia indipendente.

```text
WorkoutSession
 └── SessionExercise[]
      └── SessionSet[]
```

Questo permette di modificare un singolo allenamento senza cambiare la scheda originale.

## Serie standard e personalizzate

Gli esercizi supportano:

```text
Standard
4 × 8
```

oppure:

```text
Piramidale
10 - 8 - 8 - 6
```

Ogni serie può contenere:

- ripetizioni programmate;
- peso programmato;
- ripetizioni eseguite;
- peso eseguito;
- stato completato o saltato.

## Persistenza locale

I dati vengono salvati in IndexedDB.

Vantaggi:

- nessun backend necessario;
- latenza molto bassa;
- funzionamento offline;
- dati privati sul dispositivo;
- costi infrastrutturali ridotti.

Limiti:

- i dati non vengono sincronizzati tra dispositivi;
- cancellando i dati del browser si possono perdere le informazioni;
- non è presente un backup remoto;
- ogni browser mantiene il proprio archivio.

## Avvio in locale

Requisiti:

- Node.js 20 o superiore
- npm

Clona il repository:

```bash
git clone https://github.com/alegio98/workout-planner-ale.git
cd workout-planner-ale
```

Installa le dipendenze:

```bash
npm ci
```

Avvia il server di sviluppo:

```bash
npm run dev
```

Vite mostrerà un URL simile a:

```text
http://localhost:5173
```

## Script disponibili

```bash
npm run dev
```

Avvia l’app in modalità sviluppo.

```bash
npm run lint
```

Esegue il controllo TypeScript.

```bash
npm run build
```

Genera la build di produzione nella cartella `dist`.

```bash
npm run preview
```

Avvia localmente la build di produzione.

## Build di produzione

Prima di pubblicare:

```bash
npm run lint
npm run build
```

La cartella prodotta è:

```text
dist/
```

## Deploy

Il deploy viene eseguito automaticamente tramite GitHub Actions.

Ogni push sul branch `main` avvia:

1. checkout del repository;
2. installazione delle dipendenze;
3. controllo TypeScript;
4. build Vite;
5. pubblicazione della cartella `dist`;
6. aggiornamento GitHub Pages.

Il sito viene pubblicato su:

```text
https://alegio98.github.io/workout-planner-ale/
```

## Flusso di sviluppo

Prima di iniziare una modifica:

```bash
git pull --rebase origin main
```

Avvia l’app:

```bash
npm ci
npm run dev
```

Dopo le modifiche:

```bash
npm run lint
npm run build
```

Commit e push:

```bash
git add .
git commit -m "Descrizione modifica"
git push origin main
```

## Aggiornamento della PWA

Chi ha già installato la PWA non deve reinstallarla.

Dopo il deploy:

- il service worker rileva la nuova versione;
- scarica i nuovi file;
- mantiene invariato IndexedDB;
- applica l’aggiornamento alla successiva apertura.

Quando vengono modificati i file statici, è consigliato incrementare il nome della cache nel service worker.

## Compatibilità mobile

L’interfaccia è progettata principalmente per smartphone.

Sono stati gestiti:

- tastierino numerico;
- tastierino decimale;
- input da almeno 16 px;
- modalità standalone;
- safe area su iPhone;
- layout responsive;
- scroll dei form;
- navigazione rapida tra allenamento e timer.

## Screenshot

Inserire gli screenshot nella cartella:

```text
docs/screenshots/
```

Nomi consigliati:

```text
calendar.png
plans.png
workout.png
import.png
timer.png
```

Esempio Markdown:

```html
<p align="center">
  <img src="docs/screenshots/calendar.png" width="220">
  <img src="docs/screenshots/plans.png" width="220">
  <img src="docs/screenshots/workout.png" width="220">
</p>
```

## Roadmap tecnica

Possibili sviluppi futuri:

- esportazione e importazione del database;
- backup locale;
- sincronizzazione opzionale;
- condivisione delle schede;
- collegamento personal trainer/utente;
- storico avanzato;
- statistiche;
- test automatici;
- refactoring dei componenti;
- separazione della logica applicativa da `App.tsx`;
- gestione degli aggiornamenti PWA tramite banner;
- migrazioni IndexedDB più strutturate.

## Limiti noti

- nessuna sincronizzazione cloud;
- nessun account utente;
- dati legati al browser;
- nessun backup automatico;
- possibili differenze tra Safari, Chrome e browser Android;
- il progetto è ancora in evoluzione.

## Autore

Sviluppato da Alessandro Giovannini.

- GitHub: https://github.com/alegio98
- Repository: https://github.com/alegio98/workout-planner-ale
- Demo: https://alegio98.github.io/workout-planner-ale/
