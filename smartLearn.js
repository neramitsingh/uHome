const moment = require('moment');



module.exports.getWeekArray = function(inDate){

    return new Promise((resolve,reject)=>{
        var arr = []

var date7 = moment(inDate,"DD/MM/YYYY");

var obj1 = {
  Date: date7.format("DD/MM/YYYY")
}

arr.push(obj1)


for(let i = 0; i < 6 ; i++){


  let input = date7.subtract(1, 'days')

  obj = {
    Date: input.format("DD/MM/YYYY")
  }

  arr.push(obj)

}

resolve(arr)
})



}


module.exports.calculateAvg = function(arr){

    return new Promise((resolve,reject)=>{

        var total = 0;
        for(let i = 0; i < arr.length; i++){
            if(i%2 != 0){
                total = total + arr[i]
            }
        }

        var avg = total/7

    })
}



