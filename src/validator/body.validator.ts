import type { FatturaElettronicaBody } from '../types/index.js';
import type { FieldError } from '../errors/index.js';
import { validateBody } from './rules/index.js';

export function validateBodies(bodies: FatturaElettronicaBody | FatturaElettronicaBody[]): FieldError[] {
  const list = Array.isArray(bodies) ? bodies : [bodies];
  return list.flatMap((body, i) => validateBody(body, i));
}
