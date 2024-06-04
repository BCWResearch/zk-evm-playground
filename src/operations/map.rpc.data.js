const ethHandler = require("../services/eth.handler");
const fileHandler = require("../services/file.handler");

const blockIntervalImxData = {
  firstBatch: { // 120 txs per block
    start: 4825,
    end: 5025
  },
  secondBatch: { // 1390 txs per block
    start: 5568,
    end: 5576
  }
}

async function mapAndWriteData(writeHeaders, startBlock, endBlock) {

  // file related
  const headers = ['block_number', 'block_nonce', 'block_hash', 'number_txs', 'EOA-txs', 'non-EOA txs', '%EOA'];
  const fileName = `imx_dummy_devnet_stats.csv`;

  // logic related
  let rows = [];
  let row = [];
  let countEOATx = 0;
  let countNonEOATx = 0;

  if (writeHeaders) {
    await fileHandler.createFile(fileName);
    await fileHandler.writeFile(headers);
  } else {
    fileHandler.setFile(fileName);
  }


  for (let i=startBlock; i< endBlock; i++) {
    const block = await ethHandler.getBlock(i);

    row.push(Number(block.number));
    row.push(block.nonce);
    row.push(block.hash);
    row.push(block.transactions?.length?? 0);


    if (block.transactions != null) {
      block.transactions.forEach(tx => {
          if (ethHandler.isEOATransfer(tx)) countEOATx++;
          else countNonEOATx++;
      });
      row.push(countEOATx);
      row.push(countNonEOATx);
      const average = countEOATx / (countEOATx + countNonEOATx) * 100 ;
      row.push(`${average}%`);
    }

    await fileHandler.writeFile(row);
    rows.push(row);
    console.log(`Row ${i}`);
    console.log(row);
    row = [];
    countEOATx = 0;
    countNonEOATx = 0;
  }

  console.log(`Closing file..`);
  await fileHandler.closeFile();
  console.log(`Results exported to ${fileName}`);
}


async function writeImxData() {
  await mapAndWriteData(true, blockIntervalImxData.firstBatch.start, blockIntervalImxData.firstBatch.end);
  await mapAndWriteData(false, blockIntervalImxData.secondBatch.start, blockIntervalImxData.secondBatch.end);
}
 
writeImxData();
