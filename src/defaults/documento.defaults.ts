import type { FatturaElettronicaBody } from '../types/index.js';

function today(): string {
  return new Date().toISOString().split('T')[0]!;
}

function roundHalf(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Deduce valori del documento:
 * - Divisa → "EUR"
 * - Data   → data odierna
 * - DatiRiepilogo.Imposta → calcolata da ImponibileImporto × AliquotaIVA / 100
 *                           (o 0 se Natura è presente)
 */
export function applyDocumentoDefaults(body: FatturaElettronicaBody): void {
  const dgd = body.DatiGenerali.DatiGeneraliDocumento;

  if (!dgd.Divisa) {
    dgd.Divisa = 'EUR';
  }

  if (!dgd.Data) {
    dgd.Data = today();
  }

  // Calcola Imposta per ogni riga di riepilogo in cui manca
  for (const r of body.DatiBeniServizi.DatiRiepilogo) {
    if (r.Imposta === undefined || r.Imposta === null) {
      if (r.Natura) {
        r.Imposta = 0;
      } else if (r.ImponibileImporto !== undefined && r.AliquotaIVA !== undefined) {
        r.Imposta = roundHalf((r.ImponibileImporto * r.AliquotaIVA) / 100);
      }
    }
  }
}
