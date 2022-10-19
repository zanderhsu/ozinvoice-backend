// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';


const PDFDoc = require('./gen-invoice-pdf.js');

const User = require("./User")
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
function getRequestObj(event)
{
    let rawPath = event.rawPath;
    let method = event.routeKey.split(" ")[0];
    let theArray = rawPath.trim().split('/');
    if(theArray[0].length == 0) theArray.shift();
    if(theArray.length>1 &&theArray[theArray.length-1].length==0 )theArray.pop();
    return {
        method:method,
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
   
    const requestObj = getRequestObj(event);

    console.log(`requestObj=${JSON.stringify(requestObj)}`);
  /*  return  {
        staus: 200,
        message: "requestObj ="+JSON.stringify(requestObj)
    }*/
    
    try{
            if(requestObj.method === "POST") 
            {   if(requestObj.resource === 'getpdf')
                {
                    console.log("start calling PDFDoc")
                    return await PDFDoc(JSON.parse(event.body));
                }
                else if(requestObj.resource === 'login')
                {
                    let param = JSON.parse(event.body)
                    return await User.checkPassword(param.user_name, param.password)
                }
            }
            else if(requestObj.method === "GET") 
            {
                if(requestObj.resource === 'user')
                {
                    if(requestObj.id !== "")
                    {
                        if(requestObj.subResource === "")
                        {
                            return await User.getUserByUserName(requestObj.id);
                        }
                        else if(requestObj.subResource === "clients") //won't check subid
                        {
                             //get all clients   
                             return await User.getCients(requestObj.id)
                        }
                        else if(requestObj.subResource === "client" &&requestObj.subID !=="" )
                        {
                            //get one certain client
                        }
                    }
                    
                }
            }
            else if(requestObj.method === "PUT") 
            {
                if(requestObj.resource === 'user')
                {
                    if(requestObj.id !== "")
                    {
                        if(requestObj.subResource === "")
                        {
                            console.log("in handler: event.body="+JSON.stringify(event.body));
                            return await User.updateUser(JSON.parse(event.body));
                        }
                        else
                        {

                        }
                    }
                }
            }
            else
            {
                return  {
                    stausCode: 500,
                    message: "invalid request:"+event.rawPath
                }
            }
    }catch(err)
    {
        return  {
            stausCode: 500,
            message: "Promise Rejected:"+err
        }
    }
    
}
