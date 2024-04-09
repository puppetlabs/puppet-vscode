import * as assert from 'assert';
import axios from 'axios';
import * as fs from 'fs';
import { describe, it } from 'mocha';
import * as path from 'path';
import { pdkDownloadLink, releaseNotesLink, troubleShootingLink } from '../../extension';
describe('Vendored link checks', () => {
  let links: string[] = [pdkDownloadLink, releaseNotesLink, troubleShootingLink];

  links.forEach((link) => {
    it(`Extension metadata: should return 200 for ${link}`, async () => {
      axios.get(link).then((response) => {
        assert.strictEqual(response.status, 200);
      });
    });
  });

  // read the package.json and get the links from the jsonValidation section
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf-8'));
  links = packageJson.contributes.jsonValidation.map(element => element.url);
  links.forEach((link) => {
    it(`Validators: should return 200 for ${link}`, async () => {
      axios.get(link).then((response) => {
        assert.strictEqual(response.status, 200);
      });
    });
  });
});
