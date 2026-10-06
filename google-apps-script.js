/**
 * Energy 4Work — ricezione lead dalla landing e scrittura su Google Sheets.
 *
 * COME SI INSTALLA (5 minuti, una volta sola)
 *
 * 1. Crea un foglio nuovo su https://sheets.new e chiamalo "Lead Energy 4Work".
 * 2. Nel foglio: Estensioni ▸ Apps Script.
 * 3. Cancella il contenuto di Code.gs e incolla TUTTO questo file. Salva.
 * 4. In alto scegli la funzione "setup" e premi Esegui:
 *    autorizza quando lo chiede (è il tuo stesso account Google).
 *    Questo crea la riga di intestazione.
 * 5. Poi: Distribuisci ▸ Nuova distribuzione ▸ tipo "App web".
 *      - Descrizione:      lead landing
 *      - Esegui come:      Me
 *      - Chi ha accesso:   Chiunque            <-- IMPORTANTE
 *    Premi Distribuisci e copia l'URL che finisce con /exec
 * 6. Incolla quell'URL in index.html, nella riga:
 *      const SHEET_ENDPOINT = '';
 *    fra gli apici. Salva e ricarica la landing: i lead arrivano nel foglio.
 *
 * NOTA su "Chi ha accesso: Chiunque": è necessario perché la landing è
 * pubblica e chi compila non ha un account Google. Lo script accetta solo
 * scritture sul foglio, non espone né restituisce dati.
 *
 * Se in futuro modifichi questo script, ricordati di fare
 * Distribuisci ▸ Gestisci distribuzioni ▸ Modifica ▸ Nuova versione,
 * altrimenti resta attiva la versione precedente.
 *
 * ------------------------------------------------------------------
 * AGGIORNAMENTO DEL 09/09/2026: colonne di provenienza campagna
 *
 * Il foglio ora registra anche da dove arriva il lead (UTM e click id
 * di Meta, Google, TikTok, Microsoft). Per attivarle su un foglio che
 * gira già:
 *   1. incolla questa versione aggiornata in Code.gs e salva;
 *   2. Distribuisci ▸ Gestisci distribuzioni ▸ Modifica ▸ Nuova versione;
 *   3. le nuove colonne compaiono da sole dalla prima riga scritta dopo
 *      l'aggiornamento. Per avere anche le INTESTAZIONI aggiornate,
 *      esegui a mano "aggiornaIntestazioni" (non cancella i lead già
 *      presenti, a differenza di "setup" che svuota il foglio).
 *
 * COME COSTRUIRE I LINK DELLE CAMPAGNE
 * Nell'annuncio Meta usa un URL così:
 *   https://tuo-dominio.it/?utm_source=facebook&utm_medium=paid_social
 *     &utm_campaign=e4w_settembre&utm_content=video_bolletta
 * fbclid viene aggiunto da Meta in automatico, non va scritto a mano.
 * Chi arriva senza parametri (diretto, organico) avrà quelle colonne
 * vuote ma con Referrer e Pagina di ingresso compilate.
 * ------------------------------------------------------------------
 */

/** Colonne del foglio, nell'ordine in cui vengono scritte. */
var COLONNE = [
  'Data e ora',
  'Nome',
  'Cognome',
  'Telefono',
  'Email',
  'Città',
  'Quando richiamare',
  'Consenso privacy',
  'Pagina di origine',
  // colonna libera: la landing la lascia vuota, la compila a mano il cliente
  'Note',
  // --- provenienza campagna: compilate solo se l'utente arriva da un annuncio ---
  'Canale',            // utm_source: facebook, instagram, google, newsletter...
  'Mezzo',             // utm_medium: cpc, paid_social, email, organic...
  'Campagna',          // utm_campaign
  'Contenuto/Creativo',// utm_content: quale creatività o adset
  'Keyword/Target',    // utm_term
  'Click ID Meta',     // fbclid
  'Click ID Google',   // gclid
  'Click ID TikTok',   // ttclid
  'Click ID Microsoft',// msclkid
  'Referrer',
  'Pagina di ingresso'
];

