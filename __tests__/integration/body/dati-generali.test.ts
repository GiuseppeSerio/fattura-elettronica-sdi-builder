import { validate } from '../../../src/validator/index';
import { withBody, expectCode, baseDoc, dgBase } from '../../helpers/body-rules';

describe('DatiGeneraliDocumento', () => {
  it('errore se Divisa non è ISO 4217 (3 lettere maiuscole)', () => {
    const f = withBody({ DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), Divisa: 'eu' } } });
    expectCode(validate(f), 'INVALID_FORMAT', 'Divisa');
  });

  it('errore se Numero fattura contiene spazio', () => {
    const f = withBody({ DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), Numero: 'FT 2026 001' } } });
    expectCode(validate(f), 'INVALID_FORMAT', 'Numero');
  });

  it('errore se Numero fattura supera 20 caratteri', () => {
    const f = withBody({ DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), Numero: 'A'.repeat(21) } } });
    expectCode(validate(f), 'EXCEEDS_MAX_LENGTH', 'Numero');
  });

  it('errore se Causale supera 200 caratteri', () => {
    const f = withBody({ DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), Causale: 'x'.repeat(201) } } });
    expectCode(validate(f), 'EXCEEDS_MAX_LENGTH', 'Causale');
  });
});

describe('DatiRitenuta', () => {
  it('errore se AliquotaRitenuta > 100', () => {
    const f = withBody({
      DatiGenerali: {
        DatiGeneraliDocumento: {
          ...baseDoc(),
          DatiRitenuta: { TipoRitenuta: 'RT02', ImportoRitenuta: 20, AliquotaRitenuta: 101, CausalePagamento: 'A' },
        },
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'AliquotaRitenuta');
  });

  it('errore se CausalePagamento non è nella lista ammessa', () => {
    const f = withBody({
      DatiGenerali: {
        DatiGeneraliDocumento: {
          ...baseDoc(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DatiRitenuta: { TipoRitenuta: 'RT02', ImportoRitenuta: 20, AliquotaRitenuta: 20, CausalePagamento: 'INVALID' as any },
        },
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'CausalePagamento');
  });
});

describe('DatiBollo', () => {
  it('errore se ImportoBollo è 0', () => {
    const f = withBody({
      DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), DatiBollo: { BolloVirtuale: 'SI', ImportoBollo: 0 } } },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'ImportoBollo');
  });
});

describe('DatiCassaPrevidenziale', () => {
  it('errore se TipoCassa non è nella lista ammessa', () => {
    const f = withBody({
      DatiGenerali: {
        DatiGeneraliDocumento: {
          ...baseDoc(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DatiCassaPrevidenziale: { TipoCassa: 'XX99' as any, AlCassa: 4, ImportoContributoCassa: 4, AliquotaIVA: 22 },
        },
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'TipoCassa');
  });

  it('errore MISSING_NATURA se AliquotaIVA=0 senza Natura nella cassa', () => {
    const f = withBody({
      DatiGenerali: {
        DatiGeneraliDocumento: {
          ...baseDoc(),
          DatiCassaPrevidenziale: { TipoCassa: 'TC01', AlCassa: 4, ImportoContributoCassa: 4, AliquotaIVA: 0 },
        },
      },
    });
    expectCode(validate(f), 'MISSING_NATURA', 'Natura');
  });
});

describe('DatiDDT', () => {
  it('errore se NumeroDDT mancante', () => {
    const f = withBody({
      DatiGenerali: { ...dgBase(), DatiDDT: [{ NumeroDDT: '', DataDDT: '2026-05-01' }] },
    });
    expectCode(validate(f), 'MISSING_REQUIRED_FIELD', 'NumeroDDT');
  });

  it('errore se DataDDT in formato errato', () => {
    const f = withBody({
      DatiGenerali: { ...dgBase(), DatiDDT: [{ NumeroDDT: 'DDT001', DataDDT: '01/05/2026' }] },
    });
    expectCode(validate(f), 'INVALID_DATE_FORMAT', 'DataDDT');
  });
});
