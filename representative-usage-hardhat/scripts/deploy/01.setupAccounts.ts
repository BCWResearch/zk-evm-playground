import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { HDNodeWallet, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts } from "../types/deploy.types";


const transferEth = async (sender: HardhatEthersSigner | HDNodeWallet, receiver: string, amount: string) => {
    console.log(`Transfering ${amount} ETH from ${sender.address} to ${receiver}`);
    const tx = await sender.sendTransaction({
        to: receiver,
        value: hre.ethers.parseEther(amount),
    });
    const txResp = await tx.wait();
    console.log("Transaction Hash: ", txResp?.hash);
    console.log("Transaction Block Number: ", txResp?.blockNumber);
    return txResp;
}




export const createAccounts = async (treasurySigner: HardhatEthersSigner): Promise<DeployAccounts> => {
    const treasuryAddress = treasurySigner.address;
    const treasury = treasurySigner;
    const root = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);
    const deployer = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);
    const admin = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);
    const relayer = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);
    const passportSigner = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);
    const huntersOnChainMinter = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);
    const huntersOnChainOffchainSigner = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);

    const treasuryBalance = await hre.ethers.provider.getBalance(treasuryAddress);
    if (new BigNumber(treasuryBalance.toString()).isZero()) {
        console.log("ERROR: Treasury has 0 native gas token");
        throw new Error("Treasury has 0 native gas token");
    }

    console.log("Root Address: ", root.address);
    await transferEth(treasury, root.address, "30");
    const rootBalance = await hre.ethers.provider.getBalance(root.address);
    if (new BigNumber(rootBalance.toString()).isZero()) {
        console.log("ERROR: Root has 0 native gas token");
        throw new Error("Root has 0 native gas token");
    }

    console.log("Deployer Address: ", deployer.address);
    await transferEth(treasury, deployer.address, "2");
    const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
    if (new BigNumber(deployerBalance.toString()).isZero()) {
        console.log("ERROR: Deployer has 0 native gas token");
        throw new Error("Deployer has 0 native gas token");
    }

    console.log("Admin Address: ", admin.address);
    await transferEth(treasury, admin.address, "2");
    const adminBalance = await hre.ethers.provider.getBalance(admin.address);
    if (new BigNumber(adminBalance.toString()).isZero()) {
        console.log("ERROR: Admin has 0 native gas token");
        throw new Error("Admin has 0 native gas token");
    }

    console.log("Relayer Address: ", relayer.address);
    await transferEth(treasury, relayer.address, "5");

    console.log("Hunter OnChain Minter Address: ", huntersOnChainMinter.address);
    await transferEth(treasury, huntersOnChainMinter.address, "10");

    return {
        root,
        deployer,
        admin,
        relayer,
        passportSigner,
        huntersOnChainMinter,
        huntersOnChainOffchainSigner
    }
}

export const writeAccountsToFile = async (treasurySigner: HardhatEthersSigner, runName: string, accounts: DeployAccounts) => {
    const data = {
        root: {
            address: accounts.root.address,
            privateKey: accounts.root.privateKey
        },
        deployer: {
            address: accounts.deployer.address,
            privateKey: accounts.deployer.privateKey
        },
        admin: {
            address: accounts.admin.address,
            privateKey: accounts.admin.privateKey
        },
        relayer: {
            address: accounts.relayer.address,
            privateKey: accounts.relayer.privateKey
        },
        passportSigner: {
            address: accounts.passportSigner.address,
            privateKey: accounts.passportSigner.privateKey
        },
        huntersOnChainMinter: {
            address: accounts.huntersOnChainMinter.address,
            privateKey: accounts.huntersOnChainMinter.privateKey
        },
        huntersOnChainOffchainSigner: {
            address: accounts.huntersOnChainOffchainSigner.address,
            privateKey: accounts.huntersOnChainOffchainSigner.privateKey
        }
    }

    const fileName = `./cache/${treasurySigner.address}_${runName}.json`;
    fs.writeFileSync(fileName, JSON.stringify(data));
    console.log(`Accounts written to ${fileName}`);
}

export const isAccountFileExists = async (treasurySigner: HardhatEthersSigner, runName: string): Promise<boolean> => {
    const fileName = `./cache/${treasurySigner.address}_${runName}.json`;
    return fs.existsSync(fileName);
}

export const loadAccountsFromFile = async (treasurySigner: HardhatEthersSigner, runName: string): Promise<DeployAccounts> => {
    const fileName = `./cache/${treasurySigner.address}_${runName}.json`;
    const data = fs.readFileSync(fileName, 'utf-8');
    const accounts = JSON.parse(data);

    const root = new hre.ethers.Wallet(accounts.root.privateKey).connect(hre.ethers.provider);
    const deployer = new hre.ethers.Wallet(accounts.deployer.privateKey).connect(hre.ethers.provider);
    const admin = new hre.ethers.Wallet(accounts.admin.privateKey).connect(hre.ethers.provider);
    const relayer = new hre.ethers.Wallet(accounts.relayer.privateKey).connect(hre.ethers.provider);
    const passportSigner = new hre.ethers.Wallet(accounts.passportSigner.privateKey).connect(hre.ethers.provider);
    const huntersOnChainMinter = new hre.ethers.Wallet(accounts.huntersOnChainMinter.privateKey).connect(hre.ethers.provider);
    const huntersOnChainOffchainSigner = new hre.ethers.Wallet(accounts.huntersOnChainOffchainSigner.privateKey).connect(hre.ethers.provider);

    return {
        root,
        deployer,
        admin,
        relayer,
        passportSigner,
        huntersOnChainMinter,
        huntersOnChainOffchainSigner
    }
}


export const setupAccounts = async (treasurySigner: HardhatEthersSigner, runName: string, newDeployment = false): Promise<DeployAccounts> => {
    if (!newDeployment && await isAccountFileExists(treasurySigner, runName)) {
        const loadedAccounts = await loadAccountsFromFile(treasurySigner, runName);
        console.log("Loaded Accounts: ", loadedAccounts);
        return loadedAccounts;
    }
    const accounts = await createAccounts(treasurySigner);
    await writeAccountsToFile(treasurySigner, runName, accounts);
    return accounts;
}


const main = async () => {
    const signers = await hre.ethers.getSigners();
    console.log("Total Signers: ", signers.length);
    const treasurySigner = signers[0];

    const runName = "run2";
    const accounts = await setupAccounts(treasurySigner, runName, true);
    console.log("Accounts: ", Object.keys(accounts));
}


if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}