import { TransactionReceipt, Wallet } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { addressOf, encodeImageHash, encodeMetaTransactionsData, walletMultiSign } from "./helpers/passport.helper";
import ScriptConfig from "./scriptConfig";
import hre from "hardhat";
import { deployAll } from "./deploy/deployAll";
import { TEST_ACCOUNTS } from "../testaccounts";
import { RPCTriggerCall } from "./types/rpc.triggercall";
import { newBlockListener } from "./utils.ts/blockListener";

const getSaltCfaNonce = async (owner_a: Wallet): Promise<{
    cfa: string,
    salt: string,
    nonce: number
}> => {
    const salt = encodeImageHash(1, [{ weight: 1, owner: owner_a }]);

    const { factory, mainModule } = ScriptConfig.passportWallet;
    // Calculate CFA (Contract Factory Address) based on the salt
    const cfa = addressOf(factory.target.toString(), mainModule.target.toString(), salt);

    const nonce = await hre.ethers.provider.getTransactionCount(owner_a.address);
    return { cfa, salt, nonce };
}


const main = async () => {

    const treasurySigner = await hre.ethers.provider.getSigner(500);
    const runName = "run1";
    console.log("Deploying all contracts...");
    const resp = await deployAll(treasurySigner, runName, true);
    console.log("Contracts deployed successfully!");

    // console.log("Booting...")
    // const bootTimeStart = Date.now();
    // const owner_a = new Wallet(TEST_ACCOUNTS[412], hre.ethers.provider);
    // console.log('Owner A:', owner_a.address);
    // const { trigger: passportGem112 } = await performPassportGemGameCall(owner_a);
    // const bootTimeEnd = Date.now();

    // console.log('Boot Time:', bootTimeEnd - bootTimeStart);

    // const triggerTime = Date.now();
    // console.log('Triggering Passport Gem Game Call for Owner A');
    // const passportGemResp = await passportGem112();
    // console.log('Trigger Time:', Date.now() - triggerTime);
    // console.log('Passport Gem Game Gas Used:', passportGemResp?.gasUsed.toString());

    // const signerB = new Wallet(TEST_ACCOUNTS[115], hre.ethers.provider);
    // const eoaGemGame = await earnGem(signerB);
    // const triggerTimeB = Date.now();
    // console.log('Triggering EOA Gem Game Call for Signer B');
    // const eoaGemResp = await eoaGemGame.trigger();
    // console.log('Trigger Time:', Date.now() - triggerTimeB);
    // console.log('EOA Gem Game Gas Used:', eoaGemResp?.gasUsed.toString());

    // const hc = await performPassportHuntersOnChainBGemClaim(new Wallet(TEST_ACCOUNTS[121], hre.ethers.provider));
    // const hcResp = await hc.trigger();
    // console.log('performPassportHuntersOnChainBGemClaim Gas Used:', hcResp?.gasUsed.toString());

    // await run5Percent(treasurySigner);
    // await run50Percent(treasurySigner);

    // const gog = await performPassportcallGuildOfGuardiansClaimGame(new Wallet(TEST_ACCOUNTS[121], hre.ethers.provider));
    // const gogResp = await gog.trigger();
    // console.log('performPassportcallGuildOfGuardiansClaimGame Gas Used:', gogResp?.gasUsed.toString());
}

