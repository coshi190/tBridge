const ethers = require('ethers');
require("dotenv").config();

// CONNECT TO BLOCKCHAIN
const jbc_provider = process.env.PROVIDER_JBC;
const bsc_provider = process.env.PROVIDER_BSC;
const key = process.env.PRIVATE_KEY;

// BRIDGE SMART CONTRACTS
const jbcAddress = process.env.JBC_SC2;
const bscAddress = process.env.BSC_SC;

// TOKEN ADDRESSES
const tokenJbc = process.env.TOKEN_JBC;
const tokenBsc = process.env.TOKEN_BSC;

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

    console.log("Connecting to BSC...");
    const bscProvider = new ethers.providers.JsonRpcProvider(bsc_provider);
    const bscWallet = new ethers.Wallet(String(key), bscProvider);
    console.log("Connected! \n");

    // CONNECT TO THE BRIDGE SMART CONTRACT ON EACH NETWORK
    console.log("Connecting to JBC BRIDGE SMART CONTRACT...");
    let jbcBridge = new ethers.Contract(jbcAddress, bridgeAbi, jbcWallet);
    console.log("Connected! \n");

    console.log("Connecting to BSC BRIDGE SMART CONTRACT...");
    let bscBridge = new ethers.Contract(bscAddress, bridgeAbi, bscWallet);
    console.log("Connected! \n");

    // CONNECT TO THE TOKEN SMART CONTRACT ON EACH NETWORK
    console.log("Connecting to JBC TOKEN SMART CONTRACT...");
    let jbcToken = new ethers.Contract(tokenJbc, tokenAbi, jbcWallet);
    console.log("Connected! \n");

    console.log("Connecting to BSC TOKEN SMART CONTRACT...");
    let bscToken = new ethers.Contract(tokenBsc, tokenAbi, bscWallet);
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

    // SEND TOKENS FROM BSC BRIDGE
    const sendTokensFromBsc = async (address, amount) => {
        try {
            console.log("Sending from BSC bridge...");
            console.log("To: " + address);
            console.log("Amount: " + amount);

            // Estimate gas limit
            let gasLimit = await bscBridge.estimateGas.sendTokens(address, amount, {from: bscWallet.address});

            let tx = await bscBridge.sendTokens(address, amount, {from: bscWallet.address, gasLimit: gasLimit.toString()});

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
                sendTokensFromBsc(String(info.from), String(info.value));
            } catch (error) {
                console.log("Error on transfer from BSC bridge: " + error);
            }
        }
    });

    // LISTEN FOR TRANSFER EVENTS ON BSC
    bscToken.on("Transfer", (from, to, value) => {
            let info = {
            from: from,
            to: to,
            value: value,
        };

        if(String(to) === bscAddress) {
            try {
                sendTokensFromJbc(String(info.from), String(info.value));
            } catch (error) {
                console.log("Error on transfer from JBC bridge: " + error);
            }
        }
    });

}

main();