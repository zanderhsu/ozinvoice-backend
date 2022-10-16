const PDFDocument = require('pdfkit');
const {Buffer} = require('node:buffer');

const doc = require('pdfkit');

function getNumberFormat(number,isMoney)
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

const PDF_FONT_SIZE = 12
const PDF_BIG_FONT_SIZE = 40;
const PDF_FONT_NAME = 'Helvetica' 
const PDF_BOLD_FONT_NAME = 'Helvetica-Bold'
const PDF_LAYOUT = 'portrait'
const PDF_PAPER_SIZE = 'A4'
const PDF_PAGE_MARGIN = 30
const PDF_FONT_COLOR = "#030303";

const SUPPLIER_FONT_SIZE = 12;
const SUPPLIER_TOP = 80;

const ITEM_COLUMN_GAP = 4;

const PAYER_FONT_SIZE = 12;

const options = { 
    font: PDF_FONT_NAME,
    layout: PDF_LAYOUT,
    size:PDF_PAPER_SIZE,
    margin:PDF_PAGE_MARGIN,
    autoFirstPage: false,
    bufferPages: true
};

const HEADER_NAME_INDEX = 0;
const HEADER_ALIGN_INDEX = 1;
const HEADER_WIDTH_INDEX = 2;

const gItemHeaders = [
  ["Code","center",48],
  ["Description","left",200],
  ["Price","right",50],
  ["Qty","right",40],
  ["GST%","center",40],
  ["Disc%","center",40],
  ["Amount","right",80] 
];
function isEmptyObj(obj) {
  return Object.keys(obj).length === 0;
}
function checkInvalidArguments(funName, argArray)
{
  for(i in argArray)
  {
    if(argArray[i] === undefined || argArray[i] === null || isEmptyObj(argArray[i]))
    {
      console.log(`${funName}(): ${(i)}th argument is invalid`);
      return true;
    }
  }
  return false;
}
/*before calling this, make sure font and fontsize are correct*/
function getMaxWidth(pdfDoc,strArray)
{
  if(checkInvalidArguments("getMaxWidth",[pdfDoc,strArray])) return;

  let maxWidth = 0;
  for(i in strArray)
  {
    let curWidth = Math.floor(pdfDoc.widthOfString(strArray[i]))
    maxWidth = Math.max(curWidth, maxWidth);
  }

  return eval(maxWidth+1);//plus 1 is necessary
}

function getLeftForMostRightText(pdfDoc, strArray)
{
  if(checkInvalidArguments("getLeftForMostRightText",[pdfDoc,strArray])) return;
  return Math.floor(pdfDoc.page.width) - PDF_PAGE_MARGIN - getMaxWidth(pdfDoc,strArray);
}

function IfPropNameToShow(p)
{
  const propNamesNoNeedToShow =["business_name","address"];
  if(propNamesNoNeedToShow.indexOf(p) === -1)
  {
    return true; //if the property name doesn't exist in that array, it should show
  }
  return false; 
}
/* 
  option:
  { align: left or right or center, 
    startPos: left pos for left or center, right pos for right
    width: if set to zero, the width wil be determined by max str length
}*/
function writeBlockText(pdfDoc,strArray, option)
{
  if(checkInvalidArguments("writeBlockText",[pdfDoc,strArray, option])) return;

  let leftPos = 0;
  const maxStrWidth = getMaxWidth(pdfDoc,strArray);
  let correctWidth = maxStrWidth;

  if( option.width !== undefined && option.width > 0)//if the caller specify the width
  {
    //correctWidth = Math.min(maxStrWidth,option.width)
    correctWidth = option.width;
  }

  switch(option.align){
    case 'left':
      leftPos = option.startPos;
      break;

    case 'right':
      leftPos = option.startPos - correctWidth;
      break;
    
    case 'center':
      break;
    
    default:
      console.log("option is not right in writeBlockText()")
      return;
  }

  let pdfkitOption = {
    align:option.align,
    width:correctWidth 
  }


  for(i in strArray)
  {
    //console.log(`${strArray[i]},leftPos=${leftPos},pdfDoc.y=${pdfDoc.y},pdfkitOption.width=${pdfkitOption.width}`)
    pdfDoc.text(strArray[i],leftPos, Math.floor(pdfDoc.y),pdfkitOption);
  }
}
//to add "TAX INVOICE"
function addTaxInvoice(pdfDoc)
{
  pdfDoc.fontSize(PDF_BIG_FONT_SIZE)
    .font("Courier-Bold")
    .text("TAX INVOICE",PDF_PAGE_MARGIN,SUPPLIER_TOP)
}

