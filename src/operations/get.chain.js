const ethHandler = require("../services/eth.handler");

async function getChainId () {
    return ethHandler.getChainId();
}

getChainId();
