// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';

const PDFDoc = require('./gen-invoice-pdf.js');
var createError = require('http-errors');
var CONSTVALUES = require('./CONSTVALUES.js')

const serverless = (CONSTVALUES.ENVIROMENT === CONSTVALUES.PRODUCT)?require('serverless-http'):null;
const express = require('express');
const app = express();
const User = require("./User");
const Utility = require('./utils.js');
var cors = (CONSTVALUES.ENVIROMENT === CONSTVALUES.MYNODEJS)?require('cors'):null;


app.use(express.json())
app.use(express.urlencoded({ extended: false }));

if(CONSTVALUES.ENVIROMENT === CONSTVALUES.MYNODEJS)
{    
    app.use(cors())
}

const sendResponse = (res,next,ret)=>
{
    if(ret.success === false)
    {
        console.log("ret.message:"+ret.data.message)
        let message = ret.data.message
        next(createError(500,message?message:"unknown error"))
    }
    else
    {
        res.status(200).json(ret.data)
    }
}
   
const initPerRequest = (req,res,next)=>{
    let reqData = req.body;
   
    //   console.log("New Request:%s %s %s", req.method, req.path, req.body)

    if((typeof reqData.token !== 'undefined') && reqData.token !== "")
    {
        let decryped = Utility.decodeTokenToData(reqData.token);
        user_name = decryped.user_name;
        email = decryped.email;

        if(user_name === "" || email === "")
        {
            netx(createError(501,"Token Invalid"))
        }
        else
        {
            req.user_name = user_name
            req.email = email
            next()
        }
    }
    else
    {
        next()
    }
}

app.use(initPerRequest)

/*
app.options('/*', (req,res)=>{
    res.sendStatus(200)
})*/

app.post('/user', (req, res, next)=>{
    
    User.getUserByUserName(req.user_name)
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
  
})

app.post('/getpdf', (req, res, next)=>{
    PDFDoc(req.body)
    .then((ret)=>{
        if(ret.success === false)
        {
            next(createError(500,ret.message?ret.message:"unknown error"))
        }
        else
        {
            res.status(200)
            res.set({
                "content-disposition": "attachment; filename=MyInvoice.pdf",
                "content-type": "application/pdf"
            })
            res.send(ret.data) 
        }
    })
    .catch(next)
})

app.post('/login', (req, res, next)=>{
   /*no token need in checkpassord*/
    let reqData = req.body;
    User.checkPassword(reqData.user_name, reqData.password)
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})


app.post('/loginbytoken', (req, res, next)=>{
    //to check user_name and email in DB
    User.checkPrimaryKey(req.user_name, req.email)
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
   
})

app.post("/sendvemail", (req, res, next)=>{
    let reqData = req.body;
    User.sendVefificationEmail(req.user_name,reqData.email)
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
   
  
})

app.post("/verifyemail", (req, res, next)=>{
    let reqData = req.body;
    User.verifyEmail(reqData.vetoken)
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})

app.post("/sendtemppass", (req, res, next)=>{
    let reqData = req.body;
    User.sendTempPassword(reqData.email)
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})


app.put('/basics', (req, res, next)=>{

    let reqData = req.body;
    User.updateBasics({
        user_name:req.user_name,
        email:req.email,
        basics:reqData.basics})
        .then((ret)=>{
            sendResponse(res,next,ret)
        })
        .catch(next)
})

app.put("/newclient",(req, res, next)=>{

    let reqData = req.body;

    User.addClient({
        user_name:req.user_name,
        email:req.email,
        client:reqData.client})
        .then((ret)=>{
            sendResponse(res,next,ret)
        })
        .catch(next)
})

app.put("/newpayee", (req, res, next)=>{
 
    let reqData = req.body;

    User.addPayee({
        user_name:req.user_name,
        email:req.email,
        payee:reqData.payee}) 
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})


         
app.put("/client/:clientIndex", (req, res, next)=>{
    let reqData = req.body;
    User.updateClient({
        user_name:req.user_name,
        email: req.email,
        index: req.params.clientIndex,
        client:reqData.client})
        .then((ret)=>{
            sendResponse(res,next,ret)
        })
        .catch(next)

})

app.put("/payee/:payeeIndex", (req, res, next)=>{
    let reqData = req.body;
    User.updatePayee({
                user_name:req.user_name,
                email:req.email,
                index: req.params.payeeIndex,
                payee:reqData.payee })
        .then((ret)=>{
            sendResponse(res,next,ret)
        })
        .catch(next)
})



app.put('/newuser',(req, res, next)=>{
    let reqData = req.body;
    User.addUser(reqData)
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})

app.put('/password', (req, res, next)=>{
    let reqData = req.body;
    User.changePassword({...reqData,user_name:req.user_name,email:req.email})
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})

app.put('/email', (req, res, next)=>{
    let reqData = req.body;

    User.changeEmail({
        user_name:req.user_name,
        email: req.email,
        new_email:reqData.new_email})
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})

app.delete('/client/:clientIndex', (req, res, next)=>{
    User.deleteClient({
        user_name:req.user_name,
        email:req.email,
        index:req.params.clientIndex})
    .then((ret)=>{
        sendResponse(res,next,ret)
    })
    .catch(next)
})

app.delete('/payee/:payeeIndex', (req, res, next)=>{
    User.deletePayee({
        user_name:req.user_name,
        email:req.email,
        index:req.params.payeeIndex})
        .then((ret)=>{
            sendResponse(res,next,ret)
        })
        .catch(next)
})

           
// ============  Rount Not found  =================
app.use(function(req, res, next) {
    console.log("Invalid: %s %s", req.method, req.path)
    next(createError(404,"Invalid Path"));
  })
  
// ===========  Error handler  ==================
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
   // res.locals.message = err.message;
   // res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status).json({message: err.message})
})

 
 /**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 *
 exports.lambdaHandler = async (event, context) => {
}*/


if(CONSTVALUES.ENVIROMENT === CONSTVALUES.MYNODEJS )
{
    module.exports = app
}
else
{
    exports.lambdaHandler = serverless(app);
}