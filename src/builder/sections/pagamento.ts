import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces.js';
import type { DatiPagamento } from '../../types/index.js';

export function buildDatiPagamento(parent: XMLBuilder, dp: DatiPagamento): void {
  const node = parent.ele('DatiPagamento');

  node.ele('CondizioniPagamento').txt(dp.CondizioniPagamento).up();

  for (const det of dp.DettaglioPagamento) {
    const d = node.ele('DettaglioPagamento');

    if (det.Beneficiario) d.ele('Beneficiario').txt(det.Beneficiario).up();
    d.ele('ModalitaPagamento').txt(det.ModalitaPagamento).up();
    if (det.DataRiferimentoTerminiPagamento) d.ele('DataRiferimentoTerminiPagamento').txt(det.DataRiferimentoTerminiPagamento).up();
    if (det.GiorniTerminiPagamento !== undefined) d.ele('GiorniTerminiPagamento').txt(String(det.GiorniTerminiPagamento)).up();
    if (det.DataScadenzaPagamento) d.ele('DataScadenzaPagamento').txt(det.DataScadenzaPagamento).up();
    d.ele('ImportoPagamento').txt(det.ImportoPagamento.toFixed(2)).up();
    if (det.CodUfficioPostale) d.ele('CodUfficioPostale').txt(det.CodUfficioPostale).up();
    if (det.IstitutoFinanziario) d.ele('IstitutoFinanziario').txt(det.IstitutoFinanziario).up();
    if (det.IBAN) d.ele('IBAN').txt(det.IBAN).up();
    if (det.ABI) d.ele('ABI').txt(det.ABI).up();
    if (det.CAB) d.ele('CAB').txt(det.CAB).up();
    if (det.BIC) d.ele('BIC').txt(det.BIC).up();
    if (det.ScontoPagamentoAnticipato !== undefined) d.ele('ScontoPagamentoAnticipato').txt(det.ScontoPagamentoAnticipato.toFixed(2)).up();
    if (det.DataLimitePagamentoAnticipato) d.ele('DataLimitePagamentoAnticipato').txt(det.DataLimitePagamentoAnticipato).up();
    if (det.PenalitaPagamentiRitardati !== undefined) d.ele('PenalitaPagamentiRitardati').txt(det.PenalitaPagamentiRitardati.toFixed(2)).up();
    if (det.DataDecorrenzaPenale) d.ele('DataDecorrenzaPenale').txt(det.DataDecorrenzaPenale).up();
    if (det.CodicePagamento) d.ele('CodicePagamento').txt(det.CodicePagamento).up();

    d.up();
  }

  node.up();
}
