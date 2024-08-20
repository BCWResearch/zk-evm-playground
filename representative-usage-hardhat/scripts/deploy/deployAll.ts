import fs from "fs";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupAccounts } from './01.setupAccounts';
import { DeployAccounts } from "../types/deploy.types";
import ScriptConfig, { WritableWallet, WriteableScriptConfig } from "../scriptConfig";
import { installCreate3Deployer } from './02.installCreate3Deployer';
import { installPassportWallet, installPassportWalletV1 } from './03.installPassportWallet';
import { installSeaport } from './04.installSeaport';
import { installGemGame } from './05.installGemGame';
import { installRoyaltyAllowlist } from './06.installRoyaltyAllowlist';
import { installHuntersOnChain } from './07.installHuntersOnChain';
import { installGuildOfGuardians } from './08.installGuildofGuardians';
import { Wallet } from "ethers";


const generateWriteableFileNames = (chainId: number, treasurySigner: HardhatEthersSigner, runName: string) => {
    return `./cache/deployedContracts_${chainId}_${treasurySigner.address}_${runName}.json`;
}

const writeDeployedContractsToFile = (treasurySigner: HardhatEthersSigner, runName: string) => {
    const writableContracts: WriteableScriptConfig = {
        chainId: ScriptConfig.chainId,
        deployAccounts: Object.keys(ScriptConfig.deployAccounts).map((key) => {
            const wallet: Wallet = (ScriptConfig.deployAccounts as any)[key];
            return {
                [key]: {
                    address: wallet.address,
                    privateKey: wallet.privateKey
                }
            }
        }).reduce((acc, val) => ({ ...acc, ...val }), {}) as unknown as WriteableScriptConfig["deployAccounts"],
        create3Deployer: ScriptConfig.create3Deployer.target.toString(),
        accessControlledDeployer: ScriptConfig.accessControlledDeployer.target.toString(),
        passportWallet: {
            factory: ScriptConfig.passportWallet.factory.target.toString(),
            mainModule: ScriptConfig.passportWallet.mainModule.target.toString(),
            multiCall: ScriptConfig.passportWallet.multiCall.target.toString()
        },
        gemGame: ScriptConfig.gemGame.target.toString(),
        royaltyAllowlist: ScriptConfig.royaltyAllowlist.target.toString(),
        huntersOnChain: {
            bgemErc20: ScriptConfig.huntersOnChain.bgemErc20.target.toString(),
            huntersOnChainRelayer: ScriptConfig.huntersOnChain.huntersOnChainRelayer.target.toString(),
            huntersOnChainEquipments: ScriptConfig.huntersOnChain.huntersOnChainEquipments.target.toString(),
            huntersOnChainArtifacts: ScriptConfig.huntersOnChain.huntersOnChainArtifacts.target.toString(),
            huntersOnChainShards: ScriptConfig.huntersOnChain.huntersOnChainShards.target.toString(),
            huntersOnChainClaim: ScriptConfig.huntersOnChain.huntersOnChainClaim.target.toString(),
            huntersOnChainEIP712: ScriptConfig.huntersOnChain.huntersOnChainEIP712.target.toString(),
            huntersOnChainClaimGame: ScriptConfig.huntersOnChain.huntersOnChainClaimGame.target.toString(),
            huntersOnChainRecipe: ScriptConfig.huntersOnChain.huntersOnChainRecipe.target.toString(),
            huntersOnChainFund: ScriptConfig.huntersOnChain.huntersOnChainFund.target.toString()
        },
        guildOfGuardians: ScriptConfig.guildOfGuardians.target.toString()
    }

    const fileName = generateWriteableFileNames(ScriptConfig.chainId, treasurySigner, runName);
    fs.writeFileSync(fileName, JSON.stringify(writableContracts, null, 2));
}

const loadDeployedContractsFromFile = async (treasurySigner: HardhatEthersSigner, runName: string): Promise<WriteableScriptConfig> => {
    const fileName = generateWriteableFileNames(ScriptConfig.chainId, treasurySigner, runName);
    const data = fs.readFileSync(fileName, 'utf-8');
    const contracts = JSON.parse(data);
    return contracts;
}

