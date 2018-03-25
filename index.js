'use strict';
var VERIFY_TOKEN = "timmy-test123";
var https = require('https');
var PAGE_ACCESS_TOKEN = "EAAGKSDFbpP0BAKhjoKn7EkHBZAKcZBMBdGO8IF8UXPVSjZAGTnU46NUxLzZCuKgOxAQixkX96wsv0EfS6wLHhNqJbRhXGZAgZAXAEHZAtAwtXEfKyTApHAZBFT845erZB3RjGSnf6q2MltifQXopAPc5XnxnjP91x21iH2EuwZCFZBFG3OX4TwFNUAN";
// dynamo db setup
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
var docClient = new AWS.DynamoDB.DocumentClient();
var sessionID;
var globalSenderID;
var uniqid = require('uniqid');

// TODO write a piece that sets the session ID to the previous session ID +1
//var nextIDTest = incrementRunID();


exports.handler = (event, context, callback) => {
    
  // process GET request
  if(event.queryStringParameters){
    var queryParams = event.queryStringParameters;
 
    var rVerifyToken = queryParams['hub.verify_token']
 
    if (rVerifyToken === VERIFY_TOKEN) {
      var challenge = queryParams['hub.challenge']
      
      var response = {
        'body': parseInt(challenge),
        'statusCode': 200
      };
      
      callback(null, response);
    }else{
      var response = {
        'body': 'Error, wrong validation token',
        'statusCode': 422
      };
      
      callback(null, response);
    }
  
  // process POST request
  }else{
    var data = JSON.parse(event.body);
    console.log(data);
    // Make sure this is a page subscription
    if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    if (data.entry) {
      data.entry.forEach(function(entry) {
          var pageID = entry.id;
          var timeOfEvent = entry.time;
          // Iterate over each messaging event
          entry.messaging.forEach(function(msg) {
            if (msg.message) {
              receivedMessage(msg);
            }else if (msg.postback) {
              receivedPostback(msg);
            } else if (msg.quick_reply) {
              receivedQuick(msg);
            } else {
              console.log("Webhook received unknown event: ", event);
            }
          });
      });
    }
    }
    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    var response = {
      'body': "ok",
      'statusCode': 200
    };
      
    callback(null, response);
  }
}

function receivedQuick(event) {
  console.log("Quick Reply Data: ", event.quick_reply);

  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var quick_reply = event.quick_reply;
  console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(quick_reply));
  var payload = quick_reply.payload;

  if (payload) {
    switch (payload) {
      case "add more":
        sendMenu(senderID);
        break;
      case "confirm":
        // generate reciept and send host order
        sendTextMessage(senderID, "Order Confirmed!");
        break;
      default:
        sendTextMessage(senderID, "default");
    }
  }
}

function receivedPostback(event) {
  console.log("Postback data: ", event.postback);

  var senderID = event.sender.id;
  var globalSenderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var postback = event.postback;
  console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(postback));
  var title = postback.title;
  var payload = postback.payload;

  if (payload) {
    switch (title) {
      case "Add Item":
        if (payload == "coffee") {
          // write order to database 
          console.log("you ordered a coffeee");
        } else if (payload == "donut") {
          console.log("you ordered a donut");
          // write order to database
        }
        //send order summary
        //query by senderID, the list items 
        sendConfirmation(senderID);
        break;
      default:
        console.log("defaulted");
        sendTextMessage(senderID, "default");
    }
  }
}

