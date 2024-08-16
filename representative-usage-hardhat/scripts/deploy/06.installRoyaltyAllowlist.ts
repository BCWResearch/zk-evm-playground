import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet, ethers } from "ethers";
import fs from "fs";
import { BigNumber } from "@ethersproject/bignumber";
import { DeployAccounts ,} from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";
import { passportCall, passportCallWithGasAndValue } from "../helpers/multicall.helper";
import { OperatorAllowlistUpgradeable } from "../../typechain-types";

export const installRoyaltyAllowlist = async (deployer: Wallet, admin: Wallet): Promise<OperatorAllowlistUpgradeable> => {
    const {
        multiCallDeploy,
        walletFactory,
        latestWalletImplLocator,
        startupWalletImpl,
        mainModuleDynamicAuth,
        immutableSigner
    } = ScriptConfig.passportWallet;

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

    // // Execute a call which will cause a user's passport wallet to be deployed
    // (address userMagic, uint256 userMagicPKey) = getNewPassportMagic();
    // passportCall(
    //     userMagic,
    //     userMagicPKey,
    //     address(latestWalletImplLocator),
    //     abi.encodeWithSelector(
    //         latestWalletImplLocator.latestWalletImplementation.selector
    //     ),
    //     20000,
    //     0
    // );

    const userMagic = new Wallet(hre.ethers.Wallet.createRandom().privateKey).connect(hre.ethers.provider);

    await latestWalletImplLocator.connect(userMagic).latestWalletImplementation();
    
    // console.log("answer: ", answer);
    // try {
    //     const resp = await passportCallWithGasAndValue(
    //         userMagic,
    //         latestWalletImplLocator.target.toString(),
    //         latestWalletImplLocator.interface.encodeFunctionData("latestWalletImplementation"),
    //         BigNumber.from("20000"),
    //         BigNumber.from("0")
    //     );

    //     console.log("resp: ", resp);
    // } catch (e) {
    //     console.log("error: ", e);
    // }
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