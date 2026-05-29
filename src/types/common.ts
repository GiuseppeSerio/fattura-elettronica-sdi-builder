/**
 * Tipi di base e re-export degli enum centralizzati in src/enums.ts.
 * Gli enum runtime (REGIME_FISCALE, TIPO_DOCUMENTO, ecc.) vivono in src/enums.ts:
 * qui re-esportiamo solo i type literal derivati per comodità d'uso.
 */

export type {
  FormatoTrasmissione,
  RegimeFiscale,
  TipoDocumento,
  TipoRitenuta,
  TipoCassa,
  CausalePagamento,
  TipoCessionePrestazione,
  NaturaIVA,
  EsigibilitaIVA,
  ModalitaPagamento,
  CondizioniPagamento,
} from '../enums.js';

export type Nazione = string; // ISO 3166-1 alpha-2, es. "IT"
export type Valuta = string;  // ISO 4217, es. "EUR"

export interface IdFiscale {
  IdPaese: Nazione;
  IdCodice: string;
}

export interface Indirizzo {
  Indirizzo: string;
  NumeroCivico?: string;
  CAP: string;
  Comune: string;
  Provincia?: string;
  Nazione: Nazione;
}
