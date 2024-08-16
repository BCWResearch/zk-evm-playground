import hre, { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts } from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";
import { Recipe } from "../../typechain-types";

export const installHuntersOnChain = async (deployer: Wallet, admin: Wallet): Promise<any> => {
    const whiteListedMinters = [ScriptConfig.deployAccounts.huntersOnChainMinter.address];

    //Relayer
    const Relayer = await hre.ethers.getContractFactory('Relayer');
    const huntersOnChainRelayer = await Relayer.connect(deployer).deploy(whiteListedMinters);
    await huntersOnChainRelayer.waitForDeployment();

    // ImmutableERC20MinterBurnerPermit
    const name = "BitGem";
    const symbol = "BGEM";
    const maxSupply = new BigNumber("1000000000000000000").mul(new BigNumber(10).pow(18));
    const bgemErc20 = await hre.ethers.getContractFactory('ImmutableERC20MinterBurnerPermit');
    const bgemErc20Contract = await bgemErc20.connect(deployer).deploy(
        admin.address,
        huntersOnChainRelayer.target,
        admin.address,
        name,
        symbol,
        "0x" + maxSupply.toString(16)
    );
    await bgemErc20Contract.waitForDeployment();

    const grantTx = await bgemErc20Contract.connect(admin).grantMinterRole(ScriptConfig.deployAccounts.huntersOnChainMinter.address);
    await grantTx.wait();

    //Equipments
    const baseURIe = "https://api-imx.boomland.io/api/e/";
    const contractURIe = "https://api-imx.boomland.io";
    const Equipments = await hre.ethers.getContractFactory('Equipments');
    const huntersOnChainEquipments = await Equipments.connect(deployer).deploy(
        admin.address,
        admin.address,
        admin.address,
        admin.address,
        1000,
        baseURIe,
        contractURIe,
        ScriptConfig.royaltyAllowlist.target
    );
    await huntersOnChainEquipments.waitForDeployment();

    // Artifacts
    const baseURIa = "https://api-imx.boomland.io/api/s/";
    const contractURIa = "https://api-imx.boomland.io";
    const Artifacts = await hre.ethers.getContractFactory('Artifacts');
    const huntersOnChainArtifacts = await Artifacts.connect(deployer).deploy(
        admin.address,
        admin.address,
        admin.address,
        admin.address,
        1000,
        baseURIa,
        contractURIa,
        ScriptConfig.royaltyAllowlist.target
    );
    await huntersOnChainArtifacts.waitForDeployment();

    // Shards
    const baseURIs = "https://api-imx.boomland.io/api/s/{id}";
    const contractURIs = "https://api-imx.boomland.io/api/v1/shard";
    const Shards = await hre.ethers.getContractFactory('Shards');
    const huntersOnChainShards = await Shards.connect(deployer).deploy(
        admin.address,
        huntersOnChainRelayer.target,
        admin.address,
        admin.address,
        1000,
        baseURIs,
        contractURIs,
        ScriptConfig.royaltyAllowlist.target
    );
    await huntersOnChainShards.waitForDeployment();

    // BgemClaim 
    const BgemClaim = await hre.ethers.getContractFactory('BgemClaim');
    const huntersOnChainClaim = await BgemClaim.connect(deployer).deploy(
        admin.address,
        bgemErc20Contract.target,
        ScriptConfig.deployAccounts.huntersOnChainOffchainSigner.address
    );
    await huntersOnChainClaim.waitForDeployment();

    // EIP712WithChanges
    const EIP712WithChanges = await hre.ethers.getContractFactory('EIP712WithChanges');
    const huntersOnChainEIP712 = await EIP712WithChanges.connect(deployer).deploy(
        "Boomland Claim",
        "1",
        huntersOnChainClaim.target
    );
    await huntersOnChainEIP712.waitForDeployment();

    // Mint 1000000 ether
    const mintTx = await bgemErc20Contract.connect(ScriptConfig.deployAccounts.huntersOnChainMinter)
        .mint(
            huntersOnChainClaim.target,
            "0x" + new BigNumber("1000000000000000000000000").toString(16)
        );
    await mintTx.wait();

    // Claim Game
    const ClaimGame = await hre.ethers.getContractFactory('HuntersOnChainClaimGame');
    const huntersOnChainClaimGame = await ClaimGame.connect(deployer).deploy(
        admin.address,
        admin.address,
        admin.address
    );
    await huntersOnChainClaimGame.waitForDeployment();

    // Recipe
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
    const Recipe = await hre.ethers.getContractFactory('Recipe');
    const huntersOnChainRecipe = await Recipe.connect(deployer).deploy(
        ScriptConfig.chainId,
        ScriptConfig.deployAccounts.huntersOnChainOffchainSigner.address,
        admin.address,
        bgemErc20Contract.target,
        ZERO_ADDRESS,
        huntersOnChainArtifacts.target,
        huntersOnChainEquipments.target,
        huntersOnChainShards.target
    );
    await huntersOnChainRecipe.waitForDeployment();

    const HUNTERS_ON_CHAIN_CHEST1 = 1;
    // Set Chest Config
    const chestOneConfig: Recipe.IChestConfigStruct = {
        estimatedGas: 170000,
        multiplier: 0,
        bgemPrice: 1,
        enabled: true
    }
    const setConfigTx = await huntersOnChainRecipe
        .connect(deployer)
        .setChestConfig(HUNTERS_ON_CHAIN_CHEST1, chestOneConfig);
    await setConfigTx.wait();

    // Fund
    const Fund = await hre.ethers.getContractFactory('Fund');
    const huntersOnChainFund = await Fund.connect(deployer).deploy(
        ScriptConfig.deployAccounts.huntersOnChainMinter.address
    );
    await huntersOnChainFund.waitForDeployment();
}


export const main = async () => {

}


if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}