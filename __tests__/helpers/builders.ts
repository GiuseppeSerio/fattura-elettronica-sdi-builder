/**
 * Builder helper condivisi tra unit, integration ed e2e test.
 * Producono oggetti minimi e validi che i singoli test possono spread/override.
 */

import type {
  FatturaElettronica,
  FatturaElettronicaBody,
  FatturaElettronicaHeader,
  DettaglioLinee,
  DatiRiepilogo,
  DatiPagamento,
  DettaglioPagamento,
} from '../../src/types/index';
import type { ValidationError } from '../../src/errors/index';
import type { validate } from '../../src/validator/index';

// ---- Builders --------------------------------------------------------------

export function headerIT(): FatturaElettronicaHeader {
  return {
    DatiTrasmissione: {
      IdTrasmittente:      { IdPaese: 'IT', IdCodice: '01234567890' },
      ProgressivoInvio:    '00001',
      FormatoTrasmissione: 'FPR12',
      CodiceDestinatario:  'ABC1234',
    },
    CedentePrestatore: {
      DatiAnagrafici: {
        IdFiscaleIVA:  { IdPaese: 'IT', IdCodice: '01234567890' },
        Anagrafica:    { Denominazione: 'Fornitore Srl' },
        RegimeFiscale: 'RF01',
      },
      Sede: { Indirizzo: 'Via Roma 1', CAP: '00100', Comune: 'Roma', Provincia: 'RM', Nazione: 'IT' },
    },
    CessionarioCommittente: {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '09876543210' },
        Anagrafica:   { Denominazione: 'Cliente Spa' },
      },
      Sede: { Indirizzo: 'Via Milano 10', CAP: '20100', Comune: 'Milano', Provincia: 'MI', Nazione: 'IT' },
    },
  };
}

export function linea(over: Partial<DettaglioLinee> = {}): DettaglioLinee {
  return {
    NumeroLinea:    1,
    Descrizione:    'Servizio',
    Quantita:       1,
    UnitaMisura:    'NUM',
    PrezzoUnitario: 100,
    PrezzoTotale:   100,
    AliquotaIVA:    22,
    ...over,
  };
}

export function riep(over: Partial<DatiRiepilogo> = {}): DatiRiepilogo {
  return { AliquotaIVA: 22, ImponibileImporto: 100, Imposta: 22, ...over };
}

export function dettaglioPagamento(over: Partial<DettaglioPagamento> = {}): DettaglioPagamento {
  return {
    ModalitaPagamento:     'MP05',
    DataScadenzaPagamento: '2026-06-18',
    ImportoPagamento:      122,
    IBAN:                  'IT60X0542811101000000123456',
    ...over,
  };
}

export function pagamento(over: Partial<DatiPagamento> = {}): DatiPagamento {
  return {
    CondizioniPagamento: 'TP02',
    DettaglioPagamento: [dettaglioPagamento()],
    ...over,
  };
}

export function bodyStd(over: Partial<FatturaElettronicaBody> = {}): FatturaElettronicaBody {
  return {
    DatiGenerali: { DatiGeneraliDocumento: {
      TipoDocumento: 'TD01', Divisa: 'EUR', Data: '2026-05-18', Numero: 'TEST-001',
      ImportoTotaleDocumento: 122,
    }},
    DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    ...over,
  };
}

export function fattura(body: FatturaElettronicaBody): FatturaElettronica {
  return { FatturaElettronicaHeader: headerIT(), FatturaElettronicaBody: body };
}

// ---- Assertion helpers ----------------------------------------------------

type ValidateResult = ReturnType<typeof validate>;

export function expectOk(result: ValidateResult, label = ''): void {
  if (!result.ok) {
    const errors = result.error.fields.map(e => `[${e.code}] ${e.field}: ${e.message}`).join('\n');
    throw new Error(`Atteso ok, ricevuti errori${label ? ` (${label})` : ''}:\n${errors}`);
  }
  expect(result.ok).toBe(true);
}

export function expectErr(
  result: ValidateResult,
  codes: string[] = [],
  fields: string[] = [],
): ValidationError {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('Atteso errore di validazione');
  for (const code of codes) {
    expect(result.error.fields.some(e => e.code === code)).toBe(true);
  }
  for (const field of fields) {
    expect(result.error.fields.some(e => e.field.includes(field))).toBe(true);
  }
  return result.error;
}

/** Cerca un errore per codice e fragment di field path; ritorna undefined se non esiste. */
export function findError(
  result: ValidateResult,
  code: string,
  fieldFragment?: string,
) {
  if (result.ok) return undefined;
  return result.error.fields.find(e =>
    e.code === code && (!fieldFragment || e.field.includes(fieldFragment))
  );
}
