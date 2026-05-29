import type { FatturaElettronicaHeader } from '../types/index.js';
import type { FieldError } from '../errors/index.js';
import {
  validateDatiTrasmissione,
  validateCedentePrestatore,
  validateCessionarioCommittente,
  validateCodiceDestinatario,
} from './rules/index.js';

export function validateHeader(header: FatturaElettronicaHeader): FieldError[] {
  return [
    ...validateDatiTrasmissione(header.DatiTrasmissione),
    ...validateCodiceDestinatario(header),
    ...validateCedentePrestatore(header.CedentePrestatore),
    ...validateCessionarioCommittente(header.CessionarioCommittente),
  ];
}
