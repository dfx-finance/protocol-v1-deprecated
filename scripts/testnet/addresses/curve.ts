import { PoolInfo } from ".";

export const ethereum: PoolInfo[] = [
  {
    id: "cadcUsdc",
    source: "curve",
    pool: "0xE07BDe9Eb53DEFfa979daE36882014B758111a78",
    lpt: "0x1054Ff2ffA34c055a13DCD9E0b4c0cA5b3aecEB9",
  },
]

export const CurvePools = {
  1: ethereum,
  1337: ethereum,
  137: [],
  1338: []
};
