import type { FatturaElettronica, FatturaElettronicaBody } from '../types/index.js';
import type { FatturaElettronicaInput } from './types.js';
import { applyTrasmissioneDefaults } from './trasmissione.defaults.js';
import { applyAnagraficaDefaults }   from './anagrafica.defaults.js';
import { applyDocumentoDefaults }    from './documento.defaults.js';

export type { FatturaElettronicaInput } from './types.js';

/**
 * Applica valori di default deducibili alla fattura.
 *
 * Regole applicate (in ordine):
 * 1. DatiTrasmissione.IdTrasmittente  ← CedentePrestatore.IdFiscaleIVA
 * 2. DatiTrasmissione.FormatoTrasmissione ← "FPR12"
 * 3. DatiTrasmissione.CodiceDestinatario  ← "XXXXXXX" se cessionario estero
 * 4. CessionarioCommittente.IdFiscaleIVA.IdCodice ← "OO99999999999" se estero senza codice
 * 5. CessionarioCommittente.Sede.CAP ← "00000" se estero senza CAP
 * 6. DatiGeneraliDocumento.Divisa ← "EUR"
 * 7. DatiGeneraliDocumento.Data   ← data odierna (YYYY-MM-DD)
 * 8. DatiRiepilogo.Imposta        ← calcolata da ImponibileImporto × AliquotaIVA / 100
 *
 * I campi già valorizzati NON vengono sovrascritti.
 * La funzione modifica l'oggetto in-place e lo restituisce tipizzato come FatturaElettronica.
 */
export function applyDefaults(input: FatturaElettronicaInput): FatturaElettronica {
  const fattura = input as unknown as FatturaElettronica;

  applyTrasmissioneDefaults(fattura.FatturaElettronicaHeader);
  applyAnagraficaDefaults(fattura.FatturaElettronicaHeader);

  const bodies: FatturaElettronicaBody[] = Array.isArray(fattura.FatturaElettronicaBody)
    ? fattura.FatturaElettronicaBody
    : [fattura.FatturaElettronicaBody];

  for (const body of bodies) {
    applyDocumentoDefaults(body);
  }

  return fattura;
}
