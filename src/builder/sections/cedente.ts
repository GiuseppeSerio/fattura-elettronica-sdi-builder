import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { CedentePrestatore } from '../../types/index.js';
import { buildIndirizzo } from './indirizzo.js';

export function buildCedentePrestatore(parent: XMLBuilder, cp: CedentePrestatore): void {
  const node = parent.ele('CedentePrestatore');

  const da = node.ele('DatiAnagrafici');

  const idIVA = da.ele('IdFiscaleIVA');
  idIVA.ele('IdPaese').txt(cp.DatiAnagrafici.IdFiscaleIVA.IdPaese).up();
  idIVA.ele('IdCodice').txt(cp.DatiAnagrafici.IdFiscaleIVA.IdCodice).up();
  idIVA.up();

  if (cp.DatiAnagrafici.CodiceFiscale) da.ele('CodiceFiscale').txt(cp.DatiAnagrafici.CodiceFiscale).up();

  const ana = da.ele('Anagrafica');
  const a = cp.DatiAnagrafici.Anagrafica;
  if (a.Denominazione) ana.ele('Denominazione').txt(a.Denominazione).up();
  if (a.Nome) ana.ele('Nome').txt(a.Nome).up();
  if (a.Cognome) ana.ele('Cognome').txt(a.Cognome).up();
  if (a.Titolo) ana.ele('Titolo').txt(a.Titolo).up();
  if (a.CodEORI) ana.ele('CodEORI').txt(a.CodEORI).up();
  ana.up();

  if (cp.DatiAnagrafici.AlboProfessionale) da.ele('AlboProfessionale').txt(cp.DatiAnagrafici.AlboProfessionale).up();
  if (cp.DatiAnagrafici.ProvinciaAlbo) da.ele('ProvinciaAlbo').txt(cp.DatiAnagrafici.ProvinciaAlbo).up();
  if (cp.DatiAnagrafici.NumeroIscrizioneAlbo) da.ele('NumeroIscrizioneAlbo').txt(cp.DatiAnagrafici.NumeroIscrizioneAlbo).up();
  if (cp.DatiAnagrafici.DataIscrizioneAlbo) da.ele('DataIscrizioneAlbo').txt(cp.DatiAnagrafici.DataIscrizioneAlbo).up();
  da.ele('RegimeFiscale').txt(cp.DatiAnagrafici.RegimeFiscale).up();
  da.up();

  const sede = node.ele('Sede');
  buildIndirizzo(sede, cp.Sede);
  sede.up();

  if (cp.StabileOrganizzazione) {
    const so = node.ele('StabileOrganizzazione');
    buildIndirizzo(so, cp.StabileOrganizzazione);
    so.up();
  }

  if (cp.IscrizioneREA) {
    const rea = node.ele('IscrizioneREA');
    rea.ele('Ufficio').txt(cp.IscrizioneREA.Ufficio).up();
    rea.ele('NumeroREA').txt(cp.IscrizioneREA.NumeroREA).up();
    if (cp.IscrizioneREA.CapitaleSociale !== undefined) rea.ele('CapitaleSociale').txt(String(cp.IscrizioneREA.CapitaleSociale)).up();
    if (cp.IscrizioneREA.SocioUnico) rea.ele('SocioUnico').txt(cp.IscrizioneREA.SocioUnico).up();
    rea.ele('StatoLiquidazione').txt(cp.IscrizioneREA.StatoLiquidazione).up();
    rea.up();
  }

  if (cp.Contatti) {
    const c = node.ele('Contatti');
    if (cp.Contatti.Telefono) c.ele('Telefono').txt(cp.Contatti.Telefono).up();
    if (cp.Contatti.Fax) c.ele('Fax').txt(cp.Contatti.Fax).up();
    if (cp.Contatti.Email) c.ele('Email').txt(cp.Contatti.Email).up();
    c.up();
  }

  if (cp.RiferimentoAmministrazione) node.ele('RiferimentoAmministrazione').txt(cp.RiferimentoAmministrazione).up();

  node.up();
}
