/* Primary file for the API */

// Dependencies
var http = require('http')
var https = require('https')
var url = require('url')
var StringDecoder = require('string_decoder').StringDecoder
var config = require('./lib/config')
var fs = require('fs')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')
// var _data = require('./lib/data')

// The server should respond to all request with a string

// Instanciate the HTTP server
var httpServer = http.createServer((req, res) => {
  unifiedServer(req, res)
})

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log(`The server is listening on port ${config.httpPort} in ${config.envName} mode`)
})

// Instanciate the HTTPS server
var httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pen'),
  'cert' : fs.readFileSync('./https/cert.pem')
}

var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res)
})

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} mode`)
})

// All the server logic for both the http and https server
var unifiedServer = (req, res) => {
  // Get the url and parse it
  // var parsedUrl = url.parse(req.url, true)
  var parsedUrl = new URL(`https://localhost:3001${req.url}`)
  // Get the path
  var path = parsedUrl.pathname
  var trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  var queryStringObject = parsedUrl.query

  // Get the HTTP Method
  var method = req.method.toLowerCase()
  console.log(method)

  // Get the headers as an object
  var headers = req.headers
  
  // Get the payload if there is any
  var decoder = new StringDecoder('utf-8')
  var buffer = ''

  // On the event (data) compile stream into the var called (buffer)
  req.on('data', (data) => {
    buffer += decoder.write(data)
  })
  
  req.on('end', () => {
    buffer += decoder.end()

    // choose the handler that this request goes to
    // If one is not found use the notFound handler
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound

    // Construct the data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    // 32:19
    
    // Route the request to the handler specified in the router
    chosenHandler = (data, (statusCode, payload) => {
      // Use the status code called back by the handler, or default
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) === 'object' ? payload : {}

      // Convert the payload to a string 
      var payloadString = JSON.stringify(payload)

      // Return the response
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      res.end(payloadString)

      console.log('Arrived')
      // Problem Area

      // Log the request path 
      console.log('Returning this response: ', statusCode, payloadString) 

    })

    chosenHandler()

  })

}

// Define a request router
var router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
}