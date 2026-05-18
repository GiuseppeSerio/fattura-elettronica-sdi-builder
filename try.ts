import { exit } from 'process';
import { buildXml, validate } from './src/index';
import type { FatturaElettronica } from './src/index';

// const fattura: FatturaElettronica = {
//   FatturaElettronicaHeader: {
//     DatiTrasmissione: {
//       IdTrasmittente: { IdPaese: 'IT', IdCodice: '01879020517' },
//       ProgressivoInvio: '00001',
//       FormatoTrasmissione: 'FPR12',
//       CodiceDestinatario: 'KRRH6B9',
//     },
//     CedentePrestatore: {
//       DatiAnagrafici: {
//         IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '04200640870' },
//         Anagrafica: { Denominazione: 'Acme Solutions Srl' },
//         RegimeFiscale: 'RF01',
//       },
//       Sede: {
//         Indirizzo: 'Via Roma 1',
//         CAP: '00100',
//         Comune: 'Roma',
//         Provincia: 'RM',
//         Nazione: 'IT',
//       },
//     },
//     CessionarioCommittente: {
//       DatiAnagrafici: {
//         IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '09876543210' },
//         Anagrafica: { Denominazione: 'Cliente Spa' },
//       },
//       Sede: {
//         Indirizzo: 'Via Milano 10',
//         CAP: '20100',
//         Comune: 'Milano',
//         Provincia: 'MI',
//         Nazione: 'IT',
//       },
//     },
//   },
//   FatturaElettronicaBody: {
//     DatiGenerali: {
//       DatiGeneraliDocumento: {
//         TipoDocumento: 'TD01',
//         Divisa: 'EUR',
//         Data: '2026-05-18',
//         Numero: 'FT-2026-001',
//         // ImportoTotaleDocumento: 122.00,
//          ImportoTotaleDocumento: 122.80, //con errore per testare validazione
//       },
//     },
//     DatiBeniServizi: {
//       DettaglioLinee: [
//         {
//           NumeroLinea: 1,
//           Descrizione: 'Servizio di consulenza',
//           Quantita: 1,
//           UnitaMisura: 'NUM',
//           PrezzoUnitario: 100.00,
//           PrezzoTotale: 100.00,
//           AliquotaIVA: 22.00,
//         },
//       ],
//       DatiRiepilogo: [
//         {
//           AliquotaIVA: 22.00,
//           ImponibileImporto: 100.00,
//           Imposta: 22.00,
//           EsigibilitaIVA: 'I',
//         },
//       ],
//     },
//     DatiPagamento: [
//       {
//         CondizioniPagamento: 'TP02',
//         DettaglioPagamento: [
//           {
//             ModalitaPagamento: 'MP05',
//             DataScadenzaPagamento: '2026-06-18',
//             ImportoPagamento: 122.00,
//             IBAN: 'IT60X0542811101000000123456',
//           },
//         ],
//       },
//     ],
//   },
// };

// 1. Validazione

const fattura: FatturaElettronica = {
  FatturaElettronicaHeader: {
    DatiTrasmissione: {
      IdTrasmittente: { IdPaese: 'IT', IdCodice: '01234567890' },
      ProgressivoInvio: '00001',
      FormatoTrasmissione: 'FPR12',
      CodiceDestinatario: 'ABC1234',

      // CodiceDestinatario: 'AB12', // ERRORE: lunghezza codice destinatario
      // ProgressivoInvio: 'INV-2026/001#', // ERRORE: formato progressivo invio
      // FormatoTrasmissione: 'FPA12', // ERRORE: formato incompatibile
    },

    CedentePrestatore: {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '01234567890' },
        Anagrafica: {
          Denominazione: 'La Mia Azienda Srl',
        },
        RegimeFiscale: 'RF01',

        // IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '123' }, // ERRORE: partita iva invalida
        // RegimeFiscale: 'RF19', // ERRORE: regime fiscale incoerente
      },
      Sede: {
        Indirizzo: 'Via Roma 1',
        CAP: '00100',
        Comune: 'Roma',
        Provincia: 'RM',
        Nazione: 'IT',

        // CAP: '1234', // ERRORE: CAP non valido
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

        // Indirizzo: '5th Avenue',
        // CAP: '10001',
        // Comune: 'New York',
        // Provincia: 'NY',
        // Nazione: 'US', // ERRORE: cliente estero con provincia
      },
    },
  },

  FatturaElettronicaBody: [
    {
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: 'TD01',
          Divisa: 'EUR',
          Data: '2026-05-18',
          Numero: 'FT-2026-001',
          ImportoTotaleDocumento: 122.0,

          // ImportoTotaleDocumento: 121.99, // ERRORE: totale incoerente
        },
      },

      DatiBeniServizi: {
        DettaglioLinee: [
          {
            NumeroLinea: 1,
            Descrizione: 'Servizio di consulenza',
            Quantita: 1,
            UnitaMisura: 'NUM',
            PrezzoUnitario: 100.0,
            PrezzoTotale: 100.0,
            AliquotaIVA: 22.0,

            // Quantita: 2,
            // PrezzoUnitario: 50.0,
            // PrezzoTotale: 120.0, // ERRORE: totale linea errato

            // AliquotaIVA: 0, // ERRORE se manca Natura
            // Natura: 'N2.1', // usa insieme ad aliquota 0

            // AliquotaIVA: 22,
            // Natura: 'N2.1', // ERRORE: natura con iva > 0
          },

          // {
          //   NumeroLinea: 1,
          //   Descrizione: 'Prodotto duplicato',
          //   PrezzoUnitario: 50,
          //   PrezzoTotale: 50,
          //   AliquotaIVA: 22,
          // }, // ERRORE: NumeroLinea duplicato
        ],

        DatiRiepilogo: [
          {
            AliquotaIVA: 22.0,
            ImponibileImporto: 100.0,
            Imposta: 22.0,
            EsigibilitaIVA: 'I',

            // AliquotaIVA: 0,
            // ImponibileImporto: 100,
            // Imposta: 0, // ERRORE se manca Natura
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
              ImportoPagamento: 122.0,
              IBAN: 'IT60X0542811101000000123456',

              // DataScadenzaPagamento: '2026-05-01', // ERRORE: scadenza prima documento
              // ImportoPagamento: 100.0, // ERRORE: pagamento != totale
              // IBAN: 'IT00INVALID000000', // ERRORE: iban invalido
            },
          ],
        },
      ],
    },
  ],
};
const validation = validate(fattura);
console.log('\n=== VALIDAZIONE ===');
if (validation.ok) {
  console.log('✓ Fattura valida');
} else {
  console.log('✗ Errori trovati:');
  validation.error.fields.forEach(e => console.log(`  - [${e.code}] ${e.field}: ${e.message}`));
  exit(1);
}

// 2. Generazione XML
const build = buildXml(fattura, { prettyPrint: true });
console.log('\n=== XML GENERATO ===');
if (build.ok) {
  console.log(build.value);
} else {
  console.error('Errore build:', build.error.message);
}
