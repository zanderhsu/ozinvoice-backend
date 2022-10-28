

const { DynamoDBClient,ExecuteStatementCommand,BatchExecuteStatementCommand, ExecuteTransactionCommand  } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient,PutCommand,UpdateCommand  } = require("@aws-sdk/lib-dynamodb");

const {v4:uuid4} = require('uuid');
const USER_TABLE_NAME = "OZI-Users";
const LOG_HEADER = "[DBWrapper]:"
const { unmarshall } = require("@aws-sdk/util-dynamodb")

const gDynamoDBClient = new DynamoDBClient({region:"ap-southeast-2"});
let gDDBDocClient;

//console.log("ALL Envoriment Variables:"+JSON.stringify(process.env));
const DBClientWrapper = {}
DBClientWrapper.init = ()=>{
    const dbClient = new DynamoDBClient({region:"ap-southeast-2"});
    const marshallOptions = {
        // Whether to automatically convert empty strings, blobs, and sets to `null`.
        convertEmptyValues: false, // false, by default.
        // Whether to remove undefined values while marshalling.
        removeUndefinedValues: false, // false, by default.
        // Whether to convert typeof object to map attribute.
        convertClassInstanceToMap: false, // false, by default.
      };
      
      const unmarshallOptions = {
        // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
        wrapNumbers: false, // false, by default.
      };

    const translateConfig = { marshallOptions, unmarshallOptions };

    // Create the DynamoDB document client.
    gDDBDocClient = DynamoDBDocumentClient.from(dbClient, translateConfig);


}

DBClientWrapper.ACTION_ADD_USER = "ADD_USER"
DBClientWrapper.ACTION_UPDATE_BASICS = "UPDATE_BASICS"
DBClientWrapper.ACTION_ADD_PAYEE = "ADD_PAYEE"
DBClientWrapper.ACTION_UPDATE_PAYEE = "UPDATA_PAYEE"
DBClientWrapper.ACTION_DELETE_PAYEE = "DELETE_PAYEE"
DBClientWrapper.ACTION_GET_USER_BY_NAME = "GET_USER_BY_NAME"
DBClientWrapper.ACTION_GET_SIMPLE_BY_NAME = "GET_SIMPLE_BY_NAME"
DBClientWrapper.ACTION_GET_SIMPLE_BY_EMAIL = "GET_SIMPLE_BY_EMAIL"
DBClientWrapper.ACTION_SET_PASSWORD = "SET_PASSWORD"
DBClientWrapper.ACTION_SET_EMAIL_VERIFIED = "SET_EMAIL_VERIFIED"
DBClientWrapper.ACTION_SET_TEMP_PASSSWORD = "SET_TEMP_PASSSWORD"
DBClientWrapper.ACTION_ADD_CLIENT = "ADD_CLIENT"
DBClientWrapper.ACTION_UPDATE_CLIENT = "UPDATE_CLIENT"
DBClientWrapper.ACTION_DELETE_CLIENT = "DELETE_CLIENT"
DBClientWrapper.ACTION_GET_CLIENTS = "GET_CLENTS"
DBClientWrapper.TRANSACTION_CHANGE_EMAIL = "TRANSACTION_CHANGE_EMAIL"

function getSETStringforUpdateQL(user)
{
    let str=""
    for(p in user)
    {
        if(p !== 'user_name' && p!=='email' && p!=='payee' && p!== 'clients' )
        {
            str += `SET ${p}='${user[p]}' `
        }
    }
    return str;
}

