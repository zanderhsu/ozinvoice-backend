

const {v4:uuid4} = require('uuid')
const DBClientWrapper = require("./DBClientWrapper")
const { unmarshall } = require("@aws-sdk/util-dynamodb")
const Utility = require("./utils.js")
const CONSTVALUES = require("./CONSTVALUES")

const userEmptyItem = {
    user_name:"", //primary key,string,unique
    email:"",//string, sort key, for get back password,also unique
    password:"",//string
    email_verified:false,
    basics:{
        nickname:"",
        phone:"",
        create_at:"",
        last_login_at:"",
        /*there will be payment method infor, invoices, plan type,bills,*/
    },
    payees: [{ //the information will turn up in the invoice payee section
        business_name:"",
        abn:"",
        address: "",
        phone:"",
        email:"",
        account_name:"",
        bsb:"",
        account_number:""
      }],
    clients:[{ //Clients is a array
        business_name:"",
        abn:"",
        address: "",
        phone:"",
        email:""
      }]
}


const User = {}



/*JsonObject: a data Object or {message:xxxx}*/
function formatResponse(JsonObject,isSuccess)
{
     return {
            success: isSuccess,
            data:JsonObject
        }
}


User.init = ()=>{
    DBClientWrapper.init();
}

User.init();
User.sendTempPasswordToEmail = async(user_name,email,tempPwd)=>
{

    try{
          var mailBody = `<h3>Dear ${user_name},
          <br>
          <br>This is your temporary password for https://www.oz-invoice.com.au/:</h3>
          <h1 style="color:purple">${tempPwd}</h1>
          <h3>It'll expire in 10 minutes, so please reset your new password 
          as soon as possible after loggin in. 
          <br>If you have any other problems related to OZ Invoice, please let us know.
          <br>Hope you have a nice day!
          <br><br>Cheers,
          <br>OZ Invoice</h3>`
             
          let result = await Utility.sendEmailTo(email,{
            subject:'temporary password from oz-invoice.com.au',
            htmlBody:mailBody
          })

          return formatResponse(result,true)
        }
        catch(error)
        {
            return formatResponse({success:false, message:error},false)
        } 
}

User.sendVefificationEmail = async(user_name,email)=>
{

    try{
                
          var token = Utility.generateLoginToken(user_name,email)
    
          var vLink = CONSTVALUES.ROOT_URL+"/?vetoken="+encodeURIComponent(token)
          var mailBody = `<h3>Hi ${user_name},
          <br>
          <br>Please click the <a style="font-size:2em;color:purple;" href='${vLink}'>link</a> to verify your email address</h2>
          <br>If you have any other problems related to OZ Invoice, please let us know.
          <br>Hope you have a nice day!
          <br><br>Cheers,
          <br>OZ Invoice</h3>`
             
          let result = await Utility.sendEmailTo(email,{
            subject:'verification link from oz-invoice.com.au',
            htmlBody:mailBody
          })

          return formatResponse(result,result.success)
        }
        catch(error)
        {
            return formatResponse({success:false, message:error},false)
        } 
}

