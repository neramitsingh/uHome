var gcm = require('node-gcm');

// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
var sender = new gcm.Sender('514062511683');

// Prepare a message to be sent
var message = new gcm.Message({
    data: { key1: 'msg1' }
});

// Specify which registration IDs to deliver the message to
var regTokens = ['YOUR_REG_TOKEN_HERE'];

// Actually send the message
sender.send(message, { registrationTokens: regTokens }, function (err, response) {
	if (err) console.error(err);
	else console.log(response);
});