const ethers = require('ethers');
require("dotenv").config();

// CONNECT TO BLOCKCHAIN
const jbc_provider = process.env.PROVIDER_JBC;
const bkc_provider = process.env.PROVIDER_BKC;
const key = process.env.PRIVATE_KEY;

// BRIDGE SMART CONTRACTS
const jbcAddress = process.env.TAO_TOKEN_JBC_SC;
const bkcAddress = process.env.TAO_TOKEN_BKC_SC;

// TOKEN ADDRESSES
const tokenJbc = process.env.TOKEN_TAO_JBC;
const tokenBkc = process.env.TOKEN_TAO_BKC;

// ABI
const bridgeAbi = require('./JSON/BRIDGE.json');
const tokenAbi = require('./JSON/TOKEN.json');

// THE MAIN FUNCTION
const main = async () => {

    // CONNECT TO HOT WALLET
    console.log("Connecting to JBC...");
    const jbcProvider = new ethers.providers.JsonRpcProvider(jbc_provider);
    const jbcWallet = new ethers.Wallet(String(key), jbcProvider);
    console.log("Connected! \n");

    console.log("Connecting to BKC...");
    const bkcProvider = new ethers.providers.JsonRpcProvider(bkc_provider);
    const bkcWallet = new ethers.Wallet(String(key), bkcProvider);
    console.log("Connected! \n");

    // CONNECT TO THE BRIDGE SMART CONTRACT ON EACH NETWORK
    console.log("Connecting to JBC BRIDGE SMART CONTRACT...");
    let jbcBridge = new ethers.Contract(jbcAddress, bridgeAbi, jbcWallet);
    console.log("Connected! \n");

    console.log("Connecting to BKC BRIDGE SMART CONTRACT...");
    let bkcBridge = new ethers.Contract(bkcAddress, bridgeAbi, bkcWallet);
    console.log("Connected! \n");

    // CONNECT TO THE TOKEN SMART CONTRACT ON EACH NETWORK
    console.log("Connecting to JBC TOKEN SMART CONTRACT...");
    let jbcToken = new ethers.Contract(tokenJbc, tokenAbi, jbcWallet);
    console.log("Connected! \n");

    console.log("Connecting to BKC TOKEN SMART CONTRACT...");
    let bkcToken = new ethers.Contract(tokenBkc, tokenAbi, bkcWallet);
    console.log("Connected! \n");

    // SEND TOKENS FROM JBC BRIDGE
    const sendTokensFromJbc = async (address, amount) => {
        try {
            console.log("Sending from JBC bridge...");
            console.log("To: " + address);
            console.log("Amount: " + amount);

            // Estimate gas limit
            let gasLimit = await jbcBridge.estimateGas.sendTokens(address, amount, {from: jbcWallet.address});

            let tx = await jbcBridge.sendTokens(address, amount, {from: jbcWallet.address, gasLimit: gasLimit.toString()});

            tx.wait();

            console.log("Sent!");

        } catch (error) {
            console.log("Error: " + error);
        }
    }

    // SEND TOKENS FROM BKC BRIDGE
    const sendTokensFromBkc = async (address, amount) => {
        try {
            console.log("Sending from BKC bridge...");
            console.log("To: " + address);
            console.log("Amount: " + amount);

            // Estimate gas limit
            let gasLimit = await bkcBridge.estimateGas.sendTokens(address, amount, {from: bkcWallet.address});

            let tx = await bkcBridge.sendTokens(address, amount, {from: bkcWallet.address, gasLimit: gasLimit.toString()});

            tx.wait();

            console.log("Sent!");

        } catch (error) {
            console.log("Error: " + error);
        }
    }

    // LISTEN FOR TRANSFER EVENTS ON JBC
    jbcToken.on("Transfer", (from, to, value) => {
        let info = {
            from: from,
            to: to,
            value: value,
        };

        if(String(to) === jbcAddress) {
            try {
                sendTokensFromBkc(String(info.from), String(info.value));
            } catch (error) {
                console.log("Error on transfer from BKC bridge: " + error);
            }
        }
    });

    // LISTEN FOR TRANSFER EVENTS ON BKC
    bkcToken.on("Transfer", (from, to, value) => {
        let info = {
            from: from,
            to: to,
            value: value,
        };

        if(String(to) === bkcAddress) {
            try {
                sendTokensFromJbc(String(info.from), String(info.value));
            } catch (error) {
                console.log("Error on transfer from JBC bridge: " + error);
            }
        }
    });

} 

main();