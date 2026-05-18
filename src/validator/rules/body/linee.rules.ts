import type { DettaglioLinee, ScontoMaggiorazione } from '../../../types/index.js';
import type { FieldError } from '../../../errors/index.js';
import { required, maxLength, dateFormat, percentuale, enumValue } from '../types.js';
import { TIPO_CESSIONE_PRESTAZIONE, NATURA_DEPRECATA } from '../enums.js';

const PRICE_TOLERANCE = 0.01; // ±1 centesimo (SDI 00423)

function roundHalf(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcola il PrezzoTotale atteso applicando ScontoMaggiorazione in cascata
 * su PrezzoUnitario × Quantita.
 */
function calcolaPrezzoTotaleAtteso(linea: DettaglioLinee): number | undefined {
  if (linea.PrezzoUnitario === undefined || linea.Quantita === undefined) return undefined;
  let base = linea.PrezzoUnitario * linea.Quantita;
  for (const sm of linea.ScontoMaggiorazione ?? []) {
    if (sm.Percentuale !== undefined) {
      base = sm.Tipo === 'SC' ? base - base * sm.Percentuale / 100 : base + base * sm.Percentuale / 100;
    } else if (sm.Importo !== undefined) {
      base = sm.Tipo === 'SC' ? base - sm.Importo : base + sm.Importo;
    }
  }
  return roundHalf(base);
}

function validateScontoMaggiorazione(sm: ScontoMaggiorazione, path: string): FieldError[] {
  const errors: FieldError[] = [];
  if (sm.Percentuale === undefined && sm.Importo === undefined) {
    errors.push({ field: path, code: 'MISSING_REQUIRED_FIELD', message: 'Obbligatorio: Percentuale oppure Importo' });
  }
  errors.push(...percentuale(sm.Percentuale, `${path}.Percentuale`));
  return errors;
}

function validateSingolaLinea(linea: DettaglioLinee, path: string): FieldError[] {
  const errors: FieldError[] = [];

  if (linea.NumeroLinea < 1) {
    errors.push({ field: `${path}.NumeroLinea`, code: 'INVALID_VALUE', message: 'NumeroLinea deve essere >= 1' });
  }

  if (linea.TipoCessionePrestazione !== undefined) {
    errors.push(...enumValue(linea.TipoCessionePrestazione, TIPO_CESSIONE_PRESTAZIONE, `${path}.TipoCessionePrestazione`));
  }

  for (const [i, cod] of (linea.CodiceArticolo ?? []).entries()) {
    const cp = `${path}.CodiceArticolo[${i}]`;
    errors.push(...required(cod.CodiceTipo, `${cp}.CodiceTipo`));
    errors.push(...maxLength(cod.CodiceTipo, 35, `${cp}.CodiceTipo`));
    errors.push(...required(cod.CodiceValore, `${cp}.CodiceValore`));
    errors.push(...maxLength(cod.CodiceValore, 35, `${cp}.CodiceValore`));
  }

  errors.push(...required(linea.Descrizione, `${path}.Descrizione`));
  errors.push(...maxLength(linea.Descrizione, 1000, `${path}.Descrizione`));

  if (linea.Quantita !== undefined && linea.Quantita === 0) {
    errors.push({ field: `${path}.Quantita`, code: 'INVALID_VALUE', message: 'Quantita non può essere 0' });
  }
  errors.push(...maxLength(linea.UnitaMisura, 10, `${path}.UnitaMisura`));

  errors.push(...dateFormat(linea.DataInizioPeriodo, `${path}.DataInizioPeriodo`));
  errors.push(...dateFormat(linea.DataFinePeriodo, `${path}.DataFinePeriodo`));
  if (linea.DataInizioPeriodo && linea.DataFinePeriodo && linea.DataFinePeriodo < linea.DataInizioPeriodo) {
    errors.push({ field: `${path}.DataFinePeriodo`, code: 'INVALID_VALUE', message: 'DataFinePeriodo non può essere precedente a DataInizioPeriodo' });
  }

  if (linea.PrezzoUnitario === undefined) errors.push({ field: `${path}.PrezzoUnitario`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });

  if (linea.PrezzoTotale === undefined) {
    errors.push({ field: `${path}.PrezzoTotale`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  } else if (linea.PrezzoUnitario !== undefined && linea.Quantita !== undefined) {
    const atteso = calcolaPrezzoTotaleAtteso(linea);
    if (atteso !== undefined && Math.abs(linea.PrezzoTotale - atteso) > PRICE_TOLERANCE) {
      errors.push({
        field: `${path}.PrezzoTotale`,
        code: 'INVALID_VALUE',
        message: `PrezzoTotale non coerente: atteso ${atteso}, ricevuto ${linea.PrezzoTotale} (tolleranza ±${PRICE_TOLERANCE}, SDI 00423)`,
      });
    }
  }

  if (linea.AliquotaIVA === undefined) {
    errors.push({ field: `${path}.AliquotaIVA`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  } else if (linea.AliquotaIVA < 0) {
    errors.push({ field: `${path}.AliquotaIVA`, code: 'INVALID_VALUE', message: 'AliquotaIVA non può essere negativa' });
  } else if (linea.AliquotaIVA === 0 && !linea.Natura) {
    errors.push({ field: `${path}.Natura`, code: 'MISSING_NATURA', message: 'Natura obbligatoria quando AliquotaIVA è 0' });
  }

  // Natura presente → AliquotaIVA deve essere 0 (SDI 00401)
  if (linea.Natura !== undefined && linea.AliquotaIVA !== undefined && linea.AliquotaIVA !== 0) {
    errors.push({ field: `${path}.AliquotaIVA`, code: 'INVALID_VALUE', message: 'Se Natura è valorizzata, AliquotaIVA deve essere 0 (SDI 00401)' });
  }
  // Codici Natura N2, N3, N6 deprecati dal 2021 — richiedono sottocodice
  if (linea.Natura && NATURA_DEPRECATA.has(linea.Natura)) {
    errors.push({ field: `${path}.Natura`, code: 'INVALID_VALUE', message: `Codice Natura "${linea.Natura}" non valido dal 2021: usare il sottocodice (es. N2.1, N3.1, N6.1) (SDI 00445)` });
  }

  for (const [i, sm] of (linea.ScontoMaggiorazione ?? []).entries()) {
    errors.push(...validateScontoMaggiorazione(sm, `${path}.ScontoMaggiorazione[${i}]`));
  }

  errors.push(...maxLength(linea.RiferimentoAmministrazione, 20, `${path}.RiferimentoAmministrazione`));

  for (const [i, adg] of (linea.AltriDatiGestionali ?? []).entries()) {
    const ap = `${path}.AltriDatiGestionali[${i}]`;
    errors.push(...required(adg.TipoDato, `${ap}.TipoDato`));
    errors.push(...maxLength(adg.TipoDato, 10, `${ap}.TipoDato`));
    errors.push(...maxLength(adg.RiferimentoTesto, 60, `${ap}.RiferimentoTesto`));
  }

  return errors;
}

export function validateDettaglioLinee(linee: DettaglioLinee[], base: string): FieldError[] {
  const errors: FieldError[] = [];

  if (!linee.length) {
    errors.push({ field: `${base}.DatiBeniServizi.DettaglioLinee`, code: 'EMPTY_COLLECTION', message: 'Almeno una riga è obbligatoria' });
    return errors;
  }

  // Unicità di NumeroLinea
  const numeri = linee.map(l => l.NumeroLinea);
  const duplicati = numeri.filter((n, i) => numeri.indexOf(n) !== i);
  if (duplicati.length) {
    errors.push({
      field: `${base}.DatiBeniServizi.DettaglioLinee`,
      code: 'INVALID_VALUE',
      message: `NumeroLinea duplicato: ${[...new Set(duplicati)].join(', ')}`,
    });
  }

  // Sequenzialità: devono essere ordinati da 1 a N
  const sorted = [...numeri].sort((a, b) => a - b);
  const expectedSeq = Array.from({ length: linee.length }, (_, i) => i + 1);
  if (JSON.stringify(sorted) !== JSON.stringify(expectedSeq)) {
    errors.push({
      field: `${base}.DatiBeniServizi.DettaglioLinee`,
      code: 'INVALID_VALUE',
      message: 'NumeroLinea deve essere una sequenza da 1 a N senza salti',
    });
  }

  linee.forEach((linea, i) =>
    errors.push(...validateSingolaLinea(linea, `${base}.DatiBeniServizi.DettaglioLinee[${i}]`))
  );

  return errors;
}
