import type { FatturaElettronica, FatturaElettronicaBody } from '../types/index.js';
import type { FieldError } from '../errors/index.js';
import type { Result } from '../result.js';
import { ok, err } from '../result.js';
import { ValidationError } from '../errors/index.js';
import { validateHeader } from './header.validator.js';
import { validateBodies } from './body.validator.js';

// TipoDocumento che richiedono CessionarioCommittente con IdFiscaleIVA (SDI 00475)
const SELF_INVOICE_CESSIONARIO_IVA = new Set(['TD16','TD17','TD18','TD19','TD20','TD22','TD23','TD28','TD29']);
// TipoDocumento in cui cedente ≠ cessionario (SDI 00471)
const SELF_INVOICE_DIVERSI         = new Set(['TD16','TD17','TD18','TD19','TD20','TD22','TD23','TD28']);
// TipoDocumento in cui cedente = cessionario (SDI 00472)
const SELF_INVOICE_STESSI          = new Set(['TD21','TD27']);
// TipoDocumento per cui almeno uno tra cedente/cessionario deve essere IT (SDI 00476)
const REQUIRE_ONE_IT               = new Set(['TD01','TD06','TD24','TD25']);
// TipoDocumento per cui il cedente non può essere IT (SDI 00473)
const CEDENTE_NON_IT               = new Set(['TD17','TD18','TD19']);

function validateCrossField(fattura: FatturaElettronica): FieldError[] {
  const errors: FieldError[] = [];
  const header     = fattura.FatturaElettronicaHeader;
  const cedente    = header.CedentePrestatore;
  const cessionario = header.CessionarioCommittente;
  const bodies: FatturaElettronicaBody[] = Array.isArray(fattura.FatturaElettronicaBody)
    ? fattura.FatturaElettronicaBody
    : [fattura.FatturaElettronicaBody];

  const cedenteIdPaese  = cedente.DatiAnagrafici.IdFiscaleIVA?.IdPaese   ?? '';
  const cedenteIdCodice = cedente.DatiAnagrafici.IdFiscaleIVA?.IdCodice  ?? '';
  const cessIdPaese     = cessionario.DatiAnagrafici.IdFiscaleIVA?.IdPaese  ?? '';
  const cessIdCodice    = cessionario.DatiAnagrafici.IdFiscaleIVA?.IdCodice ?? '';
  const cedenteKey      = `${cedenteIdPaese}${cedenteIdCodice}`;
  const cessionarioKey  = `${cessIdPaese}${cessIdCodice}`;

  bodies.forEach((body, i) => {
    const tipo  = body.DatiGenerali.DatiGeneraliDocumento.TipoDocumento;
    const field = `FatturaElettronicaBody[${i}].DatiGenerali.DatiGeneraliDocumento.TipoDocumento`;

    // Almeno uno tra cedente/cessionario deve avere IdPaese "IT" (SDI 00476)
    if (REQUIRE_ONE_IT.has(tipo) && cedenteIdPaese !== 'IT' && cessIdPaese !== 'IT') {
      errors.push({ field, code: 'INVALID_VALUE',
        message: `Con ${tipo} almeno uno tra CedentePrestatore e CessionarioCommittente deve avere IdPaese "IT" (SDI 00476)` });
    }

    // Cedente ≠ Cessionario per autofatture (SDI 00471)
    if (SELF_INVOICE_DIVERSI.has(tipo) && cedenteKey && cedenteKey === cessionarioKey) {
      errors.push({ field, code: 'INVALID_VALUE',
        message: `Con ${tipo} CedentePrestatore e CessionarioCommittente devono essere soggetti diversi (SDI 00471)` });
    }

    // Cedente = Cessionario per autoconsumo/splafonamento (SDI 00472)
    if (SELF_INVOICE_STESSI.has(tipo) && cedenteKey && cedenteKey !== cessionarioKey) {
      errors.push({ field, code: 'INVALID_VALUE',
        message: `Con ${tipo} CedentePrestatore e CessionarioCommittente devono coincidere (SDI 00472)` });
    }

    // Cedente non può essere IT (SDI 00473)
    if (CEDENTE_NON_IT.has(tipo) && cedenteIdPaese === 'IT') {
      errors.push({ field, code: 'INVALID_VALUE',
        message: `Con ${tipo} (acquisto dall'estero) il CedentePrestatore non può avere IdPaese "IT" (SDI 00473)` });
    }

    // TD28: cedente deve essere San Marino (SDI 00473)
    if (tipo === 'TD28' && cedenteIdPaese !== 'SM') {
      errors.push({ field, code: 'INVALID_VALUE',
        message: 'Con TD28 il CedentePrestatore deve avere IdPaese "SM" (San Marino) (SDI 00473)' });
    }

    // TD21: AliquotaIVA non può essere 0 su nessuna riga (SDI 00474)
    if (tipo === 'TD21') {
      const zeroIVA = body.DatiBeniServizi.DettaglioLinee.some(l => l.AliquotaIVA === 0);
      if (zeroIVA) {
        errors.push({ field, code: 'INVALID_VALUE',
          message: 'Con TD21 (splafonamento) AliquotaIVA non può essere 0 su nessuna riga (SDI 00474)' });
      }
    }

    // Autofatture: CessionarioCommittente deve avere IdFiscaleIVA (SDI 00475)
    if (SELF_INVOICE_CESSIONARIO_IVA.has(tipo) && !cessIdCodice.trim()) {
      errors.push({
        field: 'FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA',
        code: 'MISSING_REQUIRED_FIELD',
        message: `Con ${tipo} il CessionarioCommittente deve avere IdFiscaleIVA valorizzato (SDI 00475)`,
      });
    }
  });

  return errors;
}

export function validate(fattura: FatturaElettronica): Result<void, ValidationError> {
  const errors = [
    ...validateHeader(fattura.FatturaElettronicaHeader),
    ...validateBodies(fattura.FatturaElettronicaBody),
    ...validateCrossField(fattura),
  ];

  return errors.length === 0 ? ok(undefined) : err(new ValidationError(errors));
}
