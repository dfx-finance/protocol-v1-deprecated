# DFX Protocol V0.5

A decentralized foreign exchange protocol optimized for stablecoins.

[![Discord](https://img.shields.io/discord/786747729376051211.svg?color=768AD4&label=discord&logo=https%3A%2F%2Fdiscordapp.com%2Fassets%2F8c9701b98ad4372b58f13fd9f65f966e.svg)](http://discord.dfx.finance/)
[![Twitter Follow](https://img.shields.io/twitter/follow/DFXFinance.svg?label=DFXFinance&style=social)](https://twitter.com/DFXFinance)

## Overview

DFX v0.5 is a fork of [shellprotocol@48dac1c](https://github.com/cowri/shell-solidity-v1/tree/48dac1c1a18e2da292b0468577b9e6cbdb3786a4), an AMM for baskets of like-valued pairs. An audit of that protocol was previously done by [Consensys Diligence](https://consensys.net/diligence/audits/2020/06/shell-protocol/shell-protocol-audit-2020-06.pdf).

There are two major parts to the protocol: **Assimilators** and **Curves** (formerly Shells). Assimilators allow the AMM to handle pairs of different value while also retrieving reported oracle prices for respective currencies. Curves allow the custom parameterization of the bonding curve with dynamic fees, halting bounderies, etc.

### Assimilators

Assimilators are a key part of the protocol, it converts all amounts to a "numeraire" which is essentially a base value used for computations across the entire protocol. This is necessary as we are dealing with pairs of different values.

Oracle price feeds are also piped in through the assimilator as they inform what numeraire amounts should be set. Since oracle price feeds report their values in USD, all assimilators attempt to convert token values to a numeraire amount based on USD.

### Curve Parameter Terminology

High level overview.

| Name      | Description                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Weights   | Weighting of the pair (only 50/50)                                                                        |
| Alpha     | The maximum and minimum allocation for each reserve                                                       |
| Beta      | Liquidity depth of the exchange; The higher the value, the flatter the curve at the reported oracle price |
| Delta/Max | Slippage when exchange is not at the reported oracle price                                                |
| Epsilon   | Fixed fee                                                                                                 |
| Lambda    | Dynamic fee captured when slippage occurs                                                                 |

For a more in-depth discussion, refer to [section 3 of the shellprotocol whitepaper](https://github.com/cowri/shell-solidity-v1/blob/master/Shell_White_Paper_v1.0.pdf)

### Major changes from the Shell Protocol

The main changes between our implementation and the original code can be found in the following files:

- All the assimilators
- `Curve.sol` (formerly `Shell.sol`)
- `CurveFactory.sol` (formerly `ShellFactory.sol`)
- `Router.sol`
- `ProportionalLiquidity.sol`
- `Swaps.sol`

#### Changing the term "Shell" to "Curve"

Throughout the repository, the term `Shell` has been changed to `Curve`. For example, `Shell.sol` has been **renamed** to `Curve.sol`, and `ShellFactory.sol` to `CurveFactory.sol`, etc.

#### Different Valued Pairs

In the original implementation, all pools are assumed to be baskets of like-valued tokens. In our implementation, all pools are assumed to be pairs of different-valued FX stablecoins (of which one side is always USDC).

This is achieved by having custom assimilators that normalize the foreign currencies to their USD counterparts. We're sourcing our FX price feed from chainlink oracles. See above for more information about assimilators.

Withdrawing and depositing related operations will respect the existing LP ratio. As long as the pool ratio hasn't changed since the deposit, amount in ~= amount out (minus fees), even if the reported price on the oracle changes. The oracle is only here to assist with efficient swaps.

## Third Party Libraries

- [Openzeppelin contracts (v3.3.0)](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v3.3.0)
- [ABDKMath (v2.4)](https://github.com/abdk-consulting/abdk-libraries-solidity/releases/tag/v2.4)
- [Shell Protocol@48dac1c](https://github.com/cowri/shell-solidity-v1/tree/48dac1c1a18e2da292b0468577b9e6cbdb3786a4)

## Testing

We recommend that you run this against a local node. The difference in latency will make a huge difference.

```
yarn
RPC_URL=<MAINNET NODE> yarn test
```

## Deploy Locally

1. Create a `.env` file at project root with the following contents:

   ```
   RPC_URL=<insert Alchemy API URL here>
   ```

2. Start the local testnet:

   ```
   yarn hh:node
   ```

3. In another terminal, run the scaffolding script:

   ```
   yarn hh:run scripts/testnet/scaffold.ts --network localhost
   ```

4. Observe console output and proceed to frontend testing setup (if required).

# Router API

## Views

### viewOriginSwap

```javascript
function viewOriginSwap(
    address _quoteCurrency,
    address _origin,
    address _target,
    uint256 _originAmount
) external view returns (uint256 targetAmount_)
```

Views how much a target amount is returned given a fixed origin amount.

| Name            | Type    |                                             |
| --------------- | ------- | ------------------------------------------- |
| \_quoteCurrency | address | Address of the intermediate currency (USDC) |
| \_origin        | address | Address of the origin token                 |
| \_target        | address | Address of the target                       |
| \_originAmount  | uint256 | Amount of origin tokens to swap             |
| targetAmount\_  | uint256 | Amount of target tokens to received         |

### viewTargetSwap

```javascript
function viewTargetSwap(
    address _quoteCurrency,
    address _origin,
    address _target,
    uint256 _targetAmount
) external view returns (uint256 originAmount_)
```

Views how much a origin amount is required given a wanted target amount.

| Name            | Type    |                                             |
| --------------- | ------- | ------------------------------------------- |
| \_quoteCurrency | address | Address of the intermediate currency (USDC) |
| \_origin        | address | Address of the origin token                 |
| \_target        | address | Address of the target                       |
| \_targetAmount  | uint256 | Amount of target tokens wanted              |
| originAmount\_  | uint256 | Amount of origin tokens required            |

## State Changing

### originSwap

```javascript
function originSwap(
    address _quoteCurrency,
    address _origin,
    address _target,
    uint256 _originAmount,
    uint256 _minTargetAmount,
    uint256 _deadline
)
```

Swaps a fixed origin amount for a dynamic target amount.

| Name              | Type    |                                                          |
| ----------------- | ------- | -------------------------------------------------------- |
| \_quoteCurrency   | address | Address of the intermediate currency (USDC)              |
| \_origin          | address | Address of the origin token                              |
| \_target          | address | Address of the target                                    |
| \_originAmount    | uint256 | Amount of origin tokens to swap                          |
| \_minTargetAmount | uint256 | Minimum amount of target tokens to receive               |
| \_deadline        | uint256 | Epoch time of which the transaction must be completed by |

# Curve API

## Views

### viewOriginSwap

```javascript
function viewOriginSwap(
    address _origin,
    address _target,
    uint256 _originAmount
) external view returns (uint256 targetAmount_)
```

Views how much a target amount is returned given a fixed origin amount.

| Name           | Type    |                                     |
| -------------- | ------- | ----------------------------------- |
| \_origin       | address | Address of the origin token         |
| \_target       | address | Address of the target               |
| \_originAmount | uint256 | Amount of origin tokens to swap     |
| targetAmount\_ | uint256 | Amount of target tokens to received |

### viewTargetSwap

```javascript
function viewTargetSwap(
    address _origin,
    address _target,
    uint256 _targetAmount
) external view returns (uint256 originAmount_)
```

Views how much a origin amount is needed given for a fixed target amount.

| Name           | Type    |                                             |
| -------------- | ------- | ------------------------------------------- |
| \_origin       | address | Address of the origin token                 |
| \_target       | address | Address of the target                       |
| \_targetAmount | uint256 | Amount of target tokens to receive          |
| originAmount\_ | uint256 | Amount of origin tokens to needed to supply |

### viewDeposit

```javascript
function viewDeposit(
    uint256 _deposit
) external view returns (uint256 curveTokens_, uint256[] memory amounts_)
```

Views how many curve lp tokens will be minted for a given deposit, as well as the amount of tokens required from each asset.

**Note that `_deposit` is denominated in 18 decimals.**

| Name          | Type      |                                                        |
| ------------- | --------- | ------------------------------------------------------ |
| \_deposit     | address   | Total amount of tokens to deposit (denominated in USD) |
| curveTokens\_ | uint256   | Amount of LP tokens received                           |
| amounts\_     | uint256[] | Amount of tokens for each address required             |

For example, if the CAD/USD rate was 0.8, a `deposit` of `100e18` will require 50 USDC and 50 USDC worth of CAD, which is 50/0.8 = 62.5 CADC.

### viewWithdraw

```javascript
function viewWithdraw(
    uint256 _curvesToBurn
) external view returns (uint256[] memory amounts_)
```

Views how many tokens you will receive for each address when you burn `_curvesToBurn` amount of curve LP tokens.

| Name           | Type      |                                            |
| -------------- | --------- | ------------------------------------------ |
| \_curvesToBurn | uint256   | Amount of LP tokens to burn                |
| amounts\_      | uint256[] | Amount of tokens for each address received |

## State Changing

Note you'll need to approve tokens to the curve address before any of the following can be performed.

### originSwap

```javascript
function originSwap(
    address _origin,
    address _target,
    uint256 _originAmount,
    uint256 _targetAmount,
    uint256 _deadline
)
```

Swaps a fixed origin amount for a dynamic target amount.

| Name              | Type    |                                                          |
| ----------------- | ------- | -------------------------------------------------------- |
| \_origin          | address | Address of the origin token                              |
| \_target          | address | Address of the target                                    |
| \_originAmount    | uint256 | Amount of origin tokens to swap                          |
| \_minTargetAmount | uint256 | Minimum amount of target tokens to receive               |
| \_deadline        | uint256 | Epoch time of which the transaction must be completed by |

### targetSwap

```javascript
function targetSwap(
    address _origin,
    address _target,
    uint256 _maxOriginAmount,
    uint256 _targetAmount,
    uint256 _deadline
)
```

Swaps a dynamic origin amount for a fixed target amount

| Name              | Type    |                                                          |
| ----------------- | ------- | -------------------------------------------------------- |
| \_origin          | address | Address of the origin token                              |
| \_target          | address | Address of the target                                    |
| \_maxOriginAmount | uint256 | Maximum amount of origin tokens to swap                  |
| \_targetAmount    | uint256 | Amount of target tokens that wants to be received        |
| \_deadline        | uint256 | Epoch time of which the transaction must be completed by |

### deposit

```javascript
function deposit(
    uint256 _deposit,
    uint256 _deadline
)
```

Deposit into the pool a proportional amount of assets. The ratio used to calculate the proportional amount is determined by the pool's ratio, not the oracles. This is to prevent LPs from getting rekt'ed.

On completion, a corresponding amount of curve LP tokens is given to the user.

**Note that `_deposit` is denominated in 18 decimals.**

| Name       | Type    |                                                          |
| ---------- | ------- | -------------------------------------------------------- |
| \_deposit  | address | Total amount of tokens to deposit (denominated in USD)   |
| \_deadline | address | Epoch time of which the transaction must be completed by |

For example, if the CAD/USD rate was 0.8, a `deposit` of `100e18` will require 50 USDC and 50 USDC worth of CAD, which is 50/0.8 = 62.5 CADC.

### withdraw

```javascript
function withdraw(
    uint256 _curvesToBurn,
    uint256 _deadline
)
```

Withdraw amount of tokens from the pool equally.

**Note that the amount is denominated in 18 decimals.**

| Name           | Type    |                                                          |
| -------------- | ------- | -------------------------------------------------------- |
| \_curvesToBurn | address | The amount of curve LP tokens to burn                    |
| \_deadline     | address | Epoch time of which the transaction must be completed by |
