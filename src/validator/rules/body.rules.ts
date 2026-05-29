import type { FatturaElettronicaBody } from '../../types/index.js';
import type { FieldError } from '../../errors/index.js';
import { validateDatiGenerali }   from './body/dati-generali.rules.js';
import { validateDettaglioLinee } from './body/linee.rules.js';
import { validateDatiRiepilogo }  from './body/riepilogo.rules.js';
import { validateDatiPagamento }  from './body/pagamento.rules.js';
import { validateAllegati, validateDatiVeicoli } from './body/allegati.rules.js';

const AMOUNT_TOLERANCE = 1.00; // ±1.00 Euro (SDI 00422)

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}


function validateCrossDates(body: FatturaElettronicaBody, base: string): FieldError[] {
  const errors: FieldError[] = [];
  const dataDoc = body.DatiGenerali.DatiGeneraliDocumento.Data;
  if (!dataDoc || !/^\d{4}-\d{2}-\d{2}$/.test(dataDoc)) return errors;

  // DataDDT non può essere successiva alla Data del documento (DDT precede sempre la fatturazione)
  body.DatiGenerali.DatiDDT?.forEach((ddt, i) => {
    if (ddt.DataDDT && /^\d{4}-\d{2}-\d{2}$/.test(ddt.DataDDT) && ddt.DataDDT > dataDoc) {
      errors.push({
        field: `${base}.DatiGenerali.DatiDDT[${i}].DataDDT`,
        code: 'INVALID_VALUE',
        message: `DataDDT (${ddt.DataDDT}) non può essere successiva alla Data del documento (${dataDoc})`,
      });
    }
  });

  // DataScadenzaPagamento non può essere precedente alla Data del documento
  body.DatiPagamento?.forEach((dp, i) => {
    dp.DettaglioPagamento.forEach((det, j) => {
      if (det.DataScadenzaPagamento && /^\d{4}-\d{2}-\d{2}$/.test(det.DataScadenzaPagamento)
          && det.DataScadenzaPagamento < dataDoc) {
        errors.push({
          field: `${base}.DatiPagamento[${i}].DettaglioPagamento[${j}].DataScadenzaPagamento`,
          code: 'INVALID_VALUE',
          message: `DataScadenzaPagamento (${det.DataScadenzaPagamento}) non può essere precedente alla Data del documento (${dataDoc})`,
        });
      }
    });
  });

  return errors;
}

function validateRiepilogoUniqueness(body: FatturaElettronicaBody, base: string): FieldError[] {
  const errors: FieldError[] = [];
  const seen = new Map<string, number>();
  body.DatiBeniServizi.DatiRiepilogo.forEach((r, i) => {
    const key = `${r.AliquotaIVA}|${r.Natura ?? ''}|${r.EsigibilitaIVA ?? ''}`;
    const prev = seen.get(key);
    if (prev !== undefined) {
      errors.push({
        field: `${base}.DatiBeniServizi.DatiRiepilogo[${i}]`,
        code: 'INVALID_VALUE',
        message: `Riepilogo IVA duplicato: stessa combinazione AliquotaIVA/Natura/EsigibilitaIVA già presente a riga [${prev}]`,
      });
    } else {
      seen.set(key, i);
    }
  });
  return errors;
}

