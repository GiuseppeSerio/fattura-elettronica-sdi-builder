/**
 * Scenari realistici end-to-end: happy path tipici (sezione A) + casi promiscui
 * con mix di sezioni opzionali valorizzate insieme (sezione C).
 */

import type {
  FatturaElettronica,
  FatturaElettronicaBody,
  DettaglioLinee,
  DatiRiepilogo,
} from '../../src/types/index';
import { headerIT, linea, riep, pagamento, expectOk } from '../helpers/builders';
import { validate } from '../../src/validator/index';

function f(body: FatturaElettronicaBody): FatturaElettronica {
  return { FatturaElettronicaHeader: headerIT(), FatturaElettronicaBody: body };
}

describe('E2E · Scenari happy path', () => {
  it('B2B nazionale standard — TD01 con bonifico IBAN', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'FT-2026-001', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      DatiPagamento: [pagamento()],
    });
    expectOk(validate(fattura), 'B2B standard');
  });

  it('B2C — cessionario persona fisica senza P.IVA, solo CF', () => {
    const h = headerIT();
    h.CessionarioCommittente = {
      DatiAnagrafici: {
        CodiceFiscale: 'RSSMRA80A01H501Z',
        Anagrafica: { Nome: 'Mario', Cognome: 'Rossi' },
      },
      Sede: { Indirizzo: 'Via Torino 5', CAP: '10100', Comune: 'Torino', Provincia: 'TO', Nazione: 'IT' },
    };
    h.DatiTrasmissione.CodiceDestinatario = '0000000';
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
          Numero: '2026/1', ImportoTotaleDocumento: 122,
        }},
        DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      },
    };
    expectOk(validate(fattura), 'B2C');
  });

  it('B2G PA — FPA12 con CodiceDestinatario 6 caratteri', () => {
    const h = headerIT();
    h.DatiTrasmissione.FormatoTrasmissione = 'FPA12';
    h.DatiTrasmissione.CodiceDestinatario = 'UF1234';
    h.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA = { IdPaese: 'IT', IdCodice: '80012345678' };
    h.CessionarioCommittente.DatiAnagrafici.Anagrafica = { Denominazione: 'Ministero della Salute' };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'PA-2026-001',
          ImportoTotaleDocumento: 122,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea()],
          DatiRiepilogo: [riep({ EsigibilitaIVA: 'S' })],
        },
      },
    };
    expectOk(validate(fattura), 'B2G PA');
  });

  it('Estero UE — cliente DE, CodiceDestinatario XXXXXXX', () => {
    const h = headerIT();
    h.DatiTrasmissione.CodiceDestinatario = 'XXXXXXX';
    h.CessionarioCommittente = {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'DE', IdCodice: 'DE123456789' },
        Anagrafica: { Denominazione: 'Kunde GmbH' },
      },
      Sede: { Indirizzo: 'Hauptstraße 1', CAP: '10115', Comune: 'Berlin', Nazione: 'DE' },
    };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'EU-2026-001', ImportoTotaleDocumento: 100,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'N7' })],
          DatiRiepilogo: [riep({ AliquotaIVA: 0, Imposta: 0, Natura: 'N7' })],
        },
      },
    };
    expectOk(validate(fattura), 'Estero UE');
  });

  it('Estero extra-UE — cliente USA con placeholder OO99999999999', () => {
    const h = headerIT();
    h.DatiTrasmissione.CodiceDestinatario = 'XXXXXXX';
    h.CessionarioCommittente = {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'OO', IdCodice: 'OO99999999999' },
        Anagrafica: { Denominazione: 'US Customer Inc.' },
      },
      Sede: { Indirizzo: '5th Avenue 100', CAP: '10001', Comune: 'New York', Nazione: 'US' },
    };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'US-2026-1', ImportoTotaleDocumento: 100,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'N7' })],
          DatiRiepilogo: [riep({ AliquotaIVA: 0, Imposta: 0, Natura: 'N7' })],
        },
      },
    };
    expectOk(validate(fattura), 'Extra-UE');
  });

  it('Multi-linea con aliquote miste (22% + 10% + 4%)', () => {
    const linee: DettaglioLinee[] = [
      linea({ NumeroLinea: 1, Descrizione: 'Servizio A', PrezzoUnitario: 100, PrezzoTotale: 100, AliquotaIVA: 22 }),
      linea({ NumeroLinea: 2, Descrizione: 'Ristorazione', PrezzoUnitario: 50, PrezzoTotale: 50, AliquotaIVA: 10 }),
      linea({ NumeroLinea: 3, Descrizione: 'Libri',        PrezzoUnitario: 25, PrezzoTotale: 25, AliquotaIVA: 4 }),
    ];
    const riepiloghi: DatiRiepilogo[] = [
      riep({ AliquotaIVA: 22, ImponibileImporto: 100, Imposta: 22 }),
      riep({ AliquotaIVA: 10, ImponibileImporto: 50,  Imposta: 5 }),
      riep({ AliquotaIVA: 4,  ImponibileImporto: 25,  Imposta: 1 }),
    ];
    const totale = 100 + 22 + 50 + 5 + 25 + 1;
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'MIX-001', ImportoTotaleDocumento: totale,
      }},
      DatiBeniServizi: { DettaglioLinee: linee, DatiRiepilogo: riepiloghi },
    });
    expectOk(validate(fattura), 'Multi-aliquota');
  });

  it('Linea con sconto % e sconto fisso in cascata', () => {
    const lineaSconto: DettaglioLinee = linea({
      PrezzoUnitario: 1000, Quantita: 1,
      ScontoMaggiorazione: [
        { Tipo: 'SC', Percentuale: 10 },
        { Tipo: 'SC', Importo: 50 },
      ],
      PrezzoTotale: 850,
    });
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'SC-001', ImportoTotaleDocumento: 1037,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [lineaSconto],
        DatiRiepilogo: [riep({ ImponibileImporto: 850, Imposta: 187 })],
      },
    });
    expectOk(validate(fattura), 'Sconto cascata');
  });

  it('Linea con maggiorazione percentuale', () => {
    const lineaMag: DettaglioLinee = linea({
      PrezzoUnitario: 100,
      ScontoMaggiorazione: [{ Tipo: 'MG', Percentuale: 20 }],
      PrezzoTotale: 120,
    });
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'MG-001', ImportoTotaleDocumento: 146.4,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [lineaMag],
        DatiRiepilogo: [riep({ ImponibileImporto: 120, Imposta: 26.4 })],
      },
    });
    expectOk(validate(fattura), 'Maggiorazione');
  });

  it('Bollo virtuale 2€ su operazione esente', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'BOLLO-001',
        DatiBollo: { BolloVirtuale: 'SI', ImportoBollo: 2 },
        ImportoTotaleDocumento: 152,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: 150, PrezzoTotale: 150, AliquotaIVA: 0, Natura: 'N4' })],
        DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 150, Imposta: 0, Natura: 'N4' })],
      },
    });
    expectOk(validate(fattura), 'Bollo virtuale');
  });

  it("Ritenuta d'acconto professionista (20%)", () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD06', Divisa: 'EUR', Data: '2026-05-18', Numero: 'PROF-2026-1',
        DatiRitenuta: { TipoRitenuta: 'RT02', ImportoRitenuta: 200, AliquotaRitenuta: 20, CausalePagamento: 'A' },
        ImportoTotaleDocumento: 1020,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ Descrizione: 'Parcella', PrezzoUnitario: 1000, PrezzoTotale: 1000, Ritenuta: 'SI' })],
        DatiRiepilogo: [riep({ ImponibileImporto: 1000, Imposta: 220 })],
      },
    });
    expectOk(validate(fattura), 'Ritenuta');
  });

  it('Cassa previdenziale 4% (es. INPS gestione separata)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'CASSA-001',
        DatiCassaPrevidenziale: {
          TipoCassa: 'TC02', AlCassa: 4, ImportoContributoCassa: 40,
          ImponibileCassa: 1000, AliquotaIVA: 22,
        },
        ImportoTotaleDocumento: 1268.80,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: 1000, PrezzoTotale: 1000 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 1040, Imposta: 228.80 })],
      },
    });
    expectOk(validate(fattura), 'Cassa');
  });

  it('Split payment PA (EsigibilitaIVA="S")', () => {
    const h = headerIT();
    h.DatiTrasmissione.FormatoTrasmissione = 'FPA12';
    h.DatiTrasmissione.CodiceDestinatario = 'UF0001';
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'SPLIT-2026-1', ImportoTotaleDocumento: 122,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea()],
          DatiRiepilogo: [riep({ EsigibilitaIVA: 'S' })],
        },
      },
    };
    expectOk(validate(fattura), 'Split payment');
  });

  it('Operazione esente IVA Natura N4 (es. formazione)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'ESE-001', ImportoTotaleDocumento: 500,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ Descrizione: 'Corso', PrezzoUnitario: 500, PrezzoTotale: 500, AliquotaIVA: 0, Natura: 'N4' })],
        DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 500, Imposta: 0, Natura: 'N4' })],
      },
    });
    expectOk(validate(fattura), 'Esente N4');
  });

  it('Reverse charge N6.1 (rottami) — autofattura TD16', () => {
    const h = headerIT();
    h.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA = { IdPaese: 'IT', IdCodice: '09876543210' };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD16', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'RC-2026-1', ImportoTotaleDocumento: 1000,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea({ Descrizione: 'Rottami', PrezzoUnitario: 1000, PrezzoTotale: 1000, AliquotaIVA: 0, Natura: 'N6.1' })],
          DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 1000, Imposta: 0, Natura: 'N6.1' })],
        },
      },
    };
    expectOk(validate(fattura), 'Reverse charge');
  });

  it('Nota di credito TD04', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD04', Divisa: 'EUR', Data: '2026-05-20',
        Numero: 'NC-2026-1', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ Descrizione: 'Storno fattura FT-2026-001' })],
        DatiRiepilogo: [riep()],
      },
    });
    expectOk(validate(fattura), 'Nota credito');
  });

  it('Fattura differita TD24 con DDT', () => {
    const fattura = f({
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: 'TD24', Divisa: 'EUR', Data: '2026-05-31',
          Numero: 'DIF-2026-5', ImportoTotaleDocumento: 122,
        },
        DatiDDT: [
          { NumeroDDT: 'DDT-0001', DataDDT: '2026-05-10' },
          { NumeroDDT: 'DDT-0002', DataDDT: '2026-05-20' },
        ],
      },
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    expectOk(validate(fattura), 'Differita');
  });

  it('Allegato PDF base64', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'ALL-001', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      Allegati: [{
        NomeAttachment: 'dettaglio.pdf',
        FormatoAttachment: 'PDF',
        DescrizioneAttachment: 'Dettaglio attività svolta',
        Attachment: 'JVBERi0xLjQKJeLjz9MK',
      }],
    });
    expectOk(validate(fattura), 'Allegato');
  });

  it('Lotto con 3 FatturaElettronicaBody', () => {
    const mkBody = (n: number): FatturaElettronicaBody => ({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: `LOT-${n}`, ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: headerIT(),
      FatturaElettronicaBody: [mkBody(1), mkBody(2), mkBody(3)],
    };
    expectOk(validate(fattura), 'Lotto');
  });
});

