import * as algokit from '@algorandfoundation/algokit-utils';

async function main() {
    const algorand = algokit.AlgorandClient.defaultLocalNet() //gives default localnet client meaning we will be interacting with the localnet running in our codespace

    //create accounts
    const alice = algorand.account.random()
    const bob = algorand.account.random()

    //
    console.log("alice: ", alice.addr);
    console.log("bob: ", bob.addr);
    
    // console.log("alice info: ", alice);
    
    console.log("Alice's amount: ", (await algorand.account.getInformation(alice.addr)).amount);
    
    const dispenser = await algorand.account.dispenser();
    
    await algorand.send.payment({
        sender: dispenser.addr,
        receiver: alice.addr,
        amount: algokit.algos(10)
        //1 algo = 10^6 microalgos
    })

    await algorand.send.payment({
        sender: dispenser.addr,
        receiver: bob.addr,
        amount: algokit.algos(10)
        //1 algo = 10^6 microalgos
    })
    
    console.log("Alice's amount: ", (await algorand.account.getInformation(alice.addr)).amount);
    
    const createRes = await algorand.send.assetCreate({
        sender: alice.addr,
        total: 100n
    })

    console.log("Result: ",createRes);

    const assetId = BigInt(createRes.confirmation.assetIndex!)

    console.log("Asset id: ", assetId);

    console.log("Bob's MBR before opt-in: ", (await algorand.account.getInformation(bob.addr)).minBalance);
    await algorand.send.assetOptIn({
        sender: bob.addr,
        assetId
    })
    console.log("Bob's MBR after opt-in: ", (await algorand.account.getInformation(bob.addr)).minBalance);
    
    await algorand.send.assetTransfer({
        sender: alice.addr,
        receiver: bob.addr,
        amount: 2n,
        assetId
    })
    
    console.log("alice's asset baloance: ", await algorand.account.getAssetInformation(alice.addr, assetId));
    console.log("bob's asset baloance: ", await algorand.account.getAssetInformation(bob.addr, assetId));
    
    //new task: 
    // we want bob to send alice the asset
    // in return alice will send bob some algo
    // one way to do this is follows:  
    // await algorand.send.payment({
    //     sender: alice.addr,
    //     receiver: bob.addr,
    //     amount: algokit.algos(1)
    // })
    // await algorand.send.assetTransfer({
    //     sender: bob.addr,
    //     receiver: alice.addr,
    //     assetId,
    //     amount: 1n
    // })
    // to ensure both parties satisfy their end of the bargain, we merge the 2 trxns into one "atomic trxn"
    
    await algorand.newGroup().addPayment({
        sender: alice.addr,
        receiver: bob.addr,
        amount: algokit.algos(1)
    }).addAssetTransfer({
        sender: bob.addr,
        receiver: alice.addr,
        assetId,
        amount: 1n
    }).execute()
    console.log("alice's asset baloance: ", await algorand.account.getAssetInformation(alice.addr, assetId));
    console.log("bob's asset baloance: ", await algorand.account.getAssetInformation(bob.addr, assetId));
    console.log("Bob's MBR after token trfr: ", (await algorand.account.getInformation(bob.addr)).minBalance);
    
    await algorand.send.assetTransfer({
        sender: bob.addr,
        receiver: alice.addr,
        assetId,
        amount: 0n,
        closeAssetTo: alice.addr // sends all remaining assets to alice
    })
    console.log("alice's asset balance: ", await algorand.account.getAssetInformation(alice.addr, assetId));
    console.log("Bob's MBR after opt-out: ", (await algorand.account.getInformation(bob.addr)).minBalance);
    
}

main();