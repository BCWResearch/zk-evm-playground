import { Wallet } from "ethers";
import {
    MultiCallDeploy,
    Factory,
    LatestWalletImplLocator,
    StartupWalletImpl,
    MainModuleDynamicAuth,
    ImmutableSigner,
    MainModuleMock,
    Recipe,
    Relayer,
    ImmutableERC20MinterBurnerPermit,
    Equipments,
    Artifacts,
    Shards,
    BgemClaim,
    EIP712WithChanges,
    HuntersOnChainClaimGame,
    Fund
} from "../../typechain-types/";

export interface DeployAccounts {
    root: Wallet;
    deployer: Wallet;
    admin: Wallet;
    relayer: Wallet;
    passportSigner: Wallet;
    huntersOnChainMinter: Wallet;
    huntersOnChainOffchainSigner: Wallet;
}


export interface PassportWalletV1 {
    multiCallDeploy: MultiCallDeploy,
    walletFactory: Factory,
    latestWalletImplLocator: LatestWalletImplLocator,
    startupWalletImpl: StartupWalletImpl,
    mainModuleDynamicAuth: MainModuleDynamicAuth,
    immutableSigner: ImmutableSigner,
}

export interface PassportWallet {
    factory: Factory,
    mainModule: MainModuleMock,
    multiCall: MultiCallDeploy,
}

export interface HuntersOnChain {
    bgemErc20: ImmutableERC20MinterBurnerPermit;
    huntersOnChainRelayer: Relayer;
    huntersOnChainEquipments: Equipments;
    huntersOnChainArtifacts: Artifacts;
    huntersOnChainShards: Shards;
    huntersOnChainClaim: BgemClaim;
    huntersOnChainEIP712: EIP712WithChanges;
    huntersOnChainClaimGame: HuntersOnChainClaimGame;
    huntersOnChainRecipe: Recipe;
    huntersOnChainFund: Fund;
}
