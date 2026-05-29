/**
 * Round-trip: validate ok → buildXml produce XML conforme.
 * Verifica che la pipeline completa (defaults opzionali + validate + build) sia consistente.
 */

import type { FatturaElettronica } from '../../src/types/index';
import { headerIT, linea, riep } from '../helpers/builders';
import { validate } from '../../src/validator/index';
import { buildXml } from '../../src/builder/index';
import { applyDefaults } from '../../src/defaults/index';

function fatturaSemplice(numero: string, opts: { conTotale?: boolean } = {}): FatturaElettronica {
  return {
    FatturaElettronicaHeader: headerIT(),
    FatturaElettronicaBody: {
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: numero,
        ImportoTotaleDocumento: opts.conTotale === false ? undefined : 122,
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    },
  };
}

describe('E2E · Round-trip validate + buildXml', () => {
  it.each([
    ['standard', fatturaSemplice('RT-001')],
    ['senza totale', fatturaSemplice('RT-002', { conTotale: false })],
  ])('%s — validate ok e buildXml produce XML conforme', (_label, fattura) => {
    const validation = validate(fattura);
    expect(validation.ok).toBe(true);

    const xml = buildXml(fattura);
    expect(xml.ok).toBe(true);
    if (xml.ok) {
      expect(xml.value).toContain('<?xml');
      expect(xml.value).toContain('<p:FatturaElettronica');
      expect(xml.value).toContain('<TipoDocumento>TD01</TipoDocumento>');
      expect(xml.value).toContain('<AliquotaIVA>22.00</AliquotaIVA>');
      expect(xml.value).toContain('<PrezzoTotale>100.00</PrezzoTotale>');
    }
  });

  it('applyDefaults → validate → buildXml su input parziale', () => {
    const input = {
      FatturaElettronicaHeader: {
        ...headerIT(),
        DatiTrasmissione: {
          ...headerIT().DatiTrasmissione,
        },
      },
      FatturaElettronicaBody: {
        DatiGenerali: { DatiGeneraliDocumento: {
          TipoDocumento: 'TD01', Numero: 'DEF-1', ImportoTotaleDocumento: 122,
          // Divisa e Data assenti — vengono dedotte
        }},
        DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
      },
    } as unknown as Parameters<typeof applyDefaults>[0];

    const fattura = applyDefaults(input);
    const body = Array.isArray(fattura.FatturaElettronicaBody)
      ? fattura.FatturaElettronicaBody[0]!
      : fattura.FatturaElettronicaBody;
    expect(body.DatiGenerali.DatiGeneraliDocumento.Divisa).toBe('EUR');
    expect(body.DatiGenerali.DatiGeneraliDocumento.Data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(validate(fattura).ok).toBe(true);

    const xml = buildXml(fattura);
    expect(xml.ok).toBe(true);
  });
});
