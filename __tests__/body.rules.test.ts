import { validate } from '../src/validator/index';
import { fatturaB2B } from './fixtures';
import type { FatturaElettronica, FatturaElettronicaBody } from '../src/types/index';

// Helper: clona il body e sovrascrive proprietà
function withBody(overrides: Partial<FatturaElettronicaBody>): FatturaElettronica {
  return {
    ...fatturaB2B,
    FatturaElettronicaBody: { ...(fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody), ...overrides },
  };
}

// ---- DatiGeneraliDocumento -------------------------------------------------

describe('DatiGeneraliDocumento', () => {
  it('ok con fattura valida', () => {
    expect(validate(fatturaB2B).ok).toBe(true);
  });

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

// ---- DatiRitenuta ----------------------------------------------------------

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

// ---- DatiBollo -------------------------------------------------------------

describe('DatiBollo', () => {
  it('errore se ImportoBollo è 0', () => {
    const f = withBody({
      DatiGenerali: { DatiGeneraliDocumento: { ...baseDoc(), DatiBollo: { BolloVirtuale: 'SI', ImportoBollo: 0 } } },
    });
    expectCode(validate(f), 'INVALID_VALUE', 'ImportoBollo');
  });
});

// ---- DatiCassaPrevidenziale ------------------------------------------------

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

// ---- DatiDDT ---------------------------------------------------------------

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

// ---- DettaglioLinee --------------------------------------------------------

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

// ---- DatiRiepilogo ---------------------------------------------------------

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

// ---- Controlli importi (SDI 00422, 00423) ------------------------------------

describe('Controlli importi', () => {
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

// ---- DatiPagamento ---------------------------------------------------------

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

// ---- CodiceDestinatario cross-field ----------------------------------------

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

// ---- Allegati --------------------------------------------------------------

describe('Allegati', () => {
  it('errore se NomeAttachment mancante', () => {
    const f = withBody({ Allegati: [{ NomeAttachment: '', Attachment: 'base64content' }] });
    expectCode(validate(f), 'MISSING_REQUIRED_FIELD', 'NomeAttachment');
  });

  it('errore se NomeAttachment supera 60 caratteri', () => {
    const f = withBody({ Allegati: [{ NomeAttachment: 'x'.repeat(61), Attachment: 'base64content' }] });
    expectCode(validate(f), 'EXCEEDS_MAX_LENGTH', 'NomeAttachment');
  });

  it('errore se Attachment mancante', () => {
    const f = withBody({ Allegati: [{ NomeAttachment: 'file.pdf', Attachment: '' }] });
    expectCode(validate(f), 'MISSING_REQUIRED_FIELD', 'Attachment');
  });
});

// ---- Helpers ---------------------------------------------------------------

function expectCode(result: ReturnType<typeof validate>, code: string, fieldFragment: string): void {
  expect(result.ok).toBe(false);
  if (!result.ok) {
    const match = result.error.fields.find(e => e.code === code && e.field.includes(fieldFragment));
    expect(match).toBeDefined();
  }
}

function baseDoc() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiGenerali.DatiGeneraliDocumento;
}

function dgBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiGenerali;
}

function beniBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiBeniServizi;
}

function lineaBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiBeniServizi.DettaglioLinee[0]!;
}

function detBase() {
  return (fatturaB2B.FatturaElettronicaBody as FatturaElettronicaBody).DatiPagamento![0]!.DettaglioPagamento[0]!;
}
