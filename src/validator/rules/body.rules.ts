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

  if (Math.abs(totaleImponibile - attesoImponibile) > AMOUNT_TOLERANCE) {
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

    if (Math.abs(dgd.ImportoTotaleDocumento - atteso) > AMOUNT_TOLERANCE) {
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
    ...validateAmounts(body, base),
    ...(body.DatiVeicoli ? validateDatiVeicoli(body.DatiVeicoli, base) : []),
    ...(body.DatiPagamento ?? []).flatMap((dp, i) =>
      validateDatiPagamento(dp, `${base}.DatiPagamento[${i}]`)
    ),
    ...(body.Allegati?.length ? validateAllegati(body.Allegati, base) : []),
  ];
}
