import hre, { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts } from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";
// import { GemGame } from "../../typechain-types/contracts/games/gems";

export const installHuntersOnChain = async (deployer: Wallet, admin: Wallet): Promise<any> => {
    const whiteListedMinters = [ScriptConfig.deployAccounts.huntersOnChainMinter.address];
    //Relayer
    const Relayer = await hre.ethers.getContractFactory('Relayer');
    const huntersOnChainRelayer = await Relayer.connect(deployer).deploy(whiteListedMinters);
    await huntersOnChainRelayer.waitForDeployment();

    const name = "BitGem";
    const symbol = "BGEM";
    const maxSupply = new BigNumber("1000000000000000000").mul(new BigNumber(10).pow(18));

    // ImmutableERC20MinterBurnerPermit
    const bgemErc20 = await hre.ethers.getContractFactory('ImmutableERC20MinterBurnerPermit');
    const bgemErc20Contract = await bgemErc20.connect(deployer).deploy(
        admin.address,
        huntersOnChainRelayer.target,
        admin.address,
        name,
        symbol,
        maxSupply.toString()
    );
    await bgemErc20Contract.waitForDeployment();

    const grantTx = await bgemErc20Contract.connect(admin).grantMinterRole(huntersOnChainRelayer.target);
    await grantTx.wait();

    const baseURIe = "https://api-imx.boomland.io/api/e/";
    const contractURIe = "https://api-imx.boomland.io";

    //Equipments
    const Equipments = await hre.ethers.getContractFactory('Equipments');
    // const huntersOnChainEquipments = await Equipments.connect(deployer).deploy(
    //     admin.address,
    //     admin.address,
    //     admin.address,
    //     admin.address,
    //     1000,
    //     baseURIe,
    //     contractURIe,
        
    // );
}


export const main = async () => {

}


if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}