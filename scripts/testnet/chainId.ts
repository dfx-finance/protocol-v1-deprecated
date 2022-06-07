export const DUMMY_CHAIN_ID = -1;

export const PROD_CHAIN_IDS = [1, 137] as const;
export const LOCALHOST_CHAIN_IDS = [1337, 1338] as const;

export const VALID_CHAIN_IDS = [...PROD_CHAIN_IDS, ...LOCALHOST_CHAIN_IDS];

export const CHAIN_IDS = [DUMMY_CHAIN_ID, ...VALID_CHAIN_IDS] as const;
export type ChainId = typeof CHAIN_IDS[number];
export type Diff<T, U> = T extends U ? never : T; // Remove types from T that are assignable to U
export type ValidChainId = Diff<ChainId, -1>;