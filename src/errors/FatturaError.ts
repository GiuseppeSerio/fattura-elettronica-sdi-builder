import type { ErrorCode } from './codes.js';

export class FatturaError extends Error {
  readonly code: ErrorCode;
  readonly section?: string;

  constructor(code: ErrorCode, message: string, section?: string) {
    super(message);
    this.name = 'FatturaError';
    this.code = code;
    this.section = section;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---- ValidationError -------------------------------------------------------

export interface FieldError {
  field: string;
  code: ErrorCode;
  message: string;
}

export class ValidationError extends FatturaError {
  readonly fields: FieldError[];

  constructor(fields: FieldError[]) {
    super(
      'MISSING_REQUIRED_FIELD',
      `Validazione fallita: ${fields.length} errore/i trovato/i`,
      'validation',
    );
    this.name = 'ValidationError';
    this.fields = fields;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---- BuildError ------------------------------------------------------------

export class BuildError extends FatturaError {
  constructor(message: string, section?: string) {
    super('BUILD_FAILED', message, section);
    this.name = 'BuildError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
