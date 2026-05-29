/**
 * Regression suite — hygiene del valore singolo: format, range, decimali,
 * tipi degeneri (NaN/Infinity), date calendaristiche, base64.
 * Ogni test corrisponde a un bug storicamente scovato e fixato.
 */

import type { FatturaElettronica, FatturaElettronicaBody } from '../../../src/types/index';
import { headerIT, linea, riep, bodyStd } from '../../helpers/builders';
import { validate } from '../../../src/validator/index';
import { buildXml } from '../../../src/builder/index';

function f(body: FatturaElettronicaBody): FatturaElettronica {
  return { FatturaElettronicaHeader: headerIT(), FatturaElettronicaBody: body };
}

describe('Regression · input validation', () => {

  it('valori derivati da somma float (0.1+0.2) non triggerano falsi positivi su decimali', () => {
    const dirty = 0.1 + 0.2;
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'FL-1',
        ImportoTotaleDocumento: 0.37,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: dirty, Quantita: 1, PrezzoTotale: 0.30 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 0.30, Imposta: 0.07 })],
      },
    });
    expect(validate(fattura).ok).toBe(true);
  });

  it('data 2026-02-31 (giorno inesistente) viene segnalata', () => {
    const fattura = f(bodyStd({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-02-31', Numero: 'D-1',
        ImportoTotaleDocumento: 122,
      }},
    }));
    const r = validate(fattura);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.fields.some(e => e.field.includes('Data') && e.code === 'INVALID_DATE_FORMAT')).toBe(true);
    }
  });

  it('data 2026-13-01 (mese inesistente) viene segnalata', () => {
    const fattura = f(bodyStd({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-13-01', Numero: 'D-2',
        ImportoTotaleDocumento: 122,
      }},
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('NumeroLinea decimale (1.5) viene segnalato', () => {
    const fattura = f(bodyStd({
      DatiBeniServizi: { DettaglioLinee: [linea({ NumeroLinea: 1.5 })], DatiRiepilogo: [riep()] },
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('PrezzoUnitario = NaN viene segnalato', () => {
    const fattura = f(bodyStd({
      DatiBeniServizi: { DettaglioLinee: [linea({ PrezzoUnitario: NaN, PrezzoTotale: 100 })], DatiRiepilogo: [riep()] },
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('PrezzoUnitario = Infinity viene segnalato', () => {
    const fattura = f(bodyStd({
      DatiBeniServizi: { DettaglioLinee: [linea({ PrezzoUnitario: Infinity, PrezzoTotale: 100 })], DatiRiepilogo: [riep()] },
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('ImportoPagamento = NaN viene segnalato', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'P-NAN',
        ImportoTotaleDocumento: 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      DatiPagamento: [{
        CondizioniPagamento: 'TP02',
        DettaglioPagamento: [{ ModalitaPagamento: 'MP05', ImportoPagamento: NaN }],
      }],
    });
    expect(validate(fattura).ok).toBe(false);
  });

  it('PrezzoTotale = atteso + 0.01 (limite tolleranza) deve passare nonostante rumore float', () => {
    const fattura = f({
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'TOL-1',
        ImportoTotaleDocumento: 122.01,
      }},
      DatiBeniServizi: {
        DettaglioLinee: [linea({ PrezzoUnitario: 100, Quantita: 1, PrezzoTotale: 100.01 })],
        DatiRiepilogo: [riep({ ImponibileImporto: 100.01, Imposta: 22 })],
      },
    });
    expect(validate(fattura).ok).toBe(true);
  });

  it('Allegato Attachment con caratteri non-base64 viene segnalato', () => {
    const fattura = f(bodyStd({
      Allegati: [{ NomeAttachment: 'doc.pdf', Attachment: '!!! not base64 @@@' }],
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('GiorniTerminiPagamento negativo viene segnalato', () => {
    const fattura = f(bodyStd({
      DatiPagamento: [{
        CondizioniPagamento: 'TP02',
        DettaglioPagamento: [{ ModalitaPagamento: 'MP05', GiorniTerminiPagamento: -30, ImportoPagamento: 122 }],
      }],
    }));
    expect(validate(fattura).ok).toBe(false);
  });

  it('CAP estero UK di 7 caratteri (SW1A1AA) deve essere ammesso', () => {
    const h = headerIT();
    h.DatiTrasmissione.CodiceDestinatario = 'XXXXXXX';
    h.CessionarioCommittente = {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'GB', IdCodice: 'GB123456789' },
        Anagrafica: { Denominazione: 'UK Customer Ltd' },
      },
      Sede: { Indirizzo: '10 Downing St', CAP: 'SW1A1AA', Comune: 'London', Nazione: 'GB' },
    };
    const fattura: FatturaElettronica = {
      FatturaElettronicaHeader: h,
      FatturaElettronicaBody: bodyStd({
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'UK-1', ImportoTotaleDocumento: 100,
        }},
        DatiBeniServizi: {
          DettaglioLinee: [linea({ AliquotaIVA: 0, Natura: 'N7' })],
          DatiRiepilogo: [riep({ AliquotaIVA: 0, ImponibileImporto: 100, Imposta: 0, Natura: 'N7' })],
        },
      }),
    };
    expect(validate(fattura).ok).toBe(true);
  });

  it('caratteri XML speciali in Descrizione vengono escapati dal builder', () => {
    const fattura = f(bodyStd({
      DatiBeniServizi: {
        DettaglioLinee: [linea({ Descrizione: 'Item <A> & "B" <100%' })],
        DatiRiepilogo: [riep()],
      },
    }));
    expect(validate(fattura).ok).toBe(true);
    const xml = buildXml(fattura);
    expect(xml.ok).toBe(true);
    if (xml.ok) {
      expect(xml.value).toContain('&lt;A&gt;');
      expect(xml.value).toContain('&amp;');
      expect(xml.value).not.toContain('<A>');
    }
  });
});
