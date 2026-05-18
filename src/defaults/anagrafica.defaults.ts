import type { FatturaElettronicaHeader } from '../types/index.js';

const EXTRA_EU_ID_CODICE = 'OO99999999999';

/**
 * Deduce valori anagrafici mancanti per cessionari esteri.
 */
export function applyAnagraficaDefaults(header: FatturaElettronicaHeader): void {
  const cc  = header.CessionarioCommittente;
  const iva = cc.DatiAnagrafici.IdFiscaleIVA;

  if (iva) {
    // IdCodice mancante per soggetto non-IT → placeholder extra-UE SDI
    if (iva.IdPaese && iva.IdPaese !== 'IT' && !iva.IdCodice?.trim()) {
      iva.IdCodice = EXTRA_EU_ID_CODICE;
    }
  }

  // Sede.CAP mancante per paesi senza CAP → "00000" (valore convenzionale SDI)
  const sede = cc.Sede;
  if (sede && sede.Nazione && sede.Nazione !== 'IT' && !sede.CAP?.trim()) {
    sede.CAP = '00000';
  }
}