function addhorizontalLine(pdfDoc,startX,endX)
{
  if(checkInvalidArguments("addhorizontalLine",[pdfDoc])) return;

  const start = ( startX === undefined ? PDF_PAGE_MARGIN:startX);
  const end = ( endX === undefined ? Math.floor(pdfDoc.page.width)-PDF_PAGE_MARGIN:endX)

  pdfDoc.moveTo(start, pdfDoc.y)                               // set the current point
        .lineTo(end,pdfDoc.y)             // draw a line
        .fill("grey")                             // draw another line
        .stroke().fill(PDF_FONT_COLOR) ; 
}
/*
payee = {
  business_name:xxxx,
  ABN:xxx,
  address: xxx
  phone:xxxx
  email:xxx
}
*/
function addPayee(pdfDoc,payee)
{
  if(checkInvalidArguments("addPayee",[pdfDoc,payee])) return;

  let strArray = [];
  for(var p in payee)
  {
    if(payee[p] !=="" )
    {
      let txt = IfPropNameToShow(p)? (p+" : "):""
      txt += payee[p];
      strArray.push(txt);
    }
  }
  const maxWidth = 250;
  const minLeftPos = pdfDoc.page.width - maxWidth - PDF_PAGE_MARGIN;
  pdfDoc.fontSize(SUPPLIER_FONT_SIZE)
      .font(PDF_FONT_NAME)
      .text("",0, SUPPLIER_TOP);

  writeBlockText(pdfDoc, strArray,{align:'left',startPos:Math.max(minLeftPos,getLeftForMostRightText(pdfDoc,strArray)),width:maxWidth})
  }


/*
payer = {
  business_name:xxxx,
  ABN:xxx,
  address: xxx
  phone:xxxx
  email:xxx
}
*/
function addPayer(pdfDoc, payer)
{
    if(checkInvalidArguments("addPayer",[pdfDoc,payer])) return;

    pdfDoc.moveDown();
    pdfDoc.fontSize(PDF_BIG_FONT_SIZE-20)
      .font(PDF_BOLD_FONT_NAME)
      .text("BILL TO", PDF_PAGE_MARGIN)
      .moveDown(0.5)
      .font(PDF_FONT_NAME)
      .fontSize(PAYER_FONT_SIZE);
    let strArray = []
    for(var p in payer)
    {
      let txt = IfPropNameToShow(p)? (p+" : "):"";
      txt += payer[p];
      strArray.push(txt);
    }

    writeBlockText(pdfDoc, strArray,{
      align:'left',
      startPos:PDF_PAGE_MARGIN,
      width:pdfDoc.page.width-2*PDF_PAGE_MARGIN
  })
}
/*
@info = [InvoiceNumber,Date]
}
*/

function addInvoiceNumberAndDate(pdfDoc,info)
{ 
  const [number, date] = info;

  let InvNumStr =  "Invoice No.   : "+number;
  let InvDateStr = "Invoice Date : "+date;

  pdfDoc.font(PDF_FONT_NAME)
    .fontSize(PAYER_FONT_SIZE)
    .text("",0,pdfDoc.y-30);

  let strArray = [InvNumStr,InvDateStr]
  pdfDoc.moveDown(0.2);
  writeBlockText(pdfDoc, strArray,{align:'left',startPos:Math.max(300,getLeftForMostRightText(pdfDoc, strArray)),width:270})
}

function addItemHeader(pdfDoc)
{
  pdfDoc.moveDown(3);

  pdfDoc.text("",PDF_PAGE_MARGIN)
    .font(PDF_BOLD_FONT_NAME)
    .fontSize(PDF_FONT_SIZE);

  const curY = pdfDoc.y;
  let curX = pdfDoc.x;
 
  for(var h in gItemHeaders)
  {
    pdfDoc.text(gItemHeaders[h][HEADER_NAME_INDEX],curX,curY,
      {align:gItemHeaders[h][HEADER_ALIGN_INDEX],
       width:gItemHeaders[h][HEADER_WIDTH_INDEX],
       baseline:"center"
      });

    curX += gItemHeaders[h][HEADER_WIDTH_INDEX] +ITEM_COLUMN_GAP;
  }
  pdfDoc.text("",PDF_PAGE_MARGIN);//let the cursor go back to most left
 
}

