/**
 * Regression suite — coerenza tra campi: enum, unicità, cross-date,
 * relazioni semantiche cedente/cessionario, totali documento.
 * Ogni test corrisponde a un bug storicamente scovato e fixato.
 */

import type { FatturaElettronica, FatturaElettronicaBody, DatiRiepilogo } from '../../../src/types/index';
import { headerIT, linea, riep, bodyStd } from '../../helpers/builders';
import { validate } from '../../../src/validator/index';

function f(body: FatturaElettronicaBody): FatturaElettronica {
  return { FatturaElettronicaHeader: headerIT(), FatturaElettronicaBody: body };
}

describe('Regression · cross-field coherence', () => {

  it('AliquotaIVA negativa in DatiRiepilogo viene segnalata', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'NIVA-1',
        ImportoTotaleDocumento: 78,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea()],
        DatiRiepilogo: [{ AliquotaIVA: -22, ImponibileImporto: 100, Imposta: -22 }],
      },
    });
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('AliquotaIVA') && e.code === 'INVALID_VALUE')).toBe(true);
    }
  });

  it('lotto vuoto (bodies = []) viene segnalato', () => {
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: headerIT(),
      FatturaElettronicaBody: [],
    };
    expect(validate(fattura).ok).toBe(false);
  });

  it('Quantita negativa per nota di credito è ammessa se PrezzoTotale è coerente', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD04', Divisa: 'EUR', Data: '2026-05-18', Numero: 'NC-NEG-1',
        ImportoTotaleDocumento: -122,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: 100, Quantita: -1, PrezzoTotale: -100 })],
        DatiRiepilogo: [riep({ ImponibileImporto: -100, Imposta: -22 })],
      },
    });
    expect(validate(fattura).ok).toBe(true);
  });

  it('TipoDocumento undefined emette MISSING_REQUIRED_FIELD', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: undefined as never, Divisa: 'EUR', Data: '2026-05-18', Numero: 'TD-UND',
        ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('TipoDocumento') && e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    }
  });

  it('Natura "N6" (senza sottocodice) in DatiRiepilogo viene segnalata come deprecata', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'N6-RAW',
        ImportoTotaleDocumento: 100,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'N6.1' })],
        DatiRiepilogo: [{ AliquotaIVA: 0, ImponibileImporto: 100, Imposta: 0, Natura: 'N6' as never }],
      },
    });
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.message.includes('00445'))).toBe(true);
    }
  });

  it('ImportoBollo undefined (DatiBollo presente) emette MISSING_REQUIRED_FIELD', () => {
    const fattura = f(bodyStd({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'BOL-NOIMP',
        DatiBollo: { BolloVirtuale: 'SI' } as never,
        ImportoTotaleDocumento: 122,
      }},
    }));
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('ImportoBollo') && e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    }
  });

  it('Natura "XYZ" (codice inesistente) viene segnalata', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'NAT-X', ImportoTotaleDocumento: 100,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'XYZ' as never })],
        DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 100, Imposta: 0, Natura: 'XYZ' as never })],
      },
    });
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('Natura') && e.code === 'INVALID_VALUE')).toBe(true);
    }
  });

  it('EsigibilitaIVA "X" (codice inesistente) viene segnalata', () => {
    const fattura = f(bodyStd({
      DatiBeniServizi: {
        DettaglioLinee: [linea()],
        DatiRiepilogo: [riep({ EsigibilitaIVA: 'X' as never })],
      },
    }));
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('EsigibilitaIVA') && e.code === 'INVALID_VALUE')).toBe(true);
    }
  });

  it('ScontoMaggiorazione SC 110% rende PrezzoTotale incoerente e viene segnalato', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'SC-110', ImportoTotaleDocumento: 0,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({
          PrezzoUnitario: 100, Quantita: 1,
          ScontoMaggiorazione: [{ Tipo: 'SC', Percentuale: 110 }],
          PrezzoTotale: 0,
        })],
        DatiRiepilogo: [riep({ ImponibileImporto: 0, Imposta: 0, AliquotaIVA: 22 })],
      },
    });
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('PrezzoTotale'))).toBe(true);
    }
  });

  it('ScontoMaggiorazione con Percentuale + Importo entrambi viene segnalato come incoerente', () => {
    const fattura = f(bodyStd({
      DatiBeniServizi: {
        DettaglioLinee: [linea({
          PrezzoUnitario: 100, Quantita: 1,
          ScontoMaggiorazione: [{ Tipo: 'SC', Percentuale: 10, Importo: 5 }],
          PrezzoTotale: 90,
        })],
        DatiRiepilogo: [riep({ ImponibileImporto: 90, Imposta: 19.80 })],
      },
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('DataScadenzaPagamento precedente alla Data del documento viene segnalata', () => {
    const fattura = f(bodyStd({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'SCAD-KO', ImportoTotaleDocumento: 122,
      }},
      DatiPagamento: [{
        CondizioniPagamento: 'TP02',
        DettaglioPagamento: [{
          ModalitaPagamento: 'MP05',
          DataScadenzaPagamento: '2026-04-01',
          ImportoPagamento: 122,
        }],
      }],
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('lotto con stesso Numero fattura su più body viene segnalato', () => {
    const mkBody = (n: string): FatturaElettronicaBody => ({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: n, ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: headerIT(),
      FatturaElettronicaBody: [mkBody('FT-1'), mkBody('FT-1'), mkBody('FT-2')],
    };
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.message.includes('Numero') || e.field.includes('Numero'))).toBe(true);
    }
  });

  it('Riepilogo IVA duplicato (stessa AliquotaIVA+Natura) viene segnalato', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'RIP-DUP', ImportoTotaleDocumento: 244,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [
          linea({ NumeroLinea: 1, PrezzoUnitario: 100, PrezzoTotale: 100 }),
          linea({ NumeroLinea: 2, PrezzoUnitario: 100, PrezzoTotale: 100 }),
        ],
        DatiRiepilogo: [
          { AliquotaIVA: 22, ImponibileImporto: 100, Imposta: 22 },
          { AliquotaIVA: 22, ImponibileImporto: 100, Imposta: 22 },
        ] as DatiRiepilogo[],
      },
    });
    expect(validate(fattura).ok).toBe(false);
  });

  it('ImportoTotaleDocumento = 0 con linee positive viene segnalato come incoerente', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'TOT-0',
        ImportoTotaleDocumento: 0,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    expect(validate(fattura).ok).toBe(false);
  });

  it('DatiCassaPrevidenziale.AliquotaIVA negativa viene segnalata', () => {
    const fattura = f(bodyStd({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'CASSA-NEG', ImportoTotaleDocumento: 122,
        DatiCassaPrevidenziale: {
          TipoCassa: 'TC02', AlCassa: 4, ImportoContributoCassa: 40, AliquotaIVA: -22,
        },
      }},
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('PrezzoUnitario = 0 deve essere ammesso (omaggio)', () => {
    const fattura = f(bodyStd({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'OMAG', ImportoTotaleDocumento: 0,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: 0, PrezzoTotale: 0, AliquotaIVA: 0, Natura: 'N1' })],
        DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 0, Imposta: 0, Natura: 'N1' })],
      },
    }));
    expect(validate(fattura).ok).toBe(true);
  });

  it('DataDDT successiva alla Data del documento viene segnalata', () => {
    const fattura = f(bodyStd({
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: 'TD24', Divisa: 'EUR', Data: '2026-05-18', Numero: 'DDT-FUT', ImportoTotaleDocumento: 122,
        },
        DatiDDT: [{ NumeroDDT: 'DDT-1', DataDDT: '2027-01-01' }],
      },
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('ScontoMaggiorazione con Tipo non in enum viene segnalato', () => {
    const fattura = f(bodyStd({
      DatiBeniServizi: {
        DettaglioLinee: [linea({
          ScontoMaggiorazione: [{ Tipo: 'XX' as never, Percentuale: 10 }],
          PrezzoTotale: 90,
        })],
        DatiRiepilogo: [riep({ ImponibileImporto: 90, Imposta: 19.80 })],
      },
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('fattura "mostro" — accumula 10+ errori contemporaneamente', () => {
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: {
        DatiTrasmissione: {
          IdTrasmittente: { IdPaese: 'it', IdCodice: '' },
          ProgressivoInvio: '',
          FormatoTrasmissione: 'FPR12',
          CodiceDestinatario: '',
        },
        CedentePrestatore: {
          DatiAnagrafici: {
            IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '123' },
            Anagrafica: {},
            RegimeFiscale: 'RFXX' as never,
          },
          Sede: { Indirizzo: '', CAP: '0010', Comune: '', Nazione: 'IT' },
        },
        CessionarioCommittente: {
          DatiAnagrafici: {
            Anagrafica: { Denominazione: 'Cliente' },
          },
          Sede: { Indirizzo: 'Via X', CAP: '20100', Comune: 'Milano', Provincia: 'mi', Nazione: 'IT' },
        },
      },
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'XX99' as never,
          Divisa: 'eu' as never,
          Data: '18/05/2026',
          Numero: 'FT 2026 001',
          ImportoTotaleDocumento: 999,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea({ NumeroLinea: 0, AliquotaIVA: 0 })],
          DatiRiepilogo: [{ AliquotaIVA: 0, ImponibileImporto: 100, Imposta: 0 } as DatiRiepilogo],
        },
      },
    };
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('lotto misto — body[0] OK, body[1] Imposta incoerente, body[2] NumeroLinea duplicato', () => {
    const mkOk = (n: number): FatturaElettronicaBody => ({
      DatiGenerali: { DatiGeneraliDocumento: { TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: `OK-${n}`, ImportoTotaleDocumento: 122 } },
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    const broken1: FatturaElettronicaBody = {
      DatiGenerali: { DatiGeneraliDocumento: { TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'KO-1', ImportoTotaleDocumento: 130 } },
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep({ Imposta: 30 })] },
    };
    const broken2: FatturaElettronicaBody = {
      DatiGenerali: { DatiGeneraliDocumento: { TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'KO-2', ImportoTotaleDocumento: 244 } },
      DatiBeniServizi: {
        DettaglioLinee: [linea({ NumeroLinea: 1 }), linea({ NumeroLinea: 1 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 200, Imposta: 44 })],
      },
    };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: headerIT(),
      FatturaElettronicaBody: [mkOk(0), broken1, broken2],
    };
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.every(e => !e.field.includes('FatturaElettronicaBody[0]'))).toBe(true);
      expect(r.error.fields.some(e => e.field.includes('FatturaElettronicaBody[1]') && e.field.includes('Imposta'))).toBe(true);
      expect(r.error.fields.some(e => e.field.includes('FatturaElettronicaBody[2]') && e.field.includes('DettaglioLinee'))).toBe(true);
    }
  });

  it('estero malformato — CodiceDestinatario sbagliato + Provincia per Nazione non IT', () => {
    const h = headerIT();
    h.DatiTrasmissione.CodiceDestinatario = 'ABC1234';
    h.CessionarioCommittente = {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'DE', IdCodice: 'DE123456789' },
        Anagrafica: { Denominazione: 'Kunde GmbH' },
      },
      Sede: { Indirizzo: 'Hauptstraße 1', CAP: '10115', Comune: 'Berlin', Provincia: 'XYZ', Nazione: 'DE' },
    };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'EU-KO-1', ImportoTotaleDocumento: 100,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'N7' })],
          DatiRiepilogo: [riep({ AliquotaIVA: 0, Imposta: 0, Natura: 'N7' })],
        },
      },
    };
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('CodiceDestinatario'))).toBe(true);
      expect(r.error.fields.some(e => e.field.includes('Provincia'))).toBe(true);
    }
  });
});
