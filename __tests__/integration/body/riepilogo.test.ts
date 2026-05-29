import { validate } from '../../../src/validator/index';
import { withBody, expectCode, baseDoc, lineaBase, detBase } from '../../helpers/body-rules';

describe('DatiRiepilogo — cross-check Imposta', () => {
  it('errore se Imposta non coerente con AliquotaIVA×Imponibile', () => {
    const f = withBody({
      DatiBeniServizi: {
        DettaglioLinee: [lineaBase()],
        DatiRiepilogo: [{ AliquotaIVA: 22, ImponibileImporto: 100, Imposta: 30 }], // 30 ≠ 22
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'Imposta');
  });

  it('ok se Imposta coerente (100 × 22% = 22)', () => {
    const f = withBody({
      DatiBeniServizi: {
        DettaglioLinee: [lineaBase()],
        DatiRiepilogo: [{ AliquotaIVA: 22, ImponibileImporto: 100, Imposta: 22 }],
      },
    });
    expect(validate(f).ok).toBe(true);
  });

  it('ok Imposta=0 con Natura impostata', () => {
    const f = withBody({
      DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), ImportoTotaleDocumento: 100 } },
      DatiBeniServizi: {
        DettaglioLinee: [{ ...lineaBase(), AliquotaIVA: 0, Natura: 'N4' }],
        DatiRiepilogo: [{ AliquotaIVA: 0, Natura: 'N4', ImponibileImporto: 100, Imposta: 0 }],
      },
    });
    expect(validate(f).ok).toBe(true);
  });
});

describe('Controlli importi (SDI 00422, 00423)', () => {
  it('errore se PrezzoTotale non coerente con PrezzoUnitario×Quantita (SDI 00423)', () => {
    const f = withBody({
      DatiBeniServizi: {
        DettaglioLinee: [{ ...lineaBase(), PrezzoUnitario: 50, Quantita: 2, PrezzoTotale: 80 }], // atteso 100
        DatiRiepilogo: [{ AliquotaIVA: 22, ImponibileImporto: 80, Imposta: 17.60 }],
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'PrezzoTotale');
  });

  it('ok PrezzoTotale coerente con sconti in cascata', () => {
    const f = withBody({
      DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), ImportoTotaleDocumento: 110.60 } },
      DatiBeniServizi: {
        DettaglioLinee: [
          {
            ...lineaBase(),
            PrezzoUnitario: 100,
            Quantita: 1,
            ScontoMaggiorazione: [{ Tipo: 'SC', Percentuale: 10 }],
            PrezzoTotale: 90, // 100 - 10% = 90
          },
        ],
        DatiRiepilogo: [{ AliquotaIVA: 22, ImponibileImporto: 90, Imposta: 19.80 }],
      },
    });
    expect(validate(f).ok).toBe(true);
  });

  it('errore se ImponibileImporto non coerente con somma linee (SDI 00422)', () => {
    const f = withBody({
      DatiBeniServizi: {
        DettaglioLinee: [{ ...lineaBase(), PrezzoTotale: 100 }],
        DatiRiepilogo: [{ AliquotaIVA: 22, ImponibileImporto: 200, Imposta: 44 }], // 200 ≠ 100
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'DatiRiepilogo');
  });

  it('errore se ImportoTotaleDocumento non coerente con totale riepilogo', () => {
    const f = withBody({
      DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), ImportoTotaleDocumento: 50 } }, // 50 ≠ 122
    });
    expectCode(validate(f), 'INVALID_VALUE', 'ImportoTotaleDocumento');
  });

  it('errore se ImportoPagamento <= 0', () => {
    const f = withBody({
      DatiPagamento: [{ CondizioniPagamento: 'TP02', DettaglioPagamento: [{ ...detBase(), ImportoPagamento: 0 }] }],
    });
    expectCode(validate(f), 'INVALID_VALUE', 'ImportoPagamento');
  });
});
