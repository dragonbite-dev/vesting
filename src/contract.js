import { ethers } from 'ethers';

const TokenVestingJSON = require('./contracts/TokenVesting.json');
const RefinableTokenJSON = require('./contracts/RefinableToken.json');
const TokenVestingFactoryJSON = require('./contracts/TokenVestingFactory.json');

export function getVestingContract(provider, address) {
  return new ethers.Contract(address, TokenVestingJSON.abi, provider);
}

export function getTokenContract(provider, address) {
  return new ethers.Contract(address, RefinableTokenJSON.abi, provider);
}

export function getVestingFactoryContract(provider, address) {
  return new ethers.Contract(address, TokenVestingFactoryJSON.abi, provider);
}

export function encodeReleaseTokens(tokenAddress) {
  const contract = new ethers.utils.Interface(TokenVestingJSON.abi);

  return contract.encodeFunctionData('release', [tokenAddress]);
}
