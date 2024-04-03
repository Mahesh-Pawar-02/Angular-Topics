// Import MongoDB and connect with MongoDB
const {MongoClient} = require("mongodb");

const URL = "mongodb://localhost:27017";

const client = new MongoClient(URL);

// Import Server and connect with Server
express = require('express');
eobj = express();
port = 2100;


// MongoDB Connection
async function GetConnection()
{
    console.log("Database Connected");
    let result = await client.connect();
    let db = result.db("MarvellousInfosystems");
    return db.collection("Batches");
}

// Read Data from MongoDB
async function ReadData(req, res)
{
    let data = await GetConnection();
    data = await data.find().toArray();
    console.log("Data from the Marvellous Database is :");
    console.log(data);
    return data;
}

// Delete Data from MongoDB
async function DeleteData()
{
    let data = await GetConnection();
    let result = await data.deleteOne({"Name" : "LSP"});
    
    if(result.acknowledged)
    {
        console.log("Data gets deleted successfully");
    }
}

// Insert Data into MongoDB
async function InsertData()
{
    let data = await GetConnection();
    let result = await data.insertOne({"Name" : "PPA", "Fees" : "15500", "Duration" : "3 Months"});

    if(result.acknowledged)
    {
        console.log("Data gets inserted successfully");
    }
}

// Update Data into MongoDB
async function UpdateData()
{
    let data = await GetConnection();
    let result = await data.updateOne({"Name" : "PPA"}, {$set : {"Fees" : "21000"}});

    if(result.acknowledged)
    {
        console.log("Data gets updated successfully");
    }
}

// Start the Express Server
function StartServer()
{
    console.log("Marvellous Server started at Port :"+port);
}

// Root Page Response
function RootPage(req,res)
{
    res.send("Marvellous Server started at Port : 2100");
}

// getBatches
async function ReadBatches(req, res)
{
    // Read data from MongoDB
    let received_Data;
    received_Data = await ReadData();

    // Send data to Angular
    res.json(received_Data); 
}

// deleteBatches 
async function DeleteBatches(req, res)
{
    // Delete data from MongoDB
    DeleteData();
}

// insertBatches
async function InsertBatches(req, res)
{
    // Insert data from MongoDB
    InsertData();
}

// updateBatches
async function UpdateBatches(req, res)
{
    // Update data from MongoDB
    UpdateData();
}


function main()
{
    // 1. Listen Server
    eobj.listen(port,StartServer);

    // 2. Send Root Data
    eobj.get('/',RootPage);

    // 3. Read requested Data
    eobj.get('/getBatches',ReadBatches);

    // 4. Delete requested Data
    eobj.get('/deleteBatches',DeleteBatches);

    // 5. Insert requested Data
    eobj.get('/insertBatches',InsertBatches);

    // 6. Update requested Data
    eobj.get('/updateBatches',UpdateBatches);
}

main();