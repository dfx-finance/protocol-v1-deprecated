/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { EursToUsdAssimilator } from "../EursToUsdAssimilator";

export class EursToUsdAssimilator__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<EursToUsdAssimilator> {
    return super.deploy(overrides || {}) as Promise<EursToUsdAssimilator>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): EursToUsdAssimilator {
    return super.attach(address) as EursToUsdAssimilator;
  }
  connect(signer: Signer): EursToUsdAssimilator__factory {
    return super.connect(signer) as EursToUsdAssimilator__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): EursToUsdAssimilator {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as EursToUsdAssimilator;
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
  "0x608060405234801561001057600080fd5b5061198b806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80636fc39052116100715780636fc39052146102855780637f328ecc146102ea578063ac969a7314610339578063f09a3fc314610394578063f5e6c0ca146103f9578063fa00102a1461043e576100a9565b80630271c3c8146100ae57806305cf7bb4146100f35780631e9b2cba14610162578063523bf257146101d15780636b677a8f14610240575b600080fd5b6100dd600480360360208110156100c457600080fd5b810190808035600f0b9060200190929190505050610483565b6040518082815260200191505060405180910390f35b6101496004803603606081101561010957600080fd5b810190808035906020019092919080359060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610614565b6040518082600f0b815260200191505060405180910390f35b6101ae6004803603604081101561017857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610864565b6040518083600f0b815260200182600f0b81526020019250505060405180910390f35b61021d600480360360408110156101e757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610971565b6040518083600f0b815260200182600f0b81526020019250505060405180910390f35b61026f6004803603602081101561025657600080fd5b810190808035600f0b9060200190929190505050610bbc565b6040518082815260200191505060405180910390f35b6102d46004803603604081101561029b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035600f0b9060200190929190505050610bf7565b6040518082815260200191505060405180910390f35b6103166004803603602081101561030057600080fd5b8101908080359060200190929190505050610d6b565b6040518083600f0b815260200182600f0b81526020019250505060405180910390f35b61037b6004803603602081101561034f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610fcc565b6040518082600f0b815260200191505060405180910390f35b6103e0600480360360408110156103aa57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506110be565b6040518082600f0b815260200191505060405180910390f35b6104256004803603602081101561040f57600080fd5b8101908080359060200190929190505050611235565b6040518082600f0b815260200191505060405180910390f35b61046a6004803603602081101561045457600080fd5b810190808035906020019092919050505061126d565b6040518082600f0b815260200191505060405180910390f35b60008061048e6113fb565b9050806305f5e1006104ad606486600f0b61149790919063ffffffff16565b02816104b557fe5b049150600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166323b872dd3330866040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b15801561055d57600080fd5b505af1158015610571573d6000803e3d6000fd5b505050506040513d602081101561058757600080fd5b810190808051906020019092919050505090508061060d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f43757276652f455552532d7472616e736665722d66726f6d2d6661696c65640081525060200191505060405180910390fd5b5050919050565b60008073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166370a08231846040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561069257600080fd5b505afa1580156106a6573d6000803e3d6000fd5b505050506040513d60208110156106bc57600080fd5b81019080805190602001909291905050509050600081116106e9576106e16000611552565b91505061085d565b60006107cd856107bf670de0b6b3a764000073a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4873ffffffffffffffffffffffffffffffffffffffff166370a08231896040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561077657600080fd5b505afa15801561078a573d6000803e3d6000fd5b505050506040513d60208110156107a057600080fd5b810190808051906020019092919050505061157590919063ffffffff16565b6115fb90919063ffffffff16565b9050600061082c610801886107f3670de0b6b3a76400008761157590919063ffffffff16565b6115fb90919063ffffffff16565b61081e69d3c21bcecceda10000008561157590919063ffffffff16565b6115fb90919063ffffffff16565b9050610857670de0b6b3a7640000620f42408386028161084857fe5b0461164590919063ffffffff16565b93505050505b9392505050565b60008060006108716113fb565b905061089660646305f5e1008387028161088757fe5b0461164590919063ffffffff16565b9250600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166370a08231876040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561091557600080fd5b505afa158015610929573d6000803e3d6000fd5b505050506040513d602081101561093f57600080fd5b8101908080519060200190929190505050905061096660648261164590919063ffffffff16565b925050509250929050565b600080600061097e6113fb565b905060006305f5e1008286028161099157fe5b049050600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff1663a9059cbb88846040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b158015610a1b57600080fd5b505af1158015610a2f573d6000803e3d6000fd5b505050506040513d6020811015610a4557600080fd5b8101908080519060200190929190505050905080610acb576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f43757276652f455552532d7472616e736665722d6661696c656400000000000081525060200191505060405180910390fd5b600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b158015610b4857600080fd5b505afa158015610b5c573d6000803e3d6000fd5b505050506040513d6020811015610b7257600080fd5b81019080805190602001909291905050509050610b9960648461164590919063ffffffff16565b9550610baf60648261164590919063ffffffff16565b9450505050509250929050565b600080610bc76113fb565b9050806305f5e100610be6606486600f0b61149790919063ffffffff16565b0281610bee57fe5b04915050919050565b600080610c026113fb565b9050806305f5e100610c21606486600f0b61149790919063ffffffff16565b0281610c2957fe5b049150600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff1663a9059cbb86856040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b158015610cb357600080fd5b505af1158015610cc7573d6000803e3d6000fd5b505050506040513d6020811015610cdd57600080fd5b8101908080519060200190929190505050905080610d63576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f43757276652f455552532d7472616e736665722d6661696c656400000000000081525060200191505060405180910390fd5b505092915050565b600080600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166323b872dd3330876040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b158015610e1357600080fd5b505af1158015610e27573d6000803e3d6000fd5b505050506040513d6020811015610e3d57600080fd5b8101908080519060200190929190505050905080610ec3576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f43757276652f455552532d7472616e736665722d66726f6d2d6661696c65640081525060200191505060405180910390fd5b600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b158015610f4057600080fd5b505afa158015610f54573d6000803e3d6000fd5b505050506040513d6020811015610f6a57600080fd5b810190808051906020019092919050505090506000610f876113fb565b9050610f9d60648361164590919063ffffffff16565b9350610fc260646305f5e10083890281610fb357fe5b0461164590919063ffffffff16565b9450505050915091565b60008073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166370a08231846040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561104a57600080fd5b505afa15801561105e573d6000803e3d6000fd5b505050506040513d602081101561107457600080fd5b81019080805190602001909291905050509050600081116110a1576110996000611552565b9150506110b9565b6110b560648261164590919063ffffffff16565b9150505b919050565b6000806110c96113fb565b905060006305f5e100828502816110dc57fe5b049050600073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff1663a9059cbb87846040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b15801561116657600080fd5b505af115801561117a573d6000803e3d6000fd5b505050506040513d602081101561119057600080fd5b8101908080519060200190929190505050905080611216576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f43757276652f455552532d7472616e736665722d6661696c656400000000000081525060200191505060405180910390fd5b61122a60648361164590919063ffffffff16565b935050505092915050565b6000806112406113fb565b905061126560646305f5e1008386028161125657fe5b0461164590919063ffffffff16565b915050919050565b60008073db25f211ab05b1c97d595516f45794528a807ad873ffffffffffffffffffffffffffffffffffffffff166323b872dd3330866040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b15801561131357600080fd5b505af1158015611327573d6000803e3d6000fd5b505050506040513d602081101561133d57600080fd5b81019080805190602001909291905050509050806113c3576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f43757276652f657572732d7472616e736665722d66726f6d2d6661696c65640081525060200191505060405180910390fd5b60006113cd6113fb565b90506113f260646305f5e100838702816113e357fe5b0461164590919063ffffffff16565b92505050919050565b600073b49f677943bc038e9857d61e7d053caa2c1734c173ffffffffffffffffffffffffffffffffffffffff166350d25bcd6040518163ffffffff1660e01b815260040160206040518083038186803b15801561145757600080fd5b505afa15801561146b573d6000803e3d6000fd5b505050506040513d602081101561148157600080fd5b8101908080519060200190929190505050905090565b6000808214156114aa576000905061154c565b600083600f0b12156114bb57600080fd5b600060406fffffffffffffffffffffffffffffffff841685600f0b02901c90506000608084901c85600f0b02905077ffffffffffffffffffffffffffffffffffffffffffffffff81111561150e57600080fd5b604081901b9050817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0381111561154457600080fd5b818101925050505b92915050565b6000677fffffffffffffff82111561156957600080fd5b604082901b9050919050565b60008083141561158857600090506115f5565b600082840290508284828161159957fe5b04146115f0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806119356021913960400191505060405180910390fd5b809150505b92915050565b600061163d83836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f0000000000008152506116ad565b905092915050565b60008082141561165457600080fd5b60006116608484611773565b90506f7fffffffffffffffffffffffffffffff6fffffffffffffffffffffffffffffffff16816fffffffffffffffffffffffffffffffff1611156116a357600080fd5b8091505092915050565b60008083118290611759576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561171e578082015181840152602081019050611703565b50505050905090810190601f16801561174b5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50600083858161176557fe5b049050809150509392505050565b60008082141561178257600080fd5b600077ffffffffffffffffffffffffffffffffffffffffffffffff84116117b85782604085901b816117b057fe5b04905061190d565b600060c09050600060c086901c905064010000000081106117e157602081901c90506020820191505b6201000081106117f957601081901c90506010820191505b610100811061181057600881901c90506008820191505b6010811061182657600481901c90506004820191505b6004811061183c57600281901c90506002820191505b6002811061184b576001820191505b600160bf830360018703901c018260ff0387901b8161186657fe5b0492506fffffffffffffffffffffffffffffffff83111561188657600080fd5b6000608086901c8402905060006fffffffffffffffffffffffffffffffff871685029050600060c089901c9050600060408a901b9050828110156118cb576001820391505b8281039050608084901b9250828110156118e6576001820391505b8281039050608084901c82146118f857fe5b88818161190157fe5b04870196505050505050505b6fffffffffffffffffffffffffffffffff81111561192a57600080fd5b809150509291505056fe536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a26469706673582212202676cbfbe7be38856d81b051ffdc4f649e2ed2755e8e1753fcf0e96de5f7efa364736f6c63430007030033";
