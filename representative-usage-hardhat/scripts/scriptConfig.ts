import { DeployAccounts } from "./types/deploy.types";
import { AccessControlledDeployer } from "../typechain-types/contracts/im-contracts/deployer";
import { OwnableCreate3Deployer } from "../typechain-types/contracts/im-contracts/deployer/create3";

class ScriptConfig {
    public static deployAccounts: DeployAccounts;
    public static accessControlledDeployer: AccessControlledDeployer;
    public static create3Deployer: OwnableCreate3Deployer;
}

export default ScriptConfig;