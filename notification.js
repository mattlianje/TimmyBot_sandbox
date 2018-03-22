var Mustache = require('mustache');
var fs = require('fs');
var AWS = require("aws-sdk");
var Sync = require('synchronize');
var twilio = require('twilio');

function sendNotification() {

  var sns = new AWS.SNS();
  //var message = providerNotificationText(session.providerResult, session.lang, session.messageContent, session.bestProviderIndex, session.langFile);

  //console.log("\nMessage: " + message + "\nPhoneNumber" + phoneNumber);

	var params = {
    TopicArn: "arn:aws:sns:us-east-1:652398375673:timmyTest",
    Subject: "Order your Timmy food",
    Message: "Hi your boy is going to Tims, you can place an order at: https://form.jotform.com/80797370270259"
    //PhoneNumber: "+16477807992"
  };

	try{
	  var result = Sync.await(sns.publish(params, Sync.defer()));
	  console.log("AWS text message publish result" + result);
	}catch (err) {
		console.log('\x1b[31m%s\x1b[0m', "You got error sending text, but that's ok. " + err);
			//console.error("You got error sending text, but that's ok.");
			return false;
	}
	return true;
}

//console.log(providerNotificationText(data));
exports.sendNotification = sendNotification;
