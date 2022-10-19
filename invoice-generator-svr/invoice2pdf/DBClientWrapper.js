

const { DynamoDBClient,ExecuteStatementCommand  } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient,PutCommand,UpdateCommand  } = require("@aws-sdk/lib-dynamodb");

const {v4:uuid4} = require('uuid');
const USER_TABLE_NAME = "OZIUsers";
const LOG_HEADER = "[DBWrapper]:"


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

DBClientWrapper.ACTION_ADD_USER = "ADD_USER";
DBClientWrapper.ACTION_UPDATE_USER = "UPDATE_USER";
DBClientWrapper.ACTION_GET_USER_BY_NAME = "GET_USER_BY_NAME"
DBClientWrapper.ACTION_GET_USERNAME_BY_EMAIL = "GET_USERNAME_BY_EMAIL"
DBClientWrapper.ACTION_CHECK_PASSWORD = "CHECK_PASSWORD"
DBClientWrapper.ACTION_ADD_CLIENT = "ADD_CLIENT"
DBClientWrapper.ACTION_GET_CLIENTS = "GET_CLENTS"
function getSETStringforUpdateQL(user)
{
    let str=""
    for(p in user)
    {
        if(p !== 'user_name' && p!=='payee' && p!== 'clients')
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
                    let str = JSON.stringify(data).replaceAll("\"", "'"); //data is user object
                    params.Statement = `INSERT INTO ${USER_TABLE_NAME} VALUE ${str}`
                }
                break;
            case DBClientWrapper.ACTION_UPDATE_USER:
                 {
                    let user = data;
                    let setStr = getSETStringforUpdateQL(user);
                    params.Statement = `UPDATE ${USER_TABLE_NAME} ${setStr} WHERE user_name='${user.user_name}'`
                 }
                 break;
            case DBClientWrapper.ACTION_GET_USER_BY_NAME:
                {          
                    let userName = data;
                    params.Statement = `SELECT user_name,display_name,email FROM ${USER_TABLE_NAME} WHERE user_name='${userName}'`
                }
                break;
            case DBClientWrapper.ACTION_GET_USERNAME_BY_EMAIL:
                {
                    let email = data;
                    params.Statement = `SELECT * FROM ${USER_TABLE_NAME} WHERE email='${email}'`
                }
                break;
            case DBClientWrapper.ACTION_CHECK_PASSWORD:
                {
                    let {user_name, password} = {...data};
                    params.Statement = `SELECT * FROM ${USER_TABLE_NAME} WHERE user_name='${user_name}' AND password='${password}'`
                }
                break;
            case DBClientWrapper.ACTION_ADD_CLIENT:
                {
                    let {user_name, client} = data;
                    let clientStr = JSON.stringify(client).replaceAll("\"", "'");
                    params.Statement = `UPDATE ${USER_TABLE_NAME} SET clients=LIST_APPEND(clients,[${clientStr}]) WHERE user_name='${user_name}'`
                }
                break;
                
            case DBClientWrapper.ACTION_GET_CLIENTS:
                {
                    let userName = data;
                    params.Statement = `SELECT clients FROM ${USER_TABLE_NAME} WHERE user_name='${userName}'`
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
        console.log("[PartiQL]"+params.Statement);

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
   
module.exports = DBClientWrapper;