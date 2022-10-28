
const {v4:uuid} = require('uuid');


const CryptoJS = require('crypto-js')
const CONSTVALUES = require("./CONSTVALUES")
const gCryptoKey = CONSTVALUES.ENCRYPTION_KEY
var nodemailer = require('nodemailer');

const Utility = {};


Utility.generateLoginToken=(user_name, email)=>
{
    var data = {
        user_name:user_name,
        email:email
    }
    let theEncrypted = CryptoJS.AES.encrypt(JSON.stringify(data),gCryptoKey);
    return theEncrypted.toString()
}

Utility.isExpired = (timevalue)=>
{
    return (new Date()).getTime() > timevalue 
}
/*

 return = {
        user_name:user_name,
        email:email
    }*/
Utility.decodeTokenToData= (token)=>
{
    var decryped = CryptoJS.AES.decrypt(token,gCryptoKey) 
    var decodedStr = decryped.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decodedStr);
}

Utility.getNumberFormat = (number,isMoney)=>
{
  if(isNaN(number)) {
    return number;
  }
  const ret = Math.round(number*100)/100;
 
  let NFObj;
  if(isMoney)
  {
    NFObj = Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
  }
  else
  {
    NFObj = Intl.NumberFormat();
  }
  return NFObj.format(ret);
}

Utility.NANtoZero = (num) =>{
    if(num === "" || isNaN(num)){
        return 0;
    }
    
    return parseFloat(num); 
}
//only compare real object values, not null, undefined 
function deepCompare(ObjA, ObjB)
{
    if(ObjA === null || ObjA === undefined || ObjA === NaN
        ||ObjB === null || ObjB === undefined || ObjB === NaN)
    {
        return ObjA === ObjB;
    }

   if(typeof ObjA !== 'object' && typeof ObjB !== 'object')
   {
        return ObjA === ObjB;
   }
   // at least one is Object, Object.keys(primite).length will return 0
   if(Object.keys(ObjA).length !== Object.keys(ObjB).length)
   {
     return false;
   }

   for(let p in ObjA)
   {
        if(!deepCompare(ObjA[p],ObjB[p]))
        {
            return false;
        }
   }

    return true;
}


function deepCopy(sourceObj,level)
{
    if(sourceObj === undefined || level === undefined)
    {
        return null;
    }
    let retObj;
    
    if(typeof sourceObj === 'object' && sourceObj !== null)
    {
        if(Array.isArray(sourceObj))
        {
            retObj = [...sourceObj]
        }
        else{
            retObj = {...sourceObj}
        }

        for(let i=0;i<level;i++)
        {
            for(let p in sourceObj)
            {
                retObj[p] = deepCopy(sourceObj[p],level-1);
            }
        }
    }
    else
    {
        retObj = sourceObj;        
    }

    return retObj;
}

//get the count after decimal
Utility.afterDecimal = (num) =>{
    
    num = parseFloat(num)
    //console.log(num+" :"+Number.isInteger(num))
    if(isNaN(num)){
        console.log(num+" is not a number")
        return 0;
    }

    if(Number.isInteger(num)) 
    {
      return 0;
    }
  
    return num.toString().split('.')[1].length;
  }

Utility.actionForWaiting = (isWaiting)=>
{
    if(isWaiting)
    {
        document.body.style.cursor = "wait";
    }
    else
    {
        document.body.style.cursor = "pointer";
    }
}

Utility.getShortUID = () =>{
  return uuid().substr(0,8)
}

var sLastRequestTime = (new Date()).getTime();
var sLastRequestType = "";
Utility.checkIfRequestTooFrequent =(requestType)=>
{
    let lastTime= sLastRequestTime;
    let lastRequestType = sLastRequestType;

    sLastRequestTime = (new Date()).getTime();
    sLastRequestType = requestType;

    if(sLastRequestTime-lastTime < 1000 && lastRequestType === requestType)
    {
        console.log(`avoid frequent ${requestType} request!`);
        return true;
    }
    return false;
}

Utility.validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
/*
content={
    subject:
    htmlBody:
}
*/
Utility.sendEmailTo = async(email, content)=>{
    return new Promise((resolve, reject)=>{
        let result = {success:false, message:""}
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'info@oz-invoice.com.au',
              pass: CONSTVALUES.EMAIL_PWD
            }
          });
          
    
          var mailOptions = {
            from: 'info@oz-invoice.com.au',
            to: email,
            subject: content.subject,
            html: content.htmlBody
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
              result.message="error"
              result.success = false
              reject(result)
    
            } else {
              console.log('Email sent: ' + info.response);
              result.message = `${content.subject} has been send to ${email}`;
              result.success = true;
              resolve(result)
            }
          });
    })
}

Utility.deepCopy = deepCopy;
Utility.deepCompare = deepCompare;
module.exports = Utility;