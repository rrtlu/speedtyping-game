# Terminal Vault 🔐

Brauseris töötav terminali-stiilis mõistatusmäng. Mängija liigub käskudega läbi väljamõeldud failisüsteemi, otsib üles **võtme** ja **koodi** ning avab nendega vaulti. Läbimängu aeg ja käskude arv salvestatakse **Supabase'i** edetabelisse.

## Käsud

| Käsk | Mida teeb |
|---|---|
| `ls` | näitab praeguse kausta sisu |
| `cd <kaust>` | liigub kausta |
| `cd ..` | liigub ühe taseme võrra üles |
| `cat <fail>` | loeb faili sisu |
| `unlock` | avab vaulti (vaja on võtit ja koodi) |
| `scores` | näitab edetabeli top 10 tulemust |
| `help` | näitab käskude nimekirja |
| `clear` | puhastab ekraani |

Mugavused: **Tab** täiendab käsu või failinime, **↑ / ↓** sirvivad käskude ajalugu.

## Tehnoloogiad

- HTML, CSS, JavaScript (ES-moodulid)
- [Vite](https://vitejs.dev) arenduse ja build'i jaoks
- [Supabase](https://supabase.com) (Postgres + Data API) edetabeli jaoks (`@supabase/supabase-js`)

## Failid

| Fail | Sisu |
|---|---|
| `index.html` | lehe struktuur, laadib `game.js` moodulina |
| `style.css` | terminali välimus |
| `game.js` | mängu loogika, käsud ja edetabeli päringud |
| `supabase.js` | Supabase'i kliendi seadistus (loeb `VITE_` muutujaid) |
| `scores.sql` | edetabeli tabeli ja turvareeglite loomise SQL |
| `.env.example` | keskkonnamuutujate näidis (kopeeri `.env.local`-iks) |
| `package.json` | sõltuvused ja npm-skriptid (dev/build/preview) |

## Käivitamine lokaalselt

Vajalik on **Node.js LTS** (koos npm-iga).

1. Klooni repo ja paigalda sõltuvused:
   ```bash
   git clone https://github.com/ukusk/speedtyping-game.git
   cd speedtyping-game
   npm install
   ```
2. Kopeeri `.env.example` → `.env.local` ja täida oma Supabase'i projekti **Project URL** ja **Publishable key**:
   ```bash
   cp .env.example .env.local
   ```
3. Käivita arendusserver:
   ```bash
   npm run dev
   ```

> `.env.local` on `.gitignore`-is ja seda ei commitita. Mäng töötab ka ilma Supabase'ita — ainult edetabel on siis offline.

## Build ja eelvaade

```bash
npm run build     # toodab dist/ kausta
npm run preview   # serveerib build'itud versiooni lokaalselt
```

Hostingusse (nt Vercel, Netlify, Cloudflare Pages) juurutades tuleb seal seadistada keskkonnamuutujad **`VITE_SUPABASE_URL`** ja **`VITE_SUPABASE_PUBLISHABLE_KEY`** — Vite loeb neid build'i ajal.

## Supabase'i seadistus

1. Loo projekt aadressil [supabase.com/dashboard](https://supabase.com/dashboard).
2. Ava **SQL Editor → New query**, kleebi faili `scores.sql` sisu ja vajuta **Run**.
3. URL ja võtme leiad nupu **Connect** alt või menüüst **Project Settings → Data API / API Keys**.

> Frontendi tohib panna ainult **publishable** / **anon** võtme. Edetabelit kaitseb Row Level Security: kõik saavad tulemusi lugeda ja lisada, aga mitte muuta ega kustutada. **Secret** ja **service_role** võtmed ei tohi kunagi repo sattuda.

## Töövoog

`main` branch on kaitstud ja sinna otse pushida ei saa. Kõik muudatused käivad feature branch'ide ja Pull Requestide kaudu:

```bash
git checkout main
git pull
git checkout -b feat/uus-asi
# ... muudatused ...
git add .
git commit -m "Kirjeldus"
git push -u origin feat/uus-asi
```

Seejärel ava GitHubis Pull Request `feat/uus-asi` → `main`.

## Autorid

- [@ukusk](https://github.com/ukusk)
- [@rrtlu](https://github.com/rrtlu)
