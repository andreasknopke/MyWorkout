# MyWorkout Trainer (Webapp)

Adaptive Workout-App für dich und deine Familie – mit Fokus auf wissenschaftlich sinnvolle Trainingssteuerung:

- RPE-basierter Feedback-Loop
- Progressive Lastanpassung (hoch/runter je nach Feedback)
- Deload-Erkennung bei anhaltend hoher Ermüdung
- 4-12 Wochen Periodisierung (Akkumulation → Intensifikation → Deload)
- Familien-Profile (mehrere Nutzer ohne Login)
- Progressionspfade je Übung (leicht → mittel → schwer, feedbackgesteuert)
- Equipment-Filter (nur Übungen, die mit vorhandenem Equipment machbar sind)
- Bewegungs-/Verletzungsfilter (z. B. Schulter, Knie, Rücken, low impact)
- Kombination aus klassischen und unorthodoxen Übungen
- Video-/Skizzenmodul (Lightweight, pro Übung hinterlegt)

## Tech Stack

- Next.js (App Router) + TypeScript
- Prisma ORM
- PostgreSQL (Railway-kompatibel)
- TailwindCSS

## Schnellstart lokal

1. Abhängigkeiten installieren
2. `.env` aus `.env.example` erstellen
3. Prisma Migration + Generate
4. Seed laden
5. Dev-Server starten

Empfohlene Reihenfolge:

- `npm install`
- `npx prisma migrate dev --name init`
- `npm run db:seed`
- `npm run dev`

## Railway Deployment

1. Repository zu GitHub pushen
2. In Railway ein neues Projekt aus dem GitHub Repo erstellen
3. PostgreSQL Service hinzufügen
4. `DATABASE_URL` automatisch verbinden lassen
5. Build Command: `npm run build`
6. Start Command: `npm run start`

## Domänenmodell (MVP)

- `User`, `UserEquipment`
- `Exercise`, `ExerciseEquipment`
- `WorkoutSession`, `WorkoutItem`, `WorkoutFeedback`

## API Überblick

- `GET /api/users` Profile abrufen
- `POST /api/users` Profil anlegen
- `PATCH /api/users/:id` Ziel/Equipment/Trainingsparameter aktualisieren
- `POST /api/workouts/generate` Workout für ein Profil erzeugen
- `POST /api/workouts/feedback` Session-Feedback speichern

## Nächste sinnvolle Ausbaustufen

1. Echte Progressionspfade pro Übung (leicht → mittel → schwer)
2. Bewegungs-Screening / Verletzungsfilter
3. Autoreguliertes Volumen pro Muskelgruppe je Woche
4. Recovery-Metriken (Schlaf, Stress, HRV optional)

## Wichtiger Hinweis

Die App ist ein Trainingsplanungs-Tool und kein medizinisches Produkt.
Bei Schmerzen, Erkrankungen oder Unsicherheit bitte ärztlich/sportmedizinisch abklären.
