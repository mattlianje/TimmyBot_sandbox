/* jshint node: true */
/*jshint esversion: 6 */

"use strict";

var AssistantRequest = require('./assistantRequest');
var AssistantResponse = require('./assistantResponse');
var twilio = require('twilio');
var AWS = require('aws-sdk');
var http = require('http');
var https = require('https');
var notification = require('./notification');
var dbSend = require('./dbSend');
AWS.config.update({region: 'us-east-1'});
var docClient = new AWS.DynamoDB.DocumentClient();
var Sync = require('synchronize');
var assistantResponse = new AssistantResponse();

const LOCATION_PERMISSION_ACTION = 'locationPermissionAction';
// const screenAvailable = app.hasAvailableSurfaceCapabilities(app.SurfaceCapabilities.SCREEN_OUTPUT);

function returnLambdaResponse(assistantResponse, context) {
  // lambda_response is the object to return that API Gateway understands
  var lambda_response = {
    "statusCode": assistantResponse.statusCode,
    "headers": {
      "Content-Type": "application/json",
      "Google-Assistant-API-Version": "v1"      // try it with v2
    },
    "body": JSON.stringify(assistantResponse.body)
  };
  context.succeed(lambda_response);
}


function dbTest (app) {
  var sentToDB = dbSend.sendToDB();

    if(sentToDB) {
      app.tell("record inserted in Dynamo DB");
    }
    else {
      app.tell("Dynamo test failed");
    }
}

function sendText(app) {
  var sendSuccess = notification.sendNotification();

    if(sendSuccess){
      app.tell("message sent");
    } else {
      app.tell("send message function failed");
    }
  /*
  var accountSid = 'ACa7278c1b5bfda0f1ba3827a1887786d7'; // Your Account SID from www.twilio.com/console
  var authToken = '60f43dc7ab70fe5d547f928158606746';   // Your Auth Token from www.twilio.com/console
  var client = new twilio(accountSid, authToken);
  
  console.log("sending text");
  
  client.messages.create({
    body: 'ur mom gay',
    to: '6477807992',  // Text this number
    from: '2898063384' // From a valid Twilio number
  })
  .then((message) => console.log(message.sid));
  app.ask("Your message might have been sent");
*/
}

function getPermission(app) {
  let namePermission = app.SupportedPermissions.NAME;
  let preciseLocationPermission = app.SupportedPermissions.DEVICE_PRECISE_LOCATION;
  app.askForPermissions("To address you by name and ask your friends nearby if they want to go on a Timmy Run", [namePermission, preciseLocationPermission]);
}

function timmyRunConfirmation(app) {
  if (app.isPermissionGranted()) {
    let displayName = app.getUserName().displayName;
    let deviceCoordinates = app.getDeviceLocation().coordinates;
    let longitude = app.getDeviceLocation().coordinates.longitude;
    let latitude = app.getDeviceLocation().coordinates.latitude;
    console.log("****Dude going on run name is: " + displayName);
    app.ask("I got that your name is " + displayName + ", do you want me to send out the run invites to your nearby friends?");
  }
}

function launchRun(app) {
  var sendSuccess = notification.sendNotification();

  if(sendSuccess){
    app.tell("message sent");
  } else {
    app.tell("send message function failed");
  }
}

function ask(app, inputPrompt) {
  app.data.lastPrompt = inputPrompt;
  app.ask(inputPrompt);
}

function askForConfirmation(app, inputPrompt) {
  app.data.lastPrompt = inputPrompt;
  app.askForConfirmation(inputPrompt);
}


function testAction(app) {
  app.ask("this is a test biatch");
}

function getTimCoordinates(app) {
  app.ask("The nearest Timmies is at DC");
}

function locationPermissionIntent(app) {
  let namePermission = app.SupportedPermissions.NAME;
  let preciseLocationPermission = app.SupportedPermissions.DEVICE_PRECISE_LOCATION;
  app.askForPermissions("To address you by name and help you find Tim Hortons' locations near you ", [namePermission, preciseLocationPermission]);
}