/** Esegui una volta a mano: prepara il foglio con le intestazioni. */
function setup() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sh.clear();
  sh.appendRow(COLONNE);
  var head = sh.getRange(1, 1, 1, COLONNE.length);
  head.setFontWeight('bold');
  head.setBackground('#1A3A5C');
  head.setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 150); // data
  sh.setColumnWidth(5, 220); // email
  sh.setColumnWidth(9, 260);  // pagina
  sh.setColumnWidth(10, 320); // note (compilata a mano)
  sh.setColumnWidth(13, 200); // campagna
  sh.setColumnWidth(14, 200); // contenuto/creativo
  sh.setColumnWidth(20, 220); // referrer
  sh.setColumnWidth(21, 260); // pagina di ingresso
  return 'Foglio pronto: ' + COLONNE.length + ' colonne.';
}

/**
 * Riscrive solo la riga 1 con le intestazioni aggiornate, senza toccare
 * i lead già presenti. Da eseguire una volta dopo aver aggiunto colonne.
 */
function aggiornaIntestazioni() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) return setup();
  sh.getRange(1, 1, 1, COLONNE.length).setValues([COLONNE]);
  var head = sh.getRange(1, 1, 1, COLONNE.length);
  head.setFontWeight('bold');
  head.setBackground('#1A3A5C');
  head.setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  return 'Intestazioni aggiornate: ' + COLONNE.length + ' colonne.';
}

/** Riceve il POST della landing e aggiunge una riga. */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // se qualcuno ha svuotato il foglio, ricrea le intestazioni
    if (sh.getLastRow() === 0) setup();

    sh.appendRow([
      new Date(),
      d.nome || '',
      d.cognome || '',
      // apostrofo iniziale: impedisce a Sheets di trasformare
      // "333 1234567" in un numero e perdere gli zeri iniziali
      d.telefono ? "'" + d.telefono : '',
      d.email || '',
      d.citta || '',
      d.fascia || '',
      d.privacy ? 'Sì' : 'No',
      d.pagina || '',
      '',                  // Note: sempre vuota, la scrive il cliente
      d.utm_source || '',
      d.utm_medium || '',
      d.utm_campaign || '',
      d.utm_content || '',
      d.utm_term || '',
      d.fbclid ? "'" + d.fbclid : '',
      d.gclid ? "'" + d.gclid : '',
      d.ttclid ? "'" + d.ttclid : '',
      d.msclkid ? "'" + d.msclkid : '',
      d.referrer || '',
      d.landing_page || ''
    ]);

    return risposta({ok: true});

  } catch (err) {
    // il lead non va perso: viene loggato in Esecuzioni
    console.error('Lead non salvato: ' + err + ' — payload: ' +
                  (e && e.postData ? e.postData.contents : 'vuoto'));
    return risposta({ok: false, error: String(err)});
  }
}

/** Verifica rapida: aprendo l'URL /exec nel browser deve rispondere. */
function doGet() {
  return risposta({ok: true, msg: 'Endpoint attivo. I lead arrivano via POST.'});
}

function risposta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * OPZIONALE — notifica email a ogni nuovo lead.
 * Per attivarla: metti qui la tua email e togli il commento
 * alla chiamata dentro doPost (vedi riga indicata sotto).
 */
var EMAIL_NOTIFICA = ''; // es. 'commerciale@energygasitalia.it'

function avvisa(d) {
  if (!EMAIL_NOTIFICA) return;
  MailApp.sendEmail({
    to: EMAIL_NOTIFICA,
    subject: 'Nuovo lead Energy 4Work: ' + (d.nome || '') + ' ' + (d.cognome || ''),
    body: 'Nome: ' + (d.nome || '') + ' ' + (d.cognome || '') + '\n' +
          'Telefono: ' + (d.telefono || '') + '\n' +
          'Email: ' + (d.email || '') + '\n' +
          'Città: ' + (d.citta || '') + '\n' +
          'Quando richiamare: ' + (d.fascia || '') + '\n\n' +
          'Da ricontattare entro 24 ore lavorative.'
  });
}
// Per attivare la notifica, dentro doPost aggiungi dopo appendRow:
//   avvisa(d);
