/**
 * Valori validi a runtime per i campi enum FatturaPA.
 * Usati dal helper enumValue() nei validator.
 */

export const REGIME_FISCALE = [
  'RF01','RF02','RF04','RF05','RF06','RF07','RF08','RF09',
  'RF10','RF11','RF12','RF13','RF14','RF15','RF16','RF17',
  'RF18','RF19','RF20',
] as const;

export const TIPO_DOCUMENTO = [
  'TD01','TD02','TD03','TD04','TD05','TD06',
  'TD07','TD08','TD09','TD10','TD11',
  'TD16','TD17','TD18','TD19','TD20','TD21',
  'TD22','TD23','TD24','TD25','TD26','TD27',
  'TD28','TD29',
] as const;

export const TIPO_RITENUTA = ['RT01','RT02','RT03','RT04','RT05','RT06'] as const;

export const TIPO_CASSA = [
  'TC01','TC02','TC03','TC04','TC05','TC06','TC07','TC08','TC09','TC10',
  'TC11','TC12','TC13','TC14','TC15','TC16','TC17','TC18','TC19','TC20',
  'TC21','TC22',
] as const;

export const CAUSALE_PAGAMENTO = [
  'A','B','C','D','E','G','H','I','J','K',
  'L','L1','M','M1','M2','N','O','O1','P',
  'Q','R','S','T','U','V','V1','V2','W','X','Y','ZO',
] as const;

export const TIPO_CESSIONE_PRESTAZIONE = ['SC','AB','AC','PR'] as const;

export const MODALITA_PAGAMENTO = [
  'MP01','MP02','MP03','MP04','MP05','MP06','MP07','MP08','MP09','MP10',
  'MP11','MP12','MP13','MP14','MP15','MP16','MP17','MP18','MP19','MP20',
  'MP21','MP22','MP23',
] as const;

export const CONDIZIONI_PAGAMENTO = ['TP01','TP02','TP03'] as const;

export const ESIGIBILITA_IVA = ['D','I','S'] as const;

/** Codici Natura deprecati dal 2021 — richiedono sottocodice (N2.x, N3.x, N6.x) */
export const NATURA_DEPRECATA = new Set(['N2','N3','N6']);
