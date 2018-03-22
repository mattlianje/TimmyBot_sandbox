var Mustache = require('mustache');
var fs = require('fs');
var AWS = require("aws-sdk");
var Sync = require('synchronize');
var twilio = require('twilio');
AWS.config.update({region: 'us-east-1'});
var docClient = new AWS.DynamoDB.DocumentClient();

function sendToDB() {

  var table = "dbTest1";

  var customerID = 2008;
  //var title = "The Big New Movie";
  
  var params = {
      TableName:table,
      Item:{
					"customerID": customerID,
					"info" : "sexy bitch",
					"menuItem" : "coffee bruh",
					"customerName" : "Tyler LAM"
      }
	};
	
	try{
	var result = Sync.await(docClient.put(params, Sync.defer()));
	console.log("Adding a new item..." + result);
	}
	catch(err){
		console.log("Dynamo test failed again");
		return false;
	}
	return true;
}

//console.log(providerNotificationText(data));
exports.sendToDB = sendToDB;
