import type { FatturaElettronicaBody } from '../types/index.js';
import type { FieldError } from '../errors/index.js';
import { validateBody } from './rules/index.js';

export function validateBodies(bodies: FatturaElettronicaBody | FatturaElettronicaBody[]): FieldError[] {
  if (Array.isArray(bodies) && bodies.length === 0) {
    return [{
      field: 'FatturaElettronicaBody',
      code: 'EMPTY_COLLECTION',
      message: 'Almeno un FatturaElettronicaBody è obbligatorio',
    }];
  }
  const list = Array.isArray(bodies) ? bodies : [bodies];
  const errors = list.flatMap((body, i) => validateBody(body, i));

  // Unicità del Numero fattura all'interno del lotto
  if (list.length > 1) {
    const seen = new Map<string, number>();
    list.forEach((b, i) => {
      const num = b.DatiGenerali.DatiGeneraliDocumento.Numero;
      if (!num) return;
      const prev = seen.get(num);
      if (prev !== undefined) {
        errors.push({
          field: `FatturaElettronicaBody[${i}].DatiGenerali.DatiGeneraliDocumento.Numero`,
          code: 'INVALID_VALUE',
          message: `Numero fattura "${num}" duplicato nel lotto (già presente a body[${prev}])`,
        });
      } else {
        seen.set(num, i);
      }
    });
  }

  return errors;
}
