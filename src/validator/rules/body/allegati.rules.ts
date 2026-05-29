import type { Allegati, DatiVeicoli } from '../../../types/index.js';
import type { FieldError } from '../../../errors/index.js';
import { required, maxLength, dateFormat, pattern } from '../types.js';

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function validateAllegati(allegati: Allegati[], base: string): FieldError[] {
  const errors: FieldError[] = [];

  allegati.forEach((a, i) => {
    const p = `${base}.Allegati[${i}]`;
    errors.push(...required(a.NomeAttachment, `${p}.NomeAttachment`));
    errors.push(...maxLength(a.NomeAttachment, 60, `${p}.NomeAttachment`));
    errors.push(...maxLength(a.FormatoAttachment, 10, `${p}.FormatoAttachment`));
    errors.push(...maxLength(a.DescrizioneAttachment, 100, `${p}.DescrizioneAttachment`));
    errors.push(...required(a.Attachment, `${p}.Attachment`));
    if (a.Attachment) {
      // Rimuovi eventuali whitespace (split su linee è ammesso nel base64 trasmesso)
      const compact = a.Attachment.replace(/\s+/g, '');
      errors.push(...pattern(compact, BASE64, `${p}.Attachment`, 'Attachment deve essere codificato in base64 valido'));
    }
  });

  return errors;
}

export function validateDatiVeicoli(dv: DatiVeicoli, base: string): FieldError[] {
  const errors: FieldError[] = [];
  const p = `${base}.DatiVeicoli`;

  errors.push(...required(dv.Data, `${p}.Data`));
  errors.push(...dateFormat(dv.Data, `${p}.Data`));
  errors.push(...required(dv.TotalePercorso, `${p}.TotalePercorso`));
  errors.push(...maxLength(dv.TotalePercorso, 15, `${p}.TotalePercorso`));

  return errors;
}
