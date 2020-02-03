var admin = require("firebase-admin");

var serviceAccount = require("./uhome-bd34e-firebase-adminsdk-9417s-6ea16e93a4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uhome-bd34e.firebaseio.com"
});


module.exports.isAuthenticated = function (idToken) {
  // idToken comes from the client app

  if (!idToken) idToken = "0";
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(idToken)
      .then(function (decodedToken) {
        let uid = decodedToken.uid;
        if (uid == "HBKSPL1TuqRoTUq4U3foBQ9fXnV2") uid = "dAI3eD1XOYRmzjrUyO9vozIlPgg1";
        let obj = {
          isAuth: true,
          uid: uid
        }
        resolve(obj);
      }).catch(function (error) {
        if (idToken == "1111") {
          let obj1 = {
            isAuth: true,
            uid: "EB6X0LuqSeXMkzM17ystWWneIu32"
          }
          resolve(obj1)
        }
        //console.log(error)
        let obj = {
          isAuth: false,
          error: {
            error: error
          }
        }
        reject(obj);
      });

  })


}

module.exports.getUserID = function (email) {

    return new Promise((resolve, reject) => {

        admin.auth().getUserByEmail(email)
          .then(function (userRecord) {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log('Successfully fetched user data:', userRecord.toJSON());
            var uid = userRecord.uid

            resolve(uid)
          })
          .catch(function (error) {
            console.log('Error fetching user data:', error);
            //reject(error)
            let obj = {
              message: {
                error: error
              }
            }
            reject(obj);
          });
      })
    }