function receivedMessage(event) {
  console.log("Message data: ", event.message);
  
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));
  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;
  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText.toLowerCase()) {
      case 'generic':
        //sendGenericMessage(senderID);
        console.log("This is his id: " + recipientID);
        sendTextMessage(senderID, "penis");
        break;
      case 'annoy matt':
        sendTextMessage(1617178451732981, "mY nAmE iS MaTTHiEuU");
        break;
      case 'annoy kevin':
        sendTextMessage(1671101976301343, "ur mom gay");
        break;
      case 'annoy tyler': 
        sendTextMessage(1700998199983769, "hi");
        break;
      case 'annoy eldrick':
        sendTextMessage(1685604204796223, "go to the back of the bus");
        break;
      case "show menu": 
        console.log("sending menu: ");
        sendMenu(senderID);
        break;
      case "i'm going to tims":
        var host = getName(senderID);
        var msg = host + " is going on a tims run, would you like to anything?";
        var friends = getFriendsID(host);
        console.log(friends);
        for (var i = 0; i < friends.length; i++) {
          console.log("sending to " + getName(friends[i]));
          sendTextMessage(friends[i], msg);
        }
        break;
      case "add another item":
        console.log("adding another item");
        sendMenu(senderID);
        break;
      case "confirm order":
        console.log("confirming order");
        sendTextMessage(senderID, "Order Confirmed!");
        //should retrieve order and print out a reciept
        break;
      case "test db":
        testDb();
        break;
      case "test increment":
        incrementRunID();
        break;
      case "test start run":
        var testSenderID = senderID.toString();
        createNewRun(testSenderID);
        //createNewRun(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText + "***" + senderID);

    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function testDb() {
  console.log("testing DB");
  var table = "dbTest1";
  var customerID = 2000;
    //var title = "The Big New Movie";
    
  var params = {
      TableName: table,
      Item:{
          'customerID': { N: "2022" },
          'Info' : { S: 'fagit' },
      }
  };

  ddb.putItem(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
}

function createNewRun(senderID) {

  // When a new run is created we must create a table that has

  /*
CID      runID    userID   status    items    role




  */

// Before anything we set a unique runID using the slick npm
console.log("creating a new run in the db...");

var uniqueRunID = uniqid();
var table = "runs2";
var hostCID = uniqueRunID + "-" + senderID;
// TODO add the host of the run to the run table
  var params = {
    TableName: table,
    Item:{
      'CID' : hostCID,
      'runID' : uniqueRunID,
      'userID' : senderID,
      'runStatus' : "open",
      'items' : "NA",
      'role' : "host",
    }
  };
  docClient.put(params, function(err, data) {
    if(err) {
      console.log("Error", err);
      return false;
    }
    else {
      //console.log("**** Success new run created", data);
      return true;
    }
  });

// TODO write piece of code that gets the userID s of all the friends
var senderName = getName(senderID);
var arrayOfFriends = getFriendsID(senderName);
var length = arrayOfFriends.length;

// loop through and add all the guest of the run to the table
for (var i = 0; i < length; i++) {
  var table = "runs2";
  var currentFriendID = arrayOfFriends[i];
  var CID = uniqueRunID + "-" + currentFriendID;
  // TODO add the host of the run to the run table
    var params = {
      TableName: table,
      Item:{
        'CID' : CID,
        'runID' : uniqueRunID,
        'userID' : currentFriendID,
        'runStatus' : "open",
        'items' : "no selections yet",
        'role' : "guest",
      }
    };
    docClient.put(params, function(err, data) {
      if(err) {
        console.log("Error", err);
        return false;
      }
      else {
        console.log("**** Success new run created", data);
        return true;
      }
    });
}

}

// function the grabs the id of the last run & calls onScan which sets the globalized session ID var
 function incrementRunID() {
   console.log("Querying the table for the greatest run");
   // we make a quick array to store all the customer ID s from the past
   var arrayPastID;
   var params = {
     TableName: "dbTest1",
     ProjectionExpression: "customerID",
   };
   docClient.scan(params, onScan);
 }

function onScan(err, data) {
  var scanResults;
  var previousID;

     if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
     }
     else {
       // print all the customer IDs
       console.log("Scan succeeded");
       console.log("First item is " + data.Items[0].customerID);
        data.Items.forEach(function(record) {
          if (record.customerID != null) {
            //scanResults.push(record.customerID);
            console.log("record: " + record.customerID);
            console.log(typeof record.customerID );
          }
     });
     }
     previousID = data.Items[0].customerID;
     sessionID = previousID + 1;
     console.log("****Your current session ID is " + sessionID);
}

// function that gets the current run ID for the users that are not hosting but joining the run
function getRunID() {
  console.log("Querying the table for the current run id");
  var arrayPastID;
   var params = {
     TableName: "dbTest1",
     ProjectionExpression: "customerID",
   };
   docClient.scan(params, onScanGetCurrent);
}

function onScanGetCurrent(err, data) {
  if (err) {
    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
   }
   else {
     // print all the customer IDs
     console.log("Scan succeeded");
     console.log("First item is " + data.Items[0].customerID);
      data.Items.forEach(function(record) {
        if (record.customerID != null) {
          //scanResults.push(record.customerID);
          console.log("record: " + record.customerID);
          console.log(typeof record.customerID );
        }
   });
   }
   var currentID = data.Items[0].customerID;
   console.log("****the ID of the current run is " + currentID);
   sessionID = data.Items[0].customerID;
}
//map userID to name
function getName(userID) {
  var dict = {
    1617178451732981: "Matthieu",
    1671101976301343: "Kevin",
    1700998199983769: "Tyler",
    1685604204796223: "Eldrick",
    1547553705291892: "Matthieu2"
  };
  return dict[userID];
}

//map name to user
function getUserID(name) {
  var dict = {
    "Tyler": 1700998199983769,
    "Matthieu": 1617178451732981,
    "Kevin": 1671101976301343,
    "Eldrick": 1685604204796223,
    "Matthieu2" : 1547553705291892
  };
  return dict[name];
}

//map name to friend ids 
function getFriendsID(name) {
  var friends = {
    "Matthieu": [getUserID("Tyler"), getUserID("Kevin"), getUserID("Eldrick")],
    "Kevin": [getUserID("Tyler"), getUserID("Matthieu"), getUserID("Eldrick")],
    "Tyler": [getUserID("Kevin"), getUserID("Matthieu"), getUserID("Eldrick")],
    "Eldrick": [getUserID("Kevin"), getUserID("Tyler"), getUserID("Matthieu")],
    "Matthieu2" : [getUserID("Kevin"), getUserID("Tyler"), getUserID("Matthieu")]
  };
  return friends[name];
}

//send quick reply text
function sendConfirmation(recipientID) {
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      text: "Confirm Order?",
      quick_replies: [
        {
          content_type: "text",
          title: "Confirm Order",
          payload: "confirm"
        },
        {
          content_type: "text",
          title: "Add Another Item",
          payload: "add more"
        }
      ]
    }
  };
  callSendAPI(messageData);
}

