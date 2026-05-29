import type { FatturaElettronicaHeader } from '../../types/index.js';
import type { FieldError } from '../../errors/index.js';

const CAMPO_CD = 'FatturaElettronicaHeader.DatiTrasmissione.CodiceDestinatario';

/**
 * Cross-field: CodiceDestinatario dipende da FormatoTrasmissione e dalla
 * nazionalità del cessionario. Logica SDI ufficiale:
 *
 * - FPA12 (PA)  → esattamente 6 caratteri [A-Z0-9]
 * - FPR12 (B2B) → esattamente 7 caratteri [A-Z0-9]
 * - Se IdPaese del cessionario ≠ "IT" → deve essere "XXXXXXX" (errore SDI 00313)
 */
export function validateCodiceDestinatario(header: FatturaElettronicaHeader): FieldError[] {
  const errors: FieldError[] = [];
  const cd      = header.DatiTrasmissione.CodiceDestinatario;
  const formato = header.DatiTrasmissione.FormatoTrasmissione;
  const idPaese = header.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA?.IdPaese;

  if (!cd) return errors; // assenza già segnalata da validateDatiTrasmissione

  // Regola esteri: se cessionario non italiano il codice deve essere "XXXXXXX"
  if (idPaese && idPaese !== 'IT') {
    if (cd !== 'XXXXXXX') {
      errors.push({
        field: CAMPO_CD,
        code: 'INVALID_VALUE',
        message: 'Per destinatari esteri (IdPaese ≠ "IT") CodiceDestinatario deve essere "XXXXXXX" (SDI errore 00313)',
      });
    }
    return errors; // le altre regole di lunghezza non si applicano
  }

  // Regola lunghezza per formato
  if (formato === 'FPA12') {
    if (!/^[A-Z0-9]{6}$/.test(cd)) {
      errors.push({
        field: CAMPO_CD,
        code: 'INVALID_FORMAT',
        message: 'Con FormatoTrasmissione FPA12 (PA) CodiceDestinatario deve essere di 6 caratteri [A-Z0-9] (codice IPA)',
      });
    }
  } else if (formato === 'FPR12') {
    if (!/^[A-Z0-9]{7}$/.test(cd)) {
      errors.push({
        field: CAMPO_CD,
        code: 'INVALID_FORMAT',
        message: 'Con FormatoTrasmissione FPR12 (B2B) CodiceDestinatario deve essere di 7 caratteri [A-Z0-9]',
      });
    }
  }

  return errors;
}
