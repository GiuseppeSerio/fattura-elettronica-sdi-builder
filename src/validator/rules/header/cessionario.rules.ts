import type { CessionarioCommittente } from '../../../types/index.js';
import type { FieldError } from '../../../errors/index.js';
import {
  required,
  maxLength,
  paese,
  partitaIvaIT,
  codiceFiscaleIT,
  pattern,
} from '../types.js';
import { validateIndirizzo } from './cedente.rules.js';

const BASE = 'FatturaElettronicaHeader.CessionarioCommittente';

// Placeholder SDI per clienti extra-UE privi di P.IVA o CF europeo
const EXTRA_EU_ID_CODICE = 'OO99999999999';
const EXTRA_EU_ID_PAESE  = 'OO';

export function validateCessionarioCommittente(cc: CessionarioCommittente): FieldError[] {
  const errors: FieldError[] = [];
  const da = cc.DatiAnagrafici;

  // Identificativo: IdFiscaleIVA oppure CodiceFiscale
  const hasIVA = !!da.IdFiscaleIVA?.IdCodice?.trim();
  const hasCF  = !!da.CodiceFiscale?.trim();
  if (!hasIVA && !hasCF) {
    errors.push({
      field: `${BASE}.DatiAnagrafici`,
      code: 'MISSING_IDENTIFIER',
      message: 'Obbligatorio: IdFiscaleIVA oppure CodiceFiscale',
    });
  }

  if (da.IdFiscaleIVA) {
    const idPaese = da.IdFiscaleIVA.IdPaese;
    const idCodice = da.IdFiscaleIVA.IdCodice;

    errors.push(...required(idPaese, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdPaese`));
    // "OO" è il codice paese SDI per nazione sconosciuta (extra-UE senza ISO disponibile)
    if (idPaese && idPaese !== EXTRA_EU_ID_PAESE) {
      errors.push(...paese(idPaese, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdPaese`));
    }

    errors.push(...required(idCodice, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`));
    if (idPaese === 'IT') {
      errors.push(...partitaIvaIT(idCodice, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`));
    } else if (idCodice && idCodice !== EXTRA_EU_ID_CODICE) {
      // Codice non è il placeholder extra-UE: valida come identificativo estero normale
      errors.push(...maxLength(idCodice, 28, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`));
      errors.push(...pattern(idCodice, /^[0-9A-Z]{1,28}$/, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`, 'IdCodice estero non valido (ammessi cifre e lettere maiuscole, max 28)'));
    }
    // Se idCodice === EXTRA_EU_ID_CODICE: placeholder valido, nessuna validazione formato aggiuntiva
  }

  if (da.CodiceFiscale) {
    errors.push(...codiceFiscaleIT(da.CodiceFiscale, `${BASE}.DatiAnagrafici.CodiceFiscale`));
  }

  // Anagrafica
  const a = da.Anagrafica;
  const hasDenominazione = !!a.Denominazione?.trim();
  const hasNomeCognome   = !!a.Nome?.trim() && !!a.Cognome?.trim();
  if (!hasDenominazione && !hasNomeCognome) {
    errors.push({
      field: `${BASE}.DatiAnagrafici.Anagrafica`,
      code: 'MISSING_ANAGRAFICA',
      message: 'Obbligatorio: Denominazione oppure Nome+Cognome',
    });
  }
  errors.push(...maxLength(a.Denominazione, 80, `${BASE}.DatiAnagrafici.Anagrafica.Denominazione`));
  errors.push(...maxLength(a.Nome, 60, `${BASE}.DatiAnagrafici.Anagrafica.Nome`));
  errors.push(...maxLength(a.Cognome, 60, `${BASE}.DatiAnagrafici.Anagrafica.Cognome`));

  // Sede
  errors.push(...validateIndirizzo(cc.Sede, `${BASE}.Sede`));

  return errors;
}
