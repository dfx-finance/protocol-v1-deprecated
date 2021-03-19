/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  Contract,
  ContractTransaction,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface AssimilatorsInterface extends ethers.utils.Interface {
  functions: {
    "iAsmltr()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "iAsmltr", values?: undefined): string;

  decodeFunctionResult(functionFragment: "iAsmltr", data: BytesLike): Result;

  events: {};
}

export class Assimilators extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: AssimilatorsInterface;

  functions: {
    iAsmltr(overrides?: CallOverrides): Promise<[string]>;

    "iAsmltr()"(overrides?: CallOverrides): Promise<[string]>;
  };

  iAsmltr(overrides?: CallOverrides): Promise<string>;

  "iAsmltr()"(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    iAsmltr(overrides?: CallOverrides): Promise<string>;

    "iAsmltr()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    iAsmltr(overrides?: CallOverrides): Promise<BigNumber>;

    "iAsmltr()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    iAsmltr(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "iAsmltr()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
