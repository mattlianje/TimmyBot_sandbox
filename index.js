/* jshint node: true */
/*jshint esversion: 6 */

"use strict";

var AssistantRequest = require('./assistantRequest');
var AssistantResponse = require('./assistantResponse');

var twilio = require('./node_modules/twilio');

var Sync = require('synchronize');
var assistantResponse = new AssistantResponse();

const LOCATION_PERMISSION_ACTION = 'locationPermissionAction';

// Some globalized user choice variables
var itemName;
var itemSize;
var itemRequest;

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
  app.askWithList("Alright! What do you want aforesaid wasteman to get you from Tim's?",
  // Build a list
  app.buildList('Timmy Menu to-go')
    // Add the first item to the list
    .addItems(app.buildOptionItem('COFFEE',
      ['coffee', 'double-double', 'coffees', 'beverage'])
      .setTitle('Coffecvvrve')
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

// send text test
function sendText() {
  console.log("sending text");
  // var accountSid = 'AC507e725097519444c8ff9d0bcb020fb5'; // Your Account SID from www.twilio.com/console
  // var authToken = '766bb8251647e070f37abff4960999cf';   // Your Auth Token from www.twilio.com/console
  var client = new twilio(accountSid, authToken);
  
  client.messages.create({
    body: 'ur mom gay',
    to: '+6478888588',  // Text this number
    from: '+6476972806' // From a valid Twilio number
  })
  .then((message) => console.log(message.sid));
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
    actionMap.set("sendText", sendText);

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

