// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';


const PDFDoc = require('./gen-invoice-pdf.js');
const DataWorker = require('./DataWorker.js')
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
function getRequestObj(path)
{
    let theArray = path.trim().split('/');
    if(theArray[0].length == 0) theArray.shift();
    if(theArray.length>1 &&theArray[theArray.length-1].length==0 )theArray.pop();
    return {
        resource:theArray[0]?theArray[0]:"",
        id:theArray[1]?theArray[1]:"",
        subResource:theArray[2]?theArray[2]:"",
        subID:theArray[3]?theArray[3]:""
    }
}

 //const handler = async (event, context) => {
  exports.lambdaHandler = async (event, context) => {
    
    /*return {
        staus: 200,
        message: "event ="+JSON.stringify(event)
    }*/
    console.log(`rawPath=${event.rawPath}`);
    console.log(`rawQueryString=${event.rawQueryString}`);
    //console.log(`event.body=${JSON.stringify(event.body)}`);
    const pathArray = event.rawPath
    const requestObj = getRequestObj(event.rawPath);

    console.log(`requestObj=${JSON.stringify(requestObj)}`);
  /*  return  {
        staus: 200,
        message: "requestObj ="+JSON.stringify(requestObj)
    }*/
    if(requestObj.resource === 'getpdf'){
        return await PDFDoc(JSON.parse(event.body));
    }
    else if(requestObj.resource === 'user')
    {
        return await DataWorker.test();
    }
    else
    {
         return  {
            staus: 500,
            message: "invalid request:"+event.rawPath
         }
    }
    
}
