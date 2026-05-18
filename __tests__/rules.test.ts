import {
  required, maxLength, exactLength, minMaxLength,
  pattern, dateFormat,
  paese, partitaIvaIT, codiceFiscaleIT, cap, provincia,
  iban, bic, numeroFattura, codiceDestinatario, progressivoInvio,
} from '../src/validator/rules/types';

const f = 'TestField';

describe('required()', () => {
  it('ok se valore presente', ()     => expect(required('abc', f)).toHaveLength(0));
  it('errore se stringa vuota', ()   => expect(required('', f)[0]?.code).toBe('MISSING_REQUIRED_FIELD'));
  it('errore se solo spazi', ()      => expect(required('   ', f)[0]?.code).toBe('MISSING_REQUIRED_FIELD'));
  it('errore se undefined', ()       => expect(required(undefined, f)[0]?.code).toBe('MISSING_REQUIRED_FIELD'));
});

describe('maxLength()', () => {
  it('ok se dentro il limite', ()    => expect(maxLength('abc', 10, f)).toHaveLength(0));
  it('ok se undefined', ()           => expect(maxLength(undefined, 10, f)).toHaveLength(0));
  it('errore se supera il limite', () => expect(maxLength('a'.repeat(11), 10, f)[0]?.code).toBe('EXCEEDS_MAX_LENGTH'));
  it('messaggio include lunghezza', () => {
    const msg = maxLength('a'.repeat(11), 10, f)[0]?.message ?? '';
    expect(msg).toContain('10');
    expect(msg).toContain('11');
  });
});

describe('exactLength()', () => {
  it('ok se lunghezza corretta', ()  => expect(exactLength('AB', 2, f)).toHaveLength(0));
  it('errore se troppo corto', ()    => expect(exactLength('A', 2, f)[0]?.code).toBe('INVALID_LENGTH'));
  it('errore se troppo lungo', ()    => expect(exactLength('ABC', 2, f)[0]?.code).toBe('INVALID_LENGTH'));
});

describe('minMaxLength()', () => {
  it('ok se nel range', ()           => expect(minMaxLength('abc', 2, 5, f)).toHaveLength(0));
  it('errore se sotto il minimo', () => expect(minMaxLength('a', 2, 5, f)[0]?.code).toBe('INVALID_LENGTH'));
  it('errore se sopra il massimo', () => expect(minMaxLength('abcdef', 2, 5, f)[0]?.code).toBe('INVALID_LENGTH'));
});

describe('dateFormat()', () => {
  it('ok con data YYYY-MM-DD', ()    => expect(dateFormat('2026-05-18', f)).toHaveLength(0));
  it('ok se undefined', ()           => expect(dateFormat(undefined, f)).toHaveLength(0));
  it('errore formato DD/MM/YYYY', () => expect(dateFormat('18/05/2026', f)[0]?.code).toBe('INVALID_DATE_FORMAT'));
  it('errore formato YYYYMMDD', ()   => expect(dateFormat('20260518', f)[0]?.code).toBe('INVALID_DATE_FORMAT'));
});

describe('paese()', () => {
  it('ok con "IT"', ()               => expect(paese('IT', f)).toHaveLength(0));
  it('ok con "DE"', ()               => expect(paese('DE', f)).toHaveLength(0));
  it('errore con "it" minuscolo', () => expect(paese('it', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con 3 lettere', ()      => expect(paese('ITA', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con cifra', ()          => expect(paese('I1', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('partitaIvaIT()', () => {
  it('ok con 11 cifre', ()               => expect(partitaIvaIT('01234567890', f)).toHaveLength(0));
  it('errore con 10 cifre', ()           => expect(partitaIvaIT('0123456789', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con 12 cifre', ()           => expect(partitaIvaIT('012345678901', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con lettere', ()            => expect(partitaIvaIT('0123456789A', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('codiceFiscaleIT()', () => {
  it('ok con 11 cifre (società)', ()                   => expect(codiceFiscaleIT('01234567890', f)).toHaveLength(0));
  it('ok con CF persona fisica 16 caratteri', ()        => expect(codiceFiscaleIT('RSSMRA80A01H501Z', f)).toHaveLength(0));
  it('errore con 10 caratteri', ()                     => expect(codiceFiscaleIT('0123456789', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con 17 caratteri', ()                     => expect(codiceFiscaleIT('RSSMRA80A01H501ZZ', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('cap()', () => {
  it('ok con 5 cifre', ()           => expect(cap('00100', f)).toHaveLength(0));
  it('errore con 4 cifre', ()       => expect(cap('0010', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con lettere', ()       => expect(cap('0010A', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('provincia()', () => {
  it('ok con "RM"', ()              => expect(provincia('RM', f)).toHaveLength(0));
  it('errore con "rm" minuscolo', ()=> expect(provincia('rm', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con 3 lettere', ()     => expect(provincia('ROM', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('iban()', () => {
  it('ok con IBAN italiano', ()     => expect(iban('IT60X0542811101000000123456', f)).toHaveLength(0));
  it('ok se undefined', ()          => expect(iban(undefined, f)).toHaveLength(0));
  it('errore con IBAN senza paese', ()=> expect(iban('600542811101000000123456', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con lettere minuscole', ()=> expect(iban('it60X054281110100000012345', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('bic()', () => {
  it('ok con 8 caratteri', ()       => expect(bic('BNLIITRR', f)).toHaveLength(0));
  it('ok con 11 caratteri', ()      => expect(bic('BNLIITRR001', f)).toHaveLength(0));
  it('ok se undefined', ()          => expect(bic(undefined, f)).toHaveLength(0));
  it('errore con 7 caratteri', ()   => expect(bic('BNLIIT1', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con 9 caratteri', ()   => expect(bic('BNLIITRR0', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('numeroFattura()', () => {
  it('ok con formato valido', ()          => expect(numeroFattura('FT-2026-001', f)).toHaveLength(0));
  it('ok con solo cifre', ()              => expect(numeroFattura('20260001', f)).toHaveLength(0));
  it('errore se supera 20 caratteri', ()  => expect(numeroFattura('a'.repeat(21), f).some(e => e.code === 'EXCEEDS_MAX_LENGTH')).toBe(true));
  it('errore con caratteri non ammessi', ()=> expect(numeroFattura('FT 2026 001', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('codiceDestinatario()', () => {
  it('ok con 7 caratteri maiuscoli', ()  => expect(codiceDestinatario('ABC1234', f)).toHaveLength(0));
  it('ok con 0000000', ()               => expect(codiceDestinatario('0000000', f)).toHaveLength(0));
  it('errore con 6 caratteri', ()       => expect(codiceDestinatario('ABC123', f)[0]?.code).toBe('INVALID_FORMAT'));
  it('errore con lettere minuscole', () => expect(codiceDestinatario('abc1234', f)[0]?.code).toBe('INVALID_FORMAT'));
});

describe('progressivoInvio()', () => {
  it('ok con alfanumerico max 10', ()   => expect(progressivoInvio('00001', f)).toHaveLength(0));
  it('errore se supera 10 caratteri', ()=> expect(progressivoInvio('a'.repeat(11), f).some(e => e.code === 'EXCEEDS_MAX_LENGTH')).toBe(true));
  it('errore con caratteri speciali', ()=> expect(progressivoInvio('00-001', f).some(e => e.code === 'INVALID_FORMAT')).toBe(true));
});
