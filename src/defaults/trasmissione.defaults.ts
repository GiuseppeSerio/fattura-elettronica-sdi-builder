import type { FatturaElettronicaHeader } from '../types/index.js';

/**
 * Deduce IdTrasmittente da CedentePrestatore se non fornito.
 * L'emittente della fattura è di norma il cedente/prestatore stesso.
 */
export function applyTrasmissioneDefaults(header: FatturaElettronicaHeader): void {
  const dt = header.DatiTrasmissione;

  if (!dt.IdTrasmittente?.IdCodice?.trim()) {
    const iva = header.CedentePrestatore.DatiAnagrafici.IdFiscaleIVA;
    if (iva?.IdPaese && iva?.IdCodice) {
      dt.IdTrasmittente = { IdPaese: iva.IdPaese, IdCodice: iva.IdCodice };
    }
  }

  if (!dt.FormatoTrasmissione) {
    dt.FormatoTrasmissione = 'FPR12';
  }

  // CodiceDestinatario: se cessionario estero e non impostato → "XXXXXXX"
  if (!dt.CodiceDestinatario) {
    const cessIdPaese = header.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA?.IdPaese;
    if (cessIdPaese && cessIdPaese !== 'IT') {
      dt.CodiceDestinatario = 'XXXXXXX';
    }
  }
}
