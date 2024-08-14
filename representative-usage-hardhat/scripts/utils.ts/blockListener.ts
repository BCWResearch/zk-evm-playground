import hre from "hardhat";

export const getLatestBlockNumber = async () => {
    const block = await hre.ethers.provider.getBlockNumber();
    return block;
}

export const newBlockListener = async (callback: Function) => {
    // polling for new blocks
    let lastBlock = await getLatestBlockNumber();
    let currentBlock = lastBlock;
    let interval = setInterval(async () => {
        try {
            currentBlock = await getLatestBlockNumber();
            if (currentBlock > lastBlock) {
                callback(currentBlock);
                lastBlock = currentBlock;
            }
        } catch (e) {
            console.error(`Error in new block listener: ${e}`);
        }
    }, 1000)
    return interval;
}