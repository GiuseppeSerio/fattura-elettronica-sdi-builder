import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { FatturaElettronicaHeader } from '../types/index.js';
import { buildDatiTrasmissione, buildCedentePrestatore, buildCessionarioCommittente } from './sections/index.js';

export function buildHeader(parent: XMLBuilder, header: FatturaElettronicaHeader): void {
  const node = parent.ele('FatturaElettronicaHeader');

  buildDatiTrasmissione(node, header.DatiTrasmissione);
  buildCedentePrestatore(node, header.CedentePrestatore);
  buildCessionarioCommittente(node, header.CessionarioCommittente);

  if (header.SoggettoEmittente) node.ele('SoggettoEmittente').txt(header.SoggettoEmittente).up();

  node.up();
}
