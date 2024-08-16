import { DeployAccounts, PassportWallet } from "./types/deploy.types";
import { AccessControlledDeployer } from "../typechain-types/contracts/im-contracts/deployer";
import { OwnableCreate3Deployer } from "../typechain-types/contracts/im-contracts/deployer/create3";
import { OperatorAllowlistUpgradeable } from "../typechain-types";

class ScriptConfig {
    public static chainId: number;
    public static deployAccounts: DeployAccounts;
    public static accessControlledDeployer: AccessControlledDeployer;
    public static create3Deployer: OwnableCreate3Deployer;
    public static passportWallet: PassportWallet;
    public static royaltyAllowlist: OperatorAllowlistUpgradeable;
}

export default ScriptConfig;