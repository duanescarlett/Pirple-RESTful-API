/*
  Request handlers
*/

// Dependencies
// const delete = require('./data')
const _data = require('./data')
const helpers = require('./helpers')

// Define the handlers
var handlers = {}

// Users 
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  // console.log(data.method)
  if (acceptableMethods.indexOf(data.method) > -1) {
    console.log("Method: ", data.method)
    // break down here
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
  console.log("handlers._users.post : ", data)
  // Check that app required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false

  console.log(firstName)
  
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
// Required data: phone
// Optional data: none 
handlers._users.get = (data, callback) => {
  // Check that the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false

  if (phone) {
    // Lookup the user
    // 37:09
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from the user object before returning it to the requester
        delete data.hashedPassword;
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password
handlers._users.put = (data, callback) => { 
  // Check for the required field
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false

  // Check for the optional fields
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  // Error if the phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {
      // Lookup the user  
      _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
          // Update the fields necessary
          if (firstName) {
            userData.firstName = firstName
          }
          if (lastName) {
            userData.lastName = lastName
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password)
          }

          // Store the new updates
          _data.update('users', phone, userData, (err) => {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, {'Error': 'Could not update the user'})
            }
          })
        } else {
          callback(400, {'Error': 'The specified user does not exist'})
        }
      })
    } else {
      callback(400, {'Error': 'Missing fields to update'})
    }
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

// Users - delete
// Required field : Phone
// @TODO Only let and authed user delet their object
// @todo Cleanup (delete) any other data files associated with this user
handlers._users.delete = (data, callback) => {
  // Check that the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false

  if (phone) {
    // Lookup the user
    // 37:09
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        _data.delete('users', phone, (err) => {
          if (!err) {
            callback(200)
          } else {
            callback(500, {'Error': 'Could not delete the specified user'})
          }
        })
      } else {
        callback(400, {'Error': 'Could not find the specified user'})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Container for all the tokens methods
handlers._tokens = {}

// Tokens - POST
// Required data: phone, password 
// Optional data: none
handlers._tokens.post = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  if (phone && password) {
    // Lookup the user who matches that phone number
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user bucket
        let hashedPassword = helpers.hash(password)
        if (hashedPassword == userData.hashedPassword) {
          // If valid create a new token with a valid name. Set expiration date 1hr in the future
          let tokenId = helpers.createRandomString(20)
          let expires = Date.now() + 1000 * 60 * 60
          let tokenObject = {
            'phone' : phone, 
            'id' : tokenId,
            'expires' : expires
          }

          // Store the token 
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              // callback(200, tokenObject)
              callback(200, 'Token was created')
            } else {
              callback(500, {'Error' : 'Could not create the new token'})
            }
          }) 
          
        } else {
          callback(400, {'Error': 'Password did not match the specified user\'s stored password'})
        }
      } else {
        callback(400, {'Error': 'Could not find the specified user'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field(s)'})
  }
}

// Tokens - GET
handlers._tokens.get = (data, callback) => {
  // Check that the ID is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false

  if (id) {
    // Lookup the token
    _data.read('token', phone, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData)
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required field'})
  }
}

// Tokens - PUT
handlers._tokens.put = (data, callback) => {
  
}

// Tokens - DELETE
handlers._tokens.delete = (data, callback) => {
  
}

// Ping handlers
handlers.ping = (data, callback) => {
  callback(200)
}

// Not found handlers
handlers.notFound = (data, callback) => {
  callback(404)
}

module.exports = handlers