import { validate } from '../../src/validator/index';
import { ValidationError } from '../../src/errors/index';
import { fatturaB2B } from '../fixtures/fattura-b2b';
import type { FatturaElettronica } from '../../src/types/index';

describe('validate()', () => {
  it('ritorna ok per una fattura B2B corretta', () => {
    const result = validate(fatturaB2B);
    expect(result.ok).toBe(true);
  });

  it('ritorna err(ValidationError) con ProgressivoInvio mancante', () => {
    const fattura: FatturaElettronica = {
      ...fatturaB2B,
      FatturaElettronicaHeader: {
        ...fatturaB2B.FatturaElettronicaHeader,
        DatiTrasmissione: {
          ...fatturaB2B.FatturaElettronicaHeader.DatiTrasmissione,
          ProgressivoInvio: '',
          CodiceDestinatario: '',
        },
      },
    };
    const result = validate(fattura);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.fields.some(e => e.field.includes('ProgressivoInvio'))).toBe(true);
      expect(result.error.fields.some(e => e.field.includes('CodiceDestinatario'))).toBe(true);
    }
  });

  it('segnala code MISSING_NATURA quando AliquotaIVA=0 e Natura assente', () => {
    const fattura: FatturaElettronica = {
      ...fatturaB2B,
      FatturaElettronicaBody: {
        ...(fatturaB2B.FatturaElettronicaBody as object),
        DatiBeniServizi: {
          DettaglioLinee: [{
            NumeroLinea: 1,
            Descrizione: 'Operazione esente',
            PrezzoUnitario: 100,
            PrezzoTotale: 100,
            AliquotaIVA: 0,
          }],
          DatiRiepilogo: [{
            AliquotaIVA: 0,
            ImponibileImporto: 100,
            Imposta: 0,
          }],
        },
      } as FatturaElettronica['FatturaElettronicaBody'],
    };
    const result = validate(fattura);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const naturaErr = result.error.fields.find(e => e.code === 'MISSING_NATURA');
      expect(naturaErr).toBeDefined();
    }
  });

  it('segnala MISSING_ANAGRAFICA se mancano sia Denominazione che Nome+Cognome', () => {
    const fattura: FatturaElettronica = {
      ...fatturaB2B,
      FatturaElettronicaHeader: {
        ...fatturaB2B.FatturaElettronicaHeader,
        CedentePrestatore: {
          ...fatturaB2B.FatturaElettronicaHeader.CedentePrestatore,
          DatiAnagrafici: {
            ...fatturaB2B.FatturaElettronicaHeader.CedentePrestatore.DatiAnagrafici,
            Anagrafica: {},
          },
        },
      },
    };
    const result = validate(fattura);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fields.some(e => e.code === 'MISSING_ANAGRAFICA')).toBe(true);
    }
  });
});
