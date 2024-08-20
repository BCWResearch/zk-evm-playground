import hre from "hardhat";
import { Wallet } from "ethers";
import { GuildOfGuardiansClaimGame } from "../../typechain-types/contracts/games/guild-of-guardians";

export const installGuildOfGuardians = async (deployer: Wallet, admin: Wallet): Promise<GuildOfGuardiansClaimGame> => {
    const GuildOfGuardiansClaimGame = await hre.ethers.getContractFactory('GuildOfGuardiansClaimGame');
    const guildOfGuardiansContract = await GuildOfGuardiansClaimGame.connect(deployer).deploy(
        admin.address,
        admin.address,
        admin.address,
    );
    await guildOfGuardiansContract.waitForDeployment();
    return guildOfGuardiansContract;
}


export const main = async () => {

}


if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}