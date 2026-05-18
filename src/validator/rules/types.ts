import type { FieldError } from '../../errors/index.js';

export type Rule<T> = (value: T, path: string) => FieldError[];

// ---- Presenza ---------------------------------------------------------------

export function required(value: string | undefined | null, field: string): FieldError[] {
  if (!value || value.trim() === '') {
    return [{ field, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' }];
  }
  return [];
}

// ---- Lunghezza --------------------------------------------------------------

export function maxLength(value: string | undefined, max: number, field: string): FieldError[] {
  if (!value) return [];
  if (value.length > max) {
    return [{
      field,
      code: 'EXCEEDS_MAX_LENGTH',
      message: `Lunghezza massima ${max} caratteri (ricevuti ${value.length})`,
    }];
  }
  return [];
}

export function exactLength(value: string | undefined, len: number, field: string): FieldError[] {
  if (!value) return [];
  if (value.length !== len) {
    return [{
      field,
      code: 'INVALID_LENGTH',
      message: `Lunghezza esatta richiesta: ${len} caratteri (ricevuti ${value.length})`,
    }];
  }
  return [];
}

export function minMaxLength(value: string | undefined, min: number, max: number, field: string): FieldError[] {
  if (!value) return [];
  if (value.length < min || value.length > max) {
    return [{
      field,
      code: 'INVALID_LENGTH',
      message: `Lunghezza richiesta tra ${min} e ${max} caratteri (ricevuti ${value.length})`,
    }];
  }
  return [];
}

// ---- Pattern / formato ------------------------------------------------------

export function pattern(
  value: string | undefined,
  regex: RegExp,
  field: string,
  message: string,
): FieldError[] {
  if (!value) return [];
  if (!regex.test(value)) {
    return [{ field, code: 'INVALID_FORMAT', message }];
  }
  return [];
}

export function dateFormat(value: string | undefined, field: string): FieldError[] {
  if (!value) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return [{ field, code: 'INVALID_DATE_FORMAT', message: 'Formato data non valido (atteso YYYY-MM-DD)' }];
  }
  return [];
}

// ---- Regole riutilizzabili da XSD ------------------------------------------

/** ISO 3166-1 alpha-2: esattamente 2 lettere maiuscole */
export function paese(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^[A-Z]{2}$/, field, 'Codice nazione non valido (atteso ISO 3166-1 alpha-2, es. "IT")');
}

/** Partita IVA italiana: 11 cifre */
export function partitaIvaIT(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^\d{11}$/, field, 'Partita IVA italiana non valida (attese 11 cifre)');
}

/** Codice fiscale italiano: 11 cifre (società) o 16 alfanumerici (persona fisica) */
export function codiceFiscaleIT(value: string | undefined, field: string): FieldError[] {
  return pattern(
    value,
    /^([0-9]{11}|[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z])$/,
    field,
    'Codice fiscale non valido (attese 11 cifre o 16 caratteri alfanumerici)',
  );
}

/** CAP italiano: esattamente 5 cifre */
export function cap(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^\d{5}$/, field, 'CAP non valido (attese 5 cifre)');
}

/** Sigla provincia italiana: esattamente 2 lettere maiuscole */
export function provincia(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^[A-Z]{2}$/, field, 'Provincia non valida (attese 2 lettere maiuscole, es. "RM")');
}

/** IBAN: 2 lettere + 2 cifre + 1-30 alfanumerici (max 34 caratteri) */
export function iban(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, field, 'IBAN non valido');
}

/** BIC/SWIFT: 8 o 11 caratteri alfanumerici */
export function bic(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^[A-Z0-9]{8}([A-Z0-9]{3})?$/, field, 'BIC/SWIFT non valido (attesi 8 o 11 caratteri)');
}

// ---- Valori numerici --------------------------------------------------------

/** Valore deve essere > 0 */
export function positiveNumber(value: number | undefined, field: string): FieldError[] {
  if (value === undefined) return [];
  if (value <= 0) {
    return [{ field, code: 'INVALID_VALUE', message: `Il valore deve essere maggiore di 0 (ricevuto ${value})` }];
  }
  return [];
}

/** Valore deve essere >= 0 */
export function nonNegativeNumber(value: number | undefined, field: string): FieldError[] {
  if (value === undefined) return [];
  if (value < 0) {
    return [{ field, code: 'INVALID_VALUE', message: `Il valore deve essere >= 0 (ricevuto ${value})` }];
  }
  return [];
}

/** Percentuale deve essere compresa tra 0 e 100 */
export function percentuale(value: number | undefined, field: string): FieldError[] {
  if (value === undefined) return [];
  if (value < 0 || value > 100) {
    return [{ field, code: 'INVALID_VALUE', message: `La percentuale deve essere tra 0 e 100 (ricevuto ${value})` }];
  }
  return [];
}

/** Valuta ISO 4217: esattamente 3 lettere maiuscole */
export function isoValuta(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^[A-Z]{3}$/, field, 'Codice valuta non valido (atteso ISO 4217, es. "EUR")');
}

/** Numero fattura SDI: alfanumerico + / e - max 20 caratteri */
export function numeroFattura(value: string | undefined, field: string): FieldError[] {
  return [
    ...maxLength(value, 20, field),
    ...pattern(value, /^[a-zA-Z0-9/\-]{1,20}$/, field, 'Numero documento non valido (caratteri ammessi: lettere, cifre, / e -)'),
  ];
}

/** Codice destinatario SDI: esattamente 7 caratteri alfanumerici maiuscoli */
export function codiceDestinatario(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^[A-Z0-9]{7}$/, field, 'CodiceDestinatario non valido (attesi 7 caratteri alfanumerici maiuscoli)');
}

/** Valore deve essere uno dei valori ammessi dall'enum */
export function enumValue(
  value: string | undefined,
  allowed: readonly string[],
  field: string,
): FieldError[] {
  if (!value) return [];
  if (!(allowed as readonly string[]).includes(value)) {
    return [{
      field,
      code: 'INVALID_VALUE',
      message: `Valore non valido: "${value}". Valori ammessi: ${allowed.join(', ')}`,
    }];
  }
  return [];
}

/** ProgressivoInvio: max 10 caratteri alfanumerici */
export function progressivoInvio(value: string | undefined, field: string): FieldError[] {
  return [
    ...maxLength(value, 10, field),
    ...pattern(value, /^[a-zA-Z0-9]{1,10}$/, field, 'ProgressivoInvio non valido (max 10 caratteri alfanumerici)'),
  ];
}
