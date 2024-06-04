const ethHandler = require("../services/eth.handler");

async function getAccounts () {
   
    console.log(`getting accounts...`);
   const accounts = await ethHandler.getActiveAccounts();
   console.log(accounts);
}

getAccounts();
