import type { CedentePrestatore, Indirizzo } from '../../../types/index.js';
import type { FieldError } from '../../../errors/index.js';
import {
  required,
  maxLength,
  paese,
  partitaIvaIT,
  codiceFiscaleIT,
  cap,
  provincia,
  pattern,
  enumValue,
} from '../types.js';
import { REGIME_FISCALE } from '../../../enums.js';

const BASE = 'FatturaElettronicaHeader.CedentePrestatore';

function validateIndirizzo(sede: Indirizzo, path: string): FieldError[] {
  const errors: FieldError[] = [];

  errors.push(...required(sede.Indirizzo, `${path}.Indirizzo`));
  errors.push(...maxLength(sede.Indirizzo, 60, `${path}.Indirizzo`));

  errors.push(...maxLength(sede.NumeroCivico, 8, `${path}.NumeroCivico`));

  errors.push(...required(sede.CAP, `${path}.CAP`));
  // CAP: 5 cifre solo per nazione IT — per l'estero formato libero (UK SW1A1AA, CA K1A0B1, ecc.)
  if (sede.Nazione === 'IT') {
    errors.push(...cap(sede.CAP, `${path}.CAP`));
  } else {
    errors.push(...maxLength(sede.CAP, 10, `${path}.CAP`));
  }

  errors.push(...required(sede.Comune, `${path}.Comune`));
  errors.push(...maxLength(sede.Comune, 60, `${path}.Comune`));

  // Provincia: obbligatoria e 2 lettere maiuscole per nazione IT
  if (sede.Nazione === 'IT') {
    if (!sede.Provincia) {
      errors.push({ field: `${path}.Provincia`, code: 'MISSING_REQUIRED_FIELD', message: 'Provincia obbligatoria per nazione IT' });
    } else {
      errors.push(...provincia(sede.Provincia, `${path}.Provincia`));
    }
  } else if (sede.Provincia !== undefined) {
    errors.push(...maxLength(sede.Provincia, 2, `${path}.Provincia`));
  }

  errors.push(...required(sede.Nazione, `${path}.Nazione`));
  errors.push(...paese(sede.Nazione, `${path}.Nazione`));

  return errors;
}

export function validateCedentePrestatore(cp: CedentePrestatore): FieldError[] {
  const errors: FieldError[] = [];
  const da = cp.DatiAnagrafici;

  // IdFiscaleIVA
  errors.push(...required(da.IdFiscaleIVA.IdPaese, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdPaese`));
  errors.push(...paese(da.IdFiscaleIVA.IdPaese, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdPaese`));

  errors.push(...required(da.IdFiscaleIVA.IdCodice, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`));
  // P.IVA italiana: 11 cifre; straniera: max 28 alfanumerici
  if (da.IdFiscaleIVA.IdPaese === 'IT') {
    errors.push(...partitaIvaIT(da.IdFiscaleIVA.IdCodice, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`));
  } else {
    errors.push(...maxLength(da.IdFiscaleIVA.IdCodice, 28, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`));
    errors.push(...pattern(da.IdFiscaleIVA.IdCodice, /^[0-9A-Z]{1,28}$/, `${BASE}.DatiAnagrafici.IdFiscaleIVA.IdCodice`, 'IdCodice estero non valido (ammessi cifre e lettere maiuscole, max 28)'));
  }

  // CodiceFiscale (opzionale)
  if (da.CodiceFiscale) {
    errors.push(...codiceFiscaleIT(da.CodiceFiscale, `${BASE}.DatiAnagrafici.CodiceFiscale`));
  }

  // Anagrafica: Denominazione o Nome+Cognome
  const a = da.Anagrafica;
  const hasDenominazione = !!a.Denominazione?.trim();
  const hasNomeCognome = !!a.Nome?.trim() && !!a.Cognome?.trim();
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

  // RegimeFiscale — presenza + valore ammesso (RF01-RF20)
  errors.push(...required(da.RegimeFiscale, `${BASE}.DatiAnagrafici.RegimeFiscale`));
  errors.push(...enumValue(da.RegimeFiscale, REGIME_FISCALE, `${BASE}.DatiAnagrafici.RegimeFiscale`));

  // Sede
  errors.push(...validateIndirizzo(cp.Sede, `${BASE}.Sede`));

  return errors;
}

// Esportata anche per uso nel validator del cessionario (stesso schema Indirizzo)
export { validateIndirizzo };
