import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { DatiTrasmissione } from '../../types/index.js';

export function buildDatiTrasmissione(parent: XMLBuilder, dt: DatiTrasmissione): void {
  const node = parent.ele('DatiTrasmissione');

  const id = node.ele('IdTrasmittente');
  id.ele('IdPaese').txt(dt.IdTrasmittente.IdPaese).up();
  id.ele('IdCodice').txt(dt.IdTrasmittente.IdCodice).up();
  id.up();

  node.ele('ProgressivoInvio').txt(dt.ProgressivoInvio).up();
  node.ele('FormatoTrasmissione').txt(dt.FormatoTrasmissione).up();
  node.ele('CodiceDestinatario').txt(dt.CodiceDestinatario).up();

  if (dt.ContattiTrasmittente) {
    const contatti = node.ele('ContattiTrasmittente');
    if (dt.ContattiTrasmittente.Telefono) contatti.ele('Telefono').txt(dt.ContattiTrasmittente.Telefono).up();
    if (dt.ContattiTrasmittente.Email) contatti.ele('Email').txt(dt.ContattiTrasmittente.Email).up();
    contatti.up();
  }

  if (dt.PECDestinatario) node.ele('PECDestinatario').txt(dt.PECDestinatario).up();

  node.up();
}