const run5Percent = async (treasurySigner: HardhatEthersSigner) => {
    // 5%
    const PASSPORT_GEM_NEW_PASSPORT = 1
    const PASSPORT_GEM_GAME = 3
    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME = 1
    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE = 1
    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM = 1
    const PASSPORT_GUILD_OF_GUARDIANS_CLAIM = 1
    const PASSPORT_SPACETREK_CLAIM = 0
    const PASSPORT_SPACENATION_COIN = 0
    const EOA_HUNTERS_ON_CHAIN_BGEM_CLAIM = 3
    const EOA_HUNTERS_ON_CHAIN_RELAYER_MINT = 1
    const EOA_HUNTERS_ON_CHAIN_RELAYER_SHARD_MINT = 1
    const EOA_GEM_GAME = 3
    const EOA_VALUE_TRANSFER = 5
    const EOA_BABY_SHARK_UNIVERSE_PROXY = 0
    const EOA_BABY_SHARK_UNIVERSE = 0
    const EOA_BLACKPASS = 0
    const HUNTERS_ON_CHAIN = 0

    const SIGNERS = await hre.ethers.getSigners();

    let totalSigners = 200;
    const PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_NEW_PASSPORT);
    totalSigners += PASSPORT_GEM_NEW_PASSPORT;

    const PASSPORT_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_GAME);
    totalSigners += PASSPORT_GEM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_RECIPE);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_RECIPE;

    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_BITGEM);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_BITGEM;

    /**
     * Skipping other impl for now
     */

    const EOA_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_GEM_GAME);
    totalSigners += EOA_GEM_GAME;

    const EOA_VALUE_TRANSFER_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_VALUE_TRANSFER);
    totalSigners += EOA_VALUE_TRANSFER;


    const triggers: RPCTriggerCall[] = [];

    for (const signer of PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS) {
        const { trigger } = await performPassportGemGameCall(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainClaimGame(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainRecipe(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainBGemClaim(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_VALUE_TRANSFER_SIGNERS) {
        const { trigger } = await sendEthToEOA(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    let currentBlockCount = 0;
    const resp: Promise<TransactionReceipt | null>[] = [];
    const blockListener = await newBlockListener(async (blockNum: number) => {
        console.log("Block Number: ", blockNum);
        if (currentBlockCount >= 1) {
            clearInterval(blockListener);
            return;
        }
        const _resp = (triggers.map(async (trigger) => {
            return await trigger.trigger();
        }));
        resp.push(..._resp);

        currentBlockCount++;
    });

    await new Promise((resolve) => {
        const interval = setInterval(async () => {
            if (currentBlockCount >= 1) {
                clearInterval(interval);
                resolve(currentBlockCount);
            }
        }, 1000);
    });

    const resolved = await Promise.all(resp);
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

    console.log('Block Number Map:', blockNumMap);


}

const run10Percent = async (treasurySigner: HardhatEthersSigner) => {
    // 10%
    const PASSPORT_GEM_NEW_PASSPORT = 2
    const PASSPORT_GEM_GAME = 6
    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME = 2
    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE = 2
    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM = 2
    const PASSPORT_GUILD_OF_GUARDIANS_CLAIM = 2
    const PASSPORT_SPACETREK_CLAIM = 0
    const PASSPORT_SPACENATION_COIN = 0
    const EOA_HUNTERS_ON_CHAIN_BGEM_CLAIM = 6
    const EOA_HUNTERS_ON_CHAIN_RELAYER_MINT = 2
    const EOA_HUNTERS_ON_CHAIN_RELAYER_SHARD_MINT = 2
    const EOA_GEM_GAME = 6
    const EOA_VALUE_TRANSFER = 10
    const EOA_BABY_SHARK_UNIVERSE_PROXY = 0
    const EOA_BABY_SHARK_UNIVERSE = 0
    const EOA_BLACKPASS = 0
    const HUNTERS_ON_CHAIN = 0

    const SIGNERS = await hre.ethers.getSigners();

    let totalSigners = 700;
    const PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_NEW_PASSPORT);
    totalSigners += PASSPORT_GEM_NEW_PASSPORT;

    const PASSPORT_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_GAME);
    totalSigners += PASSPORT_GEM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_RECIPE);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_RECIPE;

    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_BITGEM);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_BITGEM;

    /**
     * Skipping other impl for now
     */

    const EOA_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_GEM_GAME);
    totalSigners += EOA_GEM_GAME;

    const EOA_VALUE_TRANSFER_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_VALUE_TRANSFER);
    totalSigners += EOA_VALUE_TRANSFER;


    const triggers: RPCTriggerCall[] = [];

    for (const signer of PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS) {
        const { trigger } = await performPassportGemGameCall(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainClaimGame(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainRecipe(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainBGemClaim(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_VALUE_TRANSFER_SIGNERS) {
        const { trigger } = await sendEthToEOA(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    let currentBlockCount = 0;
    const resp: Promise<TransactionReceipt | null>[] = [];
    const blockListener = await newBlockListener(async (blockNum: number) => {
        console.log("Block Number: ", blockNum);
        if (currentBlockCount >= 1) {
            clearInterval(blockListener);
            return;
        }
        const _resp = (triggers.map(async (trigger) => {
            return await trigger.trigger();
        }));
        resp.push(..._resp);

        currentBlockCount++;
    });

    await new Promise((resolve) => {
        const interval = setInterval(async () => {
            if (currentBlockCount >= 1) {
                clearInterval(interval);
                resolve(currentBlockCount);
            }
        }, 1000);
    });

    const resolved = await Promise.all(resp);
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

    console.log('Block Number Map:', blockNumMap);


}

const run50Percent = async (treasurySigner: HardhatEthersSigner) => {
    // 50%
    const PASSPORT_GEM_NEW_PASSPORT = 7
    const PASSPORT_GEM_GAME = 10
    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME = 10
    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE = 10
    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM = 10
    const PASSPORT_GUILD_OF_GUARDIANS_CLAIM = 10
    const PASSPORT_SPACETREK_CLAIM = 0
    const PASSPORT_SPACENATION_COIN = 0
    const EOA_HUNTERS_ON_CHAIN_BGEM_CLAIM = 3
    const EOA_HUNTERS_ON_CHAIN_RELAYER_MINT = 1
    const EOA_HUNTERS_ON_CHAIN_RELAYER_SHARD_MINT = 1
    const EOA_GEM_GAME = 15
    const EOA_VALUE_TRANSFER = 25
    const EOA_BABY_SHARK_UNIVERSE_PROXY = 0
    const EOA_BABY_SHARK_UNIVERSE = 0
    const EOA_BLACKPASS = 0
    const HUNTERS_ON_CHAIN = 0



    const SIGNERS = await hre.ethers.getSigners();

    let totalSigners = 2900;
    const PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_NEW_PASSPORT);
    totalSigners += PASSPORT_GEM_NEW_PASSPORT;

    const PASSPORT_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_GAME);
    totalSigners += PASSPORT_GEM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_RECIPE);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_RECIPE;

    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_BITGEM);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_BITGEM;

    /**
     * Skipping other impl for now
     */

    const EOA_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_GEM_GAME);
    totalSigners += EOA_GEM_GAME;

    const EOA_VALUE_TRANSFER_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_VALUE_TRANSFER);
    totalSigners += EOA_VALUE_TRANSFER;


    const triggers: RPCTriggerCall[] = [];

    for (const signer of PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS) {
        const { trigger } = await performPassportGemGameCall(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainClaimGame(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainRecipe(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainBGemClaim(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_VALUE_TRANSFER_SIGNERS) {
        const { trigger } = await sendEthToEOA(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    let currentBlockCount = 0;
    const resp: Promise<TransactionReceipt | null>[] = [];
    const blockListener = await newBlockListener(async (blockNum: number) => {
        console.log("Block Number: ", blockNum);
        if (currentBlockCount >= 1) {
            clearInterval(blockListener);
            return;
        }
        const _resp = (triggers.map(async (trigger) => {
            return await trigger.trigger();
        }));
        resp.push(..._resp);

        currentBlockCount++;
    });

    await new Promise((resolve) => {
        const interval = setInterval(async () => {
            if (currentBlockCount >= 1) {
                clearInterval(interval);
                resolve(currentBlockCount);
            }
        }, 1000);
    });

    const resolved = await Promise.all(resp);
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

    console.log('Block Number Map:', blockNumMap);
}

const run100Percent = async (treasurySigner: HardhatEthersSigner) => {
    // 100%
    const PASSPORT_GEM_NEW_PASSPORT = 15
    const PASSPORT_GEM_GAME = 20
    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME = 20
    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE = 20
    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM = 20
    const PASSPORT_GUILD_OF_GUARDIANS_CLAIM = 0
    const PASSPORT_SPACETREK_CLAIM = 0
    const PASSPORT_SPACENATION_COIN = 0
    const EOA_HUNTERS_ON_CHAIN_BGEM_CLAIM = 6
    const EOA_HUNTERS_ON_CHAIN_RELAYER_MINT = 2
    const EOA_HUNTERS_ON_CHAIN_RELAYER_SHARD_MINT = 2
    const EOA_GEM_GAME = 30
    const EOA_VALUE_TRANSFER = 50
    const EOA_BABY_SHARK_UNIVERSE_PROXY = 0
    const EOA_BABY_SHARK_UNIVERSE = 0
    const EOA_BLACKPASS = 0
    const HUNTERS_ON_CHAIN = 0

    const SIGNERS = await hre.ethers.getSigners();

    let totalSigners = 1900;
    const PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_NEW_PASSPORT);
    totalSigners += PASSPORT_GEM_NEW_PASSPORT;

    const PASSPORT_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_GEM_GAME);
    totalSigners += PASSPORT_GEM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME;

    const PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_RECIPE);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_RECIPE;

    const PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + PASSPORT_HUNTERS_ON_CHAIN_BITGEM);
    totalSigners += PASSPORT_HUNTERS_ON_CHAIN_BITGEM;

    /**
     * Skipping other impl for now
     */

    const EOA_GEM_GAME_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_GEM_GAME);
    totalSigners += EOA_GEM_GAME;

    const EOA_VALUE_TRANSFER_SIGNERS = TEST_ACCOUNTS.slice(totalSigners, totalSigners + EOA_VALUE_TRANSFER);
    totalSigners += EOA_VALUE_TRANSFER;


    const triggers: RPCTriggerCall[] = [];

    for (const signer of PASSPORT_GEM_GAME_NEW_PASSPORT_SIGNERS) {
        const { trigger } = await performPassportGemGameCall(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_CLAIM_GAME_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainClaimGame(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_RECIPE_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainRecipe(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of PASSPORT_HUNTERS_ON_CHAIN_BITGEM_SIGNERS) {
        const { trigger } = await performPassportHuntersOnChainBGemClaim(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_GEM_GAME_SIGNERS) {
        const { trigger } = await earnGem(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    for (const signer of EOA_VALUE_TRANSFER_SIGNERS) {
        const { trigger } = await sendEthToEOA(new Wallet(signer, hre.ethers.provider));
        triggers.push({ trigger });
    }

    let currentBlockCount = 0;
    const resp: Promise<TransactionReceipt | null>[] = [];
    const blockListener = await newBlockListener(async (blockNum: number) => {
        console.log("Block Number: ", blockNum);
        if (currentBlockCount >= 1) {
            clearInterval(blockListener);
            return;
        }
        const _resp = (triggers.map(async (trigger) => {
            return await trigger.trigger();
        }));
        resp.push(..._resp);

        currentBlockCount++;
    });

    await new Promise((resolve) => {
        const interval = setInterval(async () => {
            if (currentBlockCount >= 1) {
                clearInterval(interval);
                resolve(currentBlockCount);
            }
        }, 1000);
    });

    const resolved = await Promise.all(resp);
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

    console.log('Block Number Map:', blockNumMap);
}


const performPassportGemGameCall = async (owner_a: Wallet): Promise<RPCTriggerCall> => {
    const { mainModule, multiCall, factory } = ScriptConfig.passportWallet;
    let { cfa, salt, nonce } = await getSaltCfaNonce(owner_a);
    console.log('CFA:', cfa);
    console.log('Salt:', salt);
    console.log('Nonce:', nonce);
    // Prepare the transaction data for calling `earnGem` on the gemGame contract
    const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: "0",
        target: ScriptConfig.gemGame.target.toString(),
        value: "0",
        data: ScriptConfig.gemGame.interface.encodeFunctionData('earnGem')  // Encode the call to earnGem
    };

    const TOTAL_TXS = 1;
    const transactions = Array(TOTAL_TXS).fill(transaction);

    // Encode meta-transaction data
    const data = encodeMetaTransactionsData(cfa, transactions, ScriptConfig.chainId, nonce);

    // Sign the meta-transaction
    const sig = await walletMultiSign([{ weight: 1, owner: owner_a }], 1, data, false);

    const { admin } = ScriptConfig.deployAccounts;
    const executorRole = await multiCall.EXECUTOR_ROLE();

    const roleTx = await multiCall.connect(admin).grantRole(executorRole, owner_a.address)
    await roleTx.wait();

    const trigger = async () => {
        const tx = await multiCall.connect(owner_a).deployAndExecute(cfa, mainModule.target, salt, factory.target, transactions, nonce, sig);
        const receipt = await tx.wait();
        return receipt;
    }

    return {
        trigger
    }

};

const performPassportHuntersOnChainClaimGame = async (signer: Wallet): Promise<RPCTriggerCall> => {
    const { mainModule, multiCall, factory } = ScriptConfig.passportWallet;
    const { cfa, salt, nonce } = await getSaltCfaNonce(signer);
    const huntersOnChainClaimGame = ScriptConfig.huntersOnChain.huntersOnChainClaimGame;

    console.log('CFA:', cfa);
    console.log('Salt:', salt);
    console.log('Nonce:', nonce);

    // Prepare the transaction data for calling `claim` on the huntersOnChainClaimGame contract
    const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: "0",
        target: huntersOnChainClaimGame.target.toString(),
        value: "0",
        data: huntersOnChainClaimGame.interface.encodeFunctionData('claim')  // Encode the call to claim
    };

    const TOTAL_TXS = 1;
    const transactions = Array(TOTAL_TXS).fill(transaction);

    // Encode meta-transaction data
    const data = encodeMetaTransactionsData(cfa, transactions, ScriptConfig.chainId, nonce);

    // Sign the meta-transaction
    const sig = await walletMultiSign([{ weight: 1, owner: signer }], 1, data, false);

    const { admin } = ScriptConfig.deployAccounts;
    const executorRole = await multiCall.EXECUTOR_ROLE();

    const roleTx = await multiCall.connect(admin).grantRole(executorRole, signer.address)
    await roleTx.wait();

    const trigger = async () => {
        const tx = await multiCall.connect(signer).deployAndExecute(cfa, mainModule.target, salt, factory.target, transactions, nonce, sig);
        const receipt = await tx.wait();
        return receipt;
    }

    return {
        trigger
    }
}

const performPassportHuntersOnChainRecipe = async (signer: Wallet): Promise<RPCTriggerCall> => {
    const { mainModule, multiCall, factory } = ScriptConfig.passportWallet;
    const { cfa, salt, nonce } = await getSaltCfaNonce(signer);
    const huntersOnChainRecipe = ScriptConfig.huntersOnChain.huntersOnChainRecipe;
    const bgemErc20 = ScriptConfig.huntersOnChain.bgemErc20;


    console.log('CFA:', cfa);
    console.log('Salt:', salt);
    console.log('Nonce:', nonce);

    const GWEI = 1 * 10 ** 9;
    const mintTx = await bgemErc20.connect(ScriptConfig.deployAccounts.huntersOnChainMinter).mint(cfa, 1003 * GWEI);
    mintTx.wait();

    // Prepare the transaction data for calling `openChest` on the huntersOnChainRecipe contract
    const transactions = [
        {
            delegateCall: false,
            revertOnError: true,
            gasLimit: "0",
            target: bgemErc20.target.toString(),
            value: "0",
            data: bgemErc20.interface.encodeFunctionData('approve', [huntersOnChainRecipe.target.toString(), 1000 * GWEI])  // Encode the call to approve
        },
        {
            delegateCall: false,
            revertOnError: true,
            gasLimit: "0",
            target: huntersOnChainRecipe.target.toString(),
            value: "0",
            data: huntersOnChainRecipe.interface.encodeFunctionData('openChest', [1])  // Encode the call to openChest
        }];

    // Encode meta-transaction data
    const data = encodeMetaTransactionsData(cfa, transactions, ScriptConfig.chainId, nonce);

    // Sign the meta-transaction
    const sig = await walletMultiSign([{ weight: 1, owner: signer }], 1, data, false);

    const { admin } = ScriptConfig.deployAccounts;
    const executorRole = await multiCall.EXECUTOR_ROLE();

    const roleTx = await multiCall.connect(admin).grantRole(executorRole, signer.address)
    await roleTx.wait();


    const trigger = async () => {
        const tx = await multiCall.connect(signer).deployAndExecute(cfa, mainModule.target, salt, factory.target, transactions, nonce, sig);
        const receipt = await tx.wait();
        return receipt;
    }

    return {
        trigger
    }
}

const performPassportHuntersOnChainBGemClaim = async (signer: Wallet): Promise<RPCTriggerCall> => {
    const { mainModule, multiCall, factory } = ScriptConfig.passportWallet;
    const { cfa, salt, nonce } = await getSaltCfaNonce(signer);
    const huntersOnChainBGemClaim = ScriptConfig.huntersOnChain.huntersOnChainClaimGame;

    const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: "0",
        target: huntersOnChainBGemClaim.target.toString(),
        value: "0",
        data: huntersOnChainBGemClaim.interface.encodeFunctionData('claim')  // Encode the call to claim
    };

    const TOTAL_TXS = 1;

    const transactions = Array(TOTAL_TXS).fill(transaction);

    // Encode meta-transaction data
    const data = encodeMetaTransactionsData(cfa, transactions, ScriptConfig.chainId, nonce);

    // Sign the meta-transaction
    const sig = await walletMultiSign([{ weight: 1, owner: signer }], 1, data, false);

    const { admin } = ScriptConfig.deployAccounts;

    const executorRole = await multiCall.EXECUTOR_ROLE();

    const roleTx = await multiCall.connect(admin).grantRole(executorRole, signer.address)

    await roleTx.wait();

    const trigger = async () => {
        const tx = await multiCall.connect(signer).deployAndExecute(cfa, mainModule.target, salt, factory.target, transactions, nonce, sig);
        const receipt = await tx.wait();
        return receipt;
    }

    return {
        trigger
    };
}

const performPassportcallGuildOfGuardiansClaimGame = async (signer: Wallet): Promise<RPCTriggerCall> => {
    const { mainModule, multiCall, factory } = ScriptConfig.passportWallet;
    const { cfa, salt, nonce } = await getSaltCfaNonce(signer);
    const guildOfGuardiansClaim = ScriptConfig.guildOfGuardians;

    console.log('CFA:', cfa);
    console.log('Salt:', salt);
    console.log('Nonce:', nonce);

    // Prepare the transaction data for calling `claim` on the guildOfGuardiansClaimGame contract
    const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: "0",
        target: guildOfGuardiansClaim.target.toString(),
        value: "0",
        data: guildOfGuardiansClaim.interface.encodeFunctionData('claim')  // Encode the call to claim
    };

    const TOTAL_TXS = 1;
    const transactions = Array(TOTAL_TXS).fill(transaction);

    // Encode meta-transaction data
    const data = encodeMetaTransactionsData(cfa, transactions, ScriptConfig.chainId, nonce);

    // Sign the meta-transaction
    const sig = await walletMultiSign([{ weight: 1, owner: signer }], 1, data, false);

    const { admin } = ScriptConfig.deployAccounts;
    const executorRole = await multiCall.EXECUTOR_ROLE();

    const roleTx = await multiCall.connect(admin).grantRole(executorRole, signer.address)
    await roleTx.wait();

    const trigger = async () => {
        const tx = await multiCall.connect(signer).deployAndExecute(cfa, mainModule.target, salt, factory.target, transactions, nonce, sig);
        const receipt = await tx.wait();
        return receipt;
    }

    return {
        trigger
    }
}

const earnGem = async (signer: Wallet): Promise<RPCTriggerCall> => {
    const gemGame = ScriptConfig.gemGame;
    const trigger = async () => {
        const tx = await gemGame.connect(signer).earnGem();
        const txResp = await tx.wait();
        return txResp;
    }
    return {
        trigger
    }
}


const sendEthToEOA = async (signer: Wallet): Promise<RPCTriggerCall> => {
    const trigger = async () => {
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
    }
    return {
        trigger
    }
}


main();