User.verifyEmail = async(vetoken)=>
{
    try
    {
        const {user_name, email} = Utility.decodeTokenToData(vetoken)
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_SIMPLE_BY_NAME, user_name)
       // console.log(`${unmarshall(ret.Items[0]).user_name} vs ${user_name}`)
        if(ret.Items.length === 0 || unmarshall(ret.Items[0]).email !== email)
        {
            return formatResponse({success: false,message:"Wrong VETOKEN"},false);
        }
        
        ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_SET_EMAIL_VERIFIED,{user_name:user_name,email:email,isVerified:true})
        let isSuccess = (ret.$metadata.httpStatusCode === 200)

        return formatResponse({
            success: isSuccess,
            message:`Verifying Email ${isSuccess?"succeeded":"failed"}`,
            }
            ,isSuccess)
        
    }
    catch(err)
    {
        console.log(err)
        let errorStr = `verifying Email failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success: false,message:errorStr},false);
    }
}
/*

*/
User.sendTempPassword = async(email)=>
{
    try
    {
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_SIMPLE_BY_EMAIL,email)
        if(ret.Items.length === 0)
        {
            return formatResponse({
                success: false,
                message:`${email} hasn't been registered yet`}
                ,true)//here set true so that browser show correct error message
        }

        let item = unmarshall(ret.Items[0])
        let data = {
            user_name: item.user_name,
            email:email,
            temp_password:{
                password: Utility.getShortUID(),
                expire_time: (new Date()).getTime()+10*60*1000//invald in 10 minutes
            }
        }
        console.log("temp_password:"+JSON.stringify(data.temp_password))
        await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_SET_TEMP_PASSSWORD,data)

        User.sendTempPasswordToEmail(item.user_name,email, data.temp_password.password)
        
        return formatResponse({
            success: true,
            message:`The temporary password's been sent to ${email}. It'll expire in 10 mins, so please reset your new password as soon as possible after logging in`}
            ,true)
    }
    catch(err)
    {
        console.log(err)
        let errorStr = `sendTempPassword failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success: false,message:errorStr},false);
    }
}
/*
Params User Object
*/
User.addUser = async (user)=>{
    try{
      //  console.log("user="+JSON.stringify(user));
        
       // console.log("user="+JSON.stringify(user));
        if(await DBClientWrapper.IsEmailExist(user.email))
        {
            return formatResponse({
                success: false,
                message:"Adding User failed because the email address has been used"}
                ,false)
        }

        user.basics = Utility.deepCopy(userEmptyItem.basics,3);
        user.basics.create_at = (new Date()).toLocaleString();
        user.payees = [];
        user.clients = [];
        user.email = user.email.toLowerCase();
       // console.log("user="+JSON.stringify(user));
       // user.clients = Utility.deepCopy(userEmptyItem.clients,5);
     
        console.log("user="+JSON.stringify(user));
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_ADD_USER,user)

        //no need to wait for it here
        User.sendVefificationEmail(user.user_name, user.email)

        let isSuccess = (ret.$metadata.httpStatusCode === 200)

        let token = (isSuccess)?Utility.generateLoginToken(user.user_name,user.email):""


         return formatResponse({
            success: isSuccess,
            message:`Adding User ${isSuccess?"succeeded":"failed"}`,
            token:token}
            ,isSuccess)
    }
    catch(err)
    {
        console.log(err)
        let errorStr = `Adding User failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success: false,message:errorStr},false);
    }
}

