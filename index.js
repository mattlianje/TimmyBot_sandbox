'use strict';
var VERIFY_TOKEN = "timmy-test123";
var https = require('https');
var PAGE_ACCESS_TOKEN = "EAAC30NL4C5cBAGgHCjWafH6ZC7gZBlHBZCPo5RyEF0zQ6HE7T6agUGVjacVya7AtNilAlYOqzxckO8o9UCd9moQz7jDVWvfpDsfl8CrT2SSRgjuToN1RHpe0SJzeKiZA6RFKYLXFrXZBqvistM4eOqaDbtA2T1x93KuNnM4ywt8ZCnAsqnsfyN";
// dynamo db setup
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
var docClient = new AWS.DynamoDB.DocumentClient();
var sessionID;

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
              if (msg.message.quick_reply) {
                console.log("***** this is a quick reply");
                receivedQuick(msg);
              } else {
                receivedMessage(msg);
              }
            } else if (msg.postback) {
              receivedPostback(msg);
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
  var quick_reply = event.message.quick_reply;
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
        sendOrderToHost(senderID);
        sendTextMessage(senderID, "Order Sent!");
        break;
      case "join run":
        sendMenu(senderID);
        break;
      case "decline run":
        sendTextMessage(senderID, "ok");
        break;
      case "startRun":
        sendTextMessage(senderID, "Great! I let your friends know you are going on a run");
        startRun(senderID);
        break;
      case "leavingIntent":
        sendTextMessage(senderID, "No problem, I am always here to let your friends know if you are going to Tims :)");
        break;
      default:
        sendTextMessage(senderID, "default");
    }
  }
}

function receivedPostback(event) {
  console.log("Postback data: ", event.postback);

  var senderID = event.sender.id;
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
        var msg = "nothing added";
        if (payload == "coffee") {
          console.log("you ordered a coffeee");
          addItem(senderID, "coffee");
          msg = "Coffee added to your order!";
        } else if (payload == "donut") {
          console.log("you ordered a donut");
          addItem(senderID, "donut");
          msg = "Donut added to your order!";
        } else if (payload == "sandwich") {
          console.log("you ordered a sandwich");
          addItem(senderID, "sandwich");
          msg = "Sandwich added to your order!";
        }
        //send confirm or order more?
        sendConfirmation(senderID, msg);
        break;
    default:
      console.log("defaulted");
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
        sendTextMessage(1685604204796223, "prepare to face the blickyAHHH");
        break;
      case "start a run":
        startRun(senderID);
        break;
      case "show menu": 
        console.log("sending menu: ");
        sendMenu(senderID);
        break;
      case "add another item":
        console.log("adding another item");
        sendMenu(senderID);
        break;

      case "get host": 
        console.log("gonna print out the host");
        sendOrderToHost(senderID);  
        break;
      case "confirm order":
        console.log("confirming order");
        sendTextMessage(senderID, "Order Confirmed!");
        //should retrieve order and print out a reciept
        sendOrderToHost(senderID);
        break;
      case "test add":
        addItem(senderID, "coffee");
        break;
      case "test increment":
        incrementRunID();
        break;
      case "test receipt":
        sendReciept(senderID, senderID, ["coffee", "donut", "sandwich"] );
        break;
      case "test prompt":
        sendRunPrompt(senderID, "test");
        break;
      default:
        console.log("This is his id: " + recipientID);
        greetingIntent(senderID);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function testDb() {
  console.log("testing DB");
  var table = "runs";
  var customerID = 2000;
    
  var params = {
      TableName: table,
      Item:{
          'customerID': { N: "2022" },
          'Info' : { S: 'fagit' },
      }
  };
  putItem(params);
}

// starts a run
function startRun(senderID) {
  var host = getName(senderID);
  var msg = host + " is going on a Tims run. Would you like anything?";
  var friends = getFriendsID(host);
  console.log("initializing run");
  initializeRun(senderID);
  for (var i = 0; i < friends.length; i++) {
    console.log("sending to " + getName(friends[i]));
    sendRunPrompt(friends[i], msg);
  }; 
}

function putItem(params) {
  ddb.putItem(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
}

// returns query results when passed params
function query(params) {
  var result = docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
    }
  });
  return result;
}

//send order to host given guest id 
function sendOrderToHost(userID) {
  console.log("sending order to host");
  pullUser(userID).then((user) => {
    console.log("sendOrderHost test : " + JSON.stringify(user, null, 2));
    var host = user["Item"]["hostID"];
    var order = user["Item"]["orderItems"];
    // send reciept to the host
    sendReciept(userID, parseFloat(host), order);
    // send receipt to guest
    sendReceipt(userID, userID, order);
  });
}

function addItem(senderID, item) {

  console.log("adding an item to the users order");
  var params = {
    TableName: "run1",
    Key:{
        "userID": senderID,
    },
    UpdateExpression: "set orderItems = list_append(orderItems, :val)",
    ExpressionAttributeValues:{
        ":val": [item],
    },
    ReturnValues:"UPDATED_NEW"
  };

  console.log("Updating the item...");
  docClient.update(params, function(err, data) {
      if (err) {
          console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
      }
  });

}

