export type Nazione = string; // ISO 3166-1 alpha-2, es. "IT"
export type Valuta = string;  // ISO 4217, es. "EUR"

export type FormatoTrasmissione = 'FPR12' | 'FPA12';

export type RegimeFiscale =
  | 'RF01' | 'RF02' | 'RF04' | 'RF05' | 'RF06' | 'RF07' | 'RF08'
  | 'RF09' | 'RF10' | 'RF11' | 'RF12' | 'RF13' | 'RF14' | 'RF15'
  | 'RF16' | 'RF17' | 'RF18' | 'RF19' | 'RF20';

export type TipoDocumento =
  | 'TD01'  // Fattura
  | 'TD02'  // Acconto/anticipo su fattura
  | 'TD03'  // Acconto/anticipo su parcella
  | 'TD04'  // Nota di credito
  | 'TD05'  // Nota di debito
  | 'TD06'  // Parcella
  | 'TD07'  // Fattura semplificata
  | 'TD08'  // Nota di credito semplificata
  | 'TD09'  // Nota di debito semplificata
  | 'TD10'  // Fattura acquisto intracomunitario beni
  | 'TD11'  // Fattura acquisto intracomunitario servizi
  | 'TD16'  // Integrazione fattura reverse charge interno
  | 'TD17'  // Integrazione/autofattura acquisto servizi dall'estero
  | 'TD18'  // Integrazione/autofattura acquisto beni intraUE
  | 'TD19'  // Integrazione/autofattura acquisto beni ex art.17
  | 'TD20'  // Autofattura per regolarizzazione
  | 'TD21'  // Autofattura per splafonamento
  | 'TD22'  // Estrazione da deposito IVA
  | 'TD23'  // Estrazione da deposito IVA con versamento
  | 'TD24'  // Fattura differita
  | 'TD25'  // Fattura differita cessione beni
  | 'TD26'  // Cessione di beni ammortizzabili
  | 'TD27'  // Fattura per autoconsumo
  | 'TD28'  // Acquisto da San Marino con IVA (fattura cartacea)
  | 'TD29'; // Autofattura per fattura non ricevuta o irregolare

export type TipoRitenuta =
  | 'RT01'  // Ritenuta persone fisiche
  | 'RT02'  // Ritenuta persone giuridiche
  | 'RT03'  // Contributo INPS
  | 'RT04'  // Contributo ENASARCO
  | 'RT05'  // Contributo ENPAM
  | 'RT06'; // Altro contributo previdenziale

export type TipoCassa =
  | 'TC01' | 'TC02' | 'TC03' | 'TC04' | 'TC05' | 'TC06' | 'TC07'
  | 'TC08' | 'TC09' | 'TC10' | 'TC11' | 'TC12' | 'TC13' | 'TC14'
  | 'TC15' | 'TC16' | 'TC17' | 'TC18' | 'TC19' | 'TC20' | 'TC21'
  | 'TC22';

export type CausalePagamento =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'G' | 'H' | 'I' | 'J' | 'K'
  | 'L' | 'L1' | 'M' | 'M1' | 'M2' | 'N' | 'O' | 'O1' | 'P'
  | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'V1' | 'V2' | 'W' | 'X'
  | 'Y' | 'ZO';

export type TipoCessionePrestazione = 'SC' | 'AB' | 'AC' | 'PR';

export type NaturaIVA =
  | 'N1'                                         // Escluse ex art. 15
  | 'N2' | 'N2.1' | 'N2.2'                       // Non soggette (N2 deprecato dal 2021)
  | 'N3' | 'N3.1' | 'N3.2' | 'N3.3' | 'N3.4' | 'N3.5' | 'N3.6'  // Non imponibili (N3 deprecato)
  | 'N4'                                         // Esenti
  | 'N5'                                         // Regime del margine
  | 'N6' | 'N6.1' | 'N6.2' | 'N6.3' | 'N6.4' | 'N6.5' | 'N6.6' | 'N6.7' | 'N6.8' | 'N6.9' // Reverse charge (N6 deprecato)
  | 'N7';                                        // IVA assolta in altro stato UE

export type EsigibilitaIVA = 'D' | 'I' | 'S'; // Differita | Immediata | Split payment

export type ModalitaPagamento =
  | 'MP01' | 'MP02' | 'MP03' | 'MP04' | 'MP05' | 'MP06' | 'MP07'
  | 'MP08' | 'MP09' | 'MP10' | 'MP11' | 'MP12' | 'MP13' | 'MP14'
  | 'MP15' | 'MP16' | 'MP17' | 'MP18' | 'MP19' | 'MP20' | 'MP21'
  | 'MP22' | 'MP23';

export type CondizioniPagamento = 'TP01' | 'TP02' | 'TP03';

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