export const deployAll = async (treasurySigner: HardhatEthersSigner, runName: string, newDeployment: boolean) => {
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    ScriptConfig.chainId = +chainId.toString();
    console.log("Chain ID: ", ScriptConfig.chainId);

    if (!newDeployment && fs.existsSync(generateWriteableFileNames(ScriptConfig.chainId, treasurySigner, runName))) {
        const contracts = await loadDeployedContractsFromFile(treasurySigner, runName);
        ScriptConfig.deployAccounts = Object.keys(contracts.deployAccounts).map((key) => {
            const wallet: WritableWallet = (contracts.deployAccounts as any)[key];
            return {
                [key]: new Wallet(wallet.privateKey).connect(hre.ethers.provider)
            }
        }).reduce((acc, val) => ({ ...acc, ...val }), {}) as unknown as DeployAccounts;

        ScriptConfig.create3Deployer = await hre.ethers.getContractAt("OwnableCreate3Deployer", contracts.create3Deployer);
        ScriptConfig.accessControlledDeployer = await hre.ethers.getContractAt("AccessControlledDeployer", contracts.accessControlledDeployer);
        ScriptConfig.passportWallet = {
            factory: await hre.ethers.getContractAt("Factory", contracts.passportWallet.factory),
            mainModule: await hre.ethers.getContractAt("MainModuleMock", contracts.passportWallet.mainModule),
            multiCall: await hre.ethers.getContractAt("MultiCallDeploy", contracts.passportWallet.multiCall)
        }
        ScriptConfig.gemGame = await hre.ethers.getContractAt("GemGame", contracts.gemGame);
        ScriptConfig.royaltyAllowlist = await hre.ethers.getContractAt("OperatorAllowlistUpgradeable", contracts.royaltyAllowlist);
        ScriptConfig.huntersOnChain = {
            bgemErc20: await hre.ethers.getContractAt("ImmutableERC20MinterBurnerPermit", contracts.huntersOnChain.bgemErc20),
            huntersOnChainRelayer: await hre.ethers.getContractAt("Relayer", contracts.huntersOnChain.huntersOnChainRelayer),
            huntersOnChainEquipments: await hre.ethers.getContractAt("Equipments", contracts.huntersOnChain.huntersOnChainEquipments),
            huntersOnChainArtifacts: await hre.ethers.getContractAt("Artifacts", contracts.huntersOnChain.huntersOnChainArtifacts),
            huntersOnChainShards: await hre.ethers.getContractAt("Shards", contracts.huntersOnChain.huntersOnChainShards),
            huntersOnChainClaim: await hre.ethers.getContractAt("BgemClaim", contracts.huntersOnChain.huntersOnChainClaim),
            huntersOnChainEIP712: await hre.ethers.getContractAt("EIP712WithChanges", contracts.huntersOnChain.huntersOnChainEIP712),
            huntersOnChainClaimGame: await hre.ethers.getContractAt("GuildOfGuardiansClaimGame", contracts.huntersOnChain.huntersOnChainClaimGame),
            huntersOnChainRecipe: await hre.ethers.getContractAt("Recipe", contracts.huntersOnChain.huntersOnChainRecipe),
            huntersOnChainFund: await hre.ethers.getContractAt("Fund", contracts.huntersOnChain.huntersOnChainFund)
        }
        ScriptConfig.guildOfGuardians = await hre.ethers.getContractAt("GuildOfGuardiansClaimGame", contracts.guildOfGuardians);

        return {
            deployAccounts: ScriptConfig.deployAccounts,
            create3D: {
                accessControlledDeployer: ScriptConfig.accessControlledDeployer,
                create3Deployer: ScriptConfig.create3Deployer
            },
            passportWallet: ScriptConfig.passportWallet,
            gemGame: ScriptConfig.gemGame,
            royaltyAllowList: ScriptConfig.royaltyAllowlist,
            huntersOnChain: ScriptConfig.huntersOnChain,
            guildOfGuardians: ScriptConfig.guildOfGuardians
        }
    }

    const accounts = await setupAccounts(treasurySigner, runName, newDeployment);
    ScriptConfig.deployAccounts = accounts;


    const deployAccounts: DeployAccounts = ScriptConfig.deployAccounts;
    const { deployer, admin, relayer, passportSigner } = deployAccounts;

    console.log("Deploy Accounts: ", Object.keys(deployAccounts));

    const create3D = await installCreate3Deployer(deployer, admin);
    ScriptConfig.accessControlledDeployer = create3D.accessControlledDeployer;
    ScriptConfig.create3Deployer = create3D.create3Deployer;

    const passportWallet = await installPassportWallet(deployer, admin, relayer, passportSigner);
    ScriptConfig.passportWallet = passportWallet;
    // const seaport = await installSeaport(deployer, admin);

    const gemGame = await installGemGame(deployer, admin);
    ScriptConfig.gemGame = gemGame;

    const royaltyAllowList = await installRoyaltyAllowlist(deployer, admin);
    ScriptConfig.royaltyAllowlist = royaltyAllowList;

    const huntersOnChain = await installHuntersOnChain(deployer, admin);
    ScriptConfig.huntersOnChain = huntersOnChain;

    const guildOfGuardians = await installGuildOfGuardians(deployer, admin);
    ScriptConfig.guildOfGuardians = guildOfGuardians;

    writeDeployedContractsToFile(treasurySigner, runName);
    return {
        deployAccounts,
        create3D,
        passportWallet,
        gemGame,
        royaltyAllowList,
        huntersOnChain,
        guildOfGuardians
    }

}


const main = async () => {
    // await deployAll(true);
}

if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}