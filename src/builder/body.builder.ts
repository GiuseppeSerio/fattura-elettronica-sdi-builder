import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { FatturaElettronicaBody } from '../types/index.js';
import { buildDatiGenerali, buildDettaglioLinee, buildDatiRiepilogo, buildDatiPagamento } from './sections/index.js';

export function buildBody(parent: XMLBuilder, body: FatturaElettronicaBody): void {
  const node = parent.ele('FatturaElettronicaBody');

  buildDatiGenerali(node, body.DatiGenerali);

  const datiBeni = node.ele('DatiBeniServizi');
  for (const linea of body.DatiBeniServizi.DettaglioLinee) {
    buildDettaglioLinee(datiBeni, linea);
  }
  for (const riepilogo of body.DatiBeniServizi.DatiRiepilogo) {
    buildDatiRiepilogo(datiBeni, riepilogo);
  }
  datiBeni.up();

  for (const dp of body.DatiPagamento ?? []) {
    buildDatiPagamento(node, dp);
  }

  for (const allegato of body.Allegati ?? []) {
    const a = node.ele('Allegati');
    a.ele('NomeAttachment').txt(allegato.NomeAttachment).up();
    if (allegato.AlgoritmoCompressione) a.ele('AlgoritmoCompressione').txt(allegato.AlgoritmoCompressione).up();
    if (allegato.FormatoAttachment) a.ele('FormatoAttachment').txt(allegato.FormatoAttachment).up();
    if (allegato.DescrizioneAttachment) a.ele('DescrizioneAttachment').txt(allegato.DescrizioneAttachment).up();
    a.ele('Attachment').txt(allegato.Attachment).up();
    a.up();
  }

  node.up();
}
