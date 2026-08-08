# Hugo's Paella — live zetten op hugopaella.nl

Deze map is de complete website (`index.html`, `css/`, `assets/`). Het `CNAME`-bestand
staat er al in met `hugopaella.nl` — dat heeft GitHub Pages nodig om het custom domain
te herkennen.

## Stap 1 — GitHub-account aanmaken

1. Ga naar https://github.com/join en maak een gratis account.

## Stap 2 — Repository aanmaken en de site uploaden

**Makkelijkste manier: GitHub Desktop (geen command line nodig)**

1. Download en installeer [GitHub Desktop](https://desktop.github.com/).
2. Log in met je GitHub-account.
3. File → New repository. Naam: bijv. `hugopaella-website`. Local path: kies deze map
   (`website-preview`) of maak 'm leeg aan en kopieer de bestanden erin.
4. Klik "Publish repository" (zet 'm op **Public** — GitHub Pages op een gratis account
   werkt alleen met publieke repos).

**Alternatief: via de browser**

1. Ga naar https://github.com/new, maak een repository (Public), zonder README.
2. Sleep alle bestanden en mappen uit deze map (`index.html`, `CNAME`, `css/`, `assets/`)
   in het upload-scherm van GitHub ("uploading an existing file" link op de lege repo-pagina).
3. Commit.

## Stap 3 — GitHub Pages inschakelen

1. In de repository: Settings → Pages.
2. Bij "Build and deployment" → Source: **Deploy from a branch**.
3. Branch: `main`, map: `/ (root)`. Save.
4. Bij "Custom domain" vul je `hugopaella.nl` in en sla je op (staat al klaar via het
   CNAME-bestand, maar bevestig het hier ook).

## Stap 4 — DNS instellen bij je .nl-registrar

Log in bij de partij waar je hugopaella.nl hebt geregistreerd en zet deze records:

**Voor het kale domein (hugopaella.nl):**
Vier A-records op `@` (of leeg laten, afhankelijk van je provider), allemaal naar:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Voor www.hugopaella.nl (aanbevolen, als vangnet):**
Eén CNAME-record op `www` naar:
```
<jouw-github-gebruikersnaam>.github.io
```

DNS-wijzigingen kunnen tot 24 uur duren. Zodra ze doorgevoerd zijn, verschijnt in
GitHub Settings → Pages een groen vinkje en kun je "Enforce HTTPS" aanvinken.

## Stap 5 — hugopaella.es laten doorverwijzen

Voor het .es-domein hoef je niets te hosten. Log in bij de registrar waar je
hugopaella.es hebt geregistreerd en zoek naar **"domain forwarding"** / **"URL
forwarding"** / **"doorverwijzen"** in het beheerpaneel. Stel in:

```
https://hugopaella.es  →  https://hugopaella.nl   (301 / permanent redirect)
```

De meeste registrars bieden dit gratis aan. Zoek je provider + "domain forwarding"
op als je het menu niet meteen vindt.

## Later: updates doorvoeren

Wijzig bestanden lokaal in deze map en:
- **GitHub Desktop**: wijzigingen verschijnen automatisch → schrijf een commit-bericht →
  "Commit to main" → "Push origin". Live binnen een paar minuten.
- **Browser**: upload de gewijzigde bestanden opnieuw via de repo-pagina.
