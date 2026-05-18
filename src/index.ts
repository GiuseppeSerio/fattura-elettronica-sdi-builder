// Core API
export { buildXml } from './builder/index.js';
export type { BuildOptions } from './builder/index.js';

export { validate } from './validator/index.js';

// Defaults
export { applyDefaults } from './defaults/index.js';
export type { FatturaElettronicaInput } from './defaults/index.js';

// Result
export { ok, err } from './result.js';
export type { Result } from './result.js';

// Errors
export { FatturaError, ValidationError, BuildError, ErrorCode } from './errors/index.js';
export type { FieldError } from './errors/index.js';

// Types
export type {
  FatturaElettronica,
  FatturaElettronicaHeader,
  FatturaElettronicaBody,
  DatiTrasmissione,
  CedentePrestatore,
  CessionarioCommittente,
  DatiGenerali,
  DatiGeneraliDocumento,
  DatiBeniServizi,
  DettaglioLinee,
  DatiRiepilogo,
  DatiPagamento,
  DettaglioPagamento,
  Allegati,
  IdFiscale,
  Indirizzo,
  Anagrafica,
  FormatoTrasmissione,
  TipoDocumento,
  TipoRitenuta,
  TipoCassa,
  CausalePagamento,
  TipoCessionePrestazione,
  RegimeFiscale,
  NaturaIVA,
  EsigibilitaIVA,
  ModalitaPagamento,
  CondizioniPagamento,
  Valuta,
  Nazione,
} from './types/index.js';
