

const {v4:uuid4} = require('uuid');
const DBClientWrapper = require("./DBClientWrapper");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
//const Utils = require("./utils")

const userEmptyItem = {
    user_name:"", //primary key,string,unique
    password:"",//string
    displayName:"",
    email:"",//string, for get back password,also unique
    createAt:"",
    payee: { //the information will turn up in the invoice
        business_name:"",
        ABN:"",
        address: "",
        phone:"",
        email:""
      },
    clients:[{ //Clients is a array
        client_id:"",//let uuid
        business_name:"",
        ABN:"",
        address: "",
        phone:"",
        email:""
      }]
}

const User = {}

function getResponse(data,isSuccess)
{
   return {
        statusCode: isSuccess?200:500,            
        headers: {
            "content-type": "application/json",
        },
        body:data
    }
}

User.init = ()=>{
    DBClientWrapper.init();
}

User.init();
/*
Params User Object
*/
User.addUser = async (user)=>{
    return DBClientWrapper.submitRequest(DBClientWrapper.ACTION_ADD_USER,user)
}

User.updateUser = async (user)=>{
    try
    {
       let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_UPDATE_USER,user)
       if(ret.$metadata.httpStatusCode == 200)
       {
            return getResponse("User Information updating success",true)
       }
       else
       {
            return  getResponse(ret.$metadata,false)
       }
    }
    catch(err)
    {
        return getResponse(err,false)
    }
}

/*
params :{
    user_name:

}
return user Object
*/
User.getUserByUserName =async (userName)=>{
    
    try{
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_USER_BY_NAME,userName)
        
        if( ret.Items!== undefined && ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
            return getResponse(item,true);
        }
        else
        {
            return getResponse({},true);
        }
    }
    catch(error)
    {
        return getResponse(error,false)
    }
}

User.getUserNameByEmail =  async (email)=>{
    
    try{
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_USERNAME_BY_EMAIL,email)
        
        if( ret.Items!== undefined && ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
            return getResponse(item.user_name,true);
        }
        else
        {
            return getResponse("",true);
        }
    }
    catch(error)
    {
        return getResponse(error,false)
    }
}

User.checkPassword = async(userName, password) => {
    try{
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_CHECK_PASSWORD,{user_name:userName,password:password});
        if( ret.Items!== undefined && ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
            return getResponse({
                user_name:item.user_name,
                pass: true
                },true);
        }
        else
        {
            return getResponse({
                user_name:userName,
                pass: false
                },true);
        }
    }
    catch(error)
    {
        return getResponse(error,false)
    }
}
/*
params :{
    user_name:
    
}
*/
User.deleteUser = async ()=>{
    
}

/*
params :{
    user_name:
    client:{

    }
}
*/

/*
user_name:xxx
client:{}
*/
User.addClient = async (data)=>{
    try{
        return await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_ADD_CLIENT,data);
    }
    catch(error)
    {
        return getResponse(error,false)
    }
}

/*
params :{
    user_name:
    client_id:
}
*/
User.deleteClient =async ()=>{
    
}

/*
params :{
    user_name:
    client_id:
}
*/
User.getClient = async ()=>{
    
}

User.getCients = async(userName)=>{
    try{
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_CLIENTS,userName)
        
        if( ret.Items!== undefined && ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
            return getResponse(item,true);
        }
        else
        {
            return getResponse({},true);
        }
    }
    catch(error)
    {
        return getResponse(error,false)
    }
}

User.test = async ()=>{
    // return User.getUserByUserName('xuna');
    return User.getCients('zhengxu');
 }


User.testAddClient = async ()=>{
   // return User.getUserByUserName('xuna');
   return User.addClient({
        user_name:'zhengxu',
        client:{'business_name':'OZ GOOD LINk','abn':'23043','address':'45 duffy, hornsby'}
    })
}

User.testAddUser = async()=>{
    const user = {
        user_name:"davidxu", //primary key,string,unique
        password:"DDDAAAVID",//string
        displayName:"David",
        email:"david@gmail.com",
        createAt:new Date()
    }
    return User.addUser(user)
}

User.testUpdate = async()=>{
    const user = {
        user_name:"zhengxu", //primary key,string,unique
        password:"fdasfs",//string
        display_name:"Zander Xu",
        email:"zux@gmail.com"
    }
    return User.updateUser(user)
}

module.exports = User

