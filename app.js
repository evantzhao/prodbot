const 
	request = require('request'),
	{Wit, log} = require('node-wit'),
	mongoose = require('mongoose'),
	db_uri = process.env.MONGO_URI,
	client = new Wit({
		accessToken: process.env.WIT_TOKEN
		// logger: new log.Logger(log.DEBUG)
	});

mongoose.connect(db_uri);
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  // we're connected!
  console.log("We're connected to the local mongodb");

  // Generate local schema
	var user_schema = mongoose.Schema({
		psid: Number,
		yesterday: [String],
		today: [String],
		blockers: [String]
	});

	var User = mongoose.model('users', user_schema);

});

// Handles messages events
// Note that psid is the page scoped id. identifies users.
exports.handleMessage = function(sender_psid, received_message) {
	// client.message(received_message, {}).then((data) => {
	// 		console.log('Message contents: ' + JSON.stringify(data));
	// 		if (data.entities.intent && data.entities.intent[0].value == "start_standup") {
	// 			response = {
	// 				"text": `Beginning standup!`
	// 			}

	// 			console.log("WE SHOULD START AYYY");
	// 		}
	// });


	let response;

	console.log(received_message);

	// Check if the message contains text
	if (received_message.text) {
		client.message(received_message, {}).then((data) => {
			console.log('Message contents: ' + JSON.stringify(data));
			if (data.entities.intent && data.entities.intent[0].value == "start_standup") {
				response = {
					"text": `Beginning standup!`
				}

				console.log("WE SHOULD START AYYY");
			} else {
				// Filtering for understanding what type of intent is being used.
				if (data.entities.intent && data.entities.intent[0].value == "blocked") {

				} else if (data.entities.intent && data.entities.intent[0].value == "today") {

				} else if (data.entities.intent && data.entities.intent[0].value == "yesterday") {

				} else {
					// Create the payload for a basic text message
					response = {
						"text": `You sent the message: "${received_message.text}". Now send me an image!`
					}	
				}
			}
			exports.callSendAPI(sender_psid, response);
		});

	} else if (received_message.attachments) {
		// Get the URL of the message attachment
		let attachment_url = received_message.attachments[0].payload.url;
		response = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": [{
						"title": "Is this the right picture?",
						"subtitle": "Tap a button to answer.",
						"image_url": attachment_url,
						"buttons": [
							{
							"type": "postback",
							"title": "Yes!",
							"payload": "yes",
							},
							{
							"type": "postback",
							"title": "No!",
							"payload": "no",
							}
						],
					}]
				}
			}
		}
		exports.callSendAPI(sender_psid, response);
	}

	// Sends the response message
	// exports.callSendAPI(sender_psid, response);
};

// Handles messaging_postbacks events
exports.handlePostback = function(sender_psid, received_postback) {
	let response;

	// Get the payload for the postback
	let payload = received_postback.payload;

	// Set the response based on the postback payload
	if (payload === 'yes') {
		response = { "text": "Thanks!" }
	} else if (payload === 'no') {
		response = { "text": "Oops, try sending another image." }
	}
	// Send the message to acknowledge the postback
	exports.callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
exports.callSendAPI = function(sender_psid, response) {
	// Construct the message body
	let request_body = {
		"recipient": {
			"id": sender_psid
		},
		"message": response
	}

	// Send the HTTP request to the Messenger Platform
	request({
		"uri": "https://graph.facebook.com/v2.6/me/messages",
		"qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
		"method": "POST",
		"json": request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('message sent!')
		} else {
			console.error("Unable to send message:" + err);
		}
	}); 
}