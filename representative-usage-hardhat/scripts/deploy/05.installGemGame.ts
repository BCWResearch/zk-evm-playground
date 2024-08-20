import hre from "hardhat";
import { Wallet } from "ethers";
import { GemGame } from "../../typechain-types/contracts/games/gems";

export const installGemGame = async (deployer: Wallet, admin: Wallet): Promise<GemGame> => {
    const GemGame = await hre.ethers.getContractFactory('GemGame');
    const gemGameContract = await GemGame.connect(deployer).deploy(
        admin.address,
        admin.address,
        admin.address,
    );
    await gemGameContract.waitForDeployment();
    return gemGameContract;

}


export const main = async () => {

}


if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}