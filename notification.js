const gcm = require('node-gcm');

// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
const sender = new gcm.Sender('AAAAd7CDbkM:APA91bHP4B4F6kyQe-xxm4Z4UcIRIFRbbhrJiGzDrF7orRIxMOQ88LbVrbhmLZk7FSey4eIZ4RJA9GWJQ2Sfh872CBiBpEyJIbfYINR8qwBQ16FbuTE3meWdRxRTdPQXEALVA0fCmUZn');


module.exports.findPhone = function (regTokens) {

  var message = new gcm.Message();

  message.addData('title', 'Phone search initiated');
  message.addData('body', 'The sound will play until you clear this notification');
  message.addData('play', 'true')

  // Actually send the message
  sender.send(message, regTokens, function (err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log(response);
    }

  });

}

module.exports.notifyUsers = function (regTokens) {

  var message = new gcm.Message();

  var arr = []

  console.log("RegTokens: " + JSON.stringify(regTokens))

  message.addData('title', 'Warning');
  message.addData('body', `Danger detected`);
  //message.addData('play','true')

  for(let i = 0; i < regTokens.length; i++){

    arr.push(regTokens[i].RegisID)
  }

  console.log(arr)

  // Actually send the message
  sender.send(message, arr, function (err, response) {
    if (err) {
      console.log("From Noti.js")
      console.error(err);
    } else {
      console.log("From Noti.js")
      console.log(response);
    }

  });

}