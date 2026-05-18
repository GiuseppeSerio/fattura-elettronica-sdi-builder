import type { FatturaElettronica, FatturaElettronicaHeader, FatturaElettronicaBody } from '../types/index.js';

/** Versione "allentata" di FatturaElettronica per l'input di applyDefaults.
 *  I campi deducibili automaticamente sono opzionali. */
export type FatturaElettronicaInput = Omit<FatturaElettronica, 'FatturaElettronicaHeader' | 'FatturaElettronicaBody'> & {
  FatturaElettronicaHeader: FatturaElettronicaHeaderInput;
  FatturaElettronicaBody:   FatturaElettronicaBodyInput | FatturaElettronicaBodyInput[];
};

export type FatturaElettronicaHeaderInput = Omit<FatturaElettronicaHeader, 'DatiTrasmissione'> & {
  DatiTrasmissione: Omit<FatturaElettronicaHeader['DatiTrasmissione'], 'IdTrasmittente' | 'FormatoTrasmissione'> & {
    /** Se omesso viene copiato da CedentePrestatore.DatiAnagrafici.IdFiscaleIVA */
    IdTrasmittente?: FatturaElettronicaHeader['DatiTrasmissione']['IdTrasmittente'];
    /** Se omesso viene impostato a "FPR12" */
    FormatoTrasmissione?: FatturaElettronicaHeader['DatiTrasmissione']['FormatoTrasmissione'];
  };
};

export type FatturaElettronicaBodyInput = Omit<FatturaElettronicaBody, 'DatiGenerali'> & {
  DatiGenerali: Omit<FatturaElettronicaBody['DatiGenerali'], 'DatiGeneraliDocumento'> & {
    DatiGeneraliDocumento: Omit<FatturaElettronicaBody['DatiGenerali']['DatiGeneraliDocumento'], 'Divisa' | 'Data'> & {
      /** Se omessa viene impostata a "EUR" */
      Divisa?: string;
      /** Se omessa viene impostata alla data odierna (YYYY-MM-DD) */
      Data?: string;
    };
  };
};
