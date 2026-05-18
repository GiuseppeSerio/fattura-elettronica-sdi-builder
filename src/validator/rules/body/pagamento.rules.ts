import type { DatiPagamento } from '../../../types/index.js';
import type { FieldError } from '../../../errors/index.js';
import { required, maxLength, dateFormat, iban, bic, pattern, enumValue } from '../types.js';
import { MODALITA_PAGAMENTO, CONDIZIONI_PAGAMENTO } from '../enums.js';

/** ABI e CAB: esattamente 5 cifre */
function abiCab(value: string | undefined, field: string): FieldError[] {
  return pattern(value, /^\d{5}$/, field, 'Valore non valido (attese 5 cifre)');
}

export function validateDatiPagamento(dp: DatiPagamento, path: string): FieldError[] {
  const errors: FieldError[] = [];

  errors.push(...required(dp.CondizioniPagamento, `${path}.CondizioniPagamento`));
  errors.push(...enumValue(dp.CondizioniPagamento, CONDIZIONI_PAGAMENTO, `${path}.CondizioniPagamento`));

  if (!dp.DettaglioPagamento.length) {
    errors.push({ field: `${path}.DettaglioPagamento`, code: 'EMPTY_COLLECTION', message: 'Almeno un DettaglioPagamento è obbligatorio' });
    return errors;
  }

  dp.DettaglioPagamento.forEach((det, i) => {
    const p = `${path}.DettaglioPagamento[${i}]`;

    errors.push(...required(det.ModalitaPagamento, `${p}.ModalitaPagamento`));
    errors.push(...enumValue(det.ModalitaPagamento, MODALITA_PAGAMENTO, `${p}.ModalitaPagamento`));
    if (det.ImportoPagamento === undefined) {
      errors.push({ field: `${p}.ImportoPagamento`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
    } else if (det.ImportoPagamento <= 0) {
      errors.push({ field: `${p}.ImportoPagamento`, code: 'INVALID_VALUE', message: 'ImportoPagamento deve essere maggiore di 0' });
    }

    errors.push(...maxLength(det.Beneficiario, 200, `${p}.Beneficiario`));
    errors.push(...dateFormat(det.DataRiferimentoTerminiPagamento, `${p}.DataRiferimentoTerminiPagamento`));
    errors.push(...dateFormat(det.DataScadenzaPagamento, `${p}.DataScadenzaPagamento`));
    errors.push(...maxLength(det.CodUfficioPostale, 20, `${p}.CodUfficioPostale`));
    errors.push(...maxLength(det.CognomeQuietanzante, 60, `${p}.CognomeQuietanzante`));
    errors.push(...maxLength(det.NomeQuietanzante, 60, `${p}.NomeQuietanzante`));
    errors.push(...maxLength(det.TitoloQuietanzante, 10, `${p}.TitoloQuietanzante`));
    errors.push(...maxLength(det.IstitutoFinanziario, 80, `${p}.IstitutoFinanziario`));
    errors.push(...iban(det.IBAN, `${p}.IBAN`));
    errors.push(...abiCab(det.ABI, `${p}.ABI`));
    errors.push(...abiCab(det.CAB, `${p}.CAB`));
    errors.push(...bic(det.BIC, `${p}.BIC`));
    errors.push(...dateFormat(det.DataLimitePagamentoAnticipato, `${p}.DataLimitePagamentoAnticipato`));
    errors.push(...dateFormat(det.DataDecorrenzaPenale, `${p}.DataDecorrenzaPenale`));
    errors.push(...maxLength(det.CodicePagamento, 60, `${p}.CodicePagamento`));
  });

  return errors;
}
