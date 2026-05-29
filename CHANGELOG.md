# Changelog

Tutte le modifiche significative a questo progetto sono documentate in questo file.  
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.0.0/) e il progetto adotta il [Semantic Versioning](https://semver.org/lang/it/).

---

## [0.1.3] — 2026-05-29

### Aggiunto
- **Suite di test riorganizzata in test-pyramid** (188 test totali, 15 suite):
  - `__tests__/unit/` — funzioni pure isolate (57 test)
  - `__tests__/integration/` — singolo modulo end-to-end, mirror di `src/validator/rules/` (61 test)
  - `__tests__/e2e/` — pipeline completa, scenari realistici + regressions (70 test)
  - `__tests__/fixtures/` e `__tests__/helpers/` con builder (`headerIT()`, `linea()`, `riep()`, `pagamento()`, `bodyStd()`, `fattura()`, `expectOk()`, `expectErr()`) e asserzioni condivise
- **Script `npm` per livello**: `test:unit`, `test:integration`, `test:e2e` (oltre a `test` complessivo); `test:watch` ora limita a unit+integration per velocità
- **Test integration per `applyDefaults()`** (10 test) — colmato gap totalmente scoperto
- **Enum centralizzati in `src/enums.ts`** come singola fonte di verità (12 enum: `FORMATO_TRASMISSIONE`, `REGIME_FISCALE`, `TIPO_DOCUMENTO`, `TIPO_RITENUTA`, `TIPO_CASSA`, `CAUSALE_PAGAMENTO`, `TIPO_CESSIONE_PRESTAZIONE`, `NATURA`, `NATURA_DEPRECATA`, `ESIGIBILITA_IVA`, `MODALITA_PAGAMENTO`, `CONDIZIONI_PAGAMENTO`), esportati pubblicamente in `src/index.ts`
- **Validazione enum `NATURA`** runtime su `DettaglioLinee.Natura`, `DatiRiepilogo.Natura`, `DatiCassaPrevidenziale.Natura` (prima nessun controllo sui codici)
- **Validazione enum `EsigibilitaIVA`** (era dichiarata ma `enumValue` mai chiamato)
- **Cross-check date**:
  - `DataScadenzaPagamento` ≥ `Data` del documento
  - `DataDDT` ≤ `Data` del documento
- **Unicità `Numero` fattura** all'interno di un lotto multi-body
- **Unicità `DatiRiepilogo`** per coppia `(AliquotaIVA, Natura, EsigibilitaIVA)`
- **Validazione calendaristica delle date**: `2026-02-31` o `2026-13-01` ora rilevate come inesistenti, non solo verificate per pattern
- **Validazione formato base64** per `Allegati.Attachment`
- **Validazione `GiorniTerminiPagamento ≥ 0`**
- **Lotto vuoto rilevato**: `FatturaElettronicaBody = []` ora emette `EMPTY_COLLECTION`
- **Documento `CONTRIBUTING.md`** con setup, architettura, helper di validazione, guida per aggiungere regole e blocchi XML
- **README rinnovato**: badge npm/license/TS strict, sezione "Why this library", "Requirements"

### Modificato
- **`validator/rules/` riorganizzato per simmetria header/body**:
  - Nuova cartella `rules/header/` contenente `trasmissione.rules.ts`, `cedente.rules.ts`, `cessionario.rules.ts`
  - Nuovo `rules/header.rules.ts` per le cross-rules dell'header (`validateCodiceDestinatario` estratta da `header.validator.ts`)
  - `header.validator.ts` torna a essere orchestratore puro (11 righe, prima 65)
- **`numericField`** ora arrotonda il valore a `maxDecimals` prima del confronto, distinguendo rumore floating-point da decimali reali tramite soglia epsilon-relativa
- **`dateFormat`** ora valida anche la semantica calendaristica via `new Date(value+'T00:00:00Z')` + round-trip `toISOString()`
- **Tolleranze coherence-check ora float-robust** (arrotondamento della differenza a 2 decimali prima del confronto): `PrezzoTotale` (SDI 00423), `Imposta`, `ImponibileImporto` (SDI 00422), `ImportoTotaleDocumento`
- **CAP estero** ammette fino a 10 caratteri (era max 5): supporta UK `SW1A1AA`, CA `K1A0B1`, ecc.
- `types/common.ts` ora re-esporta i type literal da `src/enums.ts` (eliminata la duplicazione fra type e runtime)

### Risolto
- `NaN` e `Infinity` in qualsiasi campo numerico ora rifiutati esplicitamente (es. `PrezzoUnitario=NaN`, `ImportoPagamento=NaN`) — prima passavano silenziosamente
- Valori float derivati da somma (`0.1 + 0.2 = 0.30000000000000004`) non generano più falsi positivi di "17 decimali" su campi con `maxDecimals` ≤ 8
- Tolleranza `PrezzoTotale` al limite (`Math.abs(100.01 - 100) = 0.010000000000005`) non emette più falso negativo SDI 00423
- `AliquotaIVA` negativa in `DatiRiepilogo` ora rilevata (prima controllata solo in `DettaglioLinee`)
- `Natura` con codice inesistente (`'XYZ'`) ora rifiutata (prima nessun controllo enum)
- `EsigibilitaIVA = 'X'` ora rifiutata
- `Numero` fattura duplicato all'interno di un lotto multi-body ora rilevato
- `DatiRiepilogo` con stessa coppia `(AliquotaIVA, Natura, EsigibilitaIVA)` ripetuta ora rilevato
- Date impossibili come `2026-02-31` o `2026-13-01` ora rilevate (prima superavano il check pattern)
- `Allegati.Attachment` con caratteri non-base64 ora rifiutato
- `GiorniTerminiPagamento` negativo ora rilevato
- CAP esteri di 7 caratteri (UK) non più rifiutati come "troppo lunghi"
- `DataScadenzaPagamento` precedente alla `Data` del documento ora rilevata
- `DataDDT` successiva alla `Data` del documento ora rilevata
- Lotto vuoto `FatturaElettronicaBody = []` ora rilevato come `EMPTY_COLLECTION`

---

## [0.1.2] — 2026-05-27

### Aggiunto
- **Controlli coerenza importi**:
  - `PrezzoTotale` per ogni linea verificato vs `PrezzoUnitario × Quantita` con applicazione cascata di `ScontoMaggiorazione` (tolleranza ±0.01, SDI 00423)
  - `AliquotaIVA` non può essere negativa
  - `ImponibileImporto` in ogni riga di `DatiRiepilogo` verificato vs somma `PrezzoTotale` delle linee con stessa aliquota/natura + casse + spese accessorie + arrotondamento (tolleranza ±1.00, SDI 00422)
  - `ImportoTotaleDocumento` verificato vs `Σ(ImponibileImporto+Imposta) − ImportoRitenuta + ImportoBollo + Arrotondamento` (tolleranza ±1.00)
  - `ImportoPagamento` deve essere > 0
- **`applyDefaults()`** — funzione di deduzione automatica dei campi derivabili:
  - `DatiTrasmissione.IdTrasmittente` ← `CedentePrestatore.IdFiscaleIVA`
  - `DatiTrasmissione.FormatoTrasmissione` ← `"FPR12"` se assente
  - `DatiTrasmissione.CodiceDestinatario` ← `"XXXXXXX"` per cessionari esteri
  - `CessionarioCommittente.IdFiscaleIVA.IdCodice` ← `"OO99999999999"` per extra-UE senza codice
  - `CessionarioCommittente.Sede.CAP` ← `"00000"` per paesi senza CAP
  - `DatiGeneraliDocumento.Divisa` ← `"EUR"`
  - `DatiGeneraliDocumento.Data` ← data odierna
  - `DatiRiepilogo.Imposta` ← calcolata automaticamente
- Tipo `FatturaElettronicaInput` con campi deducibili opzionali
- Helper `enumValue()` per validazione enum a runtime
- File `src/validator/rules/enums.ts` con tutti i valori ammessi a runtime
- Nuovi tipi esportati: `TipoRitenuta`, `TipoCassa`, `CausalePagamento`, `TipoCessionePrestazione`

### Modificato
- **Validazioni enum complete** per i campi che prima usavano solo pattern regex:
  - `TipoDocumento` — enum completo TD01–TD29 con descrizioni
  - `RegimeFiscale` — enum completo RF01–RF20 (aggiunto RF20)
  - `TipoRitenuta` — enum RT01–RT06 (aggiunti RT05, RT06)
  - `TipoCassa` — enum TC01–TC22 (prima regex generica `TC\d{2}`)
  - `CausalePagamento` — enum completo A–ZO (prima regex `[A-Z0-9]{1,2}`)
  - `ModalitaPagamento` — enum MP01–MP23
  - `CondizioniPagamento` — enum TP01–TP03
  - `TipoCessionePrestazione` — enum SC/AB/AC/PR (aggiunto PR)
- **Regole Natura** più precise:
  - `Natura` presente → `AliquotaIVA` deve essere `0` (SDI 00401 / SDI 00430)
  - Codici `N2`, `N3`, `N6` segnalati come deprecati (SDI 00445) — richiedono sottocodice
  - `EsigibilitaIVA = "S"` incompatibile con `Natura = N6.*` (SDI 00420)
- **Validazioni cross-field TipoDocumento** (SDI 00471–00476):
  - TD01/TD06/TD24/TD25: almeno un soggetto con `IdPaese = "IT"`
  - TD16–TD20/TD22–TD23/TD28: cedente ≠ cessionario
  - TD17–TD19: cedente non può avere `IdPaese = "IT"`
  - TD21/TD27: cedente = cessionario; TD21 vieta `AliquotaIVA = 0`
  - TD28: cedente deve avere `IdPaese = "SM"`
  - TD16–TD20/TD22–TD23/TD28–TD29: cessionario deve avere `IdFiscaleIVA`
- Tipi `DatiRitenuta.TipoRitenuta` e `DatiRitenuta.CausalePagamento` ora usano i nuovi union type
- Tipo `DatiCassaPrevidenziale.TipoCassa` ora usa `TipoCassa` invece di `string`
- Tipo `DettaglioLinee.TipoCessionePrestazione` include `"PR"`

---

## [0.1.0] — 2026-05-18

### Aggiunto
- Struttura progetto TypeScript con tsup (CJS + ESM + `.d.ts`)
- API pubblica: `buildXml()` e `validate()` con pattern `Result<T, E>`
- Tipi completi per FatturaPA v1.7.1 Header e Body
- Builder XML modulare (`src/builder/sections/`)
- Validator modulare (`src/validator/rules/` + `src/validator/rules/body/`)
- Validazione Header:
  - `DatiTrasmissione`: IdTrasmittente, ProgressivoInvio, FormatoTrasmissione, CodiceDestinatario
  - `CodiceDestinatario` cross-field: 6 char FPA12, 7 char FPR12, `"XXXXXXX"` per esteri
  - `CedentePrestatore` / `CessionarioCommittente`: P.IVA, CF, Anagrafica, Sede, Indirizzo
  - Placeholder `"OO99999999999"` per cessionari extra-UE senza identificativo
- Validazione Body:
  - `DatiGeneraliDocumento`: TipoDocumento, Divisa ISO 4217, Data, Numero fattura
  - `DatiRitenuta`, `DatiBollo`, `DatiCassaPrevidenziale`, `ScontoMaggiorazione`
  - `DatiDocumentoCorrelato` (OrdineAcquisto, Contratto, Convenzione, Ricezione, FattureCollegate)
  - `DatiDDT`, `FatturaPrincipale`
  - `DettaglioLinee`: NumeroLinea sequenziale, Quantita ≠ 0, periodi, CodiceArticolo
  - `DatiRiepilogo`: MISSING_NATURA, coerenza Imposta (±0.01)
  - `DatiPagamento` / `DettaglioPagamento`: IBAN, BIC, ABI/CAB
  - `DatiVeicoli`, `Allegati`
- Suite di test completa (104 test, ts-jest)
- Script `try.ts` per test manuale
