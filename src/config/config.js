const config = {
    externalImxConfig : {
        rpcProvider:`http://35.208.84.178:8545`,
        accounts:
         [
            "0x85b97ba3fd34f012d788415e0a6bfc506b3c4816d26f18602066f7e36e5f75df",
            "0x5494ad4fb53f00bbfa18f4eabc72be4af3a7595bbdd232d92f5e461e04d5990d",
            "0x31857fe2167cc4a7d923f83890c8923ad7a1fa42563e834a4b1d06b7c78f4136",
            "0x77cc1914afe06fe17a70a064ee4242e557a2e06bacfa45c7c8ebee408ddd0348",
            "0xfd13fdec062e22b009ea53897a0cb6f3a601cc80b6d78fb755c8657817d9fa60",
            "0x36d4a2d026b90827cb0be2aba27fa4afeb351dca4c195b13208ed95987ebe0e3",
            "0x4b2ad4154658b5f30f3997f5e7cb3f541843dfe80e4bbfc2734b6d86aa7e4a67",
            "0xb293e17faa2dd4df12c55f694b09eb9ecd9a3da5c9ad2e12060df5f303895990",
            "0x699e688e4610582620f787293d5eaaed6768e8b8e6b31334eb35fc9e2aa383ed",
            "0xad2ed0036525e0f063bada4d69d3ced66c64e56cfb35f70e4f263ac69c506456"
        ],
        txSamples:
        [  
            "0x467789f89c8876edfc164429fbc4014534663a5c799c6c970b689d3b95cbe820",
            "0x9e8440ba13d11728e6646376e2b72041e0c05df080932f50b3c248b1f663c4c3"
        ]
    },
    internalImxConfig: {
        // rpcProvider: 'http://35.208.68.173:8545',
        rpcProvider: 'http://127.0.0.1:7545',
        defaultAccount: {
            mnemonic: 'code code code code code code code code code code code quality',
            // privateKey: '0x42b6e34dc21598a807dc19d7784c71b2a7a01f6480dc6f58258f78e539f1a1fa',
            // publicAddress: '0x85da99c8a7c2c95964c8efd687e95e632fc533d6',
            privateKey: '0x6421222a9964cbe1b411191dcac1afda173ed99346c47302c6fe88f65d83583e',
            publicAddress: '0x964ec59D0E05Db08440c822d7C588e63BBDE8c4e',
        },
        accountDummy: {
            privateKey: '0xb1bfcac96257b3392356f3f7dae2f041c539fe2692bbfa6d9da737d867094246',
            publicAddress: '0xfa2BC769A61359fCFF98FC1B2168A9E9561a7534',
        },
        validatorContract: {
            address: '0x4242424242424242424242424242424242424242'
        }
    }
};

 module.exports = config;