# fattura-elettronica-sdi-builder

Libreria TypeScript per la creazione e validazione di fatture elettroniche XML compatibili con il **Sistema di Interscambio (SDI)** dell'Agenzia delle Entrate italiana.

Supporta i formati **FPR12** (B2B/B2C) e **FPA12** (Pubblica Amministrazione) secondo le specifiche tecniche FatturaPA v1.7.1.

---

## Feedback

Questo progetto è in fase di sviluppo attivo. Se lo stai usando o valutando, qualsiasi feedback è benvenuto:

- **Bug o comportamenti inattesi** → apri una [issue su GitHub](https://github.com/GiuseppeSerio/fattura-elettronica-sdi-builder/issues)
- **Campi mancanti, regole SDI errate o casi d'uso non coperti** → stessa cosa, più è dettagliato meglio è
- **Suggerimenti, idee o domande** → puoi scrivere direttamente a [gserio95@gmail.com](mailto:gserio95@gmail.com)

Qualsiasi contributo — segnalazione, pull request o semplice opinione — è molto apprezzato.

---

## Installazione

```bash
npm install fattura-elettronica-sdi-builder
```

---

## Utilizzo rapido

```ts
import { applyDefaults, validate, buildXml } from 'fattura-elettronica-sdi-builder';
import type { FatturaElettronicaInput } from 'fattura-elettronica-sdi-builder';

// FatturaElettronicaInput: versione con campi deducibili opzionali
const input: FatturaElettronicaInput = {
  FatturaElettronicaHeader: {
    // IdTrasmittente omesso → verrà copiato da CedentePrestatore
    DatiTrasmissione: {
      ProgressivoInvio:   '00001',
      CodiceDestinatario: 'ABC1234',
    },
    CedentePrestatore: { /* ... */ },
    CessionarioCommittente: { /* ... */ },
  },
  FatturaElettronicaBody: {
    DatiGenerali: {
      DatiGeneraliDocumento: {
        TipoDocumento: 'TD01',
        Numero: 'FT-2026-001',
        // Divisa e Data omesse → 'EUR' e data odierna
      },
    },
    DatiBeniServizi: { /* ... */ },
  },
};

// 1. Applica default (restituisce FatturaElettronica completa)
const fattura = applyDefaults(input);

// 2. Valida
const validation = validate(fattura);
if (!validation.ok) {
  console.error(validation.error.fields);
  process.exit(1);
}

// 3. Genera XML
const build = buildXml(fattura, { prettyPrint: true });
if (!build.ok) {
  console.error(build.error.message);
  process.exit(1);
}

console.log(build.value); // stringa XML pronta per SDI
```

---

## Pattern Result

Tutte le funzioni pubbliche restituiscono un `Result<T, E>` — mai eccezioni non gestite.

```ts
type Result<T, E> =
  | { ok: true;  value: T }
  | { ok: false; error: E }
```

| Funzione | Tipo di ritorno |
|---|---|
| `validate(fattura)` | `Result<void, ValidationError>` |
| `buildXml(fattura, options?)` | `Result<string, BuildError>` |

### Gestione errori

```ts
import { ValidationError, BuildError } from 'fattura-elettronica-sdi-builder';

const result = validate(fattura);

if (!result.ok) {
  const { error } = result;

  // Tutti gli errori di validazione con campo e codice tipizzato
  error.fields.forEach(({ field, code, message }) => {
    console.log(`[${code}] ${field}: ${message}`);
  });
}
```

---

## applyDefaults — deduzione automatica dei valori

`applyDefaults` accetta un oggetto `FatturaElettronicaInput` in cui i campi deducibili sono opzionali, e restituisce una `FatturaElettronica` completa. I campi già valorizzati non vengono sovrascritti.

| Campo omissibile | Valore dedotto |
|---|---|
| `DatiTrasmissione.IdTrasmittente` | Copiato da `CedentePrestatore.DatiAnagrafici.IdFiscaleIVA` |
| `DatiTrasmissione.FormatoTrasmissione` | `"FPR12"` |
| `DatiTrasmissione.CodiceDestinatario` | `"XXXXXXX"` se `CessionarioCommittente.IdPaese ≠ "IT"` |
| `CessionarioCommittente.IdFiscaleIVA.IdCodice` | `"OO99999999999"` se `IdPaese ≠ "IT"` e IdCodice assente |
| `CessionarioCommittente.Sede.CAP` | `"00000"` se `Nazione ≠ "IT"` e CAP assente |
| `DatiGeneraliDocumento.Divisa` | `"EUR"` |
| `DatiGeneraliDocumento.Data` | Data odierna `YYYY-MM-DD` |
| `DatiRiepilogo.Imposta` | `round(ImponibileImporto × AliquotaIVA / 100, 2)`, oppure `0` se `Natura` presente |

```ts
import { applyDefaults, validate, buildXml } from 'fattura-elettronica-sdi-builder';
import type { FatturaElettronicaInput } from 'fattura-elettronica-sdi-builder';

const input: FatturaElettronicaInput = { /* campi parziali */ };
const fattura = applyDefaults(input);   // FatturaElettronica completa
const valid   = validate(fattura);      // Result<void, ValidationError>
const xml     = buildXml(fattura);      // Result<string, BuildError>
```

---

## Struttura della fattura

### FatturaElettronica (tipo root)

```ts
interface FatturaElettronica {
  FatturaElettronicaHeader: FatturaElettronicaHeader;
  FatturaElettronicaBody:   FatturaElettronicaBody | FatturaElettronicaBody[];
}
```

`FatturaElettronicaBody` può essere un array per le **fatture multi-corpo** (es. fatture differite TD24/TD25).

---

### FatturaElettronicaHeader

```ts
interface FatturaElettronicaHeader {
  DatiTrasmissione:                    DatiTrasmissione;
  CedentePrestatore:                   CedentePrestatore;
  RappresentanteFiscale?:              RappresentanteFiscale;
  CessionarioCommittente:              CessionarioCommittente;
  TerzoIntermediarioOSoggettoEmittente?: TerzoIntermediario;
  SoggettoEmittente?:                  'CC' | 'TZ';
}
```

#### DatiTrasmissione

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `IdTrasmittente.IdPaese` | `string` | ✓ | ISO 3166-1 alpha-2, es. `"IT"` — pattern `[A-Z]{2}` |
| `IdTrasmittente.IdCodice` | `string` | ✓ | Pattern `[0-9A-Z]{1,28}`, max 28 caratteri |
| `ProgressivoInvio` | `string` | ✓ | Alfanumerico, max 10 caratteri — pattern `[a-zA-Z0-9]{1,10}` |
| `FormatoTrasmissione` | `"FPR12" \| "FPA12"` | ✓ | B2B/B2C o Pubblica Amministrazione |
| `CodiceDestinatario` | `string` | ✓ | Vedi regole sotto |
| `PECDestinatario` | `string` | — | Max 256 caratteri |

**Regole `CodiceDestinatario` (cross-field con CessionarioCommittente):**

| Caso | Valore atteso |
|---|---|
| `FormatoTrasmissione = "FPA12"` (PA) | Esattamente **6** caratteri `[A-Z0-9]` (codice IPA) |
| `FormatoTrasmissione = "FPR12"` (B2B) | Esattamente **7** caratteri `[A-Z0-9]` |
| `CessionarioCommittente.IdPaese ≠ "IT"` (estero) | Deve essere esattamente `"XXXXXXX"` (SDI errore 00313) |

La regola dell'estero ha precedenza sulle regole di lunghezza per formato.

#### CedentePrestatore (Fornitore / Emittente)

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `DatiAnagrafici.IdFiscaleIVA.IdPaese` | `string` | ✓ | ISO 3166-1 alpha-2 |
| `DatiAnagrafici.IdFiscaleIVA.IdCodice` | `string` | ✓ | P.IVA: `\d{11}` se IT, max 28 se estero |
| `DatiAnagrafici.CodiceFiscale` | `string` | — | Formato CF italiano se presente |
| `DatiAnagrafici.Anagrafica.Denominazione` | `string` | ✓* | *O Nome+Cognome — max 80 caratteri |
| `DatiAnagrafici.Anagrafica.Nome` | `string` | ✓* | *Con Cognome — max 60 caratteri |
| `DatiAnagrafici.Anagrafica.Cognome` | `string` | ✓* | *Con Nome — max 60 caratteri |
| `DatiAnagrafici.RegimeFiscale` | `RegimeFiscale` | ✓ | Es. `"RF01"` ordinario |
| `Sede.Indirizzo` | `string` | ✓ | Max 60 caratteri |
| `Sede.CAP` | `string` | ✓ | `\d{5}` solo se `Nazione = "IT"` |
| `Sede.Comune` | `string` | ✓ | Max 60 caratteri |
| `Sede.Provincia` | `string` | — | `[A-Z]{2}` solo se `Nazione = "IT"` |
| `Sede.Nazione` | `string` | ✓ | ISO 3166-1 alpha-2 |
| `IscrizioneREA` | `IscrizioneREA` | — | Ufficio, NumeroREA, StatoLiquidazione |
| `Contatti` | `Contatti` | — | Telefono, Fax, Email |

#### CessionarioCommittente (Cliente / Destinatario)

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `DatiAnagrafici.IdFiscaleIVA` | `IdFiscale` | ✓* | *O CodiceFiscale — P.IVA `\d{11}` se IT |
| `DatiAnagrafici.CodiceFiscale` | `string` | ✓* | *O IdFiscaleIVA — formato CF italiano |
| `DatiAnagrafici.Anagrafica` | `Anagrafica` | ✓ | Denominazione (max 80) o Nome (max 60)+Cognome (max 60) |
| `Sede` | `Indirizzo` | ✓ | Stesse regole di CedentePrestatore.Sede |

> Almeno uno tra `IdFiscaleIVA` e `CodiceFiscale` è obbligatorio (`MISSING_IDENTIFIER`).

**Clienti extra-UE senza P.IVA o codice fiscale europeo:**

| Campo | Valore |
|---|---|
| `IdFiscaleIVA.IdCodice` | `"OO99999999999"` — due "O" di Oscar + undici "9" |
| `IdFiscaleIVA.IdPaese` | Codice ISO della nazione del cliente, oppure `"OO"` se non disponibile |

```ts
// Cliente extra-UE senza identificativo fiscale
DatiAnagrafici: {
  IdFiscaleIVA: { IdPaese: 'US', IdCodice: 'OO99999999999' },
  Anagrafica:   { Denominazione: 'Acme Corp' },
},

// Nazione sconosciuta
DatiAnagrafici: {
  IdFiscaleIVA: { IdPaese: 'OO', IdCodice: 'OO99999999999' },
  Anagrafica:   { Denominazione: 'Fornitore Ignoto' },
},
```

---

### FatturaElettronicaBody

```ts
interface FatturaElettronicaBody {
  DatiGenerali:    DatiGenerali;
  DatiBeniServizi: DatiBeniServizi;
  DatiVeicoli?:    DatiVeicoli;
  DatiPagamento?:  DatiPagamento[];
  Allegati?:       Allegati[];
}
```

#### DatiGeneraliDocumento

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `TipoDocumento` | `TipoDocumento` | ✓ | Es. `"TD01"` fattura, `"TD04"` nota credito |
| `Divisa` | `string` | ✓ | ISO 4217 — pattern `[A-Z]{3}`, es. `"EUR"` |
| `Data` | `string` | ✓ | Formato `YYYY-MM-DD` |
| `Numero` | `string` | ✓ | Max 20 caratteri — pattern `[a-zA-Z0-9/\-]{1,20}` |
| `ImportoTotaleDocumento` | `number` | — | Totale comprensivo di IVA |
| `Causale` | `string \| string[]` | — | Max 200 caratteri per elemento |
| `DatiRitenuta` | `DatiRitenuta \| DatiRitenuta[]` | — | Per professionisti con ritenuta |
| `DatiBollo` | `DatiBollo` | — | Bollo virtuale |
| `DatiCassaPrevidenziale` | `DatiCassaPrevidenziale[]` | — | Contributi previdenziali |

##### DatiRitenuta

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `TipoRitenuta` | `string` | ✓ | Es. `"RT01"` persone giuridiche, `"RT02"` persone fisiche |
| `ImportoRitenuta` | `number` | ✓ | — |
| `AliquotaRitenuta` | `number` | ✓ | Percentuale 0–100 |
| `CausalePagamento` | `string` | ✓ | Pattern `[A-Z0-9]{1,2}` |

##### DatiBollo

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `BolloVirtuale` | `"SI"` | ✓ | — |
| `ImportoBollo` | `number` | ✓ | Deve essere > 0 |

##### DatiCassaPrevidenziale

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `TipoCassa` | `string` | ✓ | Pattern `TC\d{2}`, es. `"TC07"` |
| `AlCassa` | `number` | ✓ | Percentuale 0–100 |
| `ImportoContributoCassa` | `number` | ✓ | — |
| `ImponibileCassa` | `number` | — | — |
| `AliquotaIVA` | `number` | ✓ | — |
| `Natura` | `NaturaIVA` | ✓* | *Obbligatoria se `AliquotaIVA = 0` |
| `Ritenuta` | `"SI"` | — | — |
| `RiferimentoAmministrazione` | `string` | — | Max 20 caratteri |

#### DatiDocumentoCorrelato

Applicabile a `DatiOrdineAcquisto`, `DatiContratto`, `DatiConvenzione`, `DatiRicezione`, `DatiFattureCollegate`:

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `IdDocumento` | `string` | ✓ | Max 20 caratteri |
| `Data` | `string` | — | Formato `YYYY-MM-DD` |
| `NumItem` | `string` | — | Max 20 caratteri |
| `CodiceCommessaConvenzione` | `string` | — | Max 100 caratteri |
| `CodiceCUP` | `string` | — | Max 15 caratteri |
| `CodiceCIG` | `string` | — | Max 15 caratteri |

#### DatiDDT

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `NumeroDDT` | `string` | ✓ | Max 20 caratteri |
| `DataDDT` | `string` | ✓ | Formato `YYYY-MM-DD` |

#### FatturaPrincipale

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `NumeroFatturaPrincipale` | `string` | ✓ | Max 20 caratteri |
| `DataFatturaPrincipale` | `string` | ✓ | Formato `YYYY-MM-DD` |

#### DettaglioLinee

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `NumeroLinea` | `number` | ✓ | ≥ 1; i valori devono essere unici e sequenziali a partire da 1 |
| `CodiceArticolo` | `CodiceArticolo[]` | — | `CodiceTipo` e `CodiceValore` obbligatori (max 35), se presente |
| `Descrizione` | `string` | ✓ | Max 1000 caratteri |
| `Quantita` | `number` | — | Se presente, deve essere ≠ 0 |
| `UnitaMisura` | `string` | — | Max 10 caratteri |
| `DataInizioPeriodo` | `string` | — | Formato `YYYY-MM-DD` |
| `DataFinePeriodo` | `string` | — | Formato `YYYY-MM-DD`; deve essere ≥ `DataInizioPeriodo` |
| `PrezzoUnitario` | `number` | ✓ | 8 decimali |
| `ScontoMaggiorazione` | `ScontoMaggiorazione[]` | — | Vedi sotto |
| `PrezzoTotale` | `number` | ✓ | Verificato vs `PrezzoUnitario × Quantita` (con sconti cascata), tolleranza ±0.01 (SDI 00423) |
| `AliquotaIVA` | `number` | ✓ | Es. `22`, `10`, `4`, `0` — deve essere ≥ 0 |
| `Natura` | `NaturaIVA` | ✓* | *Obbligatoria se `AliquotaIVA = 0` |
| `RiferimentoAmministrazione` | `string` | — | Max 20 caratteri |
| `AltriDatiGestionali` | `AltriDatiGestionali[]` | — | `TipoDato` obbligatorio (max 10), `RiferimentoTesto` max 60 |

**Regola sequenzialità `NumeroLinea`:** i numeri di riga devono formare una sequenza contigua `[1, 2, 3, …, N]`. Valori duplicati o gap (es. `1, 3`) generano un errore `INVALID_VALUE`.

**Regola `ScontoMaggiorazione`:** almeno uno tra `Percentuale` (0–100) e `Importo` deve essere presente.

**Regola `Natura` su riga:** se `Natura` è valorizzata → `AliquotaIVA` deve essere `0` (SDI 00401). Codici `N2`, `N3`, `N6` deprecati dal 2021: usare i sottocodici (SDI 00445).

**Regola `PrezzoTotale` (SDI 00423):** quando sono presenti `PrezzoUnitario` e `Quantita`, il validatore calcola `PrezzoUnitario × Quantita` applicando in cascata tutti gli `ScontoMaggiorazione`, e confronta il risultato con `PrezzoTotale` (tolleranza ±0.01 €).

#### DatiRiepilogo

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `AliquotaIVA` | `number` | ✓ | Aliquota del gruppo |
| `Natura` | `NaturaIVA` | ✓* | *Obbligatoria se `AliquotaIVA = 0` |
| `ImponibileImporto` | `number` | ✓ | Verificato vs somma linee + casse + spese accessorie (tolleranza ±1.00, SDI 00422) |
| `Imposta` | `number` | ✓ | Ammontare IVA (deducibile via `applyDefaults`); verificato vs `ImponibileImporto × AliquotaIVA / 100` (tolleranza ±0.01, SDI 00421) |
| `EsigibilitaIVA` | `"D" \| "I" \| "S"` | — | Differita / Immediata / Split payment |
| `RiferimentoNormativo` | `string` | — | Max 100 caratteri, es. `"art. 10 DPR 633/72"` |

**Regole `DatiRiepilogo`:**
- Se `Natura` è presente → `AliquotaIVA` deve essere `0` (SDI 00430), `Imposta` deve essere `0`.
- Se `Natura` è assente → `Imposta` deve essere `round(ImponibileImporto × AliquotaIVA / 100, 2)` con tolleranza ±0.01 (SDI 00421).
- `ImponibileImporto` deve coincidere con la somma dei `PrezzoTotale` delle linee con la stessa aliquota/natura, più i contributi cassa applicabili e le voci `SpeseAccessorie` e `Arrotondamento` della riga stessa (tolleranza ±1.00 €, SDI 00422).
- Codici `N2`, `N3`, `N6` deprecati dal 2021 (SDI 00445): usare i sottocodici (es. `N2.1`, `N3.1`, `N6.1`).
- `EsigibilitaIVA = "S"` (split payment) non compatibile con `Natura = N6.*` (reverse charge) (SDI 00420).

**Regola `ImportoTotaleDocumento`:** se presente, deve rispettare la formula `Σ(ImponibileImporto + Imposta) − ΣImportoRitenuta + ImportoBollo + Arrotondamento` (tolleranza ±1.00 €).

#### DatiPagamento

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `CondizioniPagamento` | `"TP01" \| "TP02" \| "TP03"` | ✓ | Rate / Completo / Anticipo |
| `DettaglioPagamento` | `DettaglioPagamento[]` | ✓ | Almeno un elemento |

##### DettaglioPagamento

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `ModalitaPagamento` | `ModalitaPagamento` | ✓ | Es. `"MP05"` bonifico, `"MP08"` carta |
| `ImportoPagamento` | `number` | ✓ | Deve essere > 0 |
| `DataScadenzaPagamento` | `string` | — | Formato `YYYY-MM-DD` |
| `DataDecorrenzaPenale` | `string` | — | Formato `YYYY-MM-DD` |
| `Beneficiario` | `string` | — | Max 200 caratteri |
| `IstitutoFinanziario` | `string` | — | Max 80 caratteri |
| `IBAN` | `string` | — | Pattern `[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}` |
| `ABI` | `string` | — | Esattamente 5 cifre — pattern `\d{5}` |
| `CAB` | `string` | — | Esattamente 5 cifre — pattern `\d{5}` |
| `BIC` | `string` | — | Pattern `[A-Z0-9]{8}([A-Z0-9]{3})?` |
| `CodUfficioPostale` | `string` | — | Max 20 caratteri |
| `CognomeQuietanzante` | `string` | — | Max 60 caratteri |
| `NomeQuietanzante` | `string` | — | Max 60 caratteri |
| `TitoloQuietanzante` | `string` | — | Max 10 caratteri |
| `CodicePagamento` | `string` | — | Max 60 caratteri |

#### DatiVeicoli

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `Data` | `string` | ✓ | Formato `YYYY-MM-DD` |
| `TotalePercorso` | `string` | ✓ | Max 15 caratteri |

#### Allegati

| Campo | Tipo | Obbligatorio | Regola |
|---|---|:---:|---|
| `NomeAttachment` | `string` | ✓ | Max 60 caratteri |
| `FormatoAttachment` | `string` | — | Max 10 caratteri |
| `DescrizioneAttachment` | `string` | — | Max 100 caratteri |
| `Attachment` | `string` | ✓ | Contenuto Base64 del file allegato |

---

## Codici errore

La validazione restituisce errori tipizzati tramite `ErrorCode`:

| Codice | Quando viene emesso |
|---|---|
| `MISSING_REQUIRED_FIELD` | Campo obbligatorio assente o vuoto |
| `INVALID_FORMAT` | Valore non rispetta il pattern atteso (P.IVA, CF, IBAN, paese, ecc.) |
| `INVALID_DATE_FORMAT` | Data non nel formato `YYYY-MM-DD` |
| `EXCEEDS_MAX_LENGTH` | Stringa supera la lunghezza massima consentita |
| `INVALID_LENGTH` | Stringa non rispetta la lunghezza esatta o il range richiesto |
| `INVALID_VALUE` | Valore numerico o semantico non valido (percentuale fuori range, `Quantita = 0`, `NumeroLinea` non sequenziale, `Imposta` incoerente, ecc.) |
| `MISSING_NATURA` | `AliquotaIVA = 0` senza `Natura` nel riepilogo o nella riga |
| `MISSING_ANAGRAFICA` | Né `Denominazione` né `Nome`+`Cognome` presenti |
| `MISSING_IDENTIFIER` | Né `IdFiscaleIVA` né `CodiceFiscale` presenti per il cessionario |
| `EMPTY_COLLECTION` | Array obbligatorio (es. `DettaglioPagamento`) è vuoto |
| `BUILD_FAILED` | Errore interno durante la serializzazione XML |

```ts
if (!result.ok) {
  result.error.fields.forEach(({ code, field, message }) => {
    switch (code) {
      case 'MISSING_NATURA':
        // AliquotaIVA 0% senza Natura — obbligatorio per SDI
        break;
      case 'INVALID_VALUE':
        // valore fuori range o semanticamente incoerente
        break;
      case 'EXCEEDS_MAX_LENGTH':
        // campo troppo lungo
        break;
    }
  });
}
```

---

## Tipi di documento supportati (TipoDocumento)

| Codice | Descrizione | Regola SDI |
|---|---|---|
| `TD01` | Fattura | Almeno un soggetto IT (SDI 00476) |
| `TD02` | Acconto/anticipo su fattura | — |
| `TD03` | Acconto/anticipo su parcella | — |
| `TD04` | Nota di credito | — |
| `TD05` | Nota di debito | — |
| `TD06` | Parcella | Almeno un soggetto IT (SDI 00476) |
| `TD07` | Fattura semplificata | — |
| `TD08` | Nota credito semplificata | — |
| `TD09` | Nota debito semplificata | — |
| `TD10` | Acquisto beni intracomunitari | — |
| `TD11` | Acquisto servizi intracomunitari | — |
| `TD16` | Reverse charge interno | Cedente ≠ Cessionario; Cessionario con P.IVA (SDI 00471/00475) |
| `TD17` | Autofattura servizi esteri | Cedente non IT (SDI 00473); Cessionario con P.IVA (SDI 00475) |
| `TD18` | Autofattura beni intraUE | Cedente non IT (SDI 00473); Cessionario con P.IVA (SDI 00475) |
| `TD19` | Autofattura beni art. 17 | Cedente non IT (SDI 00473); Cessionario con P.IVA (SDI 00475) |
| `TD20` | Autofattura regolarizzazione | Cedente ≠ Cessionario; Cessionario con P.IVA (SDI 00471/00475) |
| `TD21` | Splafonamento | Cedente = Cessionario; AliquotaIVA ≠ 0 (SDI 00472/00474) |
| `TD22` | Estrazione deposito IVA | Cedente ≠ Cessionario; Cessionario con P.IVA (SDI 00471/00475) |
| `TD23` | Estrazione deposito IVA con versamento | Cedente ≠ Cessionario; Cessionario con P.IVA (SDI 00471/00475) |
| `TD24` | Fattura differita (beni) | Almeno un soggetto IT (SDI 00476) |
| `TD25` | Fattura differita (servizi) | Almeno un soggetto IT (SDI 00476) |
| `TD26` | Cessione beni ammortizzabili | — |
| `TD27` | Autoconsumo | Cedente = Cessionario (SDI 00472) |
| `TD28` | Acquisto da San Marino con IVA | Cedente IdPaese = "SM" (SDI 00473); Cessionario con P.IVA (SDI 00475) |
| `TD29` | Autofattura fattura non ricevuta | Cessionario con P.IVA (SDI 00475) |

---

## Regimi fiscali (RegimeFiscale)

| Codice | Descrizione |
|---|---|
| `RF01` | Ordinario |
| `RF02` | Contribuenti minimi (art. 1, c. 96-117, L. 244/07) |
| `RF04` | Agricoltura e attività connesse e pesca |
| `RF05` | Vendita sali e tabacchi |
| `RF06` | Commercio fiammiferi |
| `RF07` | Editoria |
| `RF08` | Gestione servizi telefonia pubblica |
| `RF09` | Rivendita documenti trasporto pubblico |
| `RF10` | Intrattenimenti, giochi e altre attività |
| `RF11` | Agenzie viaggi e turismo |
| `RF12` | Agriturismo |
| `RF13` | Vendite a domicilio |
| `RF14` | Rivendita beni usati / oggetti d'arte |
| `RF15` | Agenzie di vendite all'asta |
| `RF16` | IVA per cassa P.A. |
| `RF17` | IVA per cassa |
| `RF18` | Altro |
| `RF19` | Regime forfettario (art. 1, c. 54-89, L. 190/14) |
| `RF20` | Regime transfrontaliero di Franchigia IVA |

---

## Esempi

### Fattura B2B con IVA ordinaria

```ts
import { validate, buildXml } from 'fattura-elettronica-sdi-builder';
import type { FatturaElettronica } from 'fattura-elettronica-sdi-builder';

const fattura: FatturaElettronica = {
  FatturaElettronicaHeader: {
    DatiTrasmissione: {
      IdTrasmittente:      { IdPaese: 'IT', IdCodice: '01234567890' },
      ProgressivoInvio:    '00001',
      FormatoTrasmissione: 'FPR12',
      CodiceDestinatario:  'ABC1234', // 7 caratteri per FPR12
    },
    CedentePrestatore: {
      DatiAnagrafici: {
        IdFiscaleIVA:  { IdPaese: 'IT', IdCodice: '01234567890' },
        Anagrafica:    { Denominazione: 'La Mia Azienda Srl' },
        RegimeFiscale: 'RF01',
      },
      Sede: { Indirizzo: 'Via Roma 1', CAP: '00100', Comune: 'Roma', Provincia: 'RM', Nazione: 'IT' },
    },
    CessionarioCommittente: {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '09876543210' },
        Anagrafica:   { Denominazione: 'Cliente Spa' },
      },
      Sede: { Indirizzo: 'Via Milano 10', CAP: '20100', Comune: 'Milano', Provincia: 'MI', Nazione: 'IT' },
    },
  },
  FatturaElettronicaBody: {
    DatiGenerali: {
      DatiGeneraliDocumento: {
        TipoDocumento:          'TD01',
        Divisa:                 'EUR',
        Data:                   '2026-05-18',
        Numero:                 'FT-2026-001',
        ImportoTotaleDocumento: 122.00,
      },
    },
    DatiBeniServizi: {
      DettaglioLinee: [
        {
          NumeroLinea:    1,
          Descrizione:    'Servizio di consulenza',
          Quantita:       1,
          UnitaMisura:    'NUM',
          PrezzoUnitario: 100.00,
          PrezzoTotale:   100.00,
          AliquotaIVA:    22.00,
        },
      ],
      DatiRiepilogo: [
        {
          AliquotaIVA:       22.00,
          ImponibileImporto: 100.00,
          Imposta:           22.00,
          EsigibilitaIVA:    'I',
        },
      ],
    },
    DatiPagamento: [
      {
        CondizioniPagamento: 'TP02',
        DettaglioPagamento: [
          {
            ModalitaPagamento:     'MP05',
            DataScadenzaPagamento: '2026-06-18',
            ImportoPagamento:      122.00,
            IBAN:                  'IT60X0542811101000000123456',
          },
        ],
      },
    ],
  },
};

const validation = validate(fattura);
if (!validation.ok) {
  throw validation.error;
}

const build = buildXml(fattura, { prettyPrint: true });
if (!build.ok) {
  throw build.error;
}

console.log(build.value);
```

### Fattura PA (FPA12)

Il formato FPA12 richiede `CodiceDestinatario` di **6 caratteri** (codice IPA):

```ts
DatiTrasmissione: {
  IdTrasmittente:      { IdPaese: 'IT', IdCodice: '01234567890' },
  ProgressivoInvio:    '00001',
  FormatoTrasmissione: 'FPA12',
  CodiceDestinatario:  'ABCDE1', // 6 caratteri [A-Z0-9] (codice IPA)
},
```

### Destinatario estero

Per clienti con `IdPaese ≠ "IT"` il `CodiceDestinatario` deve essere `"XXXXXXX"` (SDI errore 00313):

```ts
DatiTrasmissione: {
  FormatoTrasmissione: 'FPR12',
  CodiceDestinatario:  'XXXXXXX',
},
CessionarioCommittente: {
  DatiAnagrafici: {
    IdFiscaleIVA: { IdPaese: 'DE', IdCodice: 'DE123456789' },
    Anagrafica:   { Denominazione: 'German GmbH' },
  },
  Sede: { Indirizzo: 'Hauptstrasse 1', CAP: '10115', Comune: 'Berlin', Nazione: 'DE' },
},
```

### Operazione esente IVA (AliquotaIVA = 0)

Quando l'aliquota è `0` è **obbligatorio** specificare `Natura` sia nella riga che nel riepilogo:

```ts
DettaglioLinee: [
  {
    NumeroLinea:    1,
    Descrizione:    'Prestazione medica',
    PrezzoUnitario: 200.00,
    PrezzoTotale:   200.00,
    AliquotaIVA:    0,
    Natura:         'N4', // Esente art. 10 DPR 633/72
  },
],
DatiRiepilogo: [
  {
    AliquotaIVA:          0,
    Natura:               'N4',
    ImponibileImporto:    200.00,
    Imposta:              0,
    RiferimentoNormativo: 'art. 10 DPR 633/72',
  },
],
```

### Più righe — NumeroLinea sequenziale

`NumeroLinea` deve essere progressivo e senza gap a partire da `1`:

```ts
DettaglioLinee: [
  { NumeroLinea: 1, Descrizione: 'Prodotto A', PrezzoUnitario: 50, PrezzoTotale: 50, AliquotaIVA: 22 },
  { NumeroLinea: 2, Descrizione: 'Prodotto B', PrezzoUnitario: 30, PrezzoTotale: 30, AliquotaIVA: 22 },
  { NumeroLinea: 3, Descrizione: 'Spedizione',  PrezzoUnitario: 10, PrezzoTotale: 10, AliquotaIVA: 22 },
],
DatiRiepilogo: [
  {
    AliquotaIVA: 22, ImponibileImporto: 90, Imposta: 19.80, EsigibilitaIVA: 'I',
  },
],
```

### Professionista con ritenuta d'acconto

```ts
DatiGeneraliDocumento: {
  TipoDocumento: 'TD06', // Parcella
  Divisa:        'EUR',
  Data:          '2026-05-18',
  Numero:        'PAR-2026-001',
  DatiRitenuta: {
    TipoRitenuta:     'RT02', // Persone fisiche
    ImportoRitenuta:  20.00,
    AliquotaRitenuta: 20.00,
    CausalePagamento: 'A',
  },
},
```

### Fattura con DDT e cassa previdenziale

```ts
DatiGenerali: {
  DatiGeneraliDocumento: {
    TipoDocumento: 'TD24', // Fattura differita
    Divisa: 'EUR',
    Data:   '2026-05-18',
    Numero: 'FD-2026-001',
    DatiCassaPrevidenziale: [
      {
        TipoCassa:               'TC22', // Inarcassa
        AlCassa:                 4,
        ImportoContributoCassa:  4.00,
        AliquotaIVA:             22,
      },
    ],
  },
  DatiDDT: [
    {
      NumeroDDT: 'DDT-2026-042',
      DataDDT:   '2026-05-10',
    },
  ],
},
```

### Salvataggio su file

```ts
import { writeFileSync } from 'fs';

const build = buildXml(fattura);
if (build.ok) {
  // Naming convention SDI: {IdPaese}{IdCodice}_{Formato}_{Progressivo}.xml
  writeFileSync('IT01234567890_FPR12_00001.xml', build.value, 'utf-8');
}
```

---

## Opzioni di build

```ts
buildXml(fattura, {
  prettyPrint: true,   // indenta l'XML (default: false — compatto per SDI)
  encoding:    'UTF-8' // default: 'UTF-8'
});
```

> **Nota:** SDI accetta sia XML compatto che indentato. Usare `prettyPrint: false` per file di dimensioni minori.

---

## Architettura

```
src/
├── result.ts                 ← Result<T,E>, ok(), err()
├── errors/
│   ├── codes.ts              ← ErrorCode (const object)
│   ├── FatturaError.ts       ← FatturaError | ValidationError | BuildError
│   └── index.ts
├── builder/
│   ├── sections/             ← un modulo per blocco XML FatturaPA
│   │   ├── trasmissione.ts
│   │   ├── cedente.ts
│   │   ├── cessionario.ts
│   │   ├── dati-generali.ts
│   │   ├── linee.ts
│   │   ├── riepilogo.ts
│   │   └── pagamento.ts
│   ├── header.builder.ts
│   ├── body.builder.ts
│   └── index.ts              ← buildXml() → Result<string, BuildError>
├── validator/
│   ├── rules/                ← regole atomiche per sezione
│   │   ├── types.ts          ← helpers: required(), maxLength(), pattern(), …
│   │   ├── trasmissione.rules.ts
│   │   ├── cedente.rules.ts
│   │   ├── cessionario.rules.ts
│   │   ├── body.rules.ts     ← orchestratore body
│   │   └── body/             ← regole per sotto-sezioni body
│   │       ├── dati-generali.rules.ts
│   │       ├── linee.rules.ts
│   │       ├── riepilogo.rules.ts
│   │       ├── pagamento.rules.ts
│   │       └── allegati.rules.ts
│   ├── header.validator.ts   ← validateHeader() + cross-field CodiceDestinatario
│   ├── body.validator.ts
│   └── index.ts              ← validate() → Result<void, ValidationError>
└── index.ts                  ← public API
```

### Funzioni helper di validazione (`validator/rules/types.ts`)

| Helper | Codice errore | Descrizione |
|---|---|---|
| `required(v, field)` | `MISSING_REQUIRED_FIELD` | Valore assente, `null`, `undefined` o stringa vuota |
| `maxLength(v, n, field)` | `EXCEEDS_MAX_LENGTH` | Stringa supera `n` caratteri |
| `exactLength(v, n, field)` | `INVALID_LENGTH` | Stringa non è esattamente `n` caratteri |
| `minMaxLength(v, min, max, field)` | `INVALID_LENGTH` | Lunghezza fuori dal range `[min, max]` |
| `pattern(v, regex, field, msg)` | `INVALID_FORMAT` | Valore non corrisponde alla regex |
| `dateFormat(v, field)` | `INVALID_DATE_FORMAT` | Non è `YYYY-MM-DD` |
| `paese(v, field)` | `INVALID_FORMAT` | Non è `[A-Z]{2}` |
| `partitaIvaIT(v, field)` | `INVALID_FORMAT` | Non è `\d{11}` |
| `codiceFiscaleIT(v, field)` | `INVALID_FORMAT` | Non corrisponde al formato CF italiano |
| `cap(v, field)` | `INVALID_FORMAT` | Non è `\d{5}` |
| `provincia(v, field)` | `INVALID_FORMAT` | Non è `[A-Z]{2}` |
| `iban(v, field)` | `INVALID_FORMAT` | Non rispetta il pattern IBAN |
| `bic(v, field)` | `INVALID_FORMAT` | Non rispetta il pattern BIC/SWIFT |
| `numeroFattura(v, field)` | `INVALID_FORMAT` | Supera 20 caratteri o contiene caratteri non ammessi |
| `progressivoInvio(v, field)` | `INVALID_FORMAT` | Supera 10 caratteri o contiene caratteri non ammessi |
| `isoValuta(v, field)` | `INVALID_FORMAT` | Non è `[A-Z]{3}` |
| `positiveNumber(v, field)` | `INVALID_VALUE` | Numero ≤ 0 |
| `nonNegativeNumber(v, field)` | `INVALID_VALUE` | Numero < 0 |
| `percentuale(v, field)` | `INVALID_VALUE` | Fuori dal range `[0, 100]` |

### Aggiungere una nuova regola di validazione

```ts
// src/validator/rules/cedente.rules.ts
export function validateCedentePrestatore(cp: CedentePrestatore): FieldError[] {
  const errors: FieldError[] = [];
  // ... regole esistenti ...

  // Nuova regola: email deve contenere @
  if (cp.Contatti?.Email && !cp.Contatti.Email.includes('@')) {
    errors.push({
      field:   'CedentePrestatore.Contatti.Email',
      code:    'INVALID_FORMAT',
      message: 'Email non valida',
    });
  }

  return errors;
}
```

### Aggiungere un nuovo blocco XML

```ts
// src/builder/sections/mio-blocco.ts
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';

export function buildMioBlocco(parent: XMLBuilder, data: MioBlocco): void {
  const node = parent.ele('MioBlocco');
  node.ele('Campo').txt(data.campo).up();
  node.up();
}
```

Poi importarlo e chiamarlo in `body.builder.ts`.

---

## Riferimenti

- [Specifiche tecniche FatturaPA v1.7.1](https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/)
- [Schema XSD ufficiale](https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/)
- [Tabella codici SDI](https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/)

---

## Licenza

MIT
