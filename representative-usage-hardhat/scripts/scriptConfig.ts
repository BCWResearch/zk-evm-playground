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
    public static passportWalletV1: PassportWalletV1;
    public static royaltyAllowlist: OperatorAllowlistUpgradeable;
    public static gemGame: GemGame;
    public static huntersOnChain: HuntersOnChain;
    public static guildOfGuardians: GuildOfGuardiansClaimGame;

}

export default ScriptConfig;