export const ErrorCode = {
  // Presenza
  MISSING_REQUIRED_FIELD:   'MISSING_REQUIRED_FIELD',
  MISSING_NATURA:           'MISSING_NATURA',          // AliquotaIVA=0 senza Natura
  MISSING_ANAGRAFICA:       'MISSING_ANAGRAFICA',      // né Denominazione né Nome+Cognome
  MISSING_IDENTIFIER:       'MISSING_IDENTIFIER',      // né IdFiscaleIVA né CodiceFiscale
  EMPTY_COLLECTION:         'EMPTY_COLLECTION',        // array obbligatorio vuoto

  // Formato / pattern
  INVALID_FORMAT:           'INVALID_FORMAT',          // non rispetta il pattern XSD
  INVALID_DATE_FORMAT:      'INVALID_DATE_FORMAT',     // data non YYYY-MM-DD

  // Lunghezza
  EXCEEDS_MAX_LENGTH:       'EXCEEDS_MAX_LENGTH',      // supera il massimo caratteri
  INVALID_LENGTH:           'INVALID_LENGTH',          // lunghezza esatta non rispettata

  // Valore semantico
  INVALID_VALUE:            'INVALID_VALUE',           // valore fuori range o incoerente con altri campi

  // Build
  BUILD_FAILED:             'BUILD_FAILED',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