function addNewPageIfNecessary(pdfDoc,thresHoldForY)
{
  if( Math.floor(pdfDoc.y) > thresHoldForY){
    pdfDoc.addPage();
    pdfDoc.moveTo(PDF_PAGE_MARGIN,PDF_PAGE_MARGIN);
  }
}
function addItems(pdfDoc, items)
{
  if(checkInvalidArguments("addItems",[pdfDoc,items])) return;

  pdfDoc.moveDown(0.2).font(PDF_FONT_NAME);

  for(var i in items)
  {
    addNewPageIfNecessary(pdfDoc,740);

    pdfDoc.text("",PDF_PAGE_MARGIN);
    addhorizontalLine(pdfDoc);
    pdfDoc.moveDown(0.5)

    const curY = Math.floor(pdfDoc.y);
    let curX = Math.floor(pdfDoc.x);

    let item = items[i];
    let hx = 0;
    let header;
    for(p in item) // tranver the properties in item
    { 
      if(p === "amount") //amount property will be recalculated here
      {
        let amountStr =`${item.unit_price}*${item.quantity}*(100-${item.discount})/100`;
        let amount = 0;
        try
        {
          amount = eval(amountStr)
        }
        catch(err)
        {
          console.log("[addItems()]:"+err) 
        }
        
        item[p] = amount;
      }

      let itemStr = item[p];
      if(p!=='code' && p!=="description") //the are not numbers
      {
        itemStr = getNumberFormat(item[p],(p === "unit_price" || p === "amount"));
      }
      header = gItemHeaders[hx++];
      pdfDoc.text(itemStr,curX,curY,{
          align:header[HEADER_ALIGN_INDEX],
          width:header[HEADER_WIDTH_INDEX],
          height: pdfDoc.heightOfString(itemStr)-1,
          lineBreak:false,
          ellipsis:true});
      
          curX += header[HEADER_WIDTH_INDEX]+ITEM_COLUMN_GAP; // index 2 of header is width
    }
  }
  //make double line after finishing lising items
 // pdfDoc.moveUp(0.8);
  addhorizontalLine(pdfDoc)
  pdfDoc.moveDown(0.2);
  addhorizontalLine(pdfDoc)
}

function getLeftPosOfAmount()
{
  let totalHeaderWidth = 0;
  for(i in gItemHeaders)
  {
    if( i != 6 ) //6 is the index for Amount
    {
      totalHeaderWidth += gItemHeaders[i][HEADER_WIDTH_INDEX]+ITEM_COLUMN_GAP;
    }
  }

  return totalHeaderWidth+PDF_PAGE_MARGIN;
}

function addTotalAmount(pdfDoc, items)
{
  if(checkInvalidArguments("addTotalAmount",[pdfDoc,items])) return;
  addNewPageIfNecessary(pdfDoc,680);

  let totalAmount = 0;
  let totalTax= 0;
  for(var i in items)
  {
    let item = items[i];
    let tax = 0;
    //calculate gst for each item
    try{
      tax = eval(`${item.amount}*${item.tax_rate}/(100+${item.tax_rate})`)
    }
    catch(err)
    {
      console.log("[addTotalAmount()]"+err);
    }
    totalTax += tax;
    totalAmount += item.amount;
  }

  pdfDoc.font(PDF_BOLD_FONT_NAME).fontSize(PDF_FONT_SIZE+4).moveDown(4);
  const startY = Math.floor(pdfDoc.y);
  const amountValueWidth = gItemHeaders[6][HEADER_WIDTH_INDEX];
  let staticStrRightX;
  
  let strArray = [getNumberFormat(totalTax,true),getNumberFormat(totalAmount,true)];
  let valueStrRightX = getLeftPosOfAmount() + amountValueWidth;

  writeBlockText(pdfDoc,strArray,{align:'right',startPos:valueStrRightX});

  staticStrRightX = valueStrRightX - getMaxWidth(pdfDoc,strArray);
  
  // write static strings
  pdfDoc.text("",PDF_PAGE_MARGIN,startY);//go back to origin Y position
  strArray = ["GST : ","Total Amount : "];
  writeBlockText(pdfDoc,strArray,{align:'right',startPos:staticStrRightX});

  let lineStart = staticStrRightX-getMaxWidth(pdfDoc, strArray);
  addhorizontalLine(pdfDoc, lineStart);
  addhorizontalLine(pdfDoc, lineStart);
  pdfDoc.moveDown(0.02)
  addhorizontalLine(pdfDoc,lineStart);
  addhorizontalLine(pdfDoc, lineStart);
  pdfDoc.moveDown(0.02)
  addhorizontalLine(pdfDoc,lineStart);
  addhorizontalLine(pdfDoc, lineStart);
}

/*
  payment:{
    account_name:
    BSB:
    account_number:
    note:
    due_ate:
  }*/
