import type {
  TipoDocumento,
  TipoRitenuta,
  TipoCassa,
  CausalePagamento,
  TipoCessionePrestazione,
  Valuta,
  NaturaIVA,
  EsigibilitaIVA,
  ModalitaPagamento,
  CondizioniPagamento,
} from './common.js';

// --- DatiGeneraliDocumento ---

export interface DatiRitenuta {
  TipoRitenuta: TipoRitenuta;
  ImportoRitenuta: number;
  AliquotaRitenuta: number;
  CausalePagamento: CausalePagamento;
}

export interface DatiBollo {
  BolloVirtuale: 'SI';
  ImportoBollo: number;
}

export interface DatiCassaPrevidenziale {
  TipoCassa: TipoCassa;
  AlCassa: number;
  ImportoContributoCassa: number;
  ImponibileCassa?: number;
  AliquotaIVA: number;
  Ritenuta?: 'SI';
  Natura?: NaturaIVA;
  RiferimentoAmministrazione?: string;
}

export interface ScontoMaggiorazione {
  Tipo: 'SC' | 'MG';
  Percentuale?: number;
  Importo?: number;
}

export interface DatiGeneraliDocumento {
  TipoDocumento: TipoDocumento;
  Divisa: Valuta;
  Data: string;          // formato YYYY-MM-DD
  Numero: string;
  DatiRitenuta?: DatiRitenuta | DatiRitenuta[];
  DatiBollo?: DatiBollo;
  DatiCassaPrevidenziale?: DatiCassaPrevidenziale | DatiCassaPrevidenziale[];
  ScontoMaggiorazione?: ScontoMaggiorazione | ScontoMaggiorazione[];
  ImportoTotaleDocumento?: number;
  Arrotondamento?: number;
  Causale?: string | string[];
  Art73?: 'SI';
}

// --- DatiOrdineAcquisto / DatiContratto / etc. ---

export interface DatiDocumentoCorrelato {
  RiferimentoNumeroLinea?: number[];
  IdDocumento: string;
  Data?: string;
  NumItem?: string;
  CodiceCommessaConvenzione?: string;
  CodiceCUP?: string;
  CodiceCIG?: string;
}

// --- DatiDDT ---

export interface DatiDDT {
  NumeroDDT: string;
  DataDDT: string;
  RiferimentoNumeroLinea?: number[];
}

// --- DatiGenerali ---

export interface DatiGenerali {
  DatiGeneraliDocumento: DatiGeneraliDocumento;
  DatiOrdineAcquisto?: DatiDocumentoCorrelato[];
  DatiContratto?: DatiDocumentoCorrelato[];
  DatiConvenzione?: DatiDocumentoCorrelato[];
  DatiRicezione?: DatiDocumentoCorrelato[];
  DatiFattureCollegate?: DatiDocumentoCorrelato[];
  DatiSAL?: { RiferimentoFase: number }[];
  DatiDDT?: DatiDDT[];
  DatiTrasporto?: DatiTrasporto;
  FatturaPrincipale?: { NumeroFatturaPrincipale: string; DataFatturaPrincipale: string };
}

export interface DatiTrasporto {
  DatiAnagraficiVettore?: {
    IdFiscaleIVA?: { IdPaese: string; IdCodice: string };
    CodiceFiscale?: string;
    Anagrafica: { Denominazione?: string; Nome?: string; Cognome?: string };
    NumeroLicenzaGuida?: string;
  };
  MezzoTrasporto?: string;
  CausaleTrasporto?: string;
  NumeroColli?: number;
  Descrizione?: string;
  UnitaMisuraPeso?: string;
  PesoLordo?: number;
  PesoNetto?: number;
  DataOraRitiro?: string;
  DataInizioTrasporto?: string;
  TipoResa?: string;
  IndirizzoResa?: {
    Indirizzo: string;
    NumeroCivico?: string;
    CAP: string;
    Comune: string;
    Provincia?: string;
    Nazione: string;
  };
  DataOraConsegna?: string;
}

// --- DatiBeniServizi ---

export interface CodiceArticolo {
  CodiceTipo: string;
  CodiceValore: string;
}

export interface DettaglioLinee {
  NumeroLinea: number;
  TipoCessionePrestazione?: TipoCessionePrestazione;
  CodiceArticolo?: CodiceArticolo[];
  Descrizione: string;
  Quantita?: number;
  UnitaMisura?: string;
  DataInizioPeriodo?: string;
  DataFinePeriodo?: string;
  PrezzoUnitario: number;
  ScontoMaggiorazione?: ScontoMaggiorazione[];
  PrezzoTotale: number;
  AliquotaIVA: number;
  Ritenuta?: 'SI';
  Natura?: NaturaIVA;
  RiferimentoAmministrazione?: string;
  AltriDatiGestionali?: { TipoDato: string; RiferimentoTesto?: string; RiferimentoNumero?: number; RiferimentoData?: string }[];
}

export interface DatiRiepilogo {
  AliquotaIVA: number;
  Natura?: NaturaIVA;
  SpeseAccessorie?: number;
  Arrotondamento?: number;
  ImponibileImporto: number;
  Imposta: number;
  EsigibilitaIVA?: EsigibilitaIVA;
  RiferimentoNormativo?: string;
}

export interface DatiBeniServizi {
  DettaglioLinee: DettaglioLinee[];
  DatiRiepilogo: DatiRiepilogo[];
}

// --- DatiVeicoli ---

export interface DatiVeicoli {
  Data: string;
  TotalePercorso: string;
}

// --- DatiPagamento ---

export interface DettaglioPagamento {
  Beneficiario?: string;
  ModalitaPagamento: ModalitaPagamento;
  DataRiferimentoTerminiPagamento?: string;
  GiorniTerminiPagamento?: number;
  DataScadenzaPagamento?: string;
  ImportoPagamento: number;
  CodUfficioPostale?: string;
  CognomeQuietanzante?: string;
  NomeQuietanzante?: string;
  CFQuietanzante?: string;
  TitoloQuietanzante?: string;
  IstitutoFinanziario?: string;
  IBAN?: string;
  ABI?: string;
  CAB?: string;
  BIC?: string;
  ScontoPagamentoAnticipato?: number;
  DataLimitePagamentoAnticipato?: string;
  PenalitaPagamentiRitardati?: number;
  DataDecorrenzaPenale?: string;
  CodicePagamento?: string;
}

export interface DatiPagamento {
  CondizioniPagamento: CondizioniPagamento;
  DettaglioPagamento: DettaglioPagamento[];
}

// --- Allegati ---

export interface Allegati {
  NomeAttachment: string;
  AlgoritmoCompressione?: string;
  FormatoAttachment?: string;
  DescrizioneAttachment?: string;
  Attachment: string; // base64
}

// --- FatturaElettronicaBody ---

export interface FatturaElettronicaBody {
  DatiGenerali: DatiGenerali;
  DatiBeniServizi: DatiBeniServizi;
  DatiVeicoli?: DatiVeicoli;
  DatiPagamento?: DatiPagamento[];
  Allegati?: Allegati[];
}
