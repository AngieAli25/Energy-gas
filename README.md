# Energy 4Work — Landing di conversione

Landing page per l'acquisizione di nuovi collaboratori (Digital Brand Ambassador)
del progetto Energy 4Work di EnergyGas Italia.

**Obiettivo di conversione:** prenotazione del colloquio conoscitivo di gruppo
(primo step del funnel già in uso: Colloquio → Webinar → Incarico → Formazione → Attività).

## File

```
index.html              La landing completa (HTML + CSS + JS, nessuna dipendenza di build)
grazie.html             Thank you page: dove atterra chi ha inviato il form
google-apps-script.js   Script da incollare in Apps Script per ricevere i lead nel foglio
assets/logo.png         Logo EnergyGas estratto dai deck (già inline nell'HTML in base64)
```

Entrambe le pagine sono **autonome**: si aprono da sole e si caricano su qualsiasi
hosting (Netlify, Vercel, Altervista, un FTP tradizionale) senza passaggi di
compilazione. **Vanno caricate nella stessa cartella**, perché il redirect dopo
l'invio punta a `grazie.html` con percorso relativo.

## Da configurare prima del lancio

### 1. Foglio Google — FATTO E VERIFICATO

Il form scrive sul foglio Google del cliente. Endpoint configurato in `index.html`:

```
https://script.google.com/macros/s/AKfycbzJo1b6PNKpPRnmFaLAcufGFl-lA_gz4Py3-jHPQimrFMSN138k7BTrTNfsoUbcm3f2/exec
```

Il foglio riceve ventuno colonne: data e ora, nome, cognome, telefono, email,
città, quando richiamare, consenso privacy, pagina di origine, note, canale,
mezzo, campagna, contenuto/creativo, keyword/target, i quattro click id (Meta,
Google, TikTok, Microsoft), referrer e pagina di ingresso.

La colonna **Note** è libera: la landing la lascia sempre vuota, la compila a
mano chi gestisce i lead. Ogni invio aggiunge una riga in fondo, quindi le note
scritte a mano non vengono mai sovrascritte.

La colonna **Quando richiamare** resta nel foglio ma da settembre 2026 arriva
sempre vuota: il campo corrispondente è stato tolto dal form. È stata lasciata
al suo posto per non spostare tutte le colonne successive e per non perdere il
dato dei lead già raccolti.

Se in futuro si aggiungono colonne allo script, va eseguita a mano la funzione
`aggiornaIntestazioni()`, che riscrive solo la riga 1 lasciando intatti i lead
già presenti — a differenza di `setup()`, che svuota il foglio.

**Verifiche effettuate:**

- GET sull'endpoint: risponde `{"ok":true,"msg":"Endpoint attivo..."}` → app web
  pubblicata e accessibile in anonimo (impostazione "Chiunque" corretta)
- POST con payload reale: risponde `{"ok":true}`, che lo script restituisce solo
  dopo `appendRow` riuscito
- Invio dal browser compilando il form: conferma "Richiesta ricevuta" mostrata,
  nessun errore di rete
- Invio da un URL con parametri di campagna: le colonne di provenienza si
  popolano correttamente (canale, mezzo, campagna, contenuto, keyword, click id)

Nota tecnica su Apps Script: il POST riceve sempre un **302** verso
`script.googleusercontent.com`, che accetta solo GET. È il comportamento normale
— lo script viene eseguito sul primo hop e il redirect serve solo a consegnare la
risposta. Il primo hop invia `access-control-allow-origin: *`, quindi il `fetch`
dalla landing funziona. Con `curl` questo produce un fuorviante HTTP 405: per
leggere la risposta va seguita la `Location` con una GET separata.

Se in futuro modifichi lo script in Apps Script, ricordati di fare
**Distribuisci ▸ Gestisci distribuzioni ▸ Modifica ▸ Nuova versione**,
altrimenti resta attiva la versione precedente.

Nello script c'è anche una notifica email opzionale a ogni nuovo lead: inserisci
l'indirizzo in `EMAIL_NOTIFICA` e togli il commento a `avvisa(d)` dentro `doPost`.

