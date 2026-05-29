/**
 * Edge case specifici legati ai codici errore SDI numerati.
 * Ogni test mira a un singolo errore semantico verificato dall'engine SDI reale.
 */

import type { FatturaElettronica, FatturaElettronicaBody } from '../../src/types/index';
import { headerIT, linea, riep, expectErr } from '../helpers/builders';
import { validate } from '../../src/validator/index';

function f(body: FatturaElettronicaBody): FatturaElettronica {
  return { FatturaElettronicaHeader: headerIT(), FatturaElettronicaBody: body };
}

describe('E2E · Edge case SDI', () => {
  it('TD21 splafonamento — cedente = cessionario, IVA > 0 → OK', () => {
    const h = headerIT();
    h.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA = { IdPaese: 'IT', IdCodice: '01234567890' };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD21', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'SPL-2026-1', ImportoTotaleDocumento: 122,
        }},
        DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      },
    };
    expect(validate(fattura).ok).toBe(true);
  });

  it('TD17 KO — cedente IT (deve essere estero, SDI 00473)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD17', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'TD17-1', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    const err = expectErr(validate(fattura), ['INVALID_VALUE'], ['TipoDocumento']);
    expect(err.fields.some(e => e.message.includes('00473'))).toBe(true);
  });

  it('TD28 KO — cedente non San Marino (deve essere SM)', () => {
    const h = headerIT();
    h.CedentePrestatore.DatiAnagrafici.IdFiscaleIVA = { IdPaese: 'FR', IdCodice: 'FR12345678901' };
    h.CedentePrestatore.Sede.Nazione = 'FR';
    h.CedentePrestatore.Sede.Provincia = undefined;
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD28', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'TD28-1', ImportoTotaleDocumento: 122,
        }},
        DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      },
    };
    expectErr(validate(fattura), ['INVALID_VALUE'], ['TipoDocumento']);
  });

  it('Natura N2 deprecata (SDI 00445) — richiede sottocodice', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'NAT-DEP-1', ImportoTotaleDocumento: 100,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'N2' as never })],
        DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 100, Imposta: 0, Natura: 'N2' as never })],
      },
    });
    const err = expectErr(validate(fattura), ['INVALID_VALUE'], ['Natura']);
    expect(err.fields.some(e => e.message.includes('00445'))).toBe(true);
  });

  it('N6 + split payment (SDI 00420)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'N6-S-1', ImportoTotaleDocumento: 100,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'N6.1' })],
        DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 100, Imposta: 0, Natura: 'N6.1', EsigibilitaIVA: 'S' })],
      },
    });
    const err = expectErr(validate(fattura), ['INVALID_VALUE'], ['EsigibilitaIVA']);
    expect(err.fields.some(e => e.message.includes('00420'))).toBe(true);
  });

  it('Natura valorizzata con AliquotaIVA > 0 (SDI 00401/00430)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'NAT-IVA-1', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ AliquotaIVA: 22, Natura: 'N4' })],
        DatiRiepilogo: [riep({ Natura: 'N4' })],
      },
    });
    expectErr(validate(fattura), ['INVALID_VALUE'], ['AliquotaIVA']);
  });

  it('NumeroLinea non sequenziale (1, 3)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'SEQ-1', ImportoTotaleDocumento: 244,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ NumeroLinea: 1 }), linea({ NumeroLinea: 3 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 200, Imposta: 44 })],
      },
    });
    expectErr(validate(fattura), ['INVALID_VALUE'], ['DettaglioLinee']);
  });

  it('PrezzoTotale incoerente con PrezzoUnitario × Quantita (SDI 00423)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'PT-KO-1', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: 50, Quantita: 2, PrezzoTotale: 80 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 80, Imposta: 17.6 })],
      },
    });
    const err = expectErr(validate(fattura), ['INVALID_VALUE'], ['PrezzoTotale']);
    expect(err.fields.some(e => e.message.includes('00423'))).toBe(true);
  });

  it('Imposta incoerente con Aliquota × Imponibile', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'IMP-KO-1', ImportoTotaleDocumento: 130,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea()],
        DatiRiepilogo: [riep({ Imposta: 30 })],
      },
    });
    expectErr(validate(fattura), ['INVALID_VALUE'], ['Imposta']);
  });

  it('ImponibileImporto totale fuori tolleranza ±1 (SDI 00422)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'IMPON-KO', ImportoTotaleDocumento: 244,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoTotale: 100 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 200, Imposta: 44 })],
      },
    });
    const err = expectErr(validate(fattura), ['INVALID_VALUE'], ['DatiRiepilogo']);
    expect(err.fields.some(e => e.message.includes('00422'))).toBe(true);
  });

  it('ImportoTotaleDocumento incoerente', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'TOTDOC-KO', ImportoTotaleDocumento: 999,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    });
    expectErr(validate(fattura), ['INVALID_VALUE'], ['ImportoTotaleDocumento']);
  });

  it('Provincia mancante con Nazione=IT', () => {
    const h = headerIT();
    h.CedentePrestatore.Sede.Provincia = undefined;
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
          Numero: 'PROV-KO', ImportoTotaleDocumento: 122,
        }},
        DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      },
    };
    expectErr(validate(fattura), ['MISSING_REQUIRED_FIELD'], ['Provincia']);
  });

  it('DataFinePeriodo precedente a DataInizioPeriodo', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'PER-KO', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ DataInizioPeriodo: '2026-06-30', DataFinePeriodo: '2026-06-01' })],
        DatiRiepilogo: [riep()],
      },
    });
    expectErr(validate(fattura), ['INVALID_VALUE'], ['DataFinePeriodo']);
  });

  it('PrezzoUnitario con 9 decimali (max 8)', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'DEC-KO', ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: 100.123456789, PrezzoTotale: 100.12 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 100.12, Imposta: 22.03 })],
      },
    });
    expectErr(validate(fattura), ['INVALID_FORMAT'], ['PrezzoUnitario']);
  });

  it('Eccesso caratteri XML — 19 cifre intere su campo 21 char', () => {
    const big = 9999999999999999999;
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18',
        Numero: 'BIG-KO', ImportoTotaleDocumento: 100,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ Quantita: big, PrezzoUnitario: 0.01, PrezzoTotale: 100 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 100, Imposta: 22 })],
      },
    });
    expectErr(validate(fattura), ['INVALID_FORMAT'], ['Quantita']);
  });
});
