import { validate } from '../../../src/validator/index';
import { withBody, expectCode, detBase } from '../../helpers/body-rules';

describe('DatiPagamento', () => {
  it('errore se DettaglioPagamento è vuoto', () => {
    const f = withBody({
      DatiPagamento: [{ CondizioniPagamento: 'TP02', DettaglioPagamento: [] }],
    });
    expectCode(validate(f), 'EMPTY_COLLECTION', 'DettaglioPagamento');
  });

  it('errore se ABI non ha 5 cifre', () => {
    const f = withBody({
      DatiPagamento: [{ CondizioniPagamento: 'TP02', DettaglioPagamento: [{ ...detBase(), ABI: '1234' }] }],
    });
    expectCode(validate(f), 'INVALID_FORMAT', 'ABI');
  });

  it('errore se CAB non ha 5 cifre', () => {
    const f = withBody({
      DatiPagamento: [{ CondizioniPagamento: 'TP02', DettaglioPagamento: [{ ...detBase(), CAB: 'AB123' }] }],
    });
    expectCode(validate(f), 'INVALID_FORMAT', 'CAB');
  });

  it('errore se Beneficiario supera 200 caratteri', () => {
    const f = withBody({
      DatiPagamento: [{ CondizioniPagamento: 'TP02', DettaglioPagamento: [{ ...detBase(), Beneficiario: 'x'.repeat(201) }] }],
    });
    expectCode(validate(f), 'EXCEEDS_MAX_LENGTH', 'Beneficiario');
  });

  it('errore se DataScadenzaPagamento in formato errato', () => {
    const f = withBody({
      DatiPagamento: [{ CondizioniPagamento: 'TP02', DettaglioPagamento: [{ ...detBase(), DataScadenzaPagamento: '18/06/2026' }] }],
    });
    expectCode(validate(f), 'INVALID_DATE_FORMAT', 'DataScadenzaPagamento');
  });
});
