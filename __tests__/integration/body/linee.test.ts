import { validate } from '../../../src/validator/index';
import { withBody, expectCode, beniBase, lineaBase } from '../../helpers/body-rules';

describe('DettaglioLinee', () => {
  it('errore se NumeroLinea non parte da 1', () => {
    const f = withBody({ DatiBeniServizi: { ...beniBase(), DettaglioLinee: [{ ...lineaBase(), NumeroLinea: 0 }] } });
    expectCode(validate(f), 'INVALID_VALUE', 'NumeroLinea');
  });

  it('errore con NumeroLinea duplicato', () => {
    const f = withBody({
      DatiBeniServizi: {
        ...beniBase(),
        DettaglioLinee: [{ ...lineaBase(), NumeroLinea: 1 }, { ...lineaBase(), NumeroLinea: 1 }],
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'DettaglioLinee');
  });

  it('errore con sequenza non continua (1, 3)', () => {
    const f = withBody({
      DatiBeniServizi: {
        ...beniBase(),
        DettaglioLinee: [
          { ...lineaBase(), NumeroLinea: 1 },
          { ...lineaBase(), NumeroLinea: 3 },
        ],
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'DettaglioLinee');
  });

  it('errore se Descrizione supera 1000 caratteri', () => {
    const f = withBody({ DatiBeniServizi: { ...beniBase(), DettaglioLinee: [{ ...lineaBase(), Descrizione: 'x'.repeat(1001) }] } });
    expectCode(validate(f), 'EXCEEDS_MAX_LENGTH', 'Descrizione');
  });

  it('errore se Quantita è 0', () => {
    const f = withBody({ DatiBeniServizi: { ...beniBase(), DettaglioLinee: [{ ...lineaBase(), Quantita: 0 }] } });
    expectCode(validate(f), 'INVALID_VALUE', 'Quantita');
  });

  it('errore se DataFinePeriodo è precedente a DataInizioPeriodo', () => {
    const f = withBody({
      DatiBeniServizi: {
        ...beniBase(),
        DettaglioLinee: [{ ...lineaBase(), DataInizioPeriodo: '2026-05-31', DataFinePeriodo: '2026-05-01' }],
      },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'DataFinePeriodo');
  });

  it('errore se CodiceArticolo.CodiceTipo supera 35 caratteri', () => {
    const f = withBody({
      DatiBeniServizi: {
        ...beniBase(),
        DettaglioLinee: [{ ...lineaBase(), CodiceArticolo: [{ CodiceTipo: 'x'.repeat(36), CodiceValore: 'VAL' }] }],
      },
    });
    expectCode(validate(f), 'EXCEEDS_MAX_LENGTH', 'CodiceTipo');
  });
});
