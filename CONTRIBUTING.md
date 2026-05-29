# Contributing

Grazie per voler contribuire a `fattura-elettronica-sdi-builder`. Questo documento spiega come ottenere il repository, eseguire i test, capire la struttura del codice e aggiungere nuove regole di validazione o nuovi blocchi XML.

---

## Come iniziare

### Clonare e installare

```bash
git clone https://github.com/GiuseppeSerio/fattura-elettronica-sdi-builder.git
cd fattura-elettronica-sdi-builder
npm install
```

### Eseguire i test

```bash
npm test              # esegue l'intera suite
npm run test:watch    # modalità watch
npm run test:coverage # con coverage report
```

I test sono scritti in Jest e divisi in:

- `__tests__/rules.test.ts` — helper di validazione atomici (`required`, `maxLength`, `iban`, ecc.)
- `__tests__/validator.test.ts` — validatore end-to-end (header + body + cross-field)
- `__tests__/body.rules.test.ts` — regole di sezione del body
- `__tests__/builder.test.ts` — generazione XML
- `__tests__/e2e.test.ts` — scenari realistici (B2B, B2C, PA, estero, autofatture, …)
- `__tests__/bug-hunting.test.ts` + `bug-hunting-2.test.ts` — casi limite e mutation testing

### Type-check e lint

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
```

### Build

```bash
npm run build         # genera dist/ in CJS + ESM con dichiarazioni .d.ts
```

---

## Architettura

```
src/
├── enums.ts                       ← enum centrali (NATURA, TIPO_DOCUMENTO, …) con type literal derivati
├── result.ts                      ← Result<T,E>, ok(), err()
├── errors/
│   ├── codes.ts                   ← ErrorCode (const object)
│   ├── FatturaError.ts            ← FatturaError | ValidationError | BuildError
│   └── index.ts
├── builder/
│   ├── sections/                  ← un modulo per blocco XML FatturaPA
│   │   ├── trasmissione.ts
│   │   ├── cedente.ts
│   │   ├── cessionario.ts
│   │   ├── dati-generali.ts
│   │   ├── linee.ts
│   │   ├── riepilogo.ts
│   │   ├── pagamento.ts
│   │   └── indirizzo.ts
│   ├── header.builder.ts
│   ├── body.builder.ts
│   └── index.ts                   ← buildXml() → Result<string, BuildError>
├── validator/
│   ├── rules/
│   │   ├── types.ts               ← helper di rule generici (required, maxLength, pattern, …)
│   │   ├── header.rules.ts        ← cross-rules header (validateCodiceDestinatario)
│   │   ├── header/                ← regole atomiche per ogni sezione header
│   │   │   ├── trasmissione.rules.ts
│   │   │   ├── cedente.rules.ts
│   │   │   └── cessionario.rules.ts
│   │   ├── body.rules.ts          ← cross-rules body + orchestratore validateBody
│   │   └── body/                  ← regole atomiche per ogni sezione body
│   │       ├── dati-generali.rules.ts
│   │       ├── linee.rules.ts
│   │       ├── riepilogo.rules.ts
│   │       ├── pagamento.rules.ts
│   │       └── allegati.rules.ts
│   ├── header.validator.ts        ← orchestratore puro header
│   ├── body.validator.ts          ← orchestratore body + unicità Numero lotto
│   └── index.ts                   ← validate() → Result<void, ValidationError>
├── defaults/                      ← applyDefaults() per campi deducibili
│   ├── trasmissione.defaults.ts
│   ├── anagrafica.defaults.ts
│   ├── documento.defaults.ts
│   ├── types.ts
│   └── index.ts
├── types/                         ← interfacce TypeScript dei nodi FatturaPA
│   ├── common.ts                  ← Nazione, Valuta, IdFiscale, Indirizzo + re-export enum
│   ├── header.ts
│   ├── body.ts
│   └── index.ts
└── index.ts                       ← API pubblica
```

### Convenzioni

- Le **regole atomiche per sezione** stanno sotto `validator/rules/header/` o `validator/rules/body/`.
- Le **cross-rules per livello** (che vedono più sezioni dello stesso livello) stanno in `header.rules.ts` o `body.rules.ts`.
- I **`*.validator.ts`** sono orchestratori minimali: compongono i risultati delle regole in un `FieldError[]`.
- Gli **enum** (codici SDI fissi: `TipoDocumento`, `Natura`, ecc.) vivono **solo** in `src/enums.ts` come `as const`, e i type literal sono derivati con `typeof X[number]`. Niente duplicazione tra type e runtime.

---

## Funzioni helper di validazione (`validator/rules/types.ts`)

| Helper | Codice errore | Descrizione |
|---|---|---|
| `required(v, field)` | `MISSING_REQUIRED_FIELD` | Valore assente, `null`, `undefined` o stringa vuota |
| `maxLength(v, n, field)` | `EXCEEDS_MAX_LENGTH` | Stringa supera `n` caratteri |
| `exactLength(v, n, field)` | `INVALID_LENGTH` | Stringa non è esattamente `n` caratteri |
| `minMaxLength(v, min, max, field)` | `INVALID_LENGTH` | Lunghezza fuori dal range `[min, max]` |
| `pattern(v, regex, field, msg)` | `INVALID_FORMAT` | Valore non corrisponde alla regex |
| `dateFormat(v, field)` | `INVALID_DATE_FORMAT` | Non è `YYYY-MM-DD` o data inesistente nel calendario |
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
| `numericField(v, maxChars, maxDecimals, field)` | `INVALID_FORMAT` / `INVALID_VALUE` | Rifiuta NaN/Infinity, controlla decimali e lunghezza XML serializzata |
| `enumValue(v, allowed, field)` | `INVALID_VALUE` | Valore non presente nell'enum (rispetta `as const`) |

---

## Aggiungere una nuova regola di validazione

Le nuove regole di validazione si aggiungono nel `.rules.ts` della sezione che le riguarda. Esempio: aggiungere un check sull'email del cedente.

```ts
// src/validator/rules/header/cedente.rules.ts
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

