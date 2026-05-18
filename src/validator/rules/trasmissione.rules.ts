import type { DatiTrasmissione } from '../../types/index.js';
import type { FieldError } from '../../errors/index.js';
import {
  required,
  paese,
  maxLength,
  progressivoInvio,
  pattern,
} from './types.js';

const BASE = 'FatturaElettronicaHeader.DatiTrasmissione';

export function validateDatiTrasmissione(dt: DatiTrasmissione): FieldError[] {
  const errors: FieldError[] = [];

  // IdTrasmittente.IdPaese — [A-Z]{2}
  errors.push(...required(dt.IdTrasmittente.IdPaese, `${BASE}.IdTrasmittente.IdPaese`));
  errors.push(...paese(dt.IdTrasmittente.IdPaese, `${BASE}.IdTrasmittente.IdPaese`));

  // IdTrasmittente.IdCodice — max 28 caratteri alfanumerici
  errors.push(...required(dt.IdTrasmittente.IdCodice, `${BASE}.IdTrasmittente.IdCodice`));
  errors.push(...maxLength(dt.IdTrasmittente.IdCodice, 28, `${BASE}.IdTrasmittente.IdCodice`));
  errors.push(...pattern(dt.IdTrasmittente.IdCodice, /^[0-9A-Z]{1,28}$/, `${BASE}.IdTrasmittente.IdCodice`, 'IdCodice non valido (ammessi cifre e lettere maiuscole, max 28)'));

  // ProgressivoInvio — max 10, alfanumerico
  errors.push(...required(dt.ProgressivoInvio, `${BASE}.ProgressivoInvio`));
  errors.push(...progressivoInvio(dt.ProgressivoInvio, `${BASE}.ProgressivoInvio`));

  // FormatoTrasmissione — già tipizzato come 'FPR12' | 'FPA12', solo presenza
  errors.push(...required(dt.FormatoTrasmissione, `${BASE}.FormatoTrasmissione`));

  // CodiceDestinatario — solo presenza qui; la lunghezza dipende da FormatoTrasmissione
  // e la regola "XXXXXXX" per esteri dipende dal CessionarioCommittente.
  // Il check completo viene fatto in header.validator.ts (cross-field).
  errors.push(...required(dt.CodiceDestinatario, `${BASE}.CodiceDestinatario`));

  // PECDestinatario — max 256 caratteri (se presente)
  errors.push(...maxLength(dt.PECDestinatario, 256, `${BASE}.PECDestinatario`));

  return errors;
}
