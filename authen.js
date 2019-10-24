
var admin = require("firebase-admin");

var serviceAccount = require("./uhome-bd34e-firebase-adminsdk-9417s-6ea16e93a4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uhome-bd34e.firebaseio.com"
});


function isAuthenticated(idToken){
  // idToken comes from the client app
  admin.auth().verifyIdToken(idToken)
  .then(function(decodedToken) {
    let uid = decodedToken.uid;
    return true
  }).catch(function(error) {
    console.log(error)
    return false
  });
        
}

module.exports = { isAuthenticated }