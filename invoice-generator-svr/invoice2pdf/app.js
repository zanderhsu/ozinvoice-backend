// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';

const PDFDoc = require('./gen-invoice-pdf.js');
var createError = require('http-errors');
const serverless = require('serverless-http');
const express = require('express');
const app = express();
//var bodyParser = require('body-parser')
const User = require("./User");
const Utility = require('./utils.js');
//const invoiceData = require('./invoiceData.js');

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
 */
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
//app.use(express.static(path.join(__dirname, 'public')));
const sendPDFResponse = (res,next,ret)=>{

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
}
const sendResponse = (res,next,ret)=>
{
    if(ret.success === false)
    {
        next(createError(500,ret.message?ret.message:"unknown error"))
    }
    else
    {
        res.status(200).json(ret.data)
    }
}
   

app.use((req, res,next)=>{
    let reqData = req.body;

 //   console.log("New Request:%s %s %s", req.method, req.path, req.body)
    //not all requests has a token in request.body
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
    
})

app.post('/user',async (req, res, next)=>{
    
    let ret = await User.getUserByUserName(req.user_name)
    sendResponse(res,next,ret)
})

app.post('/getpdf',async (req, res, next)=>{
    let ret = await PDFDoc(req.body)
    sendPDFResponse(res,next,ret)

})

app.post('/login',async (req, res, next)=>{
   /*no token need in checkpassord*/
    let reqData = req.body;
    let ret =  await User.checkPassword(reqData.user_name, reqData.password)
    sendResponse(res,next,ret)
})


app.post('/loginbytoken',async (req, res, next)=>{
    //to check user_name and email in DB
    let ret = await User.checkPrimaryKey(req.user_name, req.email);
    sendResponse(res,next,ret)
})

app.post("/sendvemail",async (req, res, next)=>{
    let reqData = req.body;
    let ret = await User.sendVefificationEmail(req.user_name,reqData.email)
    sendResponse(res,next,ret)
})

app.post("/verifyemail",async (req, res, next)=>{
    let reqData = req.body;
    let ret = await User.verifyEmail(reqData.vetoken)
    sendResponse(res,next,ret)
})

app.post("/sendtemppass",async (req, res, next)=>{
    let reqData = req.body;
    let ret = await User.sendTempPassword(reqData.email);
    sendResponse(res,next,ret)
})


app.put('/basics',async (req, res, next)=>{

    let reqData = req.body;

    let ret = await User.updateBasics({
        user_name:req.user_name,
        email:req.email,
        basics:reqData.basics});

    sendResponse(res,next,ret)
})

app.put("/newclient",async (req, res, next)=>{

    let reqData = req.body;

    let ret = await User.addClient({
        user_name:req.user_name,
        email:req.email,
        client:reqData.client});

    sendResponse(res,next,ret)
})

app.put("/newpayee",async (req, res, next)=>{
 
    let reqData = req.body;

    let ret = await User.addPayee({
        user_name:req.user_name,
        email:req.email,
        payee:reqData.payee});

    sendResponse(res,next,ret)
})


         
app.put("/client",async (req, res, next)=>{
    let reqData = req.body;
    let ret = await User.updateClient({
                user_name:req.user_name,
                email: req.email,
                index: reqData.index,
                client:reqData.client})
    sendResponse(res,next,ret)

})

app.put("/payee",async (req, res, next)=>{
    let reqData = req.body;
    let ret = await User.updatePayee({
                user_name:req.user_name,
                email:req.email,
                index: reqData.index,
                payee:reqData.payee })
    sendResponse(res,next,ret)
})



app.put('/newuser',async (req, res, next)=>{
    let ret = await User.addUser(reqData);
    sendResponse(res,next,ret)
})

app.put('/password',async (req, res, next)=>{
    let reqData = req.body;
    let ret = await User.changePassword({...reqData,user_name:req.user_name,email:req.email})
    sendResponse(res,next,ret)
})

app.put('/email',async (req, res, next)=>{
    let reqData = req.body;

    let ret = await User.changeEmail({
        user_name:req.user_name,
        email: req.email,
        new_email:reqData.new_email})
        sendResponse(res,next,ret)
})

app.put('/',async (req, res, next)=>{
    let ret = 
    sendResponse(res,next,ret)
})


app.delete('/client/:clientIndex',async (req, res, next)=>{
    let ret = await User.deleteClient({
        user_name:req.user_name,
        email:req.email,
        index:req.params.clientIndex})

    sendResponse(res,next,ret)
})

app.delete('/payee/:payeeIndex',async (req, res, next)=>{
    let ret = await User.deletePayee({
        user_name:req.user_name,
        email:req.email,
        index:req.params.payeeIndex})
        
    sendResponse(res,next,ret)
})

           
// ============  Rount Not found  =================
app.use(function(req, res, next) {
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

 /* exports.lambdaHandler = async (event, context) => {
}*/

exports.lambdaHandler = serverless(app);

//module.exports = app
