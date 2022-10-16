const {
    DynamoDbSchema,
    DynamoDbTable,
    embed,
} = require('@aws/dynamodb-data-mapper');

const {v4:uuid4} = require('uuid');

class User {
    // Declare methods and properties as usual
}

class Client {
    // Methods and properties
}

Object.defineProperty(Client.prototype, DynamoDbSchema, {
    value: {
        bussiness: {type: 'String'},
        abn:  {type: 'String'},
        address: {type: 'String'}  
    }
});

Object.defineProperties(User.prototype, {
    [DynamoDbTable]: {
        value: 'Users'
    },
    [DynamoDbSchema]: {
        value: {
            user_name: {
                type: 'String',
                keyType: 'HASH'/*,
                defaultProvider: v4,*/
            },
            abn: {
	              type: 'String',
            },
            business_name: {type: 'String'},
            address: {type: 'String'},
            
            clients: embed(Client)
        },
    },
});

module.exports = {User, Client}