//send menu
function sendMenu(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "list",
          top_element_style: "compact",
          elements: [
            {
              title: "Coffee $1.79",
              subtitle: "Original Blend Coffee",
              image_url: "http://www.timhortons.com/nut-calc-images/CAEN/large/Original-Blend-Coffee.png",
              buttons: [
                {
                  title: "Add Item",
                  type: "postback",
                  payload: "coffee"
                }
              ]
            },
            {
              title: "Donut $0.99",
              subtitle: "A freshly baked chocolate glazed donut",
              image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2BCaEfmSuVel83xeJ_dSwvtdgEptJHJp6AAtrZWidVTbfKcNTlw",
              buttons: [
                {
                  title: "Add Item",
                  type: "postback",
                  payload: "donut"
                }
              ]
            },
            {
              title: "Sandwich $5.99",
              subtitle: "Fresh BLT on Italian bun",
              image_url: "http://www.timhortons.com/ca/images/ham-cheese-thumbnail.png",
              buttons: [
                {
                  title: "Add Item",
                  type: "postback",
                  payload: "sandwich"
                }
              ]
            }
          ]
        }
      }
    }
  };
  callSendAPI(messageData);
}

//send button
function sendButton(recipientId) {

}

function sendTextMessage(recipientId, messageText) {
  console.log("sending to : " + recipientId);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}
function callSendAPI(messageData) {
  var body = JSON.stringify(messageData);
  console.log("sending :" + body);
  var path = '/me/messages?access_token=' + PAGE_ACCESS_TOKEN;
  var options = {
    host: "graph.facebook.com",
    path: path,
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  };
  var callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });
    response.on('end', function () {
 
    });
  }
  var req = https.request(options, callback);
  req.on('error', function(e) {
    console.log('problem with request: '+ e);
  });
 
  req.write(body);
  req.end();
}