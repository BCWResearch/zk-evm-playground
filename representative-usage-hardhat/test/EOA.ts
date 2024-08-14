import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("EOA", function () {
    it("Should EOA transfer from account to dummy account", async function () {
        const signers = await hre.ethers.getSigners();
        console.log("Total Signers: ", signers.length);


        const sendEthToEOA = async (signer: any/*HardhatEthersSigner*/) => {
            const sender = signer;
            // generate a new account
            const receiver = hre.ethers.Wallet.createRandom();

            // send 0.1 ETH from sender to receiver
            const tx = await sender.sendTransaction({
                to: receiver.address,
                value: hre.ethers.parseEther("0.1"),
            });
            const txResp = await tx.wait();
            console.log("Transaction Hash: ", txResp?.hash);
            console.log("Transaction Block Number: ", txResp?.blockNumber);
            return txResp;
        }

        const _20Signers = signers.slice(10, 20);
        // await sendEthToEOA(signers[0]);
        const resp = await Promise.all(_20Signers.map(async (signer) => {
            return await sendEthToEOA(signer);
        }));
    
    });
});