function validateAmounts(body: FatturaElettronicaBody, base: string): FieldError[] {
  const errors: FieldError[] = [];
  const dgd = body.DatiGenerali.DatiGeneraliDocumento;
  const linee = body.DatiBeniServizi.DettaglioLinee;
  const riepilogo = body.DatiBeniServizi.DatiRiepilogo;

  // --- ImponibileImporto totale (SDI 00422): la somma di tutti gli ImponibileImporto
  //     deve avere uno scarto massimo di ±1.00 euro rispetto a:
  //     Σ PrezzoTotale + Σ ImportoContributoCassa (senza Ritenuta='SI')
  //     + Σ SpeseAccessorie + Σ Arrotondamento di ogni riga riepilogo.

  const totaleImponibile = riepilogo.reduce((acc, r) => acc + (r.ImponibileImporto ?? 0), 0);

  const totaleLinee = linee.reduce((acc, l) => acc + l.PrezzoTotale, 0);

  const casse = Array.isArray(dgd.DatiCassaPrevidenziale)
    ? dgd.DatiCassaPrevidenziale
    : dgd.DatiCassaPrevidenziale ? [dgd.DatiCassaPrevidenziale] : [];
  const totaleCassa = casse
    .filter(c => c.Ritenuta !== 'SI')
    .reduce((acc, c) => acc + c.ImportoContributoCassa, 0);

  const totaleSpeseAcc = riepilogo.reduce((acc, r) => acc + (r.SpeseAccessorie ?? 0), 0);
  const totaleArrotRiepilogo = riepilogo.reduce((acc, r) => acc + (r.Arrotondamento ?? 0), 0);

  const attesoImponibile = round2(totaleLinee + totaleCassa + totaleSpeseAcc + totaleArrotRiepilogo);

  const diffImponibile = Math.round(Math.abs(totaleImponibile - attesoImponibile) * 100) / 100;
  if (diffImponibile > AMOUNT_TOLERANCE) {
    errors.push({
      field: `${base}.DatiBeniServizi.DatiRiepilogo`,
      code: 'INVALID_VALUE',
      message: `Totale ImponibileImporto non coerente: atteso ${attesoImponibile}, ricevuto ${round2(totaleImponibile)} (tolleranza ±${AMOUNT_TOLERANCE}, SDI 00422)`,
    });
  }

  // --- ImportoTotaleDocumento: se presente, deve coincidere con
  //     sum(ImponibileImporto + Imposta) - ImportoRitenuta + ImportoBollo + Arrotondamento
  if (dgd.ImportoTotaleDocumento !== undefined) {
    const totaleRiepilogo = riepilogo.reduce((acc, r) => acc + (r.ImponibileImporto ?? 0) + (r.Imposta ?? 0), 0);

    const ritenute = Array.isArray(dgd.DatiRitenuta)
      ? dgd.DatiRitenuta
      : dgd.DatiRitenuta ? [dgd.DatiRitenuta] : [];
    const totaleRitenuta = ritenute.reduce((acc, dr) => acc + (dr.ImportoRitenuta ?? 0), 0);

    const bollo = dgd.DatiBollo?.ImportoBollo ?? 0;
    const arrotDoc = dgd.Arrotondamento ?? 0;

    const atteso = round2(totaleRiepilogo - totaleRitenuta + bollo + arrotDoc);

    const diffTotale = Math.round(Math.abs(dgd.ImportoTotaleDocumento - atteso) * 100) / 100;
    if (diffTotale > AMOUNT_TOLERANCE) {
      errors.push({
        field: `${base}.DatiGenerali.DatiGeneraliDocumento.ImportoTotaleDocumento`,
        code: 'INVALID_VALUE',
        message: `ImportoTotaleDocumento non coerente: atteso ${atteso}, ricevuto ${dgd.ImportoTotaleDocumento} (tolleranza ±${AMOUNT_TOLERANCE})`,
      });
    }
  }

  return errors;
}

export function validateBody(body: FatturaElettronicaBody, index: number): FieldError[] {
  const base = `FatturaElettronicaBody[${index}]`;

  return [
    ...validateDatiGenerali(body.DatiGenerali, base),
    ...validateDettaglioLinee(body.DatiBeniServizi.DettaglioLinee, base),
    ...validateDatiRiepilogo(body.DatiBeniServizi.DatiRiepilogo, base),
    ...validateRiepilogoUniqueness(body, base),
    ...validateCrossDates(body, base),
    ...validateAmounts(body, base),
    ...(body.DatiVeicoli ? validateDatiVeicoli(body.DatiVeicoli, base) : []),
    ...(body.DatiPagamento ?? []).flatMap((dp, i) =>
      validateDatiPagamento(dp, `${base}.DatiPagamento[${i}]`)
    ),
    ...(body.Allegati?.length ? validateAllegati(body.Allegati, base) : []),
  ];
}
