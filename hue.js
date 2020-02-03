'use strict';

//const v3 = require('../../../index').v3;
// If using this code outside of this library the above should be replaced with
const v3 = require('node-hue-api').v3;
var randomstring = require("randomstring");
var main = require('./index')
const request = require('request');
const baseURL = "https://api.meethue.com/bridge";



// Values for the ClientId, ClientSecret and AppId from the Hue Remote Application you create in your developer account.
const CLIENT_ID = 'NNioColYs9FEPNwUbGB17BRmizLAFEGi',
  CLIENT_SECRET = '7GXdL4k25r7XZ03a',
  APP_ID = 'uhome'

;

// A state value you can use to validate the Callback URL results with, it should not really be hardcoded, but should
// be dynamically generated.
const STATE = randomstring.generate();
console.log('State: ' + STATE)

const LightState = v3.lightStates.LightState;

module.exports.addHueUser = function (authCode) {
  // Replace this with your authorization code that you get from the Callback URL for your Hue Remote API Application.
  // If you do not fill this value in, the code will give you the URL to start the process for generating this value.
  const authorizationCode = authCode;
  // const authorizationCode = null;

  const remoteBootstrap = v3.api.createRemote(CLIENT_ID, CLIENT_SECRET);

  return new Promise((resolve, reject) => {

    if (!authorizationCode) {
      var url = remoteBootstrap.getAuthCodeUrl('node-hue-api-remote', APP_ID, STATE)
      var obj = {
        "url": url,
        "text": "You need to generate an authorization code for your application using this URL:"
      }
      console.log('***********************************************************************************************');
      console.log(``);
      console.log(`${remoteBootstrap.getAuthCodeUrl('node-hue-api-remote', APP_ID, STATE)}`);
      console.log('***********************************************************************************************');

      reject(obj);
    } else {
      // Exchange the code for tokens and connect to the Remote Hue API
      remoteBootstrap.connectWithCode(authorizationCode)
        .catch(err => {
          console.error('Failed to get a remote connection using authorization code.');
          console.error(err);
          reject(err);
        })
        .then(api => {
          console.log('Successfully validated authorization code and exchanged for tokens');

          const remoteCredentials = api.remote.getRemoteAccessCredentials();

          // Display the tokens and username that we now have from using the authorization code. These need to be stored
          // for future use.
          console.log(`Remote API Access Credentials:\n ${JSON.stringify(remoteCredentials, null, 2)}\n`);
          console.log(`The Access Token is valid until:  ${new Date(remoteCredentials.tokens.access.expiresAt)}`);
          console.log(`The Refresh Token is valid until: ${new Date(remoteCredentials.tokens.refresh.expiresAt)}`);
          console.log('\nNote: You should securely store the tokens and username from above as you can use them to connect\n' +
            'in the future.');

          // Do something on the remote API, like list the lights
          api.lights.getAll()
            .then(lights => {
              console.log('Retrieved the following lights for the bridge over the Remote Hue API');
              lights.forEach(light => {
                console.log(light.toStringDetailed());
              })
            });
          resolve(remoteCredentials)
        })
    }
  })
}

module.exports.switchLight = function (ACCESS_TOKEN, REFRESH_TOKEN, USERNAME, LightId) {

  const remoteBootstrap = v3.api.createRemote(CLIENT_ID, CLIENT_SECRET);

  //checkExpired(ACCESS_TOKEN, REFRESH_TOKEN, USERNAME, "1")

  var currentState;

  // The username value is optional, one will be create upon connection if one is not passed in, but this example is
  // pretending to be something close to what you would expect to operate like upon a reconnection using previously
  // obtained tokens and username.
  remoteBootstrap.connectWithTokens(ACCESS_TOKEN, REFRESH_TOKEN, USERNAME)
    .catch(err => {
      console.error('Failed to get a remote connection using existing tokens.');
      console.error(err);
      process.exit(1);
    })
    .then(api => {
      console.log('Successfully connected using the existing OAuth tokens.');

      // Do something on the remote API, like list the lights in the bridge
      api.lights.getLightState(LightId)
        .then(state => {
          // Display the state of the light
          console.log(JSON.stringify(state, null, 2));
          currentState = state.on;

          var newState = null
          if (currentState) {
            newState = new LightState().off();
          } else {
            newState = new LightState().on().ct(300).rgb(49,36,222);
          }
          api.lights.setLightState(LightId, newState)
          return !currentState
        })
        .then(result => {
          console.log(`Light state change was successful? ${result}`);
        }).catch(err => {
          console.error(err);
        })
    });
}

