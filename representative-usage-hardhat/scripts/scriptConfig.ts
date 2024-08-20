import { DeployAccounts, HuntersOnChain, PassportWallet, PassportWalletV1 } from "./types/deploy.types";
import { AccessControlledDeployer } from "../typechain-types/contracts/im-contracts/deployer";
import { OwnableCreate3Deployer } from "../typechain-types/contracts/im-contracts/deployer/create3";
import { GemGame, GuildOfGuardiansClaimGame, OperatorAllowlistUpgradeable } from "../typechain-types";

class ScriptConfig {
    public static chainId: number;
    public static deployAccounts: DeployAccounts;
    public static accessControlledDeployer: AccessControlledDeployer;
    public static create3Deployer: OwnableCreate3Deployer;
    public static passportWallet: PassportWallet;
    public static royaltyAllowlist: OperatorAllowlistUpgradeable;
    public static gemGame: GemGame;
    public static huntersOnChain: HuntersOnChain;
    public static guildOfGuardians: GuildOfGuardiansClaimGame;

}

export interface WritableWallet {
    address: string;
    privateKey: string;
}

export interface WritablePassportWallet {
    factory: string,
    mainModule: string,
    multiCall: string
}

export interface WritableHuntersOnChain {
    bgemErc20: string
    huntersOnChainRelayer: string
    huntersOnChainEquipments: string
    huntersOnChainArtifacts: string
    huntersOnChainShards: string
    huntersOnChainClaim: string
    huntersOnChainEIP712: string
    huntersOnChainClaimGame: string
    huntersOnChainRecipe: string
    huntersOnChainFund: string
}

export interface WriteableScriptConfig {
    chainId: number;
    deployAccounts: {
        root: WritableWallet;
        deployer: WritableWallet;
        admin: WritableWallet;
        relayer: WritableWallet;
        passportSigner: WritableWallet;
        huntersOnChainMinter: WritableWallet;
        huntersOnChainOffchainSigner: WritableWallet;
    };
    accessControlledDeployer: string;
    create3Deployer: string;
    passportWallet: WritablePassportWallet;
    royaltyAllowlist: string;
    gemGame: string;
    huntersOnChain: WritableHuntersOnChain;
    guildOfGuardians: string;
}

export default ScriptConfig;