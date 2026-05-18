import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { DatiGenerali } from '../../types/index.js';

export function buildDatiGenerali(parent: XMLBuilder, dg: DatiGenerali): void {
  const node = parent.ele('DatiGenerali');
  const dgd = node.ele('DatiGeneraliDocumento');

  dgd.ele('TipoDocumento').txt(dg.DatiGeneraliDocumento.TipoDocumento).up();
  dgd.ele('Divisa').txt(dg.DatiGeneraliDocumento.Divisa).up();
  dgd.ele('Data').txt(dg.DatiGeneraliDocumento.Data).up();
  dgd.ele('Numero').txt(dg.DatiGeneraliDocumento.Numero).up();

  if (dg.DatiGeneraliDocumento.DatiRitenuta) {
    const list = Array.isArray(dg.DatiGeneraliDocumento.DatiRitenuta)
      ? dg.DatiGeneraliDocumento.DatiRitenuta
      : [dg.DatiGeneraliDocumento.DatiRitenuta];
    for (const r of list) {
      const n = dgd.ele('DatiRitenuta');
      n.ele('TipoRitenuta').txt(r.TipoRitenuta).up();
      n.ele('ImportoRitenuta').txt(r.ImportoRitenuta.toFixed(2)).up();
      n.ele('AliquotaRitenuta').txt(r.AliquotaRitenuta.toFixed(2)).up();
      n.ele('CausalePagamento').txt(r.CausalePagamento).up();
      n.up();
    }
  }

  if (dg.DatiGeneraliDocumento.DatiBollo) {
    const b = dgd.ele('DatiBollo');
    b.ele('BolloVirtuale').txt(dg.DatiGeneraliDocumento.DatiBollo.BolloVirtuale).up();
    b.ele('ImportoBollo').txt(dg.DatiGeneraliDocumento.DatiBollo.ImportoBollo.toFixed(2)).up();
    b.up();
  }

  if (dg.DatiGeneraliDocumento.ImportoTotaleDocumento !== undefined) {
    dgd.ele('ImportoTotaleDocumento').txt(dg.DatiGeneraliDocumento.ImportoTotaleDocumento.toFixed(2)).up();
  }

  if (dg.DatiGeneraliDocumento.Arrotondamento !== undefined) {
    dgd.ele('Arrotondamento').txt(dg.DatiGeneraliDocumento.Arrotondamento.toFixed(2)).up();
  }

  const causali = dg.DatiGeneraliDocumento.Causale;
  if (causali) {
    const list = Array.isArray(causali) ? causali : [causali];
    for (const c of list) dgd.ele('Causale').txt(c).up();
  }

  if (dg.DatiGeneraliDocumento.Art73) dgd.ele('Art73').txt(dg.DatiGeneraliDocumento.Art73).up();

  dgd.up();

  for (const ddt of dg.DatiDDT ?? []) {
    const n = node.ele('DatiDDT');
    n.ele('NumeroDDT').txt(ddt.NumeroDDT).up();
    n.ele('DataDDT').txt(ddt.DataDDT).up();
    for (const r of ddt.RiferimentoNumeroLinea ?? []) n.ele('RiferimentoNumeroLinea').txt(String(r)).up();
    n.up();
  }

  node.up();
}
