import type {
  FormatoTrasmissione,
  RegimeFiscale,
  IdFiscale,
  Indirizzo
} from './common.js';

// --- DatiTrasmissione ---

export interface DatiTrasmissione {
  IdTrasmittente: IdFiscale;
  ProgressivoInvio: string;
  FormatoTrasmissione: FormatoTrasmissione;
  CodiceDestinatario: string;
  ContattiTrasmittente?: {
    Telefono?: string;
    Email?: string;
  };
  PECDestinatario?: string;
}

// --- Anagrafica ---

export interface Anagrafica {
  Denominazione?: string;
  Nome?: string;
  Cognome?: string;
  Titolo?: string;
  CodEORI?: string;
}

export interface DatiAnagraficiCedente {
  IdFiscaleIVA: IdFiscale;
  CodiceFiscale?: string;
  Anagrafica: Anagrafica;
  AlboProfessionale?: string;
  ProvinciaAlbo?: string;
  NumeroIscrizioneAlbo?: string;
  DataIscrizioneAlbo?: string;
  RegimeFiscale: RegimeFiscale;
}

export interface DatiAnagraficiCessionario {
  IdFiscaleIVA?: IdFiscale;
  CodiceFiscale?: string;
  Anagrafica: Anagrafica;
}

// --- CedentePrestatore (Fornitore/Emittente) ---

export interface IscrizioneREA {
  Ufficio: string;
  NumeroREA: string;
  CapitaleSociale?: number;
  SocioUnico?: 'SU' | 'SM';
  StatoLiquidazione: 'LS' | 'LN';
}

export interface Contatti {
  Telefono?: string;
  Fax?: string;
  Email?: string;
}

export interface CedentePrestatore {
  DatiAnagrafici: DatiAnagraficiCedente;
  Sede: Indirizzo;
  StabileOrganizzazione?: Indirizzo;
  IscrizioneREA?: IscrizioneREA;
  Contatti?: Contatti;
  RiferimentoAmministrazione?: string;
}

// --- RappresentanteFiscale ---

export interface RappresentanteFiscale {
  DatiAnagrafici: {
    IdFiscaleIVA: IdFiscale;
    CodiceFiscale?: string;
    Anagrafica: Anagrafica;
  };
}

// --- CessionarioCommittente (Cliente/Destinatario) ---

export interface CessionarioCommittente {
  DatiAnagrafici: DatiAnagraficiCessionario;
  Sede: Indirizzo;
  StabileOrganizzazione?: Indirizzo;
  RappresentanteFiscale?: {
    IdFiscaleIVA: IdFiscale;
    Denominazione?: string;
    Nome?: string;
    Cognome?: string;
  };
}

// --- TerzoIntermediarioSoggettoEmittente ---

export interface TerzoIntermediario {
  DatiAnagrafici: {
    IdFiscaleIVA: IdFiscale;
    CodiceFiscale?: string;
    Anagrafica: Anagrafica;
  };
}

// --- FatturaElettronicaHeader ---

export interface FatturaElettronicaHeader {
  DatiTrasmissione: DatiTrasmissione;
  CedentePrestatore: CedentePrestatore;
  RappresentanteFiscale?: RappresentanteFiscale;
  CessionarioCommittente: CessionarioCommittente;
  TerzoIntermediarioOSoggettoEmittente?: TerzoIntermediario;
  SoggettoEmittente?: 'CC' | 'TZ';
}