function addPaymentDetail(pdfDoc, payment)
{
  if(checkInvalidArguments("addPaymentDetail",[pdfDoc, payment])) return;

  pdfDoc.moveUp(5)
    .fontSize(PDF_FONT_SIZE)
    .font(PDF_FONT_NAME)
    .text("",PDF_PAGE_MARGIN);
  
  let strArray = [];
  strArray.push("Due Date : "+payment.due_date);
  strArray.push("  ");

  strArray.push("Payment details:");
  strArray.push(payment.account_name);
  strArray.push("BSB : "+payment.BSB);
  strArray.push("Acc : "+payment.account_number);
  strArray.push("Note : "+payment.note);

  writeBlockText(pdfDoc, strArray,{align:'left',startPos:PDF_PAGE_MARGIN,width:350})
  
}
/*
invoiceInfo ={
  payee: {supplier object},
  payer: {payer object}
  items:[{
    code:""
    description:""
    amount:""
    unit_price:
    quantity:
    discount:
    tax_rate": "0.1"~"1"
    amount: //can be empty, but calculated by back end
  },...
  {

  }],

  payment:{
    account_name:
    BSB:
    account_number:
    note:
    due_date:
    invoice_number:
    invoice_date:
  }

}
*/

function addPageNumber(pdfDoc)
{
    pdfDoc.fontSize(PDF_FONT_SIZE-4)
          .font(PDF_FONT_NAME)
   
  let pages = pdfDoc.bufferedPageRange();
  let pageCount = pages.count;
  
  let x = 0;
  let y = pdfDoc.page.height - PDF_PAGE_MARGIN-PDF_FONT_SIZE;
 
  for(let i=0;i < pages.count;i++) 
  {
    pdfDoc.switchToPage(i);
  
    //Footer: Add page number
    let pageStr = `Page ${i + 1} of ${pageCount}`
    pdfDoc.text(pageStr,x,y,{align:'center',width:pdfDoc.page.width});
  }
  
}


function composePDF(pdfDoc, invoiceInfo)
{
  if(checkInvalidArguments("composePDF",[pdfDoc, invoiceInfo])) return;

  pdfDoc.on('pageAdded', () =>{
    pdfDoc.moveDown(3);
  });
  
  pdfDoc.addPage();
  addTaxInvoice(pdfDoc);
  addPayee(pdfDoc,invoiceInfo.payee);
  addhorizontalLine(pdfDoc);
  
  addPayer(pdfDoc,invoiceInfo.payer);

  if(invoiceInfo.payment!== undefined){
    addInvoiceNumberAndDate(pdfDoc, [invoiceInfo.payment.invoice_number,invoiceInfo.payment.invoice_date]);
  }
  addItemHeader(pdfDoc);

  //generate double lines below item headers;
  addhorizontalLine(pdfDoc);
  //pdfDoc.moveDown(0.2);
  //addhorizontalLine(pdfDoc);

  addItems(pdfDoc,invoiceInfo.items);

  addTotalAmount(pdfDoc,invoiceInfo.items);

  addPaymentDetail(pdfDoc, invoiceInfo.payment);

  addPageNumber(pdfDoc);
}

const getInvoicePDF = async (invoiceInfo)=> {
    return new Promise((resolve, reject) => 
    {
      if( checkInvalidArguments("getInvoicePDF",[invoiceInfo]))
      {
        reject("Invalid invoiceInfo Object:"+JSON.stringify(invoiceInfo))
        return;
      }

      try{
        const doc = new PDFDocument(options).fontSize(PDF_FONT_SIZE);
    
        const buffers = [];
    
        doc.on("data", buffers.push.bind(buffers));
    
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        composePDF(doc, invoiceInfo);
        doc.end();
      }
      catch(err)
      {
        reject(err)
      }

    });
  }

const outputPDF = async (invoiceInfo) => {
  return new Promise((resolve, reject)=>{
   
      getInvoicePDF(invoiceInfo).then((pdfDoc)=>{
          const filename = "invoice.pdf";
          console.log("PDF size = "+pdfDoc.length);
          
          resolve( {
                  statusCode: 200,            
                  headers: {
                      "content-type": "application/pdf",
                      "content-disposition":`attachment; filename=${filename}`
                  },
                  body: pdfDoc.toString("base64"),
                  isBase64Encoded: true
              })
        })
        .catch((err)=>{
            console.log("outputPDF's catch(): "+err)
                reject( {
                    statusCode: 500,
                    message:err
                })
        })

  });
}
 

module.exports = outputPDF;