### 2. Privacy e cookie policy — FATTO

Collegate le policy ufficiali del cliente, prese da energygasitalia.it:

- Informativa privacy (nel consenso del form e nel footer):
  `https://www.iubenda.com/privacy-policy/30607502`
- Cookie policy: `https://www.iubenda.com/privacy-policy/30607502/cookie-policy`
- Accessibilità: `https://www.energygasitalia.it/accessibilita/`

### 3. Dati societari — FATTO

Footer completato con i dati reali: Energygas Italia Srl Unipersonale, sede
legale Milano, sede operativa Prato, P.IVA e C.F. 02412510972, Tel. 0574 200907.
Il credito "Marketing e Sviluppo by Turbo Business" è stato rimosso su richiesta.

Come richiesto, **numero verde e rimando al sito principale sono stati
rimossi**: la landing non disperde il traffico verso energygasitalia.it.

### 4. Cookie banner — FATTO

Installato il banner Iubenda con la **configurazione reale del cliente**
(`siteId 2395353`, `cookiePolicyId 30607502`), letta dal sito ufficiale: stesso
account, stessa policy, stessi colori e testi. Il pulsante preferenze è in basso
a destra.

Due note tecniche:

- L'account Iubenda del cliente include un **widget di accessibilità a
  pagamento** (acsbapp.com) che viene iniettato dalla configurazione remota.
  Sul sito istituzionale ha senso; su questa landing è peso inutile, quindi è
  nascosto via CSS (non esiste un flag lato pagina per disattivarlo).
- L'**autoblocking** di Iubenda è presente ma commentato: ora non serve, perché
  la pagina non carica script di tracciamento. Va riattivato insieme ai pixel.
- La configurazione remota dell'account inietta un **secondo pulsante preferenze**
  in basso a sinistra, che si sommava al nostro in basso a destra. Il duplicato è
  neutralizzato via CSS (con `visibility`, non `display`: Iubenda usa uno stile
  inline che vincerebbe sul foglio di stile).

### 5. Attivare il tracciamento (solo quando partono le campagne)

Gli eventi di conversione sono già scritti e si attivano da soli se i pixel
sono presenti: `generate_lead` per Google Analytics e `Lead` per Meta.

Per attivarli servono due cose:
1. inserire gli script di GA4 / Meta Pixel nel `<head>`
2. **togliere il commento all'autoblocking Iubenda** (riga indicata in fondo a
   `index.html`), altrimenti i cookie di tracciamento partirebbero prima del
   consenso — che è la violazione GDPR più contestata.

### 6. Tracciamento della provenienza (UTM) — FATTO

La landing registra da dove arriva ogni lead. Al primo caricamento legge
dall'URL `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
e i click id `fbclid` (Meta), `gclid` (Google), `ttclid` (TikTok), `msclkid`,
insieme a referrer e pagina di ingresso.

I valori vengono conservati in `sessionStorage`: i parametri compaiono nell'URL
solo al primo click sull'annuncio, ma restano associati al lead anche se
l'utente ricarica la pagina o naviga nel sito prima di compilare il form. Chi
arriva in modo diretto o organico avrà quelle colonne vuote, con referrer e
pagina di ingresso comunque compilate.

**Come costruire i link degli annunci.** Nell'inserzione Meta va usato un URL
di questa forma:

```
https://energygas.vercel.app/?utm_source=facebook&utm_medium=paid_social&utm_campaign=e4w_settembre&utm_content=video_bolletta
```

`fbclid` viene aggiunto da Meta in automatico e non va scritto a mano. Conviene
tenere una convenzione fissa sui nomi (tutto minuscolo, underscore al posto
degli spazi), altrimenti nel foglio la stessa campagna compare scritta in tre
modi diversi e i conteggi non tornano.

## Thank you page

Il form raccoglie: nome, cognome, telefono, email, città e consenso privacy.
Il campo "Quando richiamarti" è stato rimosso: la preferenza di fascia oraria
verrà sostituita dalla prenotazione diretta dello slot (vedi sotto).

