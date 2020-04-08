//https://api.sunrise-sunset.org/json?lat=13.7923542&lng=100.3268313

const https = require('https');
const moment = require('moment');

module.exports.getSun = function (lat, long) {

    return new Promise((resolve,reject)=>{

        // lat = Number(lat)
        // long = Number(long)

        var options = {
            hostname: 'api.sunrise-sunset.org',
            path: `/json?lat=${Number(lat)}&lng=${Number(long)}`,
            method: 'GET'
        };
        
        var req = https.request(options, function (resp) {
        
        
            resp.on('data', async function (d) {
        
                var k = JSON.parse(d)

                console.log(JSON.stringify(k))
        
                resolve(k.results)
    
            });
        })
        
        req.end();
        
        req.on('error', function (e) {
            console.error(e);
            reject(e)
        });

    })
}

module.exports.getTime = function (input){
    return new Promise((resolve,reject)=>{

        var arr = []

        var time = moment(input, "LTS")

        var localTime = time.add(7,'hours')
        var newTime = localTime.toDate()

        var hours = ('0'+ (newTime.getHours())).slice(-2)
        var mins = ('0' + newTime.getMinutes()).slice(-2)

        console.log(hours)
        console.log(mins)


        arr.push(hours)
        arr.push(mins)

        console.log(arr)

        resolve(arr)

    })
}




