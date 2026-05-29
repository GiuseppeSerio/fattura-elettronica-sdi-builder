import type { DatiRiepilogo } from '../../../types/index.js';
import type { FieldError } from '../../../errors/index.js';
import { maxLength, numericField, enumValue } from '../types.js';
import { NATURA, NATURA_DEPRECATA, ESIGIBILITA_IVA } from '../../../enums.js';

const TOLERANCE = 0.01; // tolleranza arrotondamento

/** Confronto tollerante al rumore floating-point: arrotonda la differenza a 2 decimali. */
function diffEntro(a: number, b: number, tol: number): boolean {
  const diff = Math.round(Math.abs(a - b) * 100) / 100;
  return diff <= tol;
}

function isImpostaCoerente(r: DatiRiepilogo): boolean {
  // Se Natura è impostata l'imposta deve essere 0
  if (r.Natura) return diffEntro(r.Imposta, 0, TOLERANCE);
  // Altrimenti: Imposta ≈ ImponibileImporto * AliquotaIVA / 100
  const expected = Math.round((r.ImponibileImporto * r.AliquotaIVA) / 100 * 100) / 100;
  return diffEntro(r.Imposta, expected, TOLERANCE);
}

function validateSingoloRiepilogo(r: DatiRiepilogo, path: string): FieldError[] {
  const errors: FieldError[] = [];

  if (r.AliquotaIVA === undefined)       errors.push({ field: `${path}.AliquotaIVA`,       code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  else if (r.AliquotaIVA < 0)            errors.push({ field: `${path}.AliquotaIVA`,       code: 'INVALID_VALUE',           message: 'AliquotaIVA non può essere negativa' });
  errors.push(...numericField(r.AliquotaIVA, 6, 2, `${path}.AliquotaIVA`));
  if (r.ImponibileImporto === undefined)  errors.push({ field: `${path}.ImponibileImporto`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...numericField(r.ImponibileImporto, 15, 2, `${path}.ImponibileImporto`));
  if (r.Imposta === undefined)            errors.push({ field: `${path}.Imposta`,           code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...numericField(r.Imposta, 15, 2, `${path}.Imposta`));
  errors.push(...numericField(r.SpeseAccessorie, 15, 8, `${path}.SpeseAccessorie`));
  errors.push(...numericField(r.Arrotondamento, 21, 8, `${path}.Arrotondamento`));

  if (r.AliquotaIVA === 0 && !r.Natura) {
    errors.push({ field: `${path}.Natura`, code: 'MISSING_NATURA', message: 'Natura obbligatoria quando AliquotaIVA è 0' });
  }

  errors.push(...enumValue(r.Natura, NATURA, `${path}.Natura`));
  errors.push(...enumValue(r.EsigibilitaIVA, ESIGIBILITA_IVA, `${path}.EsigibilitaIVA`));

  // Natura presente → AliquotaIVA deve essere 0 (SDI 00430)
  if (r.Natura !== undefined && r.AliquotaIVA !== undefined && r.AliquotaIVA !== 0) {
    errors.push({ field: `${path}.AliquotaIVA`, code: 'INVALID_VALUE', message: 'Se Natura è valorizzata, AliquotaIVA deve essere 0 (SDI 00430)' });
  }

  // Codici Natura N2, N3, N6 deprecati dal 2021 (SDI 00445)
  if (r.Natura && NATURA_DEPRECATA.has(r.Natura)) {
    errors.push({ field: `${path}.Natura`, code: 'INVALID_VALUE', message: `Codice Natura "${r.Natura}" non valido dal 2021: usare il sottocodice (es. N2.1, N3.1, N6.1) (SDI 00445)` });
  }

  // EsigibilitaIVA "S" (split payment) incompatibile con reverse charge N6* (SDI 00420)
  const isN6 = r.Natura && (r.Natura === 'N6' || r.Natura.startsWith('N6.'));
  if (isN6 && r.EsigibilitaIVA === 'S') {
    errors.push({ field: `${path}.EsigibilitaIVA`, code: 'INVALID_VALUE', message: 'EsigibilitaIVA "S" (split payment) non compatibile con Natura N6 (reverse charge) (SDI 00420)' });
  }

  // Cross-check coerenza Imposta
  if (r.AliquotaIVA !== undefined && r.ImponibileImporto !== undefined && r.Imposta !== undefined) {
    if (!isImpostaCoerente(r)) {
      const expected = r.Natura ? 0 : Math.round((r.ImponibileImporto * r.AliquotaIVA) / 100 * 100) / 100;
      errors.push({
        field: `${path}.Imposta`,
        code: 'INVALID_VALUE',
        message: `Imposta non coerente: atteso ${expected}, ricevuto ${r.Imposta} (tolleranza ±${TOLERANCE})`,
      });
    }
  }

  errors.push(...maxLength(r.RiferimentoNormativo, 100, `${path}.RiferimentoNormativo`));

  return errors;
}

export function validateDatiRiepilogo(riepilogo: DatiRiepilogo[], base: string): FieldError[] {
  const errors: FieldError[] = [];

  if (!riepilogo.length) {
    errors.push({ field: `${base}.DatiBeniServizi.DatiRiepilogo`, code: 'EMPTY_COLLECTION', message: 'Almeno un riepilogo IVA è obbligatorio' });
    return errors;
  }

  riepilogo.forEach((r, i) =>
    errors.push(...validateSingoloRiepilogo(r, `${base}.DatiBeniServizi.DatiRiepilogo[${i}]`))
  );

  return errors;
}