Dopo l'invio del form l'utente viene portato su `grazie.html`. Un URL dedicato,
invece di una conferma inline, serve a due cose: è **tracciabile come
conversione** (GA4 e Meta contano la visita alla pagina) e permette di dire
cosa succede dopo, riducendo le mancate risposte al telefono.

Contenuto: conferma esplicita che i dati sono stati ricevuti e che il richiamo
arriva entro 24 ore lavorative, i quattro passi successivi (chiamata → colloquio
di gruppo → webinar → decisione), e un promemoria sul fatto che la chiamata
arriva da un numero fisso di Prato, con invito a controllare lo spam.

La pagina è `noindex,nofollow`: è una pagina di servizio e non deve comparire
nei risultati di ricerca.

**Da fare: link Calendly.** L'idea è mettere qui il bottone per prenotare da sé
lo slot del colloquio, accanto (non al posto) della promessa di richiamo entro
24 ore. L'ordine conta: prima il form, così il contatto è già salvato sul
foglio anche per chi non prenota; poi la prenotazione, offerta nel momento di
massima disponibilità. Manca solo il link dell'account Calendly.

**Ordine delle operazioni nel form.** Il redirect parte solo *dopo* che la
scrittura sul foglio è confermata (`await` sulla fetch): se partisse prima, il
cambio di pagina interromperebbe la richiesta e il lead andrebbe perso. Sono
previsti due casi limite:

- se la navigazione non parte (blocco del browser, file mancante), dopo 1,2s
  compare comunque la conferma inline come rete di sicurezza;
- se l'invio fallisce (rete assente, endpoint non raggiungibile), il pulsante
  torna attivo e appare un messaggio che spiega il problema e offre il numero
  di telefono come alternativa — così il contatto non si perde.

## Scelte di contenuto

Fra l'hero e "Il punto di partenza" c'è la fascia **"Perché è diverso"**: tre
card che rispondono alle obiezioni tipiche di chi associa questo tipo di
progetto al network marketing — niente prodotti da piazzare, nessun monte ore,
nessuno da convincere. Sta lì perché è l'obiezione che si forma per prima,
prima ancora di leggere i numeri.

I claim economici seguono il registro che EnergyGas usa già sui canali pubblici
(il piano editoriale social): "puoi ottenere", "fino a", simulazioni etichettate
come tali e disclaimer espliciti.

Sono stati **deliberatamente esclusi** dalla pagina pubblica:

- il range "da 600€ a 5.000€ al mese" (deck colloquio, slide 20)
- le formule "il risultato è garantito" e "non è un'ipotesi ma è una promessa"

Motivo: su una pagina pubblica indicizzata, claim di guadagno garantito legati a un
requisito di reclutamento sono il profilo che l'AGCM contesta più spesso
(D.Lgs. 206/2005 sulle pratiche commerciali scorrette, L. 173/2005 sulle vendite piramidali).
Restano invece in piena evidenza le leve **verificabili e immediate**, che sono anche
quelle che convertono meglio a freddo: tariffa riservata, cashback 30–40€/mese,
Gift Card omaggio, bonus 25€+25€, zero costi di ingresso.

Nota: il riquadro del cashback ora dice "30—40€ al mese di risparmio, pari a
circa 5 bollette all'anno". Il riferimento alla spesa familiare media ISTAT di
1.200€/mese, che era la base di quel calcolo, è stato rimosso su richiesta: la
cifra resta affermata ma non è più giustificata in pagina.

Il simulatore di rendita usa il modello del deck webinar (4 livelli, 2 utenze per DBA,
quote 1,00 / 0,50 / 1,00 / 0,75 €). Il cursore va da 2 a 10 collaboratori diretti e
la **rendita si calcola solo da 4 in poi**: sotto quella soglia il riquadro resta
spento, con il valore a trattino e un badge "da 4 collaboratori"; da 4 in su si
accende in teal, con bordo e ombra colorati. A 4 collaboratori restituisce
536€/mese, lo stesso numero delle slide.

