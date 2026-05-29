/**
 * Integration test su applyDefaults(): verifica che ogni regola di default
 * venga applicata solo se il campo è omesso e non sovrascriva valori esistenti.
 */

import { applyDefaults } from '../../src/defaults/index';
import type { FatturaElettronicaInput } from '../../src/defaults/index';
import { linea, riep } from '../helpers/builders';

function minimalInput(): FatturaElettronicaInput {
  return {
    FatturaElettronicaHeader: {
      DatiTrasmissione: {
        ProgressivoInvio: '00001',
        CodiceDestinatario: 'ABC1234',
      },
      CedentePrestatore: {
        DatiAnagrafici: {
          IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '01234567890' },
          Anagrafica: { Denominazione: 'Fornitore Srl' },
          RegimeFiscale: 'RF01',
        },
        Sede: { Indirizzo: 'Via Roma 1', CAP: '00100', Comune: 'Roma', Provincia: 'RM', Nazione: 'IT' },
      },
      CessionarioCommittente: {
        DatiAnagrafici: {
          IdFiscaleIVA: { IdPaese: 'IT', IdCodice: '09876543210' },
          Anagrafica: { Denominazione: 'Cliente Spa' },
        },
        Sede: { Indirizzo: 'Via Milano 10', CAP: '20100', Comune: 'Milano', Provincia: 'MI', Nazione: 'IT' },
      },
    } as FatturaElettronicaInput['FatturaElettronicaHeader'],
    FatturaElettronicaBody: {
      DatiGenerali: { DatiGeneraliDocumento: {
        TipoDocumento: 'TD01', Numero: 'FT-001', ImportoTotaleDocumento: 122,
        // Divisa, Data: omessi
      }},
      DatiBeniServizi: { DettaglioLinee: [linea()], DatiRiepilogo: [riep()] },
    } as FatturaElettronicaInput['FatturaElettronicaBody'],
  };
}

function firstBody(f: ReturnType<typeof applyDefaults>) {
  return Array.isArray(f.FatturaElettronicaBody) ? f.FatturaElettronicaBody[0]! : f.FatturaElettronicaBody;
}

describe('applyDefaults()', () => {
  it('compila Divisa = "EUR" se omessa', () => {
    const fattura = applyDefaults(minimalInput());
    expect(firstBody(fattura).DatiGenerali.DatiGeneraliDocumento.Divisa).toBe('EUR');
  });

  it('compila Data odierna in formato YYYY-MM-DD se omessa', () => {
    const fattura = applyDefaults(minimalInput());
    expect(firstBody(fattura).DatiGenerali.DatiGeneraliDocumento.Data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('compila FormatoTrasmissione = "FPR12" se omesso', () => {
    const input = minimalInput();
    delete (input.FatturaElettronicaHeader.DatiTrasmissione as Record<string, unknown>).FormatoTrasmissione;
    const fattura = applyDefaults(input);
    expect(fattura.FatturaElettronicaHeader.DatiTrasmissione.FormatoTrasmissione).toBe('FPR12');
  });

  it('copia IdTrasmittente da CedentePrestatore.IdFiscaleIVA se omesso', () => {
    const input = minimalInput();
    delete (input.FatturaElettronicaHeader.DatiTrasmissione as Record<string, unknown>).IdTrasmittente;
    const fattura = applyDefaults(input);
    expect(fattura.FatturaElettronicaHeader.DatiTrasmissione.IdTrasmittente).toEqual({
      IdPaese: 'IT', IdCodice: '01234567890',
    });
  });

  it('NON sovrascrive valori già presenti — Divisa = "USD" rimane "USD"', () => {
    const input = minimalInput();
    const body = input.FatturaElettronicaBody as { DatiGenerali: { DatiGeneraliDocumento: { Divisa?: string } } };
    body.DatiGenerali.DatiGeneraliDocumento.Divisa = 'USD';
    const fattura = applyDefaults(input);
    expect(firstBody(fattura).DatiGenerali.DatiGeneraliDocumento.Divisa).toBe('USD');
  });

  it('NON sovrascrive Data già valorizzata', () => {
    const input = minimalInput();
    const body = input.FatturaElettronicaBody as { DatiGenerali: { DatiGeneraliDocumento: { Data?: string } } };
    body.DatiGenerali.DatiGeneraliDocumento.Data = '2025-01-01';
    const fattura = applyDefaults(input);
    expect(firstBody(fattura).DatiGenerali.DatiGeneraliDocumento.Data).toBe('2025-01-01');
  });

  it('cessionario estero senza CodiceDestinatario → applica "XXXXXXX"', () => {
    const input = minimalInput();
    input.FatturaElettronicaHeader.CessionarioCommittente = {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'DE', IdCodice: 'DE123456789' },
        Anagrafica: { Denominazione: 'Kunde GmbH' },
      },
      Sede: { Indirizzo: 'Hauptstraße 1', CAP: '10115', Comune: 'Berlin', Nazione: 'DE' },
    };
    delete (input.FatturaElettronicaHeader.DatiTrasmissione as Record<string, unknown>).CodiceDestinatario;
    const fattura = applyDefaults(input);
    expect(fattura.FatturaElettronicaHeader.DatiTrasmissione.CodiceDestinatario).toBe('XXXXXXX');
  });

  it('cessionario extra-UE senza IdCodice → applica placeholder "OO99999999999"', () => {
    const input = minimalInput();
    input.FatturaElettronicaHeader.CessionarioCommittente = {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'US' },
        Anagrafica: { Denominazione: 'Acme Corp' },
      } as FatturaElettronicaInput['FatturaElettronicaHeader']['CessionarioCommittente']['DatiAnagrafici'],
      Sede: { Indirizzo: '5th Avenue 100', CAP: '10001', Comune: 'New York', Nazione: 'US' },
    };
    const fattura = applyDefaults(input);
    expect(fattura.FatturaElettronicaHeader.CessionarioCommittente.DatiAnagrafici.IdFiscaleIVA?.IdCodice)
      .toBe('OO99999999999');
  });

  it('cessionario estero senza CAP → applica "00000"', () => {
    const input = minimalInput();
    input.FatturaElettronicaHeader.CessionarioCommittente = {
      DatiAnagrafici: {
        IdFiscaleIVA: { IdPaese: 'DE', IdCodice: 'DE123456789' },
        Anagrafica: { Denominazione: 'Kunde GmbH' },
      },
      Sede: { Indirizzo: 'Hauptstraße 1', Comune: 'Berlin', Nazione: 'DE' } as FatturaElettronicaInput['FatturaElettronicaHeader']['CessionarioCommittente']['Sede'],
    };
    const fattura = applyDefaults(input);
    expect(fattura.FatturaElettronicaHeader.CessionarioCommittente.Sede.CAP).toBe('00000');
  });

  it('DatiRiepilogo.Imposta dedotto da ImponibileImporto × AliquotaIVA / 100', () => {
    const input = minimalInput();
    const body = input.FatturaElettronicaBody as { DatiBeniServizi: { DatiRiepilogo: Array<{ AliquotaIVA: number; ImponibileImporto: number; Imposta?: number }> } };
    body.DatiBeniServizi.DatiRiepilogo = [{ AliquotaIVA: 22, ImponibileImporto: 100 }];
    const fattura = applyDefaults(input);
    expect(firstBody(fattura).DatiBeniServizi.DatiRiepilogo[0]!.Imposta).toBe(22);
  });
});