DBClientWrapper.submitRequest = async(action,data)=>
{
    return new Promise((resolve,reject)=>{
  
        let params ={Statement:""};
        switch(action)
        {
            case DBClientWrapper.ACTION_ADD_USER:
                {
                    let user = data
                    let str = JSON.stringify(user).replaceAll("\"", "'"); //data is user object
                    params.Statement = `INSERT INTO "${USER_TABLE_NAME}" VALUE ${str}`
                }
                break;
 
            case DBClientWrapper.ACTION_UPDATE_BASICS:
                 {
                    let paramObj = data;
                    let basicsStr = JSON.stringify(data.basics).replaceAll("\"", "'"); 
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET basics=${basicsStr} WHERE user_name='${paramObj.user_name}' AND email='${paramObj.email}'`
                 }
                 break;
  
            case DBClientWrapper.ACTION_GET_USER_BY_NAME:
                {          
                  let userName = data;
                  params.Statement = `SELECT * FROM "${USER_TABLE_NAME}" WHERE user_name='${userName}'`
                }
                break;
            case DBClientWrapper.ACTION_GET_SIMPLE_BY_NAME:
                {          
                    let userName = data;
                    params.Statement = `SELECT password,email,temp_password FROM "${USER_TABLE_NAME}" WHERE user_name='${userName}'`
                  }
                  break;
            case DBClientWrapper.ACTION_GET_SIMPLE_BY_EMAIL:
                {
                    let email = data;
                    params.Statement = `SELECT user_name,password FROM "${USER_TABLE_NAME}" WHERE email='${email}'`
                }
                break;

            case DBClientWrapper.ACTION_SET_PASSWORD:
                {
                    let {user_name, new_password,email} = {...data}
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET password='${new_password}' WHERE user_name='${user_name}' AND email='${email}'`
                }
                break;
            case DBClientWrapper.ACTION_SET_EMAIL_VERIFIED:
                {
                    let {user_name, email, isVerified} = {...data}
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET email_verified=${isVerified} WHERE user_name='${user_name}' AND email='${email}'`
                    break;
                }
                case DBClientWrapper.ACTION_SET_TEMP_PASSSWORD:
                {
                    let {user_name, email, temp_password} = {...data} //temp_password = {password:xx, expire_time:xxx}
                    let tmpStr = JSON.stringify(temp_password).replaceAll("\"", "'");
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET temp_password=${tmpStr} WHERE user_name='${user_name}' AND email='${email}'`
                    break;
                }
                          
            case DBClientWrapper.ACTION_ADD_CLIENT:
                {   /*keyObj ={user_name:xxx, email:xxx }, as update need both keys*/
                    let paramObj = data;
                    let clientStr = JSON.stringify(paramObj.client).replaceAll("\"", "'");
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET clients=LIST_APPEND(clients,[${clientStr}]) WHERE user_name='${paramObj.user_name}' AND email='${paramObj.email}'`
                }
                break;
            case DBClientWrapper.ACTION_ADD_PAYEE:
                {
                    let paramObj = data;
                    let payeeStr = JSON.stringify(paramObj.payee).replaceAll("\"", "'");
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET payees=LIST_APPEND(payees,[${payeeStr}]) WHERE user_name='${paramObj.user_name}' AND email='${paramObj.email}'`
                }
                break;
            case DBClientWrapper.ACTION_UPDATE_CLIENT:
                {   /*paramObj ={user_name:xxx, email:xxx,client:{} }, as update need both keys*/
                    let paramObj = data;
                    let clientStr = JSON.stringify(paramObj.client).replaceAll("\"", "'");
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET clients[${paramObj.client.client_id}]=${clientStr} WHERE user_name='${paramObj.user_name}' AND email='${paramObj.email}'`
                }
                break;
            case DBClientWrapper.ACTION_UPDATE_PAYEE:
                {   /*paramObj ={user_name:xxx, email:xxx,client:{} }, as update need both keys*/
                    let paramObj = data;
                    let payeeStr = JSON.stringify(paramObj.payee).replaceAll("\"", "'");
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" SET payees[${paramObj.payee.payee_id}]=${payeeStr} WHERE user_name='${paramObj.user_name}' AND email='${paramObj.email}'`
                }
                break;    
            case DBClientWrapper.ACTION_GET_CLIENTS:
                {
                    let userName = data;
                    params.Statement = `SELECT clients FROM "${USER_TABLE_NAME}" WHERE user_name='${userName}'`
                }
                break;
            case DBClientWrapper.ACTION_DELETE_CLIENT:
                {
                    let whichClient = data;
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" REMOVE clients[${whichClient.client_id}] WHERE user_name='${whichClient.user_name}' AND email='${whichClient.email}'`
                }
                break;
            case DBClientWrapper.ACTION_DELETE_PAYEE:
                {
                    let whichPayee = data;
                    params.Statement = `UPDATE "${USER_TABLE_NAME}" REMOVE payees[${whichPayee.payee_id}] WHERE user_name='${whichPayee.user_name}' AND email='${whichPayee.email}'`
                }
                break;
            
            default:
                {
                    let retStr = `${LOG_HEADER}ACTION UNKNOWN:${action}`;
                    console.log(retStr)
                    reject(retStr)
                }
                return;
        }
        //console.log("[PartiQL]"+params.Statement);

        gDDBDocClient.send(new ExecuteStatementCommand(params))
                .then((data)=>{
                    resolve(data)
                    console.log(`${LOG_HEADER}${action} in THEN!`);
                })
                .catch((error)=>{
                    console.log(`${LOG_HEADER}${action} in CATCH!`);
                    reject(error);
                })
    });
}
DBClientWrapper.IsEmailExist = async(email)=>{

    let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_SIMPLE_BY_EMAIL,email.toLowerCase())
    if( ret.Items.length > 0)
    {
        return true
    }
    return false
}

/*
dataO:{
    user_name:
    email:
    new_email:
}



*/
DBClientWrapper.changeEmail = async(paramObj)=>
{
    //console.log("paramObj="+JSON.stringify(paramObj))
    return new Promise(async(resolve,reject)=>{
        try
        {
            paramObj.email = paramObj.email.toLowerCase();
            paramObj.new_email = paramObj.new_email.toLowerCase();

            //check whether the new email address has been used
            if(await DBClientWrapper.IsEmailExist(paramObj.new_email))
            {
                reject({
                    name:"the email address has been registered by someone else",
                    $fault:"client"});
                return;
            }

            //get and save original data at first
            let params= {Statement:`SELECT * FROM "${USER_TABLE_NAME}" WHERE user_name='${paramObj.user_name}'`}
            let result = await gDDBDocClient.send(new ExecuteStatementCommand(params))
        
            if(result.Items.length > 0)
            {
                let originalItem = unmarshall(result.Items[0])
                originalItem.email = paramObj.new_email
                originalItem.email_verified = false;
                let originalItemStr = JSON.stringify(originalItem).replaceAll("\"", "'");
                params ={
                    TransactStatements:[

                        {
                            Statement:`DELETE FROM "${USER_TABLE_NAME}" WHERE user_name='${paramObj.user_name}' AND email='${paramObj.email}'`
                        },
                        {
                            Statement:`INSERT INTO "${USER_TABLE_NAME}" VALUE ${originalItemStr}`                      
                        }]
                }
    
                result = await gDDBDocClient.send(new ExecuteTransactionCommand(params))
                
                resolve(result)
                console.log(`${LOG_HEADER}Change email Transaction Succeeded!`);
            }
            else
            {
                reject({
                    name:"User name is wrong",
                    $fault:"client"});
            }

        }
        catch(error)
        {
            console.log(`${LOG_HEADER}$Change email, query data in CATCH: ${error}`);
            reject(error);
        }
    }) 
    
}

module.exports = DBClientWrapper;