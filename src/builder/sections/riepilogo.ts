import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { DatiRiepilogo } from '../../types/index.js';

export function buildDatiRiepilogo(parent: XMLBuilder, r: DatiRiepilogo): void {
  const node = parent.ele('DatiRiepilogo');

  node.ele('AliquotaIVA').txt(r.AliquotaIVA.toFixed(2)).up();
  if (r.Natura) node.ele('Natura').txt(r.Natura).up();
  if (r.SpeseAccessorie !== undefined) node.ele('SpeseAccessorie').txt(r.SpeseAccessorie.toFixed(2)).up();
  if (r.Arrotondamento !== undefined) node.ele('Arrotondamento').txt(r.Arrotondamento.toFixed(2)).up();
  node.ele('ImponibileImporto').txt(r.ImponibileImporto.toFixed(2)).up();
  node.ele('Imposta').txt(r.Imposta.toFixed(2)).up();
  if (r.EsigibilitaIVA) node.ele('EsigibilitaIVA').txt(r.EsigibilitaIVA).up();
  if (r.RiferimentoNormativo) node.ele('RiferimentoNormativo').txt(r.RiferimentoNormativo).up();

  node.up();
}
