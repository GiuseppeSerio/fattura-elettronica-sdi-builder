import { create } from 'xmlbuilder2';
import type { FatturaElettronica } from '../types/index.js';
import type { Result } from '../result.js';
import { ok, err } from '../result.js';
import { BuildError } from '../errors/index.js';
import { buildHeader } from './header.builder.js';
import { buildBody } from './body.builder.js';

export interface BuildOptions {
  prettyPrint?: boolean;
  encoding?: string;
}

const NAMESPACE = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2';

export function buildXml(fattura: FatturaElettronica, options: BuildOptions = {}): Result<string, BuildError> {
  try {
    const { prettyPrint = false, encoding = 'UTF-8' } = options;
    const formato = fattura.FatturaElettronicaHeader.DatiTrasmissione.FormatoTrasmissione;

    const doc = create({ version: '1.0', encoding })
      .ele(NAMESPACE, 'p:FatturaElettronica', {
        'xmlns:p': NAMESPACE,
        'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': `${NAMESPACE} Schema_del_file_xml_FatturaPA_v1.2.xsd`,
        versione: formato,
      });

    buildHeader(doc, fattura.FatturaElettronicaHeader);

    const bodies = Array.isArray(fattura.FatturaElettronicaBody)
      ? fattura.FatturaElettronicaBody
      : [fattura.FatturaElettronicaBody];

    for (const body of bodies) {
      buildBody(doc, body);
    }

    return ok(doc.end({ prettyPrint }));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(new BuildError(`Errore durante la generazione XML: ${message}`));
  }
}
