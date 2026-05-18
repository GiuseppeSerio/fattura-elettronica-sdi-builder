import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { Indirizzo } from '../../types/index.js';

export function buildIndirizzo(parent: XMLBuilder, sede: Indirizzo): void {
  parent.ele('Indirizzo').txt(sede.Indirizzo).up();
  if (sede.NumeroCivico) parent.ele('NumeroCivico').txt(sede.NumeroCivico).up();
  parent.ele('CAP').txt(sede.CAP).up();
  parent.ele('Comune').txt(sede.Comune).up();
  if (sede.Provincia) parent.ele('Provincia').txt(sede.Provincia).up();
  parent.ele('Nazione').txt(sede.Nazione).up();
}
