import { ethers } from 'ethers';
import { TOKEN_CONTRACT_ADDRESS } from "./config";

import {
  BigNumber,
  bigNumberify,
  getAddress,
  keccak256,
  defaultAbiCoder,
  toUtf8Bytes,
  solidityPack
} from 'ethers/lib/utils';

export function formatTokenNum(x, symbol) {
  console.log(x);
  if (!x) return 'loading...';
  return (
    parseFloat(ethers.utils.formatEther(x.toString(), 'ether')).toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ) + ` ${symbol}`
  );
}

export function abbreviateAddress(address) {
  return address.substr(0, 6) + '...' + address.substr(address.length - 4, 4);
}

export function createPermitMessageData(
  fromAddress, 
  spender,
  nonce,
  value,
  deadline) {
  
  const message = {
    owner: fromAddress,
    spender: spender,
    value: value,
    nonce: nonce,
    deadline: deadline
  };

  const typedData = JSON.stringify({
    types: {
      EIP712Domain: [
        {
          name: "name",
          type: "string",
        },
        {
          name: "version",
          type: "string",
        },
        {
          name: "chainId",
          type: "uint256",
        },
        {
          name: "verifyingContract",
          type: "address",
        },
      ],
      Permit: [
        {
          name: "owner",
          type: "address",
        },
        {
          name: "spender",
          type: "address",
        },
        {
          name: "value",
          type: "uint256",
        },
        {
          name: "nonce",
          type: "uint256",
        },
        {
          name: "deadline",
          type: "uint256",
        }
      ],
    },
    primaryType: "Permit",
    domain: {
      name: "Dragonbite Point",
      version: "1",
      chainId: 137,
      verifyingContract: TOKEN_CONTRACT_ADDRESS,
    },
    message: message,
  });

  return {
    typedData,
    message,
  };
};

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

function getDomainSeparator(name, tokenAddress) {
  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
        keccak256(toUtf8Bytes(name)),
        keccak256(toUtf8Bytes('1')),
        137,
        tokenAddress
      ]
    )
  )
}

export async function getApprovalDigest(
  tokenName,
  tokenAddress,
  approve,
  nonce,
  deadline
) {
  const DOMAIN_SEPARATOR = getDomainSeparator(tokenName, tokenAddress);
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
          )
        )
      ]
    )
  )
}