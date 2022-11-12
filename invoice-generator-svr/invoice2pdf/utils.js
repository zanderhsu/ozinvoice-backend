
const {v4:uuid} = require('uuid');


const CryptoJS = require('crypto-js')
const CONSTVALUES = require("./CONSTVALUES")
const gCryptoKey = CONSTVALUES.ENCRYPTION_KEY
var nodemailer = require('nodemailer');

const Utility = (function(){

    const generateLoginToken = (user_name, email)=>
    {
        var data = {
            user_name:user_name,
            email:email
        }
        let theEncrypted = CryptoJS.AES.encrypt(JSON.stringify(data),gCryptoKey);
        return theEncrypted.toString()
    }

    const isExpired = (timevalue)=>
    {
        return (new Date()).getTime() > timevalue 
    }

    const decodeTokenToData= (token)=>
    {
        var decryped = CryptoJS.AES.decrypt(token,gCryptoKey) 
        var decodedStr = decryped.toString(CryptoJS.enc.Utf8)
        return JSON.parse(decodedStr);
    }

    const getNumberFormat = (number,isMoney)=>
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

    const NANtoZero = (num) =>{
      if(num === "" || isNaN(num)){
          return 0;
      }
      
      return parseFloat(num); 
    }

    const deepCompare = (ObjA, ObjB)=>{
    
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
    


    const  deepCopy = (sourceObj,level)=>{
      
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
  
    const afterDecimal = (num) =>{
    
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


    const getShortUID = () =>{
      return uuid().substring(0,8)
    }

    const validateEmail = (email) => {
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
  const sendEmailTo = async(email, content)=>{
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

    return {
      generateLoginToken:generateLoginToken,
      isExpired:isExpired,
      decodeTokenToData:decodeTokenToData,
      getNumberFormat:getNumberFormat,
      NANtoZero:NANtoZero,
      deepCompare:deepCompare,
      deepCopy:deepCopy,
      afterDecimal:afterDecimal,
      getShortUID:getShortUID,
      validateEmail:validateEmail,
      sendEmailTo:sendEmailTo,
    }
})();

module.exports = Utility;