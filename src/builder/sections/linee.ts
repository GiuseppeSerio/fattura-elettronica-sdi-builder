import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { DettaglioLinee } from '../../types/index.js';

export function buildDettaglioLinee(parent: XMLBuilder, linea: DettaglioLinee): void {
  const node = parent.ele('DettaglioLinee');

  node.ele('NumeroLinea').txt(String(linea.NumeroLinea)).up();
  if (linea.TipoCessionePrestazione) node.ele('TipoCessionePrestazione').txt(linea.TipoCessionePrestazione).up();

  for (const cod of linea.CodiceArticolo ?? []) {
    const c = node.ele('CodiceArticolo');
    c.ele('CodiceTipo').txt(cod.CodiceTipo).up();
    c.ele('CodiceValore').txt(cod.CodiceValore).up();
    c.up();
  }

  node.ele('Descrizione').txt(linea.Descrizione).up();

  if (linea.Quantita !== undefined) node.ele('Quantita').txt(linea.Quantita.toFixed(8)).up();
  if (linea.UnitaMisura) node.ele('UnitaMisura').txt(linea.UnitaMisura).up();
  if (linea.DataInizioPeriodo) node.ele('DataInizioPeriodo').txt(linea.DataInizioPeriodo).up();
  if (linea.DataFinePeriodo) node.ele('DataFinePeriodo').txt(linea.DataFinePeriodo).up();

  node.ele('PrezzoUnitario').txt(linea.PrezzoUnitario.toFixed(8)).up();

  for (const sm of linea.ScontoMaggiorazione ?? []) {
    const s = node.ele('ScontoMaggiorazione');
    s.ele('Tipo').txt(sm.Tipo).up();
    if (sm.Percentuale !== undefined) s.ele('Percentuale').txt(sm.Percentuale.toFixed(2)).up();
    if (sm.Importo !== undefined) s.ele('Importo').txt(sm.Importo.toFixed(2)).up();
    s.up();
  }

  node.ele('PrezzoTotale').txt(linea.PrezzoTotale.toFixed(2)).up();
  node.ele('AliquotaIVA').txt(linea.AliquotaIVA.toFixed(2)).up();

  if (linea.Ritenuta) node.ele('Ritenuta').txt(linea.Ritenuta).up();
  if (linea.Natura) node.ele('Natura').txt(linea.Natura).up();
  if (linea.RiferimentoAmministrazione) node.ele('RiferimentoAmministrazione').txt(linea.RiferimentoAmministrazione).up();

  for (const adg of linea.AltriDatiGestionali ?? []) {
    const a = node.ele('AltriDatiGestionali');
    a.ele('TipoDato').txt(adg.TipoDato).up();
    if (adg.RiferimentoTesto) a.ele('RiferimentoTesto').txt(adg.RiferimentoTesto).up();
    if (adg.RiferimentoNumero !== undefined) a.ele('RiferimentoNumero').txt(String(adg.RiferimentoNumero)).up();
    if (adg.RiferimentoData) a.ele('RiferimentoData').txt(adg.RiferimentoData).up();
    a.up();
  }

  node.up();
}
