const { SIGHUP } = require('constants');
var express = require('express');
var app = express();

app.set('view engine', 'ejs')

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { stringify } = require('querystring');

const ccPath = path.resolve(__dirname, "connection.json");
const ccpJSON = fs.readFileSync(ccPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


app.get('/', function (req, res) {
    res.render('index');
});

app.get('/query', async function (req, res) {
    const query_responses = await getQueryResult();
    if (query_responses) {
        res.send(JSON.stringify(query_responses.toString()));
    } else {
        console.log("No payloads were returned from query")
    }
});

app.post('/ship', async function (req, res) {
    const query_responses = await ship();
    if (query_responses) {
        res.json('User added successfully')
    } else {
        console.log("No payloads were returned from query")
    }

});

async function getQueryResult() {
    try {

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('assetmgr');
        const result = await contract.evaluateTransaction('query','100');

        return result;

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }

}

async function ship(){
    try{
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user1');
        if(!userExists){
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {wallet, identity:'user1', discovery:{enabled:false}});

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('assetmgr');

        await contract.submitTransaction("Ship","100","OEM deliver ipad to school","New Jersey");
        console.log('Transaction has been submitted');

        await gateway.disconnect();


    } catch (error){
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }

}

app.listen(3000, function(){
    console.log('Example app listening on port 3000!');
});