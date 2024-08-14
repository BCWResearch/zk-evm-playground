import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet, ethers } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts } from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";

export const installRoyaltyAllowlist = async (deployer: Wallet, admin: Wallet): Promise<any> => {
    const functionSignature = "initialize(address,address,address)";
    const initData = (await hre.ethers.getContractFactory('OperatorAllowlistUpgradeable')).interface.encodeFunctionData(functionSignature, [admin.address, admin.address, admin.address]);

    //OperatorAllowlistUpgradeable
    const OperatorAllowlistUpgradeable = await hre.ethers.getContractFactory('OperatorAllowlistUpgradeable');
    const operatorAllowlistContract = await OperatorAllowlistUpgradeable.connect(deployer).deploy();
    await operatorAllowlistContract.waitForDeployment();

    // ERC1967Proxy
    const ERC1967Proxy = await hre.ethers.getContractFactory('ERC1967ProxyRun');
    const erc1967Proxy = await ERC1967Proxy.connect(deployer).deploy(
        operatorAllowlistContract.target,
        initData
    );
    await erc1967Proxy.waitForDeployment();

    const user = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);

    
}

export const main = async () => {

}


if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}