// VestingInterface.js

import React, { useEffect, useState } from 'react';
import moment from 'moment';

import {
  getVestingContract,
  getTokenContract,
  encodeReleaseTokens,
} from './contract';
import { abbreviateAddress, formatTokenNum } from './utils';
import { TOKEN_CONTRACT_ADDRESS, EXPLORER_URL } from './config';

import {
  Box,
  Button,
  Container,
  Center,
  Heading,
  Progress,
  Table,
  Tbody,
  Td,
  Tr,
  Text,
  Link,
} from '@chakra-ui/react';
import { ethers } from 'ethers';

function VestingInterface({ vestingContractAddress }) {
  const [vestingState, setVestingState] = useState({});
  const [isClaiming, setIsClaiming] = useState(false);

  const metamask = window.ethereum;

  const getData = async () => {
    const provider = new ethers.providers.Web3Provider(metamask);

    const signer = provider.getSigner();

    const vestingContract = await getVestingContract(
      signer,
      vestingContractAddress
    );

    const tokenContract = await getTokenContract(
      signer,
      TOKEN_CONTRACT_ADDRESS
    );

    const symbol = await tokenContract.symbol();

    const start = (await vestingContract.getStart()).toNumber();
    const duration = (await vestingContract.getDuration()).toNumber();
    const cliff = (await vestingContract.getCliff()).toNumber();

    const released = await vestingContract.getReleased(TOKEN_CONTRACT_ADDRESS);

    const balance = await tokenContract.balanceOf(vestingContractAddress);

    const total = released.add(balance);

    const vested = await vestingContract.getVestedAmount(
      TOKEN_CONTRACT_ADDRESS
    );

    const remaining = total.sub(vested);

    const releasable = vested.sub(released);

    setVestingState({
      start,
      duration,
      released,
      vested,
      balance,
      releasable,
      symbol,
      cliff,
      total,
      remaining,
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

  const claimTokens = async () => {
    setIsClaiming(true);

    try {
      const data = encodeReleaseTokens(TOKEN_CONTRACT_ADDRESS);

      const transactionParameters = {
        gas: '0x30D40', // customizable by user during MetaMask confirmation.
        to: vestingContractAddress, // Required except during contract publications.
        from: metamask.selectedAddress, // must match user's active address.
        value: '0x00', // Only required to send ether to the recipient from the initiating external account.
        data,
      };

      // txHash is a hex string
      // As with any RPC call, it may throw an error
      await metamask.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
    } catch (err) {
      console.error(err);
    }

    setIsClaiming(false);
  };

  return (
    vestingState.total === 0? 
    (
      <Container height="100vh">
        <Center>
          {`Vesting has not started yet. The vesting start date is ${moment(
                    (vestingState.start) * 1000
                  ).format('YYYY/MM/DD HH:mm')}. The ${vestingState.symbol} tokens will appear here soon.`}
        </Center>
      </Container>
    )
    :
    <Box>

      <Heading size="md" mb={5}>
        Stake BITE and Earn Interest
      </Heading>

      <Table
        variant="simple"
        size="md"
      >
        <Tbody>
          <Tr>
            <Td>
            <Link
              color="red.500" 
              href={`https://stake.polkabridge.org/`}
              isExternal
            >
              <Button
              bgColor="green.200"
              >
               <strong>Stake BITE at Polkabridge</strong>
              </Button>
            </Link>
            </Td>
            <Td>
            <Link
              color="red.500" 
              href={`https://dragonbite.medium.com/staking-bite-in-a-few-clicks-with-polkabridge-ensure-your-high-apy-deae1b34a80b`}
              isExternal
            >
              Polkabridge Guide
            </Link>
            </Td>
          </Tr>
          <Tr>
            <Td>
            <Link
              color="red.500" 
              href={`https://app.mantradao.com/staking`}
              isExternal
            >
              <Button
              bgColor="green.200"
              >
              <strong>Stake BITE at Mantradao</strong>
              </Button>
            </Link>
            </Td>
            <Td>
            <Link 
              color="red.500"
              href={`https://dragonbite.medium.com/earn-attractive-interests-stake-your-bite-on-mantra-dao-6be4bcd71d1d`}
              isExternal
            >
              Mantradao Guide
            </Link>
            </Td>
          </Tr>
        </Tbody>
      </Table>

      <span>&nbsp;&nbsp;</span>
      
      <Heading size="md" mb={5}>
        Claim Your BITE Tokens
      </Heading>
      
      <Box mb={5}>
        {vestingState.vested ? (
          <>
            <Progress
              value={vestingState.vested
                .mul(100)
                .div(vestingState.total)
                .toNumber()}
            />
            <Text align="center">
              {formatTokenNum(vestingState.vested, vestingState.symbol)} /{' '}
              {formatTokenNum(vestingState.total, vestingState.symbol)}
            </Text>
          </>
        ) : (
          ''
        )}
      </Box>
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
              <strong>Vesting Contract Address</strong>
            </Td>
            <Td>
              <Link
                color="teal.500"
                href={`${EXPLORER_URL}/address/${vestingContractAddress}`}
                isExternal
              >
                {abbreviateAddress(vestingContractAddress)}
              </Link>
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Start date</strong>
            </Td>
            <Td>
              {vestingState.start
                ? moment(vestingState.start * 1000).format('YYYY/MM/DD HH:mm')
                : 'loading...'}
            </Td>
          </Tr>

          {vestingState.cliff === vestingState.start ? (
            ''
          ) : (
            <Tr>
              <Td>
                <strong>Cliff date</strong>
              </Td>
              <Td>
                {vestingState.cliff
                  ? moment(vestingState.cliff * 1000).format('YYYY/MM/DD HH:mm')
                  : 'loading...'}
              </Td>
            </Tr>
          )}

          <Tr>
            <Td>
              <strong>End date</strong>
            </Td>
            <Td>
              {vestingState.start
                ? moment(
                    (vestingState.start + vestingState.duration) * 1000
                  ).format('YYYY/MM/DD HH:mm')
                : 'loading...'}
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Total tokens</strong>
            </Td>
            <Td>{formatTokenNum(vestingState.total, vestingState.symbol)}</Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Already vested</strong>
            </Td>
            <Td>{formatTokenNum(vestingState.vested, vestingState.symbol)}</Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Remaining to vest</strong>
            </Td>
            <Td>
              {formatTokenNum(vestingState.remaining, vestingState.symbol)}
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Already claimed</strong>
            </Td>
            <Td>
              {formatTokenNum(vestingState.released, vestingState.symbol)}
            </Td>
          </Tr>
          <Tr>
            <Td>
              <strong>Available to Claim</strong>
            </Td>
            <Td>
              {formatTokenNum(vestingState.releasable, vestingState.symbol)}{' '}
              <Button
                onClick={claimTokens}
                colorScheme="green"
                ml={5}
                isDisabled={isClaiming}
              >
                Claim
              </Button>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}

export default VestingInterface;
