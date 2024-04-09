/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios';
import { extensions, MarkdownString } from 'vscode';
import { ILogger } from './logging';

export interface PuppetForgeCompletionInfo {
  total: number;
  modules: string[];
}

export interface PuppetForgeModuleInfo {
  uri: string;
  slug: string;
  name: string;
  downloads: number;
  score: number;
  created: Date;
  updated: Date;
  endorsement: string;
  owner: { slug: string; username: string };
  forgeUrl: string;
  homepageUrl: string;
  version: number;
  summary: string;
}

function getVersion(): string {
  const pkg = extensions.getExtension('puppet.puppet-vscode');
  return pkg.packageJSON.version;
}

export function buildMarkdown(info: PuppetForgeModuleInfo): MarkdownString {
  const message = `## ${info.name}\n
${info.summary}\n
**Latest version:** ${info.version} (${info.updated.toDateString()})\n
**Forge**: [${info.forgeUrl}](${info.forgeUrl})\n
**Project**: [${info.homepageUrl}](${info.homepageUrl})\n
**Owner:** ${info.owner.username}\n
**Endorsement:** ${info.endorsement?.toLocaleUpperCase()}\n
**Score:** ${info.score}\n
`;
  return new MarkdownString(message);
}

export function getPDKVersion(logger: ILogger): Promise<string> {
  return new Promise((resolve) => {
    return axios
      .get('https://s3.amazonaws.com/puppet-pdk/pdk/LATEST', {
        params: {
          exclude_fields: 'readme changelog license reference',
        },
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'User-Agent': `puppet-vscode/${getVersion()}`,
        },
      })
      .then((response) => {
        if (response.status !== 200) {
          logger.error(`Error getting Puppet forge data. Status: ${response.status}:${response.statusText}`);
          resolve(undefined);
        }
        resolve(response.data);
      });
  });
}

export function getModuleInfo(title: string, logger: ILogger): Promise<PuppetForgeModuleInfo> {
  return new Promise((resolve) => {
    return axios
      .get(`https://forgeapi.puppet.com/v3/modules/${title}`, {
        params: {
          exclude_fields: 'readme changelog license reference',
        },
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'User-Agent': `puppet-vscode/${getVersion()}`,
        },
      })
      .then((response) => {
        if (response.status !== 200) {
          logger.error(`Error getting Puppet forge data. Status: ${response.status}:${response.statusText}`);
          resolve(undefined);
        }

        const info = response.data;
        const module = {
          uri: info.uri,
          slug: info.slug,
          name: info.name,
          downloads: info.downloads,
          score: info.feedback_score,
          created: new Date(info.created_at),
          updated: new Date(info.updated_at),
          endorsement: info.endorsement ?? '',
          forgeUrl: `https://forge.puppet.com/modules/${info.owner.username}/${info.name}`,
          homepageUrl: info.homepage_url ?? '',
          version: info.current_release.version,
          owner: {
            uri: info.owner.uri,
            slug: info.owner.slug,
            username: info.owner.username,
            gravatar: info.owner.gravatar_id,
          },
          summary: info.current_release.metadata.summary,
        };

        resolve(module);
      })
      .catch((error) => {
        logger.error(`Error getting Puppet forge data: ${error}`);
        resolve(undefined);
      });
  });
}

export function getPuppetModuleCompletion(text: string, logger: ILogger): Promise<PuppetForgeCompletionInfo> {
  return new Promise((resolve) => {
    return axios
      .get(`https://forgeapi.puppet.com/private/modules?starts_with=${text}`, {
        params: {
          exclude_fields: 'readme changelog license reference',
        },
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'User-Agent': `puppet-vscode/${getVersion()}`,
        },
      })
      .then((response) => {
        if (response.status !== 200) {
          logger.error(`Error getting Puppet forge data. Status: ${response.status}:${response.statusText}`);
          resolve(undefined);
        }

        const info = response.data;
        const results: string[] = info.results as string[];
        const data = {
          total: parseInt(info.total),
          modules: results,
        };

        resolve(data);
      })
      .catch((error) => {
        logger.error(`Error getting Puppet forge data: ${error}`);
        resolve(undefined);
      });
  });
}
