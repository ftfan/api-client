import { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

export interface SignTo {
  DomainReal: string; // https://api.fmex.com
  AccessKey: string;
  AccessSecret: string;
}

export const ApiSign = (config: AxiosRequestConfig, to: SignTo) => {
  const time = Date.now().toString();
  const data = [] as string[];
  const params = [] as string[];
  const secret = [`${(config.method || '').toLocaleUpperCase()}${to.DomainReal}${config.url}`];

  if (config.data) {
    for (const arg in config.data) data.push(`${arg}=${config.data[arg]}`);
  }

  for (const arg in config.params) {
    params.push(`${arg}=${config.params[arg]}`);
  }
  params.sort();
  data.sort();

  if (params.length) secret.push(`?${params.join('&')}`);

  secret.push(`${time}`);
  secret.push(`${data.join('&')}`);
  const signtmp = crypto
    .createHmac('sha1', to.AccessSecret)
    .update(new Buffer(secret.join('')).toString('base64'))
    .digest()
    .toString('base64');

  config.headers = config.headers || {};
  Object.assign(config.headers, {
    'FC-ACCESS-KEY': to.AccessKey,
    'FC-ACCESS-SIGNATURE': signtmp,
    'FC-ACCESS-TIMESTAMP': time,
    'Content-Type': 'application/json;charset=UTF-8',
  });

  return config;
};
