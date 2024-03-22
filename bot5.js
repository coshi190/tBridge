const ethers = require('ethers');
require("dotenv").config();

// CONNECT TO BLOCKCHAIN
const jbc_provider = process.env.PROVIDER_JBC;
const bkc_provider = process.env.PROVIDER_BKC;
const key = process.env.PRIVATE_KEY;

// BRIDGE SMART CONTRACTS
const jbcAddress = process.env.TAO_NFT_JBC_SC;
const bkcAddress = process.env.TAO_NFT_BKC_SC;

// ABI
const bridgeAbi = require('./JSON/NFT-BRIDGE.json');

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

    // SEND TOKENS FROM JBC BRIDGE
    const sendTokensFromJbc = async (address, id) => {
        try {
            console.log("Sending from JBC bridge...");
            console.log("To: " + address);
            console.log("Id: " + id);

            // Estimate gas limit
            let gasLimit = await jbcBridge.estimateGas.sendNFTs(address, id, {from: jbcWallet.address});

            let tx = await jbcBridge.sendNFTs(address, id, {from: jbcWallet.address, gasLimit: gasLimit.toString()});

            tx.wait();

            console.log("Sent!");

        } catch (error) {
            console.log("Error: " + error);
        }
    }

    // SEND TOKENS FROM BKC BRIDGE
    const sendTokensFromBkc = async (address, id) => {
        try {
            console.log("Sending from BKC bridge...");
            console.log("To: " + address);
            console.log("Id: " + id);

            // Estimate gas limit
            let gasLimit = await bkcBridge.estimateGas.sendNFTs(address, id, {from: bkcWallet.address});

            let tx = await bkcBridge.sendNFTs(address, id, {from: bkcWallet.address, gasLimit: gasLimit.toString()});

            tx.wait();

            console.log("Sent!");

        } catch (error) {
            console.log("Error: " + error);
        }
    }

    // LISTEN FOR TRANSFER EVENTS ON JBC
    jbcBridge.on("ReceiveNFTs", (from, nftId) => {
        let info = {
            from: from,
            nftId: nftId,
        };

        try {
            sendTokensFromBkc(String(info.from), String(info.nftId));
        } catch (error) {
            console.log("Error on transfer from BKC bridge: " + error);
        }
    });

    // LISTEN FOR TRANSFER EVENTS ON BKC
    bkcBridge.on("ReceiveNFTs", (from, nftId) => {
        let info = {
            from: from,
            nftId: nftId,
        };

        try {
            sendTokensFromJbc(String(info.from), String(info.nftId));
        } catch (error) {
            console.log("Error on transfer from JBC bridge: " + error);
        }
    });

} 

main();