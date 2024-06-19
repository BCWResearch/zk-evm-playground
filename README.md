# zk-evm-playground
A set of tools and snippets to facilitate data mapping for zk-evm

# Quick-start
Designed to work with the zk-evm services of BCW for things such as
Map type of data available in the test nodes
Write dummy data
Fetch metadata
And so on.

## Scripts 
#### map:data 
Exports data from the node to a csv 

#### set:eoa:transfer
Writes eoa transfer to an RPC provider

```bash
npm run set:eoa:transfer -- --txs=10
```

#### set:nft:transfer
Writes nft transfer to an RPC provider

```bash
npm run set:nft:transfer -- --txs=10
```

#### chain
Returns the chain for the RPC provider
    
