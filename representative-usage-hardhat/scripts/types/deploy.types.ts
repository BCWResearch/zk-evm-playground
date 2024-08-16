import { Wallet } from "ethers";
import { MultiCallDeploy, Factory, LatestWalletImplLocator, StartupWalletImpl, MainModuleDynamicAuth, ImmutableSigner } from "../../typechain-types/";

export interface DeployAccounts {
    root: Wallet;
    deployer: Wallet;
    admin: Wallet;
    relayer: Wallet;
    passportSigner: Wallet;
    huntersOnChainMinter: Wallet;
    huntersOnChainOffchainSigner: Wallet;
}


export interface PassportWallet {
    multiCallDeploy: MultiCallDeploy,
    walletFactory: Factory,
    latestWalletImplLocator: LatestWalletImplLocator,
    startupWalletImpl: StartupWalletImpl,
    mainModuleDynamicAuth: MainModuleDynamicAuth,
    immutableSigner: ImmutableSigner,
}