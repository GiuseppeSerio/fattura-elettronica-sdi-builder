export type * from './common.js';
export type * from './header.js';
export type * from './body.js';

import type { FatturaElettronicaHeader } from './header.js';
import type { FatturaElettronicaBody } from './body.js';

export interface FatturaElettronica {
  FatturaElettronicaHeader: FatturaElettronicaHeader;
  FatturaElettronicaBody: FatturaElettronicaBody | FatturaElettronicaBody[];
}
