# Changelog

Tutte le modifiche significative a questo progetto sono documentate in questo file.  
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.0.0/) e il progetto adotta il [Semantic Versioning](https://semver.org/lang/it/).

---

## [Unreleased]

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
