import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt } from "ethers";
import { newBlockListener } from "./utils.ts/blockListener";

const main = async () => {
    const signers = await hre.ethers.getSigners();
    console.log("Total Signers: ", signers.length);

    const selectedSigner = signers[0];

    const ConduitFactory = await hre.ethers.getContractFactory('ImmConduitController');
    console.log("Deploying Conduit Contract...");
    const ConduitContract = await ConduitFactory.connect(selectedSigner).deploy();
    await ConduitContract.waitForDeployment();
    const conduitAddress = await ConduitContract.getAddress();

    console.log("Conduit Contract Address: ", conduitAddress);

    const ImmutableSeaportFactory = await hre.ethers.getContractFactory('ImmutableSeaport');
    const ImmutableSeaportContract = await ImmutableSeaportFactory.connect(selectedSigner).deploy(
        conduitAddress,
        selectedSigner.address,
    );
    await ImmutableSeaportContract.waitForDeployment();
    console.log("Immutable Seaport Contract Address: ", (await ImmutableSeaportContract.getAddress()));

}

main();