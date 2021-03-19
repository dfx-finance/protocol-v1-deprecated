/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { CadcToUsdAssimilator } from "../CadcToUsdAssimilator";

export class CadcToUsdAssimilator__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CadcToUsdAssimilator> {
    return super.deploy(overrides || {}) as Promise<CadcToUsdAssimilator>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): CadcToUsdAssimilator {
    return super.attach(address) as CadcToUsdAssimilator;
  }
  connect(signer: Signer): CadcToUsdAssimilator__factory {
    return super.connect(signer) as CadcToUsdAssimilator__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CadcToUsdAssimilator {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as CadcToUsdAssimilator;
  }
}

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "int128",
        name: "_amount",
        type: "int128",
      },
    ],
    name: "intakeNumeraire",
    outputs: [
      {
        internalType: "uint256",
        name: "amount_",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "intakeRaw",
    outputs: [
      {
        internalType: "int128",
        name: "amount_",
        type: "int128",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "intakeRawAndGetBalance",
    outputs: [
      {
        internalType: "int128",
        name: "amount_",
        type: "int128",
      },
      {
        internalType: "int128",
        name: "balance_",
        type: "int128",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_dst",
        type: "address",
      },
      {
        internalType: "int128",
        name: "_amount",
        type: "int128",
      },
    ],
    name: "outputNumeraire",
    outputs: [
      {
        internalType: "uint256",
        name: "amount_",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_dst",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "outputRaw",
    outputs: [
      {
        internalType: "int128",
        name: "amount_",
        type: "int128",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_dst",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "outputRawAndGetBalance",
    outputs: [
      {
        internalType: "int128",
        name: "amount_",
        type: "int128",
      },
      {
        internalType: "int128",
        name: "balance_",
        type: "int128",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "viewNumeraireAmount",
    outputs: [
      {
        internalType: "int128",
        name: "amount_",
        type: "int128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_addr",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "viewNumeraireAmountAndBalance",
    outputs: [
      {
        internalType: "int128",
        name: "amount_",
        type: "int128",
      },
      {
        internalType: "int128",
        name: "balance_",
        type: "int128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_addr",
        type: "address",
      },
    ],
    name: "viewNumeraireBalance",
    outputs: [
      {
        internalType: "int128",
        name: "balance_",
        type: "int128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_baseWeight",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quoteWeight",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_addr",
        type: "address",
      },
    ],
    name: "viewNumeraireBalanceLPRatio",
    outputs: [
      {
        internalType: "int128",
        name: "balance_",
        type: "int128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int128",
        name: "_amount",
        type: "int128",
      },
    ],
    name: "viewRawAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "amount_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50611a01806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80636fc39052116100715780636fc39052146102855780637f328ecc146102ea578063ac969a7314610339578063f09a3fc314610394578063f5e6c0ca146103f9578063fa00102a1461043e576100a9565b80630271c3c8146100ae57806305cf7bb4146100f35780631e9b2cba14610162578063523bf257146101d15780636b677a8f14610240575b600080fd5b6100dd600480360360208110156100c457600080fd5b810190808035600f0b9060200190929190505050610483565b6040518082815260200191505060405180910390f35b6101496004803603606081101561010957600080fd5b810190808035906020019092919080359060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061061b565b6040518082600f0b815260200191505060405180910390f35b6101ae6004803603604081101561017857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610869565b6040518083600f0b815260200182600f0b81526020019250505060405180910390f35b61021d600480360360408110156101e757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610984565b6040518083600f0b815260200182600f0b81526020019250505060405180910390f35b61026f6004803603602081101561025657600080fd5b810190808035600f0b9060200190929190505050610bdd565b6040518082815260200191505060405180910390f35b6102d46004803603604081101561029b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035600f0b9060200190929190505050610c1f565b6040518082815260200191505060405180910390f35b6103166004803603602081101561030057600080fd5b8101908080359060200190929190505050610d9a565b6040518083600f0b815260200182600f0b81526020019250505060405180910390f35b61037b6004803603602081101561034f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611009565b6040518082600f0b815260200191505060405180910390f35b6103e0600480360360408110156103aa57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061111f565b6040518082600f0b815260200191505060405180910390f35b6104256004803603602081101561040f57600080fd5b810190808035906020019092919050505061129d565b6040518082600f0b815260200191505060405180910390f35b61046a6004803603602081101561045457600080fd5b81019080803590602001909291905050506112dc565b6040518082600f0b815260200191505060405180910390f35b60008061048e611471565b9050806305f5e1006104b4670de0b6b3a764000086600f0b61150d90919063ffffffff16565b02816104bc57fe5b049150600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166323b872dd3330866040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b15801561056457600080fd5b505af1158015610578573d6000803e3d6000fd5b505050506040513d602081101561058e57600080fd5b8101908080519060200190929190505050905080610614576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f43757276652f434144432d7472616e736665722d66726f6d2d6661696c65640081525060200191505060405180910390fd5b5050919050565b60008073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166370a08231846040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561069957600080fd5b505afa1580156106ad573d6000803e3d6000fd5b505050506040513d60208110156106c357600080fd5b81019080805190602001909291905050509050600081116106f0576106e860006115c8565b915050610862565b60006107d4856107c6670de0b6b3a764000073a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4873ffffffffffffffffffffffffffffffffffffffff166370a08231896040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561077d57600080fd5b505afa158015610791573d6000803e3d6000fd5b505050506040513d60208110156107a757600080fd5b81019080805190602001909291905050506115eb90919063ffffffff16565b61167190919063ffffffff16565b90506000610831610808886107fa670de0b6b3a7640000876115eb90919063ffffffff16565b61167190919063ffffffff16565b610823670de0b6b3a7640000856115eb90919063ffffffff16565b61167190919063ffffffff16565b905061085c670de0b6b3a7640000620f42408386028161084d57fe5b046116bb90919063ffffffff16565b93505050505b9392505050565b6000806000610876611471565b90506108a2670de0b6b3a76400006305f5e1008387028161089357fe5b046116bb90919063ffffffff16565b9250600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166370a08231876040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561092157600080fd5b505afa158015610935573d6000803e3d6000fd5b505050506040513d602081101561094b57600080fd5b81019080805190602001909291905050509050610979670de0b6b3a7640000826116bb90919063ffffffff16565b925050509250929050565b6000806000610991611471565b905060006305f5e100828602816109a457fe5b049050600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff1663a9059cbb88846040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b158015610a2e57600080fd5b505af1158015610a42573d6000803e3d6000fd5b505050506040513d6020811015610a5857600080fd5b8101908080519060200190929190505050905080610ade576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f43757276652f434144432d7472616e736665722d6661696c656400000000000081525060200191505060405180910390fd5b600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b158015610b5b57600080fd5b505afa158015610b6f573d6000803e3d6000fd5b505050506040513d6020811015610b8557600080fd5b81019080805190602001909291905050509050610bb3670de0b6b3a7640000846116bb90919063ffffffff16565b9550610bd0670de0b6b3a7640000826116bb90919063ffffffff16565b9450505050509250929050565b600080610be8611471565b9050806305f5e100610c0e670de0b6b3a764000086600f0b61150d90919063ffffffff16565b0281610c1657fe5b04915050919050565b600080610c2a611471565b9050806305f5e100610c50670de0b6b3a764000086600f0b61150d90919063ffffffff16565b0281610c5857fe5b049150600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff1663a9059cbb86856040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b158015610ce257600080fd5b505af1158015610cf6573d6000803e3d6000fd5b505050506040513d6020811015610d0c57600080fd5b8101908080519060200190929190505050905080610d92576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f43757276652f434144432d7472616e736665722d6661696c656400000000000081525060200191505060405180910390fd5b505092915050565b600080600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166323b872dd3330876040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b158015610e4257600080fd5b505af1158015610e56573d6000803e3d6000fd5b505050506040513d6020811015610e6c57600080fd5b8101908080519060200190929190505050905080610ef2576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f43757276652f434144432d7472616e736665722d66726f6d2d6661696c65640081525060200191505060405180910390fd5b600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b158015610f6f57600080fd5b505afa158015610f83573d6000803e3d6000fd5b505050506040513d6020811015610f9957600080fd5b810190808051906020019092919050505090506000610fb6611471565b9050610fd3670de0b6b3a7640000836116bb90919063ffffffff16565b9350610fff670de0b6b3a76400006305f5e10083890281610ff057fe5b046116bb90919063ffffffff16565b9450505050915091565b600080611014611471565b9050600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166370a08231856040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561109357600080fd5b505afa1580156110a7573d6000803e3d6000fd5b505050506040513d60208110156110bd57600080fd5b81019080805190602001909291905050509050600081116110eb576110e260006115c8565b9250505061111a565b611115670de0b6b3a76400006305f5e1008484028161110657fe5b046116bb90919063ffffffff16565b925050505b919050565b60008061112a611471565b905060006305f5e1008285028161113d57fe5b049050600073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff1663a9059cbb87846040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b1580156111c757600080fd5b505af11580156111db573d6000803e3d6000fd5b505050506040513d60208110156111f157600080fd5b8101908080519060200190929190505050905080611277576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f43757276652f434144432d7472616e736665722d6661696c656400000000000081525060200191505060405180910390fd5b611292670de0b6b3a7640000836116bb90919063ffffffff16565b935050505092915050565b6000806112a8611471565b90506112d4670de0b6b3a76400006305f5e100838602816112c557fe5b046116bb90919063ffffffff16565b915050919050565b60008073cadc0acd4b445166f12d2c07eac6e2544fbe2eef73ffffffffffffffffffffffffffffffffffffffff166323b872dd3330866040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b15801561138257600080fd5b505af1158015611396573d6000803e3d6000fd5b505050506040513d60208110156113ac57600080fd5b8101908080519060200190929190505050905080611432576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f43757276652f636164632d7472616e736665722d66726f6d2d6661696c65640081525060200191505060405180910390fd5b600061143c611471565b9050611468670de0b6b3a76400006305f5e1008387028161145957fe5b046116bb90919063ffffffff16565b92505050919050565b600073a34317db73e77d453b1b8d04550c44d10e981c8e73ffffffffffffffffffffffffffffffffffffffff166350d25bcd6040518163ffffffff1660e01b815260040160206040518083038186803b1580156114cd57600080fd5b505afa1580156114e1573d6000803e3d6000fd5b505050506040513d60208110156114f757600080fd5b8101908080519060200190929190505050905090565b60008082141561152057600090506115c2565b600083600f0b121561153157600080fd5b600060406fffffffffffffffffffffffffffffffff841685600f0b02901c90506000608084901c85600f0b02905077ffffffffffffffffffffffffffffffffffffffffffffffff81111561158457600080fd5b604081901b9050817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038111156115ba57600080fd5b818101925050505b92915050565b6000677fffffffffffffff8211156115df57600080fd5b604082901b9050919050565b6000808314156115fe576000905061166b565b600082840290508284828161160f57fe5b0414611666576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806119ab6021913960400191505060405180910390fd5b809150505b92915050565b60006116b383836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250611723565b905092915050565b6000808214156116ca57600080fd5b60006116d684846117e9565b90506f7fffffffffffffffffffffffffffffff6fffffffffffffffffffffffffffffffff16816fffffffffffffffffffffffffffffffff16111561171957600080fd5b8091505092915050565b600080831182906117cf576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015611794578082015181840152602081019050611779565b50505050905090810190601f1680156117c15780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385816117db57fe5b049050809150509392505050565b6000808214156117f857600080fd5b600077ffffffffffffffffffffffffffffffffffffffffffffffff841161182e5782604085901b8161182657fe5b049050611983565b600060c09050600060c086901c9050640100000000811061185757602081901c90506020820191505b62010000811061186f57601081901c90506010820191505b610100811061188657600881901c90506008820191505b6010811061189c57600481901c90506004820191505b600481106118b257600281901c90506002820191505b600281106118c1576001820191505b600160bf830360018703901c018260ff0387901b816118dc57fe5b0492506fffffffffffffffffffffffffffffffff8311156118fc57600080fd5b6000608086901c8402905060006fffffffffffffffffffffffffffffffff871685029050600060c089901c9050600060408a901b905082811015611941576001820391505b8281039050608084901b92508281101561195c576001820391505b8281039050608084901c821461196e57fe5b88818161197757fe5b04870196505050505050505b6fffffffffffffffffffffffffffffffff8111156119a057600080fd5b809150509291505056fe536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a26469706673582212209c562d631fe7ea5864ab74a7cbd1f3cf4f5396f9e222dea71b87804f8e097cd564736f6c63430007030033";