//pull user where run status is open
function pullUser(userID) {
  var pullUser = new Promise( (resolve, reject) => {
    var params = {
      TableName: "run1",
      Key:{
        "userID": userID
      }
    };

    var user = docClient.get(params, function(err, data) {
      if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
          resolve(error);
      } else {
          console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
          resolve(data);
      }
    });
  });
  return pullUser;
}

// To be done at the start of each run - combines test functions setHostID and clearItems
function initializeRun(hostID) {

  var arrayOfAllIDs = getFriendsID(getName(hostID));
  arrayOfAllIDs.push(hostID);

  for (var i = 0; i < arrayOfAllIDs.length; i++) {
      var table = "run1";
      var currentFriend = arrayOfAllIDs[i].toString();
      console.log("****" + arrayOfAllIDs[i]);
      // Update the item, unconditionally,

      var params = {
          TableName: table,
          Key: {
              "userID": currentFriend
          },
          UpdateExpression: "set hostID = :r, orderItems = :p",
          ExpressionAttributeValues: {
              ":r": hostID,
              ":p": [],
          },
          ReturnValues: "UPDATED_NEW"
      };

      console.log("Updating the item...");
      docClient.update(params, function(err, data) {
          if (err) {
              console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
              console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
          }
      });
  }
}

//given an array of menu items send a receipt
function sendReciept(senderID, recipientID, items) {
  var subtotal = calculateTotal(items);
  var tax = Math.round(subtotal*0.15);
  tax = Math.round( tax * 100) / 100;
  var total = subtotal + tax;
  var elements = [];
  console.log(items.toString());
  for (var i = 0; i < items.length; i++) {
    console.log(items[i]);
    var item = {
      title: items[i],
      quantity: 1,
      price: getPrice(items[i]),
      currency: "CAD",
      image_url: getImage(items[i])
    }
    elements.push(item);
  }

  var payload = {
    recipient: {
      id: recipientID
    }, 
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: getName(senderID),
          sharable: true,
          currency: "CAD",
          order_number: "1234",
          payment_method: "cash or e-transfer",
          summary: {
            subtotal: subtotal,
            total_tax: tax,
            total_cost: total
          },
          elements: elements
        }
      }
    }
  }
  
  callSendAPI(payload);
}

//map userID to name 1700998199983769
function getName(userID) {
  var dict = {
    1617178451732981: "Matthieu",
    1671101976301343: "Kevin",
    1700998199983769: "Tyler",
    1685604204796223: "Eldrick"
  };
  return dict[userID];
}

//map name to user
function getUserID(name) {
  var dict = {
    "Tyler": 1700998199983769,
    "Matthieu": 1617178451732981,
    "Kevin": 1671101976301343,
    "Eldrick": 1685604204796223
  };
  return dict[name];
}

//map name to friend ids 
function getFriendsID(name) {
  var friends = {
    "Matthieu": [getUserID("Tyler"), getUserID("Kevin"), getUserID("Eldrick")],
    "Kevin": [getUserID("Tyler"), getUserID("Matthieu"), getUserID("Eldrick")],
    "Tyler": [getUserID("Kevin"), getUserID("Matthieu"), getUserID("Eldrick")],
    "Eldrick": [getUserID("Kevin"), getUserID("Matthieu"), getUserID("Tyler")]
  };
  return friends[name];
}

//return the price of a menu item 
function getPrice(name) {
  var menuItems = {
    "coffee": 1.79,
    "donut": 1.00,
    "sandwich": 5.99
  };
  return menuItems[name];
}

//calculate total
function calculateTotal(items) {
  var total = 0.00;
  for (var i = 0; i < items.length; i++) {
    total += getPrice(items[i]);
  }
  return Math.round(total * 100) / 100;
}

function getImage(name) {
  var menuItems = {
    "coffee": "http://www.timhortons.com/nut-calc-images/CAEN/large/Original-Blend-Coffee.png",
    "donut": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2BCaEfmSuVel83xeJ_dSwvtdgEptJHJp6AAtrZWidVTbfKcNTlw",
    "sandwich": "http://www.timhortons.com/ca/images/ham-cheese-thumbnail.png"
  };
  return menuItems[name];
}

//send quick reply text
function sendConfirmation(recipientID, msg) {
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      text: msg,
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

//send join run prompt
function sendRunPrompt(recipientID, msg) {
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      text: msg,
      quick_replies: [
        {
          content_type: "text",
          title: "Yes",
          payload: "join run"
        },
        {
          content_type: "text",
          title: "No Thanks",
          payload: "decline run"
        }
      ]
    }
  };
  callSendAPI(messageData);
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

function greetingIntent(recipientID) {
  var messageData = {
    recipient: {
        id: recipientID
    },
    message: {
        text: "Hi, this is Timmy! Do you want me to let your friends know you are going to Tims and get their orders? In the future you can just say 'start a run' and I'll let your friends know you are going to Tims.",
        quick_replies: [{
                content_type: "text",
                title: "Start a run",
                payload: "startRun"
            },
            {
                content_type: "text",
                title: "No thanks",
                payload: "leavingIntent"
            }
        ]
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