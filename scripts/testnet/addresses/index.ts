import { DfxPools } from "./dfx";
import { SushiPools } from "./sushi";
import { CurvePools } from "./curve";
import { BalancerPools } from "./balancer";

export const Stablecoins = [
  "cadc",
  "usdc",
  "eurs",
  "xsgd",
  "xidr",
  "nzds",
  "tryb",
] as const;
export const Tokens = ["dfx", "weth", "tel", ...Stablecoins] as const;

export interface PoolInfo {
  id: string;
  source: "dfx" | "curve" | "balancer" | "sushi";
  pool: string;
  lpt: string;
  stakingRewards?: string;
  stakingDualRewards?: string;
  stakingRewardsMulti?: string;
  stakingDualRewardsLegacy?: string;
  stakingRewardsMultiLegacy?: string;
  oracle?: string;
}

const ethPools: PoolInfo[] = [
  ...DfxPools[1],
  ...SushiPools[1],
  ...CurvePools[1],
];

const ethereum = {
  dfx: {
    Router: "0x9d0950c595786AbA7c26dfDdf270D66a8b18B4FA",
    Zap: "0x64d65E3d70ba0f8812A9d1d7b8B5C51DAB78CD15",
  },
  tokens: {
    dfx: "0x888888435fde8e7d4c54cab67f206e4199454c60",
    cadc: "0xcadc0acd4b445166f12d2c07eac6e2544fbe2eef",
    usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    eurs: "0xdb25f211ab05b1c97d595516f45794528a807ad8",
    xsgd: "0x70e8de73ce538da2beed35d14187f6959a8eca96",
    xidr: "0xebf2096e01455108badcbaf86ce30b6e5a72aa52",
    weth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    tel: "0x467bccd9d29f223bce8043b84e8c8b282827790f",
    nzds: "0xda446fad08277b4d2591536f204e018f32b6831c",
    tryb: "0x2c537e5624e4af88a7ae4060c022609376c8d0eb",
  },
  pools: ethPools,
};

const polygonPools: PoolInfo[] = [
  ...DfxPools[137],
  ...SushiPools[137],
  ...BalancerPools[137],
];

const polygon = {
  dfx: {
    Router: "0x39F45038D763dd88791cE9BdE8d6c18081c7d522",
    Zap: "0x921a33B6f2cf9bC79FDd1F052c36b12eFEeC2AA7",
  },
  tokens: {
    dfx: "0xe7804d91dfcde7f776c90043e03eaa6df87e6395",
    cadc: "0x5d146d8b1dacb1ebba5cb005ae1059da8a1fbf57",
    usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    eurs: "0xe111178a87a3bff0c8d18decba5798827539ae99",
    xsgd: "0x769434dca303597c8fc4997bf3dab233e961eda2",
    weth: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    tel: "0xdf7837de1f2fa4631d716cf2502f8b230f1dcc32",
    nzds: "0xeafe31cd9e8e01c8f0073a2c974f728fb80e9dce",
    tryb: "0x4fb71290ac171e1d144f7221d882becac7196eb5",
    xidr: null,
  },
  pools: polygonPools,
};


export const Addresses = {
  1: ethereum,
  137: polygon,
  1337: ethereum,
  1338: polygon,
};
