import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts, PassportWallet } from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";


export const installPassportWallet = async (deployer: Wallet, admin: Wallet, relayer: Wallet, passportSigner: Wallet): Promise<PassportWallet> => {
    const MultiCallDeploy = await hre.ethers.getContractFactory('MultiCallDeploy');
    const multiCallDeployContract = await MultiCallDeploy.connect(deployer).deploy(
        admin.address,
        relayer.address
    );
    await multiCallDeployContract.waitForDeployment();

    const walletFactory = await hre.ethers.getContractFactory('Factory');
    const walletFactoryContract = await walletFactory.connect(deployer).deploy(
        admin.address,
        multiCallDeployContract.target
    );
    await walletFactoryContract.waitForDeployment();

    // LatestWalletImplLocator
    const latestWalletImplLocator = await hre.ethers.getContractFactory('LatestWalletImplLocator');
    const latestWalletImplLocatorContract = await latestWalletImplLocator.connect(deployer).deploy(
        admin.address,
        admin.address,
    );
    await latestWalletImplLocatorContract.waitForDeployment();

    // StartupWalletImpl
    const startupWalletImpl = await hre.ethers.getContractFactory('StartupWalletImpl');
    const startupWalletImplContract = await startupWalletImpl.connect(deployer).deploy(
        latestWalletImplLocatorContract.target
    );
    await startupWalletImplContract.waitForDeployment();

    // MainModuleDynamicAuth
    const mainModuleDynamicAuth = await hre.ethers.getContractFactory('MainModuleDynamicAuth');
    const mainModuleDynamicAuthContract = await mainModuleDynamicAuth.connect(deployer).deploy(
        walletFactoryContract.target,
        startupWalletImplContract.target,
    );
    await mainModuleDynamicAuthContract.waitForDeployment();


    // ImmutableSigner
    const immutableSigner = await hre.ethers.getContractFactory('ImmutableSigner');
    const immutableSignerContract = await immutableSigner.connect(deployer).deploy(
        admin.address,
        admin.address,
        passportSigner.address,
    );
    await immutableSignerContract.waitForDeployment();

    const walletImplTx = await latestWalletImplLocatorContract.connect(admin).changeWalletImplementation(mainModuleDynamicAuthContract.target);
    await walletImplTx.wait();

    return {
        multiCallDeploy: multiCallDeployContract,
        walletFactory: walletFactoryContract,
        latestWalletImplLocator: latestWalletImplLocatorContract,
        startupWalletImpl: startupWalletImplContract,
        mainModuleDynamicAuth: mainModuleDynamicAuthContract,
        immutableSigner: immutableSignerContract,
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