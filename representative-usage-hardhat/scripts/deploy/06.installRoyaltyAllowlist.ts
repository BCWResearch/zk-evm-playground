import hre from "hardhat";
import { Wallet } from "ethers";
import { OperatorAllowlistUpgradeable } from "../../typechain-types";

export const installRoyaltyAllowlist = async (deployer: Wallet, admin: Wallet): Promise<OperatorAllowlistUpgradeable> => {

    //OperatorAllowlistUpgradeable
    const OperatorAllowlistUpgradeable = await hre.ethers.getContractFactory('OperatorAllowlistUpgradeable');
    const impl = await OperatorAllowlistUpgradeable.connect(deployer).deploy();
    await impl.waitForDeployment();

    // Init Data
    const initData = impl.interface.encodeFunctionData("initialize", [admin.address, admin.address, admin.address]);

    // ERC1967Proxy
    const ERC1967Proxy = await hre.ethers.getContractFactory('ERC1967ProxyRun');
    const erc1967Proxy = await ERC1967Proxy.connect(deployer).deploy(
        impl.target,
        initData
    );
    await erc1967Proxy.waitForDeployment();

    const royaltyAllowlist: OperatorAllowlistUpgradeable = impl.attach(erc1967Proxy.target) as OperatorAllowlistUpgradeable;

    return royaltyAllowlist;
}

export const main = async () => {

}


if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error(error);
        process.exit(1);
    });
}