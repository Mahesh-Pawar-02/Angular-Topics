express = require('express');
eobj = express();
port = 5555;

// To handle CORS
// Cross Origin Resource Sharing
eobj.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin",
    "http://localhost:4200");

    res.header("Access-Control-Allow-Headers",
    "Origin, X-Requested-with, Content-Type, Accept");

    next();
});

function Starter()
{
    console.log("Marvellous serever is in listening mode at : "+port);
}

eobj.listen(port,Starter);

function MarvellousGet(req,res)
{
    res.send("Marvellous server started...");
}

eobj.get('/',MarvellousGet);

function MarvellousBatches(req,res)
{
    res.json({"Name":"PPA", "Fees" : 19500, "Duration": "4 months"});
}

eobj.get('/getBatches',MarvellousBatches);
