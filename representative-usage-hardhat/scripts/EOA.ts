import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt } from "ethers";
import { newBlockListener } from "./utils.ts/blockListener";

const sendEthToEOA = async (signer: HardhatEthersSigner): Promise<TransactionReceipt | null> => {
    try {
        const sender = signer;
        // generate a new account
        const receiver = hre.ethers.Wallet.createRandom();

        // send 0.01 ETH from sender to receiver
        const tx = await sender.sendTransaction({
            to: receiver.address,
            value: hre.ethers.parseEther("0.01"),
        });
        const txResp = await tx.wait();
        console.log("Transaction Hash: ", txResp?.hash);
        console.log("Transaction Block Number: ", txResp?.blockNumber);
        return txResp;
    } catch (error) {
        console.log("Error: ", error);
        return {
            blockNumber: -1,
            hash: "0x0"
        } as TransactionReceipt;
    }
}

const main = async () => {
    const signers = await hre.ethers.getSigners();
    console.log("Total Signers: ", signers.length);

    let index = 0
    const START_PAD = 800;
    const TOTAL_ACCOUNTS = 10;

    const totalActiveBlocks = 1;
    let currentBlockCount = 0;
    const resp: Promise<TransactionReceipt | null>[] = [];
    const blockListener = await newBlockListener(async (blockNum: number) => {
        console.log("Block Number: ", blockNum);
        if (currentBlockCount >= totalActiveBlocks) {
            clearInterval(blockListener);
            return;
        }
        const start = START_PAD + (index * TOTAL_ACCOUNTS);
        const end = start + TOTAL_ACCOUNTS;
        const _20Signers = signers.slice(start, end);

        const _resp = (_20Signers.map(async (signer) => {
            return await sendEthToEOA(signer);
        }));
        resp.push(..._resp);
        currentBlockCount++;
    })

    // wait for all transactions to be mined
    await new Promise((resolve) => {
        const interval = setInterval(async () => {
            if (currentBlockCount >= totalActiveBlocks) {
                clearInterval(interval);
                resolve(currentBlockCount);
            }
        }, 1000);
    });

    const resolved = await Promise.all(resp);
    // map of unique blockNum and total transactions
    const blockNumMap = new Map();
    resolved.forEach((txResp) => {
        if (!txResp)
            return;
        if (blockNumMap.has(txResp.blockNumber)) {
            blockNumMap.set(txResp.blockNumber, blockNumMap.get(txResp.blockNumber) + 1);
        } else {
            blockNumMap.set(txResp.blockNumber, 1);
        }
    });
    console.log("Block Number Map: ", blockNumMap);
}

main();