// App.js

import { Button } from '@chakra-ui/button';
import { Box, Center, Container, Flex } from '@chakra-ui/layout';
import { Tag } from '@chakra-ui/tag';
import React, { useEffect, useState } from 'react';

import { ethers } from 'ethers';

import { getVestingFactoryContract } from './contract';
import { abbreviateAddress } from './utils';
import VestingInterface from './VestingInterface';

import { FACTORY_CONTRACT_ADDRESS, REQUIRED_CHAIN_ID, TOKEN_CONTRACT_ADDRESS } from './config';

function App() {
  const metamask = window.ethereum;

  const [currentAccount, setCurrentAccount] = useState(
    metamask.selectedAddress
  );

  const [address, setAddress] = useState(null);

  const [currentSignerAddress, setCurrentSignerAddress] = useState(
    metamask.selectedAddress
  );

  const [chainId, setChainId] = useState(null);

  metamask.on('accountsChanged', (accounts) => {
    setCurrentAccount(accounts[0]);
  });

  metamask.on('chainChanged', (id) => {
    setChainId(id);
  });

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(metamask);

    const signer = provider.getSigner();

    signer.getAddress().then(setCurrentSignerAddress);

    const getAddress = async () => {
      const factoryContract = await getVestingFactoryContract(
        signer,
        FACTORY_CONTRACT_ADDRESS
      );

      const result = await factoryContract.getVestingAddress({
        from: metamask.selectedAddress,
      });

      const cid = await metamask.request({ method: 'eth_chainId' });

      setChainId(cid);

      setAddress(result);

      // modify from here
      const tokenAddress = TOKEN_CONTRACT_ADDRESS;
      const tokenSymbol = 'BITE';
      const tokenDecimals = 18;
      const tokenImage = 'https://dragonbite.io/static/images/dragonbite-center-white-337x350.png';
      
      const wasAdded = await metamask.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });
    // modify ending ---------------------

    };
    getAddress();

  }, [currentAccount, metamask]);

  if (!metamask) return <Center>Metamask not installed!</Center>;

  return (
    <Container height="100vh">
      <Flex direction="column" height="100%" width="100%">
        <Center p={5}>
          <Box mr={2}>Your Wallet:</Box>

          {currentSignerAddress ? (
            <Tag colorScheme="teal">
              {abbreviateAddress(currentSignerAddress)}
            </Tag>
          ) : (
            <Button
              colorScheme="blue"
              onClick={() =>
                metamask.request({ method: 'eth_requestAccounts' })
              }
            >
              Connect Metamask
            </Button>
          )}
        </Center>

        {!currentAccount ? (
          'Please connect your Metamask or change your address.'
        ) : chainId !== REQUIRED_CHAIN_ID ? (
          <Center>
            {`Incorrect network. Your current chain Id is ${chainId}, ${REQUIRED_CHAIN_ID} is needed.`}
          </Center>
        ) : address === '0x0000000000000000000000000000000000000000' ||
          !address ? (
          'Your address does not have a vesting contract! Please make sure your network and metamask address are correct.'
        ) : (
          <Flex flexGrow={1}>
            <VestingInterface vestingContractAddress={address} />
          </Flex>
        )}
      </Flex>
    </Container>
  );
}

// Wrap everything in <UseWalletProvider />
export default App;