User.addPayee = async (paramObj)=>{
    try
    {
       let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_ADD_PAYEE,paramObj)

       let isSuccess = (ret.$metadata.httpStatusCode === 200)
     
       return  formatResponse({
            success: isSuccess,
            message:`Adding Payee ${isSuccess?"succeeded":"failed"}`}
            ,isSuccess)       
    }
    catch(err)
    {
        let errorStr = `Adding Payee failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success:false, message:errorStr},false);
    }
}


/*
paramObj:
{
    user_name:
    email:
    index;
    payee:{

    }
}

*/
User.updatePayee = async (paramObj)=>{
    try
    {
       let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_UPDATE_PAYEE,paramObj)

       let isSuccess = (ret.$metadata.httpStatusCode === 200)
     
       return  formatResponse({
            success: isSuccess,
            message:`Updating Payee ${isSuccess?"succeeded":"failed"}`}
            ,isSuccess)       
    }
    catch(err)
    {
        let errorStr = `Updating Payee failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success:false, message:errorStr},false);
    }
}
/*
paramObj:
{
    user_name:
    email:
    basics:{ basics Object  }
}
*/
User.updateBasics = async (paramObj)=>{
    try
    {
       let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_UPDATE_BASICS,paramObj)

       let isSuccess = (ret.$metadata.httpStatusCode === 200)
     
       return  formatResponse({
            success: isSuccess,
            message:`Updating user Information ${isSuccess?"succeeded":"failed"}`}
            ,isSuccess)
       /*
       An example of $metadata 
       {
            "httpStatusCode":200 or 400,
            "requestId":"T8LI2FJ8I53BBVBQGP5IQ9K3VFVV4KQNSO5AEMVJF66Q9ASUAAJG",
            "attempts":1,"totalRetryDelay":0
        }         
        */
       
    }
    catch(err)
    {
        /*
        err format
        {"name":"ConditionalCheckFailedException",
        "$fault":"client",
        "$metadata":{"httpStatusCode":400,"requestId":"PPQ88QGD2UA4UQBFKFVEMEOG53VV4KQNSO5AEMVJF66Q9ASUAAJG","attempts":1,"totalRetryDelay":0},
        "__type":"com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException"}}
        */
        let errorStr = `Updating user information failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success:false, message:errorStr},false);
    }
}

/*
params :{
    user_name:

}
return whole user Object
*/
User.getUserByUserName =async (userName)=>{
    
    try{
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_USER_BY_NAME,userName)
        
        if( ret.Items!== undefined && ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
            delete item.password;//don't let password returned.
            return formatResponse(item,true);
        }
        else
        {
            return formatResponse(null,true);
        }
    }
    catch(err)
    {
        let errorStr = `Getting user by name failed,reason:${err.name} fault:${err.$fault}`;
        console.log(errorStr)
        return formatResponse(null,false);
    }
}

User.checkPrimaryKey = async(user_name, email) =>{
    let result = {user_name:"", pass:false}

    try{
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_SIMPLE_BY_NAME, user_name)
      
        if(ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
            
            if(email === item.email)
            {
                result.user_name = item.user_name
                result.pass = true
                return formatResponse(result, true)
            }
        }
    }
    catch(err)
    {
        let errorStr = `Someting wrong in checking Primary Key,reason:${err.name} fault:${err.$fault}`;
        console.log(errorStr)
    }
    
    return formatResponse(result,false);
}

User.checkPassword = async(userName, password) => {
    let passObject = {user_name:userName,pass: false,isByTempPass:false,token:""}
    try{
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_SIMPLE_BY_NAME,userName);
        if(ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
         
            if(password === item.password) 
            {
                passObject.pass = true
                
            } 
            else if(item.temp_password !== undefined && !Utility.isExpired(item.temp_password.expire_time))
            {
                //temp_password is valid, so do the compare
                if(password === item.temp_password.password)
                {
                    passObject.pass = true
                    passObject.isByTempPass = true;
                }
            }

            if(passObject.pass) 
            {
                passObject.token = Utility.generateLoginToken(userName, item.email);
            }
        }
        
        return formatResponse(passObject,passObject.pass);
    }
    catch(err)
    {
        let errorStr = `Someting wrong in Checking password,reason:${err.name} fault:${err.$fault}`;
        console.log(errorStr)
        return formatResponse(passObject,false)
    }
}

/*
dataObj:{
    user_name:
    email:
    new_email:
}

*/
User.changeEmail = async(dataObj) => {
  
    try
    {
        dataObj.email = dataObj.email.toLowerCase();
        dataObj.new_email = dataObj.new_email.toLowerCase();
        
        await DBClientWrapper.changeEmail(dataObj)
        
        //no need to wait it here
        User.sendVefificationEmail(dataObj.user_name, dataObj.new_email)
        
        return formatResponse({
                success: true,
                message:"Chaning email succeeded",
                token:Utility.generateLoginToken(dataObj.user_name,dataObj.new_email)
            }
             ,true)
        
    }
    catch(err)
    {
        let errorStr = `Someting wrong in changing email,reason:${err.name} fault:${err.$fault}`;
        console.log(errorStr)
        return formatResponse({success:false, message:errorStr},false)
    }
}
/*
{
user_name:
email
"current_password":"",
"new_password":"",
}
*/
User.changePassword = async(dataObj)=>{
    let result = {
        success: false,
        message:"Reason unknown"
    }

    try
    {
        let response = await User.checkPassword(dataObj.user_name,dataObj.current_password )

        if( response.success )
        {
            //begin to change password
            console.log("begin to change password")
            ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_SET_PASSWORD,{
                user_name:dataObj.user_name,
                new_password:dataObj.new_password,
                email:dataObj.email});

            let isSuccess = (ret.$metadata.httpStatusCode === 200)
    
            return  formatResponse({
                success: isSuccess,
                message:`Setting new password ${isSuccess?"succeeded":"failed"}`} ,isSuccess)
        }
        else
        {
            result.message = "Incorrect current password!"
        }
    }
    catch(err)
    {
        let errorStr = `Changing password failed,reason:${err.name} fault:${err.$fault}`;
        result.message = errorStr;
    }
    return  formatResponse(result,false)
    
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
paramObj :{
    user_name:xxx
    email:xxx
    client:{}
}
*/
User.addClient = async (paramObj)=>{
    try
    {
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_ADD_CLIENT,paramObj);

        let isSuccess = (ret.$metadata.httpStatusCode === 200)
     
        return  formatResponse({
            success: isSuccess,
            message:`Adding client ${isSuccess?"succeeded":"failed"}`} ,isSuccess)
    }       
    catch(err)
    {
        let errorStr = `Adding client failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success:false,message:errorStr},false);
    }
    
}

