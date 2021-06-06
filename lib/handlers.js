/*
  Request handlers
*/

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')

// Define the handlers
var handlers = {}

// Users 
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Container for the users submethods
handlers._users = {}

// Users - post
// Required data: firstname, lastname, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that app required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesnt already existing
    _data.read('users', phone, (err, data) => {
      if (err) {
        // Hash the password 
        let hashedPassword = helpers.hash(password)

        // Create the user object 
        if (hashedPassword) {
          let userObj = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          }

          // Store the user
          _data.create('users', phone, userObj, (err) => {
            if (err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, {'Error': 'Could not create the new user'})
            }
          })          
        } else {
          callback(500, {'Error': 'Could not hash the user\'s password'})
        }

      } else {
        // User alread exist Line: 44
        callback(400, {'Error': 'A user with that phone number already exist'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields line: 36'})
  }
}

// Users - get
handlers._users.get = (data, callback) => {
  
}

// Users - put
handlers._users.put = (data, callback) => {
  
}

// Users - delete
handlers._users.delete = (data, callback) => {
  
}


// Ping handlers
handlers.ping = (data, callback) => {
  callback(200)
}

// Not found handlers
handlers.notFound = (data, callback) => {
  callback(404)
}

