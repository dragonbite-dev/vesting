import { ethers } from 'ethers';

const BITEPOINTJSON = require('./contracts/BITEPOINT.json');

export function getTokenContract(provider, address) {
  console.log(address);
  return new ethers.Contract(address, BITEPOINTJSON.abi, provider);
}

export function encodeReleaseTokens(tokenAddress) {

  const contract = new ethers.utils.Interface(BITEPOINTJSON.abi);

  return contract.encodeFunctionData('release', [tokenAddress]);
}
