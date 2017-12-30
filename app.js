const 
	request = require('request'),
	{Wit, log} = require('node-wit'),
	client = new Wit({
		accessToken: process.env.WIT_TOKEN
		// logger: new log.Logger(log.DEBUG)
	});

// Handles messages events
// Note that psid is the page scoped id. identifies users.
exports.handleMessage = function(sender_psid, received_message, User) {
	let generateTextResponse = function (res) {
		return response = {
			"text": res
		}
	}

	let checkEntity = function(data, input) {
		return data.entities.intent && (data.entities.intent[0].value == input);
	} 

	let callback = function (psid, message, caller) {
		let response;

		client.message(message.text, {}).then((data) => {
			console.log('Message contents: ' + JSON.stringify(data));
			if (checkEntity(data, "start_standup")) {

				response = generateTextResponse("Beginning standup!");
				console.log("WE SHOULD START AYYY");

			} else if (checkEntity(data, "previous")) {
				response = generateTextResponse(`blockers were: ${caller.blockers}`)

			} else if (checkEntity(data, "blocker")) {
				var arr = [];

				if (data.entities.reminder) {
					data.entities.reminder.forEach(function (entry) {
						arr.push(entry.value);
					});
				}

				if (arr.length == 0) {
					caller.blockers = "No blockers [beta version]";
					response = generateTextResponse("No blockers");
				} else {
					let all = arr.join(', ');
					caller.blockers = all;
					response = generateTextResponse(`Blocked by: ${all}`)
				}

			} else if (checkEntity(data, "today")) {
				var arr = [];

				if (data.entities.reminder) {
					data.entities.reminder.forEach(function (entry) {
						arr.push(entry.value);
					});
				}

				let temp = arr.join(', ');

				response = generateTextResponse(`Tasks for today are: ${temp}`);
			} else if (checkEntity(data, "yesterday")) {
				var arr = [];

				if (data.entities.reminder) {
					data.entities.reminder.forEach(function (entry) {
						arr.push(entry.value);
					});
				}

				let temp = arr.join(', ');

				response = generateTextResponse(`Yesterday I completed: ${temp}`);
			} else {
				// Create the payload for a basic text message
				response = generateTextResponse(`You sent the message: "${message.text}". Now send me an image!`);
			}
			caller.save(function(err, updated_user) {
				if (err) return console.error(err);
				console.log("UPDATE: " + updated_user);
				exports.callSendAPI(psid, response);
			});
		});
	}

	// Check if the message contains text
	if (received_message.text) {
		console.log(received_message.text);
		// callback(sender_psid, received_message, User);

		var user_query = User.findOne({ psid: sender_psid });
		user_query.then(function (this_user) {
			if (!this_user) {
				User.create({ psid: sender_psid }, function(err, user) {
					if (err) return console.error(err);
					callback(sender_psid, received_message, user);
				});
			} else {
				callback(sender_psid, received_message, this_user);
			}
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
exports.handlePostback = function(sender_psid, received_postback, User) {
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