const gcm = require('node-gcm');

// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
const sender = new gcm.Sender('AAAAd7CDbkM:APA91bHP4B4F6kyQe-xxm4Z4UcIRIFRbbhrJiGzDrF7orRIxMOQ88LbVrbhmLZk7FSey4eIZ4RJA9GWJQ2Sfh872CBiBpEyJIbfYINR8qwBQ16FbuTE3meWdRxRTdPQXEALVA0fCmUZn');

// var message = new gcm.Message();

// message.addData('hello', 'world');
// message.addData('name', 'khuay')
// message.addData('body', 'Guy is gay')
// message.addData('play', 'true')
// // message.addNotification('title', 'Khuay');
// // message.addNotification('body', 'Hee');

// // Specify which registration IDs to deliver the message to
// var regTokens = ['ctvDxBWHNDQ:APA91bFIeNRbgTyjPWTxE_vWYWg9iKWqB4Mknpt_6XBhy0aK4jDBJIApG1sg6HOZqfws7IHq3NjtSciOAKhH4RdWfzPW5zxw5Cd5L_lQVOZMrdTb_nWWlaZdc_alVYHD_nHS9m3UlO4R', 'eUVQ9FiFASc:APA91bFKWzxCAQW-tr2wUbRlrUXZYCkJz64vfxV0duIgLpHnHULkJJhKsNwLrx8oo-rYwxnOOkxoCCNaeYAMLYJj34m0bylw4Gs2sX8D93jNeyr2Onz8nE2cyZ30-JMRSDOSBJdUlgBb', 'fZkaZIAXcaw:APA91bF1HqwZF5s4gp_Tfh0ZEyJypjFfz4rdbeZc5mPk4Fw8wcofy55Q9bHepdw8LsVNVkiFviJ9owL1qkHI8cm0bKAGCupEA4aCTi_i0QZkp_Uhs_UWPWJ13zgG_1Aiik40aC4Jhjsx', 'd1AIltZ9W8Q:APA91bE6v0Pla-3Zl_R7yLndRZUJKoilL22heqKfPX3LskVxupWbkWxPcvpCEmS9t2gEQiCZyvarjW6sIXwt5NWCIpdQdaCpBcY7EMKpF5QMEWDUZpwLqIwmeDY77vlrGvW2kSoVVdDc', 'el7-mouWYRU:APA91bH9JPinAIg1_AoXznzTvmx9uh8qzaJc9DnPuQYN5yalSGC10IqYc-BtZvUI9UXysUbellP8Pw_GzV25wBzZmhzeAsam8LZ1-1jVTwNIMxqooTVzMGQmandCifv8WxUQB9QQT5Kf'];

// // Actually send the message
// sender.send(message, regTokens, function (err, response) {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log(response);
//   }
// });

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

module.exports.notifyUsers = function (regTokens, HomeName) {

  var message = new gcm.Message();

  message.addData('title', 'Warning');
  message.addData('body', `Warning at ${HomeName}`);
  //message.addData('play','true')

  // Actually send the message
  sender.send(message, regTokens, function (err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log(response);
    }

  });

}