const {User,Client} = require('./User');
const { DataMapper } = require('@aws/dynamodb-data-mapper');
const DynamoDBClient = require('aws-sdk/clients/dynamodb');

//const { DynamoDBClient, BatchExecuteStatementCommand } = require("@aws-sdk/client-dynamodb");
//const AWS = require('@aws-sdk')
const {v4:uuid4} = require('uuid');
//const dotEnv = require('dotenv')
//console.log("AWS loading config file")
//AWS.config.loadFromPath('./config.json');

//dotEnv.config();

console.log("ALL Envoriment Variables:"+JSON.stringify(process.env));
const DataWorker = {}
DataWorker.test = async ()=>
{
    return new Promise((resovle, reject)=>{
       
        try{
          //  dotEnv.config();
                console.log("start ....")
                const dbClient = new DynamoDBClient({region: 'ap-southeast-2'});
              
                console.log("A:")
                const mapper = new DataMapper({dbClient});
                console.log("B:")
                const user = new User();
                console.log("C:"+JSON.stringify(user))
                user.user_name = 'zhengxu';
                user.abn = '7654321';
                user.business_name = "Great Australia Pty LTD";
                user.address = "23 FkJB street, Chatswood, NSW 2000";
                user.clients = Object.assign(new Client(), {
                    abn:'9876543',
                    business_name : "Daivd Jhones",
                    address : "55 Client street, Rosewood, NSW 2000",
                });
                console.log(JSON.stringify(user))
                mapper.put({item: user}).then(() => {
                    // The post has been created!
                    resovle({
                        statusCode: 200,
                        message:"success"
                    })
                    console.log(user.user_name);
                }).catch((err)=>{
                    console.log("[mapper.error]:"+err);
                    reject({
                        statusCode: 200,
                        message:err
                })   
                });
            }
            catch(err)
            {
                console.log("[Error Caught]:"+err);  
                reject({
                        statusCode: 200,
                        message:err
                })   
            }
        })

}
   


module.exports = DataWorker;