describe('E2E · Scenari promiscui', () => {
  it('Fattura "completa" — tutte le sezioni opzionali valorizzate insieme', () => {
    // Imponibile 1000 + cassa 40 = 1040; IVA 22% = 228.80; - ritenuta 200 + bollo 2 = 1070.80
    const fattura = f({
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'FULL-001',
          Causale: ['Servizi professionali maggio 2026', 'IVA come da DPR 633/72'],
          DatiRitenuta: { TipoRitenuta: 'RT02', ImportoRitenuta: 200, AliquotaRitenuta: 20, CausalePagamento: 'A' },
          DatiBollo: { BolloVirtuale: 'SI', ImportoBollo: 2 },
          DatiCassaPrevidenziale: { TipoCassa: 'TC02', AlCassa: 4, ImportoContributoCassa: 40, ImponibileCassa: 1000, AliquotaIVA: 22 },
          ImportoTotaleDocumento: 1070.80,
        },
        DatiDDT: [{ NumeroDDT: 'DDT-X1', DataDDT: '2026-05-10' }],
      },
      DatiBeniServizi: {
        DettaglioLinee: [
          linea({
            Descrizione: 'Consulenza',
            PrezzoUnitario: 1100, Quantita: 1,
            ScontoMaggiorazione: [{ Tipo: 'SC', Percentuale: 10 }],
            PrezzoTotale: 990,
            Ritenuta: 'SI',
          }),
          linea({ NumeroLinea: 2, Descrizione: 'Spese trasferta', PrezzoUnitario: 10, Quantita: 1, PrezzoTotale: 10 }),
        ],
        DatiRiepilogo: [riep({ ImponibileImporto: 1040, Imposta: 228.80 })],
      },
      DatiPagamento: [pagamento({
        DettaglioPagamento: [{ ModalitaPagamento: 'MP05', DataScadenzaPagamento: '2026-06-30', ImportoPagamento: 1070.80, IBAN: 'IT60X0542811101000000123456' }],
      })],
      Allegati: [{ NomeAttachment: 'parcella.pdf', FormatoAttachment: 'PDF', Attachment: 'JVBERi0xLjQK' }],
    });
    expectOk(validate(fattura), 'Fattura completa');
  });
});
