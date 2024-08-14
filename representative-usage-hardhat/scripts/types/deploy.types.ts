import { Wallet } from "ethers";

export interface DeployAccounts {
    root: Wallet;
    deployer: Wallet;
    admin: Wallet;
    relayer: Wallet;
    passportSigner: Wallet;
    huntersOnChainMinter: Wallet;
    huntersOnChainOffchainSigner: Wallet;
}