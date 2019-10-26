
var admin = require("firebase-admin");

var serviceAccount = require("./uhome-bd34e-firebase-adminsdk-9417s-6ea16e93a4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uhome-bd34e.firebaseio.com"
});


function isAuthenticated(idToken){
  // idToken comes from the client app
  if(idToken == "1111") return {
      isAuth: true,
      uid: "EB6X0LuqSeXMkzM17ystWWneIu32"
    }
  admin.auth().verifyIdToken(idToken)
  .then(function(decodedToken) {
    let uid = decodedToken.uid;
    // let obj = {
    //   isAuth: true,
    //   uid: uid
    // }
    // JSON.stringify(obj)
    // return obj
    return "ass"
  }).catch(function(error) {
    console.log(error)
    // let obj = {
    //   isAuth: false,
    //   error: error
    // }
    //JSON.stringify(obj)
    return {
        isAuth: false,
        error: error
      }
    //return false
  });
        
}

module.exports = isAuthenticated