const Utility = {};
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
    console.log(num+" :"+Number.isInteger(num))
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

Utility.deepCopy = deepCopy;
module.exports = Utility;