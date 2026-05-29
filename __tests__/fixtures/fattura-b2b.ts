import type { FatturaElettronica } from '../../src/types/index.js';

export const fatturaB2B: FatturaElettronica = {
  FatturaElettronicaHeader: {
    DatiTrasmissione: {
      IdTrasmittente: { IdPaese: 'IT', IdCodice: '01234567890' },
      ProgressivoInvio: '00001',
      FormatoTrasmissione: 'FPR12',
      CodiceDestinatario: 'ABC1234',
    },
    CedentePrestatore: {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '01234567890' },
        Anagrafica: { Denominazione: 'Fornitore Srl' },
        RegimeFiscale: 'RF01',
      },
      Sede: {
        Indirizzo: 'Via Roma 1',
        CAP: '00100',
        Comune: 'Roma',
        Provincia: 'RM',
        Nazione: 'IT',
      },
    },
    CessionarioCommittente: {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '09876543210' },
        Anagrafica: { Denominazione: 'Cliente Spa' },
      },
      Sede: {
        Indirizzo: 'Via Milano 10',
        CAP: '20100',
        Comune: 'Milano',
        Provincia: 'MI',
        Nazione: 'IT',
      },
    },
  },
  FatturaElettronicaBody: {
    DatiGenerali: {
      DatiGeneraliDocumento: {
        TipoDocumento: 'TD01',
        Divisa: 'EUR',
        Data: '2026-05-18',
        Numero: 'FT-2026-001',
        ImportoTotaleDocumento: 122.00,
      },
    },
    DatiBeniServizi: {
      DettaglioLinee: [
        {
          NumeroLinea: 1,
          Descrizione: 'Servizio di consulenza',
          Quantita: 1,
          UnitaMisura: 'NUM',
          PrezzoUnitario: 100.00,
          PrezzoTotale: 100.00,
          AliquotaIVA: 22.00,
        },
      ],
      DatiRiepilogo: [
        {
          AliquotaIVA: 22.00,
          ImponibileImporto: 100.00,
          Imposta: 22.00,
          EsigibilitaIVA: 'I',
        },
      ],
    },
    DatiPagamento: [
      {
        CondizioniPagamento: 'TP02',
        DettaglioPagamento: [
          {
            ModalitaPagamento: 'MP05',
            DataScadenzaPagamento: '2026-06-18',
            ImportoPagamento: 122.00,
            IBAN: 'IT60X0542811101000000123456',
          },
        ],
      },
    ],
  },
};
