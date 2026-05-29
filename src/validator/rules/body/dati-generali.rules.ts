import type {
  DatiGenerali,
  DatiRitenuta,
  DatiBollo,
  DatiCassaPrevidenziale,
  ScontoMaggiorazione,
  DatiDocumentoCorrelato,
  DatiDDT,
} from '../../../types/index.js';
import type { FieldError } from '../../../errors/index.js';
import {
  required,
  maxLength,
  dateFormat,
  isoValuta,
  numeroFattura,
  percentuale,
  positiveNumber,
  numericField,
  enumValue,
} from '../types.js';
import { TIPO_DOCUMENTO, TIPO_RITENUTA, CAUSALE_PAGAMENTO, TIPO_CASSA, NATURA } from '../../../enums.js';

// ---- DatiRitenuta ----------------------------------------------------------

function validateDatiRitenuta(r: DatiRitenuta, path: string): FieldError[] {
  const errors: FieldError[] = [];
  errors.push(...required(r.TipoRitenuta, `${path}.TipoRitenuta`));
  errors.push(...enumValue(r.TipoRitenuta, TIPO_RITENUTA, `${path}.TipoRitenuta`));
  if (r.ImportoRitenuta === undefined) errors.push({ field: `${path}.ImportoRitenuta`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...numericField(r.ImportoRitenuta, 15, 2, `${path}.ImportoRitenuta`));
  if (r.AliquotaRitenuta === undefined) errors.push({ field: `${path}.AliquotaRitenuta`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...percentuale(r.AliquotaRitenuta, `${path}.AliquotaRitenuta`));
  errors.push(...numericField(r.AliquotaRitenuta, 6, 2, `${path}.AliquotaRitenuta`));
  errors.push(...required(r.CausalePagamento, `${path}.CausalePagamento`));
  errors.push(...enumValue(r.CausalePagamento, CAUSALE_PAGAMENTO, `${path}.CausalePagamento`));
  return errors;
}

// ---- DatiBollo -------------------------------------------------------------

function validateDatiBollo(b: DatiBollo, path: string): FieldError[] {
  const errors: FieldError[] = [];
  if (b.ImportoBollo === undefined) errors.push({ field: `${path}.ImportoBollo`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...positiveNumber(b.ImportoBollo, `${path}.ImportoBollo`));
  errors.push(...numericField(b.ImportoBollo, 15, 2, `${path}.ImportoBollo`));
  return errors;
}

// ---- DatiCassaPrevidenziale ------------------------------------------------

function validateDatiCassaPrevidenziale(c: DatiCassaPrevidenziale, path: string): FieldError[] {
  const errors: FieldError[] = [];
  errors.push(...required(c.TipoCassa, `${path}.TipoCassa`));
  errors.push(...enumValue(c.TipoCassa, TIPO_CASSA, `${path}.TipoCassa`));
  if (c.AlCassa === undefined) errors.push({ field: `${path}.AlCassa`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...percentuale(c.AlCassa, `${path}.AlCassa`));
  errors.push(...numericField(c.AlCassa, 6, 2, `${path}.AlCassa`));
  if (c.ImportoContributoCassa === undefined) errors.push({ field: `${path}.ImportoContributoCassa`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...numericField(c.ImportoContributoCassa, 15, 2, `${path}.ImportoContributoCassa`));
  errors.push(...numericField(c.ImponibileCassa, 15, 2, `${path}.ImponibileCassa`));
  if (c.AliquotaIVA === undefined) errors.push({ field: `${path}.AliquotaIVA`, code: 'MISSING_REQUIRED_FIELD', message: 'Campo obbligatorio' });
  errors.push(...numericField(c.AliquotaIVA, 6, 2, `${path}.AliquotaIVA`));
  if (c.AliquotaIVA === 0 && !c.Natura) errors.push({ field: `${path}.Natura`, code: 'MISSING_NATURA', message: 'Natura obbligatoria quando AliquotaIVA è 0' });
  errors.push(...enumValue(c.Natura, NATURA, `${path}.Natura`));
  errors.push(...maxLength(c.RiferimentoAmministrazione, 20, `${path}.RiferimentoAmministrazione`));
  return errors;
}

// ---- ScontoMaggiorazione ---------------------------------------------------

function validateScontoMaggiorazione(sm: ScontoMaggiorazione, path: string): FieldError[] {
  const errors: FieldError[] = [];
  if (sm.Percentuale === undefined && sm.Importo === undefined) {
    errors.push({ field: path, code: 'MISSING_REQUIRED_FIELD', message: 'Obbligatorio: Percentuale oppure Importo' });
  }
  errors.push(...percentuale(sm.Percentuale, `${path}.Percentuale`));
  errors.push(...numericField(sm.Percentuale, 6, 2, `${path}.Percentuale`));
  errors.push(...numericField(sm.Importo, 15, 8, `${path}.Importo`));
  return errors;
}

// ---- DatiDocumentoCorrelato ------------------------------------------------

function validateDatiDocumentoCorrelato(d: DatiDocumentoCorrelato, path: string): FieldError[] {
  const errors: FieldError[] = [];
  errors.push(...required(d.IdDocumento, `${path}.IdDocumento`));
  errors.push(...maxLength(d.IdDocumento, 20, `${path}.IdDocumento`));
  errors.push(...dateFormat(d.Data, `${path}.Data`));
  errors.push(...maxLength(d.NumItem, 20, `${path}.NumItem`));
  errors.push(...maxLength(d.CodiceCommessaConvenzione, 100, `${path}.CodiceCommessaConvenzione`));
  errors.push(...maxLength(d.CodiceCUP, 15, `${path}.CodiceCUP`));
  errors.push(...maxLength(d.CodiceCIG, 15, `${path}.CodiceCIG`));
  return errors;
}

// ---- DatiDDT ---------------------------------------------------------------

function validateDatiDDT(ddt: DatiDDT, path: string): FieldError[] {
  const errors: FieldError[] = [];
  errors.push(...required(ddt.NumeroDDT, `${path}.NumeroDDT`));
  errors.push(...maxLength(ddt.NumeroDDT, 20, `${path}.NumeroDDT`));
  errors.push(...required(ddt.DataDDT, `${path}.DataDDT`));
  errors.push(...dateFormat(ddt.DataDDT, `${path}.DataDDT`));
  return errors;
}

// ---- Orchestratore ---------------------------------------------------------

export function validateDatiGenerali(dg: DatiGenerali, base: string): FieldError[] {
  const errors: FieldError[] = [];
  const dgd = dg.DatiGeneraliDocumento;
  const p   = `${base}.DatiGenerali.DatiGeneraliDocumento`;

  // Campi base
  errors.push(...required(dgd.TipoDocumento, `${p}.TipoDocumento`));
  errors.push(...enumValue(dgd.TipoDocumento, TIPO_DOCUMENTO, `${p}.TipoDocumento`));
  errors.push(...required(dgd.Divisa, `${p}.Divisa`));
  errors.push(...isoValuta(dgd.Divisa, `${p}.Divisa`));
  errors.push(...required(dgd.Data, `${p}.Data`));
  errors.push(...dateFormat(dgd.Data, `${p}.Data`));
  errors.push(...required(dgd.Numero, `${p}.Numero`));
  errors.push(...numeroFattura(dgd.Numero, `${p}.Numero`));

  const causali = dgd.Causale ? (Array.isArray(dgd.Causale) ? dgd.Causale : [dgd.Causale]) : [];
  causali.forEach((c, i) => errors.push(...maxLength(c, 200, `${p}.Causale[${i}]`)));

  // DatiRitenuta
  const ritenute = dgd.DatiRitenuta ? (Array.isArray(dgd.DatiRitenuta) ? dgd.DatiRitenuta : [dgd.DatiRitenuta]) : [];
  ritenute.forEach((r, i) => errors.push(...validateDatiRitenuta(r, `${p}.DatiRitenuta[${i}]`)));

  // DatiBollo
  if (dgd.DatiBollo) errors.push(...validateDatiBollo(dgd.DatiBollo, `${p}.DatiBollo`));

  // DatiCassaPrevidenziale
  const casse = dgd.DatiCassaPrevidenziale ? (Array.isArray(dgd.DatiCassaPrevidenziale) ? dgd.DatiCassaPrevidenziale : [dgd.DatiCassaPrevidenziale]) : [];
  casse.forEach((c, i) => errors.push(...validateDatiCassaPrevidenziale(c, `${p}.DatiCassaPrevidenziale[${i}]`)));

  // ScontoMaggiorazione documento
  const sconti = dgd.ScontoMaggiorazione ? (Array.isArray(dgd.ScontoMaggiorazione) ? dgd.ScontoMaggiorazione : [dgd.ScontoMaggiorazione]) : [];
  sconti.forEach((sm, i) => errors.push(...validateScontoMaggiorazione(sm, `${p}.ScontoMaggiorazione[${i}]`)));

  // ImportoTotaleDocumento e Arrotondamento
  errors.push(...numericField(dgd.ImportoTotaleDocumento, 15, 2, `${p}.ImportoTotaleDocumento`));
  errors.push(...numericField(dgd.Arrotondamento, 21, 8, `${p}.Arrotondamento`));

  // Documenti correlati
  const corrNames: Array<keyof typeof dg> = ['DatiOrdineAcquisto', 'DatiContratto', 'DatiConvenzione', 'DatiRicezione', 'DatiFattureCollegate'];
  for (const key of corrNames) {
    const list = dg[key] as DatiDocumentoCorrelato[] | undefined;
    list?.forEach((d, i) => errors.push(...validateDatiDocumentoCorrelato(d, `${base}.DatiGenerali.${key}[${i}]`)));
  }

  // DatiDDT
  dg.DatiDDT?.forEach((ddt, i) => errors.push(...validateDatiDDT(ddt, `${base}.DatiGenerali.DatiDDT[${i}]`)));

  // FatturaPrincipale
  if (dg.FatturaPrincipale) {
    const fp = `${base}.DatiGenerali.FatturaPrincipale`;
    errors.push(...required(dg.FatturaPrincipale.NumeroFatturaPrincipale, `${fp}.NumeroFatturaPrincipale`));
    errors.push(...maxLength(dg.FatturaPrincipale.NumeroFatturaPrincipale, 20, `${fp}.NumeroFatturaPrincipale`));
    errors.push(...required(dg.FatturaPrincipale.DataFatturaPrincipale, `${fp}.DataFatturaPrincipale`));
    errors.push(...dateFormat(dg.FatturaPrincipale.DataFatturaPrincipale, `${fp}.DataFatturaPrincipale`));
  }

  return errors;
}
