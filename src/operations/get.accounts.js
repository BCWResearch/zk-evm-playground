const config = require('./../config/config');
const ethHandler = require('../services/eth.handler');

async function listAccounts() {
    ethHandler.setProvider(config.imxConfig.accounts);
}

listAccounts();
