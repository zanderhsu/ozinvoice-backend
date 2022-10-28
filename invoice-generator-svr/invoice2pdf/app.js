const PDFDoc = require('./gen-invoice-pdf.js');
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
function getRouteObj(event)
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
    
    console.log(`rawPath=${event.rawPath}`);
    //console.log(`rawQueryString=${event.rawQueryString}`);
    const routeObj = getRouteObj(event);
 
    console.log(`routeObj=${JSON.stringify(routeObj)}`);
   
    try{
            let reqData = null;
            let user_name = ""
            let email = ""
            if(event.body !== "")
            {
                reqData = JSON.parse(event.body);
            }
            //console.log(`event.body = ${event.body}`)
            if(reqData.token !== undefined && reqData.token !== "")
            {
              let decryped = Utility.decodeTokenToData(reqData.token);
              user_name = decryped.user_name;
              email = decryped.email;

              if(user_name === "" || email === "")
              {
                    return  {
                        statusCode: 501,
                        body:JSON.stringify({message:"Token Invalid"})
                    }
              }
            }
            
           // console.log(`user_name=${user_name}, email=${email}`)
            if(routeObj.method === "POST") 
            {  
                if(routeObj.resource === 'user')
                {
                    return await User.getUserByUserName(user_name);
                }

                if(routeObj.resource === 'getpdf')
                {
                    return await PDFDoc(reqData);
                }
                
                if(routeObj.resource === 'login')
                {   /*no token need in checkpassord*/
                    return await User.checkPassword(reqData.user_name, reqData.password)
                }
                
                if(routeObj.resource === 'loginbytoken')
                {
                    //to check user_name and email in DB
                    return await User.checkPrimaryKey(user_name, email);
                }

                if(routeObj.resource === "sendvemail")
                {
                    return await User.sendVefificationEmail(user_name,reqData.email)
                }

                if(routeObj.resource === "verifyemail")
                {
                    return await User.verifyEmail(reqData.vetoken)
                }
                if(routeObj.resource === "sendtemppass")
                {
                    return await User.sendTempPassword(reqData.email);
                }
            }
            
            if(routeObj.method === "GET") 
            {

                if(routeObj.resource === "clients") 
                {
                    //get all clients   
                    return await User.getClients(user_name)
                }
                     
            }
            
            if(routeObj.method === "PUT") 
            {
                if(routeObj.resource === 'basics')
                {
                    return await User.updateBasics({
                        user_name:user_name,
                        email:email,
                        basics:reqData.basics});
                }

                if(routeObj.resource === "newclient")
                {
                    return await User.addClient({
                        user_name:user_name,
                        email:email,
                        client:reqData.client});
                }

                if(routeObj.resource === "newpayee")
                {
                    return await User.addPayee({
                        user_name:user_name,
                        email:email,
                        payee:reqData.payee});
                }
                
                if(routeObj.resource === "client")
                {
                    return await User.updateClient({
                        user_name:user_name,
                        email: email,
                        client:reqData.client})
                }

                if(routeObj.resource === "payee")
                {
                    //updating a payee                            
                    return await User.updatePayee({
                        user_name:user_name,
                        email:email,
                        payee:reqData.payee })
                }

                if(routeObj.resource === 'newuser')
                {
                    return await User.addUser(reqData);
                }

                if(routeObj.resource === 'password')
                {
                    return await User.changePassword({...reqData,user_name:user_name,email:email})
                }

                if(routeObj.resource === 'email')
                {
                    return await User.changeEmail({
                        user_name:user_name,
                        email: email,
                        new_email:reqData.new_email})
                }
            }
            
            if(routeObj.method === "DELETE")
            {
                if(routeObj.resource === 'client' && routeObj.id !== "")
                {
                    //delete a client
                    return await User.deleteClient({
                        user_name:user_name,
                        email:email,
                        client_id:routeObj.id})                    
                }

                if(routeObj.resource === 'payee' && routeObj.id !== "")
                {
                    //delete a client
                    return await User.deletePayee({
                        user_name:user_name,
                        email:email,
                        payee_id:routeObj.id})                    
                }
            }
    }
    catch(err)
    {
        return  {
            statusCode: 510,
            body:JSON.stringify({message:"Promise Rejected:"+err})
        }
    }

   
    return {
        statusCode: 520,
        body: JSON.stringify({message: `invalid Request:event.rawPath = ${event.rawPath},event.routeKey=${event.routeKey}`})
    }
    
}


