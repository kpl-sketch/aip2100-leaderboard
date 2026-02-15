# 🦉 AIP2100 LinkedIn Leaderboard

Duolingo-inspirert gamification-dashboard for LinkedIn-aktivitet i AIP2100.
Data deles mellom alle besøkende via Vercel KV.

## Deploy til Vercel (steg for steg)

### 1. Push til GitHub

```bash
cd aip2100-leaderboard
npm install
git init
git add .
git commit -m "Initial commit"
```

Opprett repo på github.com, og push:
```bash
git remote add origin https://github.com/DITT-BRUKERNAVN/aip2100-leaderboard.git
git branch -M main
git push -u origin main
```

### 2. Deploy på Vercel

1. Gå til [vercel.com/new](https://vercel.com/new)
2. Importer GitHub-repoet
3. Framework: **Vite** (auto-detected)
4. Klikk **Deploy**

### 3. Sett opp Vercel KV (database)

1. I Vercel-dashboardet, gå til prosjektet ditt
2. Klikk **Storage** → **Create Database** → **KV**
3. Gi den et navn (f.eks. `aip2100-data`) og klikk **Create**
4. KV kobles automatisk til prosjektet med environment variables

### 4. Sett admin-nøkkel

1. I Vercel, gå til **Settings** → **Environment Variables**
2. Legg til:
   - Name: `ADMIN_KEY`
   - Value: (velg et passord, f.eks. `mittHemmeligePassord2026`)
3. Klikk **Save**
4. **Redeploy** prosjektet (Settings → Deployments → klikk "..." → Redeploy)

### 5. Ferdig! 🎉

- Nettsiden er live på `ditt-prosjekt.vercel.app`
- Studentene ser leaderboarden uten innlogging
- Du bruker admin-nøkkelen for å legge inn/slette innlegg via ⚙️-panelet

## Bruk

### Legge inn innlegg manuelt
1. Klikk ⚙️ på nettsiden
2. Skriv inn admin-nøkkelen
3. Fyll ut skjemaet og klikk "Legg til"

### Bulk-import via Claude Chrome Extension
1. Gå til LinkedIn og søk #AIP2100
2. Be Claude formatere innleggene som JSON
3. Lim inn i bulk-import-feltet på admin-panelet

### JSON-format
```json
[
  {
    "author": "Navn Navnesen",
    "date": "2026-02-15",
    "likes": 24,
    "comments": 5,
    "externalComments": 2,
    "reposts": 3,
    "description": "Om AI i helsesektoren",
    "linkedinUrl": "https://linkedin.com/posts/..."
  }
]
```

## Arkitektur

- **Frontend**: React + Vite (statisk, hostet på Vercel CDN)
- **API**: Vercel Serverless Functions (`/api/posts.js`)
- **Database**: Vercel KV (Redis) – gratis tier: 30K requests/måned
- **Auth**: Enkel admin-nøkkel for skriveoperasjoner, lesing er åpen
