import { validate } from '../../../src/validator/index';
import { withBody, expectCode } from '../../helpers/body-rules';

describe('Allegati', () => {
  it('errore se NomeAttachment mancante', () => {
    const f = withBody({ Allegati: [{ NomeAttachment: '', Attachment: 'base64content' }] });
    expectCode(validate(f), 'MISSING_REQUIRED_FIELD', 'NomeAttachment');
  });

  it('errore se NomeAttachment supera 60 caratteri', () => {
    const f = withBody({ Allegati: [{ NomeAttachment: 'x'.repeat(61), Attachment: 'base64content' }] });
    expectCode(validate(f), 'EXCEEDS_MAX_LENGTH', 'NomeAttachment');
  });

  it('errore se Attachment mancante', () => {
    const f = withBody({ Allegati: [{ NomeAttachment: 'file.pdf', Attachment: '' }] });
    expectCode(validate(f), 'MISSING_REQUIRED_FIELD', 'Attachment');
  });
});