function timHortonsSearch(app) {
  if (app.isPermissionGranted()) {
    let displayName = app.getUserName().displayName;
    let deviceCoordinates = app.getDeviceLocation().coordinates;
    let longitude = app.getDeviceLocation().coordinates.longitude;
    let latitude = app.getDeviceLocation().coordinates.latitude;

    app.ask("You current location is " + JSON.stringify(deviceCoordinates) + latitude + longitude + "and based on this the nearest Tim Hortons is at DC");
  }
}

function customizeCoffee(app) {
  app.ask(app.buildRichResponse()
    .addSimpleResponse({speech: 'Do you want a small, medium, or large coffee',
      displayText: 'Coffee size?'})
    .addSuggestions(['Small', 'Medium', 'Large'])
    //.addSuggestionLink('Suggestion Link', 'https://assistant.google.com/')
  );
}

function menuPicker(app) {
  console.log("**** test passed");
  
  app.askWithList("Alright! What do you want aforesaid wasteman to get you from Tim's?",
  // Build a list
  app.buildList('Timmy Menu to-go')
    // Add the first item to the list
    .addItems(app.buildOptionItem('COFFEE',
      ['coffee', 'double-double', 'coffees', 'beverage'])
      .setTitle('Coffee')
      .setDescription('Fresh arabica triple roasted hipster shit bitches')
      .setImage('http://www.timhortons.com/nut-calc-images/CAEN/large/Original-Blend-Coffee.png', 'Coffee')
    )
    // Add the second item to the list
    .addItems(app.buildOptionItem('DONUT',
      ['donut', 'donuts', 'pastry'])
      .setTitle('Donut')
      .setDescription('Select a delicious donut fresh out the oven')
      .setImage('http://www.timhortons.co.uk/assets/img/products/image-donut.jpg', 'Donut')
    )
    // Add third item to the list
    .addItems(app.buildOptionItem('SANDWICH',
      ['sandwich', 'sandwiches', 'fries'])
      .setTitle('Custom Sandwich')
      .setDescription('Build a tremendous custom sandwich')
      .setImage('http://shoplevy.com/wp-content/uploads/2017/11/enhanced-30250-1482966036-1.jpg', 'Sandwich')
    )
  );
}


exports.handler = function(event, context, callback) {
  process.env.DEBUG = 'actions-on-google:*';
  var assistantRequest = new AssistantRequest(event);
  //var ActionsSdkAssistant = require('actions-on-google').ApiAiAssistant;
  var ActionsSdkAssistant = require('actions-on-google').DialogflowApp;

  var assistant = new ActionsSdkAssistant({
    request: assistantRequest,
    response: assistantResponse
  });

  const actionMap = new Map();

  //const appery = new ActionsSdkApp({request, response});
  //const testMap = new Map();

    // actionMap.set("providerSearchAction", providerSearchIntent);
    // actionMap.set(SEND_MESSAGE_ACTION, sendMessageAction);
    actionMap.set("getTimCoordinates", getTimCoordinates);
    actionMap.set("testAction", testAction);
    actionMap.set("locationPermissionAction", locationPermissionIntent);
    actionMap.set("searchAction", timHortonsSearch);
    actionMap.set("menuPicker", menuPicker);
    actionMap.set("customizeCoffee", customizeCoffee);
    actionMap.set("dbTest", dbTest);
    actionMap.set("sendText", sendText);
    actionMap.set("getPermission", getPermission);
    actionMap.set("timmyRunConfirmation", timmyRunConfirmation);
    actionMap.set("launchRun", launchRun);

    // fix this to actually be able to get user selections without asking
    
    actionMap.set(assistant.StandardIntents.OPTION, () => {
      const param = app.getSelectedOption();
      if (!param) {
        app.ask('You did not select any item from the list or carousel');
      } else if (param == 'COFFEE') {
        app.ask('User wants a coffee');
        console.log("user wants a coffee");
      } else if (param == 'DONUT') {
        app.ask('User wants a donut');
      } else if (param == 'SANDWICH') {
        app.ask('User wants a sandiwch');
      } else {
        app.ask('You selected an unknown item from the list or carousel');
      }
    });

    Sync.fiber(function() {
    assistant.handleRequest(actionMap);
    returnLambdaResponse(assistantResponse, context);
  });
};
