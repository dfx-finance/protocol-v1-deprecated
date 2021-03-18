/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { MockAggregator } from "../MockAggregator";

export class MockAggregator__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides & { from?: string | Promise<string> }): Promise<MockAggregator> {
    return super.deploy(overrides || {}) as Promise<MockAggregator>;
  }
  getDeployTransaction(overrides?: Overrides & { from?: string | Promise<string> }): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MockAggregator {
    return super.attach(address) as MockAggregator;
  }
  connect(signer: Signer): MockAggregator__factory {
    return super.connect(signer) as MockAggregator__factory;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): MockAggregator {
    return new Contract(address, _abi, signerOrProvider) as MockAggregator;
  }
}

const _abi = [
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_a",
        type: "uint256",
      },
    ],
    name: "setAnswer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060c78061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806350d25bcd14603757806385a013e0146053575b600080fd5b603d607e565b6040518082815260200191505060405180910390f35b607c60048036036020811015606757600080fd5b81019080803590602001909291905050506087565b005b60008054905090565b806000819055505056fea2646970667358221220fdc5bfd030272ac82639576e4066f47d6289caf24adfb4c6ae9dd7d485f0890164736f6c63430007030033";