// VestingInterface.js

import React, { useEffect, useState } from 'react';
import moment from 'moment';

import {
  getTokenContract,
} from './contract';
import { abbreviateAddress, formatTokenNum } from './utils';
import { TOKEN_CONTRACT_ADDRESS, EXPLORER_URL } from './config';
import { createPermitMessageData, getApprovalDigest } from './utils';
import { ethers } from 'ethers';
import { ecsign } from 'ethereumjs-util'

import {
  hexlify,
} from 'ethers/lib/utils';

import {
  Box,
  Button,
  Heading,
  Table,
  Tbody,
  Td,
  Tr,
  Link,
  Center,
  NumberInput,
  NumberInputField,
  Text,
  Input
} from '@chakra-ui/react';

function VestingInterface() {

  const [amountTransfer, setAmountTransfer] = useState();
  const [signerAddress, setSignerAddress] = useState();
  const [spenderAddress, setSpenderAddress] = useState();
  const [accountState, setAccountState] = useState({'balance': 0, 'symbol': 'BTIEPT', 'nonce': 0});
  const [signedTransactionState, setSignedTransactionState] = useState({});
  const [isClaiming, setIsClaiming] = useState(false);

  const metamask = window.ethereum;

  const getData = async () => {
    
    const provider = new ethers.providers.Web3Provider(metamask);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    setSignerAddress(address);

    const tokenContract = getTokenContract(
      provider,
      TOKEN_CONTRACT_ADDRESS
    );

    const symbol = await tokenContract.symbol();
    const balance = await tokenContract.balanceOf(address);
    const nonce = await tokenContract.nonces(address);

    setAccountState({
      balance,
      symbol,
      nonce
    });
  };

  useEffect(() => {
    getData();
    const interval = setInterval(getData, 5000);
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signData = async (fromAddress, typeData) => {
    return new Promise(function (resolve, reject) {

      const provider = new ethers.providers.Web3Provider(metamask);
      const signer = provider.getSigner();
      
      metamask.sendAsync(
        {
          id: 1,
          method: "eth_signTypedData_v3",
          params: [fromAddress, typeData],
          from: fromAddress,
        },
        function (err, result) {
          if (err) {
            reject(err); //TODO
            setIsClaiming(false);
          } else {
            const r = result.result.slice(0, 66);
            const s = "0x" + result.result.slice(66, 130);
            const v = Number("0x" + result.result.slice(130, 132));
            resolve({
              v,
              r,
              s,
            });
          }
        }
      );
    });
  };

  const signTransaction = async () => {
    
    setIsClaiming(true);
    const messageData = createPermitMessageData(
      signerAddress,
      spenderAddress,
      accountState.nonce.toString(),
      amountTransfer,
      1833234440741
    );
    
    const sig = await signData(signerAddress, messageData.typedData);
    
    setSignedTransactionState(Object.assign({}, sig, messageData.message))

    // const deadline = 1833234440741;
    // const approve = { owner: signerAddress, spender: spenderAddress, value: amountTransfer };
    // const digest = await getApprovalDigest(
    //   "Dragonbite Point",
    //   TOKEN_CONTRACT_ADDRESS,
    //   approve,
    //   accountState.nonce.toString(),
    //   deadline
    // )

    // const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from("", 'hex'))
    // console.log(v, hexlify(r), hexlify(s));

    setIsClaiming(false);
  };

  return (
     <Box>

      <Heading size="md" mb={5} textAlign="center">
        Test meta transaction
      </Heading>
      
      <Table
        variant="simple"
        size="md"
        borderRadius="12px"
        borderWidth="1px"
        style={{ borderCollapse: 'initial', tableLayout: 'fixed' }}
      >
        <Tbody>
          <Tr>
            <Td>
              <strong>Token Contract Address</strong>
            </Td>
            <Td>
              <Link
                color="teal.500"
                href={`${EXPLORER_URL}/address/${TOKEN_CONTRACT_ADDRESS}`}
                isExternal
              >
                {abbreviateAddress(TOKEN_CONTRACT_ADDRESS)}
              </Link>
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Signed Transaction Owner</strong>
            </Td>
            <Td>
              {signedTransactionState.owner
                ? signedTransactionState.owner
                : 'loading...'}
            </Td>
          </Tr>

          <Tr>
            <Td>
              <strong>Signed Transaction Spender</strong>
            </Td>
            <Td>
              {signedTransactionState.spender
                ? signedTransactionState.spender
                : 'loading...'}
            </Td>
          </Tr>

          <Tr>
            <Td>
              <strong>Signed Transaction Value</strong>
            </Td>
            <Td>
              {signedTransactionState.value ? 
                signedTransactionState.value + " " + accountState.symbol
                : 'loading...'
              }
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Signed Transaction Deadline</strong>
            </Td>
            <Td>
              {signedTransactionState.deadline
                ? <Box>
                  <Text>{moment(
                    (signedTransactionState.deadline)
                  ).format('YYYY/MM/DD HH:mm')}</Text>
                  <Text>{"Stamp: " + signedTransactionState.deadline}</Text>
                  </Box>
                : 'loading...'}
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>R, S, V</strong>
            </Td>
            <Td>
              {signedTransactionState.r
                ? <Box>
                    <Text>{"R: " + signedTransactionState.r}</Text>
                    <Text>{"\nS: " + signedTransactionState.s}</Text>
                    <Text>{"\n V: " + signedTransactionState.v}</Text>
                  </Box>
                : 'loading...'}
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Available to Permit</strong>
            </Td>
            <Td>
              <Center>
              {`${accountState.balance} ${accountState.symbol}`}
              </Center>
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Amount to Permit</strong>
            </Td>
            <Td>
              <Center>
              <NumberInput
                value={amountTransfer}
                onChange={(valueString)=>setAmountTransfer(valueString.replace(".", ""))}
                defaultValue={0}>
                  <NumberInputField />
              </NumberInput>
              </Center>
              {parseInt(amountTransfer === "" ? "0" : amountTransfer, 10) > parseInt(accountState.balance, 10) ?
              (<Text fontSize="xs" color="red.400" fontWeight="bold">Amount is greater than balance!</Text>) : <Text/>
              }
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Grant to Address</strong>
            </Td>
            <Td>
              <Input value={spenderAddress} onChange={(event)=>setSpenderAddress(event.target.value)}/>
            </Td>
          </Tr>
          <Tr>
            <Td>
            </Td>
            <Td>
              <Button
                onClick={signTransaction}
                colorScheme="green"
                ml={5}
                isDisabled={isClaiming || parseInt(amountTransfer === "" ? "0" : amountTransfer, 10) > parseInt(accountState.balance, 10) || amountTransfer === ""}
              >
                Sign Transaction
              </Button>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}

export default VestingInterface;
