import { buildXml } from '../../src/builder/index';
import { BuildError } from '../../src/errors/index';
import { fatturaB2B } from '../fixtures/fattura-b2b';

describe('buildXml()', () => {
  it('ritorna ok con XML valido', () => {
    const result = buildXml(fatturaB2B);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('<?xml');
      expect(result.value).toContain('FatturaElettronica');
    }
  });

  it('include FatturaElettronicaHeader', () => {
    const result = buildXml(fatturaB2B);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('<FatturaElettronicaHeader>');
      expect(result.value).toContain('<FormatoTrasmissione>FPR12</FormatoTrasmissione>');
      expect(result.value).toContain('<CodiceDestinatario>ABC1234</CodiceDestinatario>');
    }
  });

  it('include CedentePrestatore con anagrafica e regime fiscale', () => {
    const result = buildXml(fatturaB2B);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('<CedentePrestatore>');
      expect(result.value).toContain('<Denominazione>Fornitore Srl</Denominazione>');
      expect(result.value).toContain('<RegimeFiscale>RF01</RegimeFiscale>');
    }
  });

  it('include CessionarioCommittente', () => {
    const result = buildXml(fatturaB2B);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('<CessionarioCommittente>');
      expect(result.value).toContain('<Denominazione>Cliente Spa</Denominazione>');
    }
  });

  it('include body con linee e riepilogo IVA', () => {
    const result = buildXml(fatturaB2B);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('<TipoDocumento>TD01</TipoDocumento>');
      expect(result.value).toContain('<DettaglioLinee>');
      expect(result.value).toContain('<DatiRiepilogo>');
      expect(result.value).toContain('<AliquotaIVA>22.00</AliquotaIVA>');
    }
  });

  it('include DatiPagamento', () => {
    const result = buildXml(fatturaB2B);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('<ModalitaPagamento>MP05</ModalitaPagamento>');
      expect(result.value).toContain('<IBAN>IT60X0542811101000000123456</IBAN>');
    }
  });

  it('supporta pretty print', () => {
    const result = buildXml(fatturaB2B, { prettyPrint: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatch(/\n/);
    }
  });

  it('ritorna err(BuildError) su input non serializzabile', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    // Forziamo un errore passando un oggetto con getter che lancia
    const broken = {
      ...fatturaB2B,
      FatturaElettronicaHeader: {
        ...fatturaB2B.FatturaElettronicaHeader,
        DatiTrasmissione: {
          ...fatturaB2B.FatturaElettronicaHeader.DatiTrasmissione,
          get FormatoTrasmissione(): never {
            throw new Error('Errore simulato nel getter');
          },
        },
      },
    };

    const result = buildXml(broken as never);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(BuildError);
    }
  });
});
