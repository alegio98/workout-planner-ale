export const MUSCLE_GROUPS = [
  'Petto',
  'Schiena',
  'Gambe',
  'Spalle',
  'Bicipiti',
  'Tricipiti',
  'Addome',
  'Glutei',
  'Polpacci',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
export type ExerciseKind = 'compound' | 'accessory' | 'isolation'

export interface LibraryExercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: string
  instructions: string
  kind: ExerciseKind
  defaultSets: number
  defaultReps: number
  recoverySeconds: number
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  { id: 'chest-press', name: 'Chest Press', muscleGroup: 'Petto', secondaryMuscles: ['Tricipiti', 'Spalle'], equipment: 'Macchina', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Regola il sedile con le maniglie all’altezza del petto. Mantieni schiena e scapole appoggiate e spingi senza bloccare i gomiti.' },
  { id: 'incline-dumbbell-press', name: 'Panca inclinata con manubri', muscleGroup: 'Petto', secondaryMuscles: ['Tricipiti', 'Spalle'], equipment: 'Manubri', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Mantieni i piedi stabili, abbassa i manubri in controllo e spingi seguendo una traiettoria naturale.' },
  { id: 'push-up', name: 'Piegamenti sulle braccia', muscleGroup: 'Petto', secondaryMuscles: ['Tricipiti', 'Spalle'], equipment: 'Corpo libero', kind: 'compound', defaultSets: 3, defaultReps: 12, recoverySeconds: 75, instructions: 'Mantieni il corpo in linea, scendi con controllo e spingi senza perdere la posizione del bacino.' },
  { id: 'cable-fly', name: 'Croci ai cavi', muscleGroup: 'Petto', secondaryMuscles: ['Spalle'], equipment: 'Cavi', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Tieni i gomiti leggermente flessi e avvicina le mani davanti al petto senza chiudere le spalle.' },

  { id: 'lat-machine', name: 'Lat Machine', muscleGroup: 'Schiena', secondaryMuscles: ['Bicipiti'], equipment: 'Macchina', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Porta la barra verso la parte alta del petto, mantenendo il busto stabile e le spalle lontane dalle orecchie.' },
  { id: 'seated-row', name: 'Pulley basso', muscleGroup: 'Schiena', secondaryMuscles: ['Bicipiti'], equipment: 'Cavo', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Tira verso l’addome, avvicina le scapole e torna lentamente senza incurvare la schiena.' },
  { id: 'chest-supported-row', name: 'Rematore con petto appoggiato', muscleGroup: 'Schiena', secondaryMuscles: ['Bicipiti'], equipment: 'Manubri', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Mantieni il petto appoggiato e porta i gomiti indietro senza sollevare le spalle.' },
  { id: 'straight-arm-pulldown', name: 'Pulldown a braccia tese', muscleGroup: 'Schiena', secondaryMuscles: [], equipment: 'Cavo', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Con gomiti morbidi, porta la barra verso le cosce usando il dorso e mantenendo il busto fermo.' },

  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Gambe', secondaryMuscles: ['Glutei'], equipment: 'Macchina', kind: 'compound', defaultSets: 4, defaultReps: 10, recoverySeconds: 120, instructions: 'Appoggia tutta la schiena, scendi fin dove mantieni il bacino stabile e spingi senza bloccare le ginocchia.' },
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'Gambe', secondaryMuscles: ['Glutei'], equipment: 'Manubrio', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Tieni il peso vicino al petto, ginocchia in linea con i piedi e busto stabile durante tutta la discesa.' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Gambe', secondaryMuscles: [], equipment: 'Macchina', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Regola il rullo sopra le caviglie, estendi le ginocchia in controllo e non slanciare il peso.' },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'Gambe', secondaryMuscles: [], equipment: 'Macchina', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Mantieni il bacino stabile, fletti le ginocchia e ritorna lentamente senza perdere tensione.' },

  { id: 'shoulder-press', name: 'Shoulder Press', muscleGroup: 'Spalle', secondaryMuscles: ['Tricipiti'], equipment: 'Macchina', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Mantieni la schiena appoggiata e spingi verso l’alto senza inarcare eccessivamente la zona lombare.' },
  { id: 'dumbbell-press', name: 'Spinte con manubri', muscleGroup: 'Spalle', secondaryMuscles: ['Tricipiti'], equipment: 'Manubri', kind: 'compound', defaultSets: 3, defaultReps: 10, recoverySeconds: 90, instructions: 'Parti con i manubri all’altezza delle spalle e spingi in alto mantenendo il busto stabile.' },
  { id: 'lateral-raise', name: 'Alzate laterali', muscleGroup: 'Spalle', secondaryMuscles: [], equipment: 'Manubri', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Solleva le braccia lateralmente con gomiti morbidi, senza slanci e senza superare troppo l’altezza delle spalle.' },
  { id: 'reverse-fly', name: 'Alzate posteriori', muscleGroup: 'Spalle', secondaryMuscles: ['Schiena'], equipment: 'Macchina o cavi', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Apri le braccia mantenendo le spalle basse e concentrati sul movimento controllato delle scapole.' },

  { id: 'dumbbell-curl', name: 'Curl con manubri', muscleGroup: 'Bicipiti', secondaryMuscles: [], equipment: 'Manubri', kind: 'accessory', defaultSets: 3, defaultReps: 10, recoverySeconds: 75, instructions: 'Mantieni i gomiti vicini al busto e solleva i manubri senza oscillare con la schiena.' },
  { id: 'cable-curl', name: 'Curl al cavo basso', muscleGroup: 'Bicipiti', secondaryMuscles: [], equipment: 'Cavo', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Tieni i gomiti fermi e completa la flessione controllando anche la fase di ritorno.' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Bicipiti', secondaryMuscles: [], equipment: 'Manubri', kind: 'accessory', defaultSets: 3, defaultReps: 10, recoverySeconds: 75, instructions: 'Mantieni i palmi rivolti uno verso l’altro e non spostare i gomiti durante la salita.' },

  { id: 'rope-pushdown', name: 'Pushdown con corda', muscleGroup: 'Tricipiti', secondaryMuscles: [], equipment: 'Cavo', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Mantieni i gomiti fermi ai lati del busto e separa leggermente la corda nella parte finale.' },
  { id: 'overhead-extension', name: 'Estensioni sopra la testa', muscleGroup: 'Tricipiti', secondaryMuscles: [], equipment: 'Cavo o manubrio', kind: 'accessory', defaultSets: 3, defaultReps: 10, recoverySeconds: 75, instructions: 'Mantieni i gomiti rivolti in avanti e muovi solo gli avambracci, senza inarcare la schiena.' },
  { id: 'assisted-dip', name: 'Dip assistite', muscleGroup: 'Tricipiti', secondaryMuscles: ['Petto'], equipment: 'Macchina', kind: 'compound', defaultSets: 3, defaultReps: 8, recoverySeconds: 90, instructions: 'Scendi in controllo mantenendo le spalle stabili e usa un’assistenza che permetta un movimento pulito.' },

  { id: 'plank', name: 'Plank', muscleGroup: 'Addome', secondaryMuscles: [], equipment: 'Corpo libero', kind: 'accessory', defaultSets: 3, defaultReps: 30, recoverySeconds: 45, instructions: 'Mantieni testa, tronco e bacino allineati. Il valore delle ripetizioni può essere usato come secondi.' },
  { id: 'dead-bug', name: 'Dead Bug', muscleGroup: 'Addome', secondaryMuscles: [], equipment: 'Corpo libero', kind: 'accessory', defaultSets: 3, defaultReps: 10, recoverySeconds: 45, instructions: 'Mantieni la zona lombare appoggiata e alterna braccio e gamba opposti senza perdere il controllo.' },
  { id: 'cable-crunch', name: 'Crunch al cavo', muscleGroup: 'Addome', secondaryMuscles: [], equipment: 'Cavo', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Fletti il tronco usando l’addome, senza trasformare il movimento in una trazione con le braccia.' },
  { id: 'reverse-crunch', name: 'Reverse Crunch', muscleGroup: 'Addome', secondaryMuscles: [], equipment: 'Corpo libero', kind: 'accessory', defaultSets: 3, defaultReps: 12, recoverySeconds: 45, instructions: 'Porta il bacino verso il petto in modo controllato senza slanciare le gambe.' },

  { id: 'hip-thrust-machine', name: 'Hip Thrust', muscleGroup: 'Glutei', secondaryMuscles: ['Gambe'], equipment: 'Macchina o bilanciere', kind: 'compound', defaultSets: 4, defaultReps: 10, recoverySeconds: 90, instructions: 'Spingi attraverso i talloni, completa l’estensione dell’anca e non inarcare la zona lombare.' },
  { id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'Glutei', secondaryMuscles: ['Gambe'], equipment: 'Corpo libero', kind: 'accessory', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Solleva il bacino contraendo i glutei e mantieni costole e bacino in posizione controllata.' },
  { id: 'cable-kickback', name: 'Slanci posteriori al cavo', muscleGroup: 'Glutei', secondaryMuscles: [], equipment: 'Cavo', kind: 'isolation', defaultSets: 3, defaultReps: 12, recoverySeconds: 60, instructions: 'Mantieni il bacino fermo e porta la gamba indietro senza ruotare il busto.' },
  { id: 'abductor-machine', name: 'Abductor Machine', muscleGroup: 'Glutei', secondaryMuscles: [], equipment: 'Macchina', kind: 'isolation', defaultSets: 3, defaultReps: 15, recoverySeconds: 60, instructions: 'Apri le ginocchia in controllo mantenendo il busto stabile e ritorna senza lasciare cadere il peso.' },

  { id: 'standing-calf-raise', name: 'Calf Raise in piedi', muscleGroup: 'Polpacci', secondaryMuscles: [], equipment: 'Macchina', kind: 'isolation', defaultSets: 4, defaultReps: 12, recoverySeconds: 60, instructions: 'Scendi in allungamento e sali sulle punte senza rimbalzare.' },
  { id: 'seated-calf-raise', name: 'Calf Raise seduto', muscleGroup: 'Polpacci', secondaryMuscles: [], equipment: 'Macchina', kind: 'isolation', defaultSets: 4, defaultReps: 15, recoverySeconds: 60, instructions: 'Mantieni l’appoggio stabile, esegui tutta l’escursione e controlla la discesa.' },
  { id: 'leg-press-calf', name: 'Calf Raise alla Leg Press', muscleGroup: 'Polpacci', secondaryMuscles: [], equipment: 'Leg Press', kind: 'isolation', defaultSets: 3, defaultReps: 15, recoverySeconds: 60, instructions: 'Muovi solo le caviglie, mantenendo le ginocchia leggermente flesse e il piede ben appoggiato.' },
]
