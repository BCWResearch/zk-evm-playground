import hre from "hardhat";
import { Wallet } from "ethers";
import { AccessControlledDeployer } from "../../typechain-types/contracts/im-contracts/deployer";
import { OwnableCreate3Deployer } from "../../typechain-types/contracts/im-contracts/deployer/create3";


export const installAccessControlledDeployer = async (deployer: Wallet, admin: Wallet): Promise<AccessControlledDeployer> => {
    const AccessControlledDeployer = await hre.ethers.getContractFactory('AccessControlledDeployer')
    const AccessControlledDeployerContract = await AccessControlledDeployer.connect(deployer).deploy(
        admin.address,
        admin.address,
        admin.address,
        admin.address
    );
    await AccessControlledDeployerContract.waitForDeployment();
    return AccessControlledDeployerContract;
}


export const installOwnableCreate3Deployer = async (deployer: Wallet, accessControlledDeployer: string): Promise<OwnableCreate3Deployer> => {
    const OwnableCreate3Deployer = await hre.ethers.getContractFactory('OwnableCreate3Deployer');
    const OwnableCreate3DeployerContract = await OwnableCreate3Deployer.connect(deployer).deploy(
        accessControlledDeployer
    );
    await OwnableCreate3DeployerContract.waitForDeployment();
    return OwnableCreate3DeployerContract;
}

export const installCreate3Deployer = async (deployer: Wallet, admin: Wallet): Promise<{ accessControlledDeployer: AccessControlledDeployer, create3Deployer: OwnableCreate3Deployer }> => {
    const accessControlledDeployer = await installAccessControlledDeployer(deployer, admin);
    const accessControlledDeployerAddress = await accessControlledDeployer.getAddress();
    const Create3Deployer = await installOwnableCreate3Deployer(deployer, accessControlledDeployerAddress);

    const grantRoleTx = await accessControlledDeployer.connect(admin).grantDeployerRole([deployer.address]);
    await grantRoleTx.wait();

    return {
        accessControlledDeployer: accessControlledDeployer,
        create3Deployer: Create3Deployer
    }
}


export const main = async () => {

}

if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}