module.exports.getAllLights = function (ACCESS_TOKEN, REFRESH_TOKEN, USERNAME) {
  // Replace this with your authorization code that you get from the Callback URL for your Hue Remote API Application.
  // If you do not fill this value in, the code will give you the URL to start the process for generating this value.


  const remoteBootstrap = v3.api.createRemote(CLIENT_ID, CLIENT_SECRET);

  return new Promise((resolve, reject) => {

    remoteBootstrap.connectWithTokens(ACCESS_TOKEN, REFRESH_TOKEN, USERNAME)
      .catch(err => {
        console.error('Failed to get a remote connection using existing tokens.');
        console.error(err);
        process.exit(1);
      })
      .then(api => {
        console.log('Successfully connected using the existing OAuth tokens.');

        // Do something on the remote API, like list the lights
        var allLights = api.lights.getAll()
          .then(lights => {
            console.log('Retrieved the following lights for the bridge over the Remote Hue API');
            lights.forEach(light => {
              console.log(light.toStringDetailed());
            })
            //console.log(lights)
            resolve(lights)
          });

      })
  })
}

module.exports.getLight = function (ACCESS_TOKEN, REFRESH_TOKEN, USERNAME, LightID) {
  // Replace this with your authorization code that you get from the Callback URL for your Hue Remote API Application.
  // If you do not fill this value in, the code will give you the URL to start the process for generating this value.


  const remoteBootstrap = v3.api.createRemote(CLIENT_ID, CLIENT_SECRET);

  return new Promise((resolve, reject) => {

    remoteBootstrap.connectWithTokens(ACCESS_TOKEN, REFRESH_TOKEN, USERNAME)
      .catch(err => {
        console.error('Failed to get a remote connection using existing tokens.');
        console.error(err);
        process.exit(1);
      })
      .then(api => {
        console.log('Successfully connected using the existing OAuth tokens.');

        // Do something on the remote API, like list the lights
        api.lights.getLightAttributesAndState(Number(LightID))
          .then(attributesAndState => {
            // Display the details of the light
            console.log(JSON.stringify(attributesAndState, null, 2));
            resolve(attributesAndState)
          });
      }).catch(function (error) {
        reject(error)
      })


  })
}





function checkExpired(ACCESS_TOKEN, REFRESH_TOKEN, USERNAME, ACCESS_EXPIRE, REFRESH_EXPIRE, UID) {

  const today = new Date();
  const accessExp = new Date(ACCESS_EXPIRE);
  const refreshExp = new Date(REFRESH_EXPIRE);

  var diff = Math.abs(today - accessExp)

  // if (diff <= 0) {
  //   var diff2 = Math.abs(today - refreshExp)
  //   if (diff2 <= 0) {

  //   }
  //else {
  const remoteBootstrap = v3.api.createRemote(CLIENT_ID, CLIENT_SECRET);

  remoteBootstrap.connectWithTokens(ACCESS_TOKEN, REFRESH_TOKEN, USERNAME)
    .catch(err => {
      console.error('Failed to get a remote connection using existing tokens.');
      console.error(err);
      process.exit(1);
    })
    .then(api => {
      console.log('Successfully connected using the existing OAuth tokens.');

      var rem = api.remote.refreshTokens()
        .catch(err => {
          console.error('Unable to refresh');
          console.error(err);
          // process.exit(1);
        })
      console.log("Refreshed")
      console.log(rem)
      //await main.updateHueToken()

    });

}
//}
//}