/*
paramObj :{
    user_name:xxx
    email:xxx
    index:index
    client:{}
}
*/
User.updateClient = async (paramObj)=>{
    try
    {
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_UPDATE_CLIENT,paramObj);

        let isSuccess = (ret.$metadata.httpStatusCode === 200)
     
        return  formatResponse({
            success: isSuccess,
            message:`Updating client ${isSuccess?"succeeded":"failed"}`} ,isSuccess)
    }       
    catch(err)
    {
        let errorStr = `Updating client failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success:false,message:errorStr},false);
    }
    
}

/*
whichPayee :{
    user_name:
    email:
    index:
}
*/
User.deletePayee =async (whichPayee)=>{
    try
    {
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_DELETE_PAYEE,whichPayee);

        let isSuccess = (ret.$metadata.httpStatusCode === 200)
     
        return  formatResponse({
            success: isSuccess,
            message:`Deleting payee ${isSuccess?"succeeded":"failed"}`} ,isSuccess)
    }       
    catch(err)
    {
        let errorStr = `Deleting payee failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success:false,message:errorStr},false);
    }
}

/*
whichClient :{
    user_name:
    email:
    index:
}
*/
User.deleteClient =async (whichClient)=>{
    try
    {
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_DELETE_CLIENT,whichClient);

        let isSuccess = (ret.$metadata.httpStatusCode === 200)
     
        return  formatResponse({
            success: isSuccess,
            message:`Deleting client ${isSuccess?"succeeded":"failed"}`} ,isSuccess)
    }       
    catch(err)
    {
        let errorStr = `Deleting client failed,reason:${err.name} fault:${err.$fault}`;
        return formatResponse({success:false,message:errorStr},false);
    }
}

/*
params :{
    user_name:
    clientIndex:
}
*/
User.getClient = async ()=>{
    
}

User.getClients = async(userName)=>{
    try
    {
        let ret = await DBClientWrapper.submitRequest(DBClientWrapper.ACTION_GET_CLIENTS,userName)
        
        if( ret.Items!== undefined && ret.Items.length > 0)
        {
            let item = unmarshall(ret.Items[0])
            console.log(JSON.stringify(item))
            
            return formatResponse(item.clients,true);
        }
        else
        {
            return formatResponse([],true);
        }
    }
    catch(err)
    {
        let errorStr = `getting client failed,reason:${err.name} fault:${err.$fault}`;
        console.log(errorStr)
        return formatResponse([],false)
    }
}

User.test = async ()=>{
    // return User.getUserByUserName('xuna');
}

module.exports = User

