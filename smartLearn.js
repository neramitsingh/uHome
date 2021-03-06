const moment = require('moment');

const math = require('mathjs')



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

    // console.log("In calculate function: ")
    // console.log("Arr = " + JSON.stringify(arr))
    // console.log("Length = "+ arr.length)
    // console.log("Times = "+times)

    return new Promise((resolve,reject)=>{

        var result = math.mean(arr)


        resolve(result)

 

    })
}

module.exports.calculateSD = function(data, mean, times){

    return new Promise((resolve,reject)=>{

    var sd = math.std(data)
 
    resolve(sd)

    })
}

module.exports.statDataPrep = function (result) {
    return new Promise((resolve, reject) => {
  
      var arr = []
  
      for (let i = 0; i < result.length; i++) {

          var date1 = Number(result[i].StopTimer[0])
          var date2 = Number(result[i].StartTime)
  
          console.log(typeof date1)
          console.log(typeof date2)
  
          console.log("Date 1: " + date1)
          console.log("Date 2: " + date2)

          var value = date1 - date2
  
  
          arr.push(value)
      }

      console.log(JSON.stringify(arr))
  
      setTimeout(resolve(arr), 3000)
  
    })
  }

  module.exports.calculateUserTimes = function (result) {
    return new Promise((resolve, reject) => {
  
      var arr = {}
  
      for (let i = 0; i < result.length; i++) {
  
  
        if (!(`${result[i].Name}` in arr)) {

  
          arr[`${result[i].Name}`] = 1;
  
          //console.log(arr[`${result[i].RoomID}`])
        } else {
          let temp = arr[`${result[i].Name}`]
          arr[`${result[i].Name}`] = temp + 1;
        }
      }
  
      console.log(arr)
  
      var arr2 = Object.entries(arr)
  
      setTimeout(resolve(arr2), 3000)
  
    })
  }


  module.exports.calculateAverageAll = function (arr1, arr2) {
    return new Promise((resolve, reject) => {
  
      for(let i = 0; i < arr1.length; i++){
        var result = Number(arr1[i][1])/Number(arr2[i][1])

        arr1[i][1] = parseFloat(result)

        console.log(arr1[i][1])
      }

      console.log(arr1)

      setTimeout(resolve(arr1), 1000)
  
    })
  }