Linee guida:

- Riusa gli helper di `validator/rules/types.ts` quando possibile (`pattern`, `maxLength`, `enumValue`, ecc.).
- Se è una **regola cross-field** (dipende da più sezioni dello stesso livello), mettila in `header.rules.ts` o `body.rules.ts`.
- Se è una **regola che dipende dall'intera fattura** (cross-header-body), mettila in `validator/index.ts` dentro `validateCrossField`.
- Aggiungi sempre almeno un test (ok + ko) in `__tests__/` per la regola nuova.
- Se il codice errore non esiste già, aggiungilo a `src/errors/codes.ts`.

---

## Aggiungere un nuovo blocco XML

I builder XML sono modulari: un file per nodo `<...>` significativo, sotto `src/builder/sections/`.

```ts
// src/builder/sections/mio-blocco.ts
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { MioBlocco } from '../../types/index.js';

export function buildMioBlocco(parent: XMLBuilder, data: MioBlocco): void {
  const node = parent.ele('MioBlocco');
  node.ele('Campo').txt(data.campo).up();
  node.up();
}
```

Poi:

1. Esportalo da `src/builder/sections/index.ts`.
2. Importalo e chiamalo nel builder di livello superiore (`header.builder.ts` o `body.builder.ts`) nella posizione corretta dell'ordine XSD.
3. Aggiungi il tipo TS corrispondente in `src/types/header.ts` o `body.ts`.
4. Aggiungi una rule di validazione (vedi sezione sopra) se il nodo ha campi obbligatori o con vincoli.
5. Aggiungi un test in `__tests__/builder.test.ts` che verifichi la presenza del tag nell'output.

Per i numeri serializzati nell'XML, usa `.toFixed(n)` con il numero corretto di decimali richiesto dallo XSD FatturaPA (tipicamente 2 per importi, 8 per quantità e prezzi unitari).

---

## Pull request

- Fai partire i tuoi cambiamenti da `main`, in una branch tematica.
- Verifica che `npm test`, `npm run typecheck` e `npm run lint` passino tutti.
- Includi una breve descrizione della motivazione (caso d'uso, regola SDI, link allo specifico paragrafo della spec FatturaPA se applicabile).
- Per regole nuove, cita il codice errore SDI nei messaggi (es. `(SDI 00423)`) — aiuta chi debugga la fattura a ritrovare la regola sulla documentazione ufficiale.
