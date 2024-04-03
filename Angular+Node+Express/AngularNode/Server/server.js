const express = require('express');
const app = express();

app.listen(5100, function(req,res){
  console.log("Marvellous Server is started succesfully");
});

//Handling cors
app.use((req,res,next)=>{
  res.header("Access-Control-Allow-Origin",
  "http://localhost:4200");

  res.header("Access-Control-Allow-Headers",
  "Origin, X-Requested-with, Content-Type, Accept");

  next();
});

app.get('/',MarvellousGet);

function MarvellousGet(req,res)
{
  res.send("Marvellous Server is ON");
}

app.get('/getBatches',MarvellousGetBatches);

function MarvellousGetBatches(req,res)
{
  res.json({"batch":"PPA", "Fees": 18500});
}