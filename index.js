/* jshint node: true */
/*jshint esversion: 6 */

"use strict";

var AssistantRequest = require('./assistantRequest');
var AssistantResponse = require('./assistantResponse');

var Sync = require('synchronize');
var assistantResponse = new AssistantResponse();

const LOCATION_PERMISSION_ACTION = 'locationPermissionAction';


function returnLambdaResponse(assistantResponse, context) {
  // lambda_response is the object to return that API Gateway understands
  var lambda_response = {
    "statusCode": assistantResponse.statusCode,
    "headers": {
      "Content-Type": "application/json",
      "Google-Assistant-API-Version": "v1"
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

    // actionMap.set("providerSearchAction", providerSearchIntent);
    // actionMap.set(SEND_MESSAGE_ACTION, sendMessageAction);
    actionMap.set("testAction", testAction)

    Sync.fiber(function() {
    assistant.handleRequest(actionMap);
    returnLambdaResponse(assistantResponse, context);
  });
};