⚠️ **Da tenere d'occhio.** La formula è esponenziale su 4 livelli: a 6
collaboratori la proiezione è 2.424€/mese, a 10 arriva a 17.120€/mese. Insieme
alla rimozione della nota che spiegava le ipotesi del calcolo, l'unico
disclaimer rimasto è "È una proiezione, non una previsione" nell'introduzione
della sezione. Su una pagina pubblica indicizzata è il punto più esposto a
contestazione: se le cifre alte non servono davvero in campagna, conviene
riabbassare il massimo del cursore o rimettere una riga che espliciti le ipotesi.

## Note tecniche

- Font Poppins da Google Fonts; palette estratta dai deck originali
- Nessuna libreria esterna, nessun build step
- Responsive con hero mobile riprogettato (testo prima del visual)
- Reveal on scroll via IntersectionObserver, con rispetto di `prefers-reduced-motion`
- Validazione form nativa; accessibilità verificata (un solo H1, gerarchia corretta,
  tutti i campi etichettati, `lang="it"`, alt su tutte le immagini)
- CTA sticky su mobile oltre i 700px di scroll, che si ritira sul form
- Parametri di campagna conservati in `sessionStorage` (chiave `e4w_track`),
  letti una sola volta al caricamento e allegati al payload all'invio del form

## Verifica mobile (375px)

Controllata sezione per sezione a 375px. Difetti trovati e corretti:

| Problema | Correzione |
|---|---|
| La nav fissa copriva il titolo di ogni sezione raggiunta da un CTA | `scroll-padding-top:88px` — ora 65px di margine su tutte le ancore |
| Checkbox privacy 19px: difficile da toccare, ed è obbligatorio per convertire | area di tocco 44×44 attorno al quadratino |
| Slider del simulatore alto 6px, non afferrabile col dito | area sensibile 44px, traccia disegnata a parte |
| La barra sticky copriva il tasto "Invia" mentre si compilava il form | si ritira quando il form entra a schermo |
| Padding del body 74px contro barra sticky da 84px | allineati a 92px |
| Luce/gas e nome/cognome impilati invece che affiancati | breakpoint corretto da 420 a 340px |
| Tastiera sbagliata su telefono ed email | aggiunto `inputmode` tel / email |
| Pagina di 18 schermate, form alla quattordicesima | ritmo verticale compatto: 15,7 schermate |
| Un solo punto di conversione, a fondo pagina | CTA intermedia dopo i vantaggi (schermata 5,8) |
| "È immediato." spezzato male tra le righe | interruzione di riga controllata |
| Le 5 bollette in evidenza illeggibili sul fondo navy | contrasto rinforzato |

Stato finale: nessun overflow orizzontale, zero errori in console, form validato e
funzionante, nessuna regressione su desktop.

I tre punti di conversione su mobile sono ora: hero, schermata 5,8 (dopo i vantaggi
immediati) e schermata 12,9 (form), più la barra sticky sempre raggiungibile.

### Card dell'hero: sovrapposizione (corretta)

Le due card dell'hero ("La tua bolletta" e "Cashback in bolletta") erano posizionate
in assoluto, come sul desktop dove si sfalsano di proposito. Sotto i 980px, però,
il visual perde la colonna dedicata e le card **collidevano**:

- a 375px: sovrapposizione di 154×73px, la prima card illeggibile
- a 600px e 768px: 177×181px, il caso peggiore (tablet e telefoni in orizzontale)

Corretto passando le card a **layout in flusso** (griglia affiancata) per tutta la
fascia sotto i 980px, con le forme decorative dietro come sfondo. Sotto i 400px
tornano in colonna. Essendo in griglia, non possono più sovrapporsi a nessuna
larghezza. Sopra i 980px il desktop mantiene il posizionamento assoluto originale.

Verificato con una scansione automatica delle collisioni su **124 elementi testuali**
a 375, 600 e 768px: zero sovrapposizioni. Larghezze provate: 320, 360, 375, 414,
500, 600, 768, 979, 1100px — nessun overflow orizzontale, card mai sovrapposte.
