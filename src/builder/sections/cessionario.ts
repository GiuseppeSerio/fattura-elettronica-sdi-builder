import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { CessionarioCommittente } from '../../types/index.js';
import { buildIndirizzo } from './indirizzo.js';

export function buildCessionarioCommittente(parent: XMLBuilder, cc: CessionarioCommittente): void {
  const node = parent.ele('CessionarioCommittente');

  const da = node.ele('DatiAnagrafici');

  if (cc.DatiAnagrafici.IdFiscaleIVA) {
    const idIVA = da.ele('IdFiscaleIVA');
    idIVA.ele('IdPaese').txt(cc.DatiAnagrafici.IdFiscaleIVA.IdPaese).up();
    idIVA.ele('IdCodice').txt(cc.DatiAnagrafici.IdFiscaleIVA.IdCodice).up();
    idIVA.up();
  }

  if (cc.DatiAnagrafici.CodiceFiscale) da.ele('CodiceFiscale').txt(cc.DatiAnagrafici.CodiceFiscale).up();

  const ana = da.ele('Anagrafica');
  const a = cc.DatiAnagrafici.Anagrafica;
  if (a.Denominazione) ana.ele('Denominazione').txt(a.Denominazione).up();
  if (a.Nome) ana.ele('Nome').txt(a.Nome).up();
  if (a.Cognome) ana.ele('Cognome').txt(a.Cognome).up();
  ana.up();

  da.up();

  const sede = node.ele('Sede');
  buildIndirizzo(sede, cc.Sede);
  sede.up();

  if (cc.StabileOrganizzazione) {
    const so = node.ele('StabileOrganizzazione');
    buildIndirizzo(so, cc.StabileOrganizzazione);
    so.up();
  }

  node.up();
}
