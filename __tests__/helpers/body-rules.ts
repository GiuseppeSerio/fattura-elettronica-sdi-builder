/**
 * Helper specifici per i test integration sul body.
 * Lavorano sopra il fixture fatturaB2B per produrre varianti minimali.
 */

import type { FatturaElettronica, FatturaElettronicaBody } from '../../src/types/index';
import type { validate } from '../../src/validator/index';
import { fatturaB2B } from '../fixtures/fattura-b2b';

type ValidateResult = ReturnType<typeof validate>;

/** Clona il fixture B2B sovrascrivendo proprietà del body. */
export function withBody(overrides: Partial<FatturaElettronicaBody>): FatturaElettronica {
  return {
    ...fatturaB2B,
    FatturaElettronicaBody: { ...(fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody), ...overrides },
  };
}

/** Asserisce che il result sia ko, con un errore di `code` su un field che contiene `fieldFragment`. */
export function expectCode(result: ValidateResult, code: string, fieldFragment: string): void {
  expect(result.ok).toBe(false);
  if (!result.ok) {
    const match = result.error.fields.find(e => e.code === code && e.field.includes(fieldFragment));
    expect(match).toBeDefined();
  }
}

// ---- Shortcut sul fixture --------------------------------------------------

export function baseDoc() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiGenerali.DatiGeneraliDocumento;
}

export function dgBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiGenerali;
}

export function beniBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiBeniServizi;
}

export function lineaBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiBeniServizi.DettaglioLinee[0]!;
}

export function detBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiPagamento![0]!.DettaglioPagamento[0]!;
}
