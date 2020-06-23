import { CodeObj, Code } from '@/types/Code';
import { sleep } from './utils';
const cryptico = require('cryptico');
const Bits = 1024;

export const AES = {
  Encrypt(password: string, PlainText: string, time = 600): Promise<CodeObj<string>> {
    return new Promise((resolve) => {
      Promise.all([EncryptStrByPassword(password, PlainText), sleep(time)]).then(([res]) => resolve(res));
    });
  },

  Decrypt(password: string, result: string, time = 600): Promise<CodeObj<string>> {
    return new Promise((resolve) => {
      Promise.all([DecryptStrByPassword(password, result), sleep(time)]).then(([res]) => resolve(res));
    });
  },
};

// 加密
export const EncryptStrByPassword = async (password: string, PlainText: string) => {
  await sleep(16); // 因为加密解密过程消耗资源，为了避免卡顿，异步处理
  const MattsRSAkey = cryptico.generateRSAKey(password, Bits);
  const MattsPublicKeyString = cryptico.publicKeyString(MattsRSAkey);
  const SamsRSAkey = cryptico.generateRSAKey('PassPhrase', Bits);
  const res = cryptico.encrypt(PlainText, MattsPublicKeyString, SamsRSAkey);
  if (res.status !== 'success') return new CodeObj(Code.Error, res, res.status);
  return new CodeObj(Code.Success, res.cipher);
};

// 解密
export const DecryptStrByPassword = async (password: string, result: string) => {
  await sleep(16); // 因为加密解密过程消耗资源，为了避免卡顿，异步处理
  const MattsRSAkey = cryptico.generateRSAKey(password, Bits);
  const res = cryptico.decrypt(result, MattsRSAkey);
  if (res.status !== 'success') return new CodeObj(Code.Error, res, res.status);
  return new CodeObj(Code.Success, res.plaintext);
};
