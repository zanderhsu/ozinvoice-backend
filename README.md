# ozinvoice-backend
This is source code for AWS Lambda function(Node.JS runtime),which is the serverless backend for OZ-Invoice.     

[DBClientWrapper.js]: the module for accessing AWS DynamoDB  
  
[User.js]:    the module based on DBClientWrapper.js,which mainly handles requests from a loggined user, such as login, generating token, verify token, write data to DB, send out notify email etc.  
  
[gen-invoice-pdf.js]:   the module for generating PDF using pdfkit library  
  
[app.js]:   the AWS Lamda function handler for dealing with all HTTP REST request and decide what to do.  
