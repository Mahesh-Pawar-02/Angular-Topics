express = require('express');

eobj = express();

port = 5200;

function Starter()
{
    console.log("Marvellous server is started at port 5200");
}

eobj.listen(port,Starter);

function AcceptRequest(req,res)
{
    res.send("Marvellous server is ON...");
}

BalanceAmount = 10000;

eobj.get('/',AcceptRequest);

function CreditAmount(req,res)
{
    value = req.query.Amount;
    BalanceAmount = BalanceAmount + Number(value);
    res.send("Credit option is selected and balance is : "+BalanceAmount);
}

eobj.get('/Credit',CreditAmount);

function DebitAmount(req,res)
{
    value = req.query.Amount;
    BalanceAmount = BalanceAmount - Number(value);
    res.send("Debit option is selected and balance is : "+BalanceAmount);
}

eobj.get('/Debit', DebitAmount);