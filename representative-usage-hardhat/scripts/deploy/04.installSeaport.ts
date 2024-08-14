import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet, ethers } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts } from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";
import { AccessControlledDeployer } from "../../typechain-types/contracts/im-contracts/deployer";

export const WALLET_DEPLOY_CODE = "0x6054600f3d396034805130553df3fe63906111273d3560e01c14602b57363d3d373d3d3d3d369030545af43d82803e156027573d90f35b3d90fd5b30543d5260203df3";

export const installSeaport = async (deployer: Wallet, admin: Wallet): Promise<any> => {
    //ConduitController
    const ConduitController = await hre.ethers.getContractFactory('ConduitController');
    const conduitControllerContract = await ConduitController.connect(deployer).deploy();
    await conduitControllerContract.waitForDeployment();

    const init = ethers.solidityPacked(
        ["bytes", "uint256", "uint256"],
        [
            WALLET_DEPLOY_CODE,
            conduitControllerContract.target,
            admin.address
        ]
    );

    // SeaportDeployer
    const SeaportDeployer = await hre.ethers.getContractFactory('SeaportDeployer');
    const seaportDeployerContract = await SeaportDeployer.connect(deployer).deploy(
        // address _admin,
        // address _create3Deployer,
        // address _seaportConduitController,
        // address _accessControlledDeployer
        admin.address,
        (await ScriptConfig.create3Deployer.getAddress()),
        conduitControllerContract.target,
        ScriptConfig.accessControlledDeployer.target,
    );
    await seaportDeployerContract.waitForDeployment();

    // const seaport = await seaportDeployerContract.connect(deployer).deployByCreate3();
    // seaport.wait();
    
    // const seaport = await hre.ethers.getContractFactory('ImmutableSeaport');
    // const seaportContract = await seaport.connect(deployer).deploy(
    // );

    return {
        conduitController: conduitControllerContract
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