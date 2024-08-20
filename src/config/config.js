const config = {
    externalImxConfig: {
        rpcProvider: `http://35.208.84.178:8545`,
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
        rpcProvider: 'http://44.215.105.45:8545',
        // rpcProvider: 'http://127.0.0.1:7545',
        defaultAccount: {
            mnemonic: 'code code code code code code code code code code code quality',
            privateKey: '0xabe883de5773c0aa72b65d46180dd4ab6e95ccf7c7781f455e03741fa7c41ae6',
            publicAddress: '0x1B11dc3F7568E728a057ca60d68285bd06094F98',
            privateKey2: '0x5494ad4fb53f00bbfa18f4eabc72be4af3a7595bbdd232d92f5e461e04d5990d',
            privateKey3: '0x31857fe2167cc4a7d923f83890c8923ad7a1fa42563e834a4b1d06b7c78f4136',
            privateKey4: '0x77cc1914afe06fe17a70a064ee4242e557a2e06bacfa45c7c8ebee408ddd0348',
            publicAddress2: '0x964ec59D0E05Db08440c822d7C588e63BBDE8c4e',
            // privateKey: '0xe79a26e98ad10db36e8d31cd0bcf93114d53f8acf99b0440d6a3ffb176a9cd98',
            // publicAddress: '0x6e5C0ac738E7fd20227A1Ca9f8bCD802E109b471',
            // privateKey: '0x0ff28f44a47484706d12ce3ad203d5424b6d1c1c003c98853bd42b295c86f91a',
            // publicAddress: '0xcfe521bdf015C7Cad2Da8766CDC242FCB28Ef028',
            // privateKey: '0xce509aa3945e98ffd706d3c850a6160a6ae162a4d5f6270fe1683401cf3160a5',
            // publicAddress: '0xfB68d6ec2636a5eE255E1D9401712409e2430d7b',
            // privateKey: '0xb5431beba55b8394ba192e8f1a6beb6e55d8cb21895a2d1957fe3a545b90b676',
            // publicAddress: '0x0d4e5491610a61ca674bD0E6cF57beDb43ccBdAf',
        },
        executorAccount: {
            privateKey: '0x1382a7ad39f49346bf890a0c5b3b8aec820cc37a06a5bd0a24dd1035f84d160c',
            publicAddress: '0x62210AF667D8c4b15Ab07c88541b562426D41604',
        },
        anotherAccount: {
            privateKey: '0xf8158fb8a9f37093d009cbf7392cf51c36cd49f1514f99c803f7d47ce3cb1f21',
            publicAddress: '0x010530C8066681d20412DE14FBbFa21565956826',
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