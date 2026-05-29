import { validate } from '../../../src/validator/index';
import { fatturaB2B } from '../../fixtures/fattura-b2b';
import { expectCode } from '../../helpers/body-rules';
import type { FatturaElettronica } from '../../../src/types/index';

describe('CodiceDestinatario cross-field', () => {
  it('FPR12: ok con 7 caratteri', () => {
    expect(validate(fatturaB2B).ok).toBe(true);
  });

  it('FPA12: errore se CodiceDestinatario ha 7 caratteri invece di 6', () => {
    const f: FatturaElettronica = {
      ...fatturaB2B,
      FatturaElettronicaHeader: {
        ...fatturaB2B.FatturaElettronicaHeader,
        DatiTrasmissione: {
          ...fatturaB2B.FatturaElettronicaHeader.DatiTrasmissione,
          FormatoTrasmissione: 'FPA12',
          CodiceDestinatario: 'ABC1234', // 7 char — sbagliato per FPA12
        },
      },
    };
    expectCode(validate(f), 'INVALID_FORMAT', 'CodiceDestinatario');
  });

  it('FPA12: ok con 6 caratteri', () => {
    const f: FatturaElettronica = {
      ...fatturaB2B,
      FatturaElettronicaHeader: {
        ...fatturaB2B.FatturaElettronicaHeader,
        DatiTrasmissione: {
          ...fatturaB2B.FatturaElettronicaHeader.DatiTrasmissione,
          FormatoTrasmissione: 'FPA12',
          CodiceDestinatario: 'ABC123', // 6 char — ok
        },
      },
    };
    expect(validate(f).ok).toBe(true);
  });

  it('estero: errore se CodiceDestinatario non è XXXXXXX', () => {
    const f: FatturaElettronica = {
      ...fatturaB2B,
      FatturaElettronicaHeader: {
        ...fatturaB2B.FatturaElettronicaHeader,
        CessionarioCommittente: {
          ...fatturaB2B.FatturaElettronicaHeader.CessionarioCommittente,
          DatiAnagrafici: {
            IdFiscaleIVA: { IdPaese: 'DE', IdCodice: '123456789' },
            Anagrafica: { Denominazione: 'Kunde GmbH' },
          },
        },
        DatiTrasmissione: {
          ...fatturaB2B.FatturaElettronicaHeader.DatiTrasmissione,
          CodiceDestinatario: 'ABC1234', // dovrebbe essere XXXXXXX
        },
      },
    };
    expectCode(validate(f), 'INVALID_VALUE', 'CodiceDestinatario');
  });

  it('estero: ok se CodiceDestinatario è XXXXXXX', () => {
    const f: FatturaElettronica = {
      ...fatturaB2B,
      FatturaElettronicaHeader: {
        ...fatturaB2B.FatturaElettronicaHeader,
        CessionarioCommittente: {
          ...fatturaB2B.FatturaElettronicaHeader.CessionarioCommittente,
          DatiAnagrafici: {
            IdFiscaleIVA: { IdPaese: 'DE', IdCodice: '123456789' },
            Anagrafica: { Denominazione: 'Kunde GmbH' },
          },
          Sede: { Indirizzo: 'Hauptstraße 1', CAP: '10115', Comune: 'Berlin', Nazione: 'DE' },
        },
        DatiTrasmissione: {
          ...fatturaB2B.FatturaElettronicaHeader.DatiTrasmissione,
          CodiceDestinatario: 'XXXXXXX',
        },
      },
    };
    expect(validate(f).ok).toBe(true);
  });
});
