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


module.exports.calculateAvg = function(arr, times){

    console.log("In calculate function: ")
    console.log("Arr = " + JSON.stringify(arr))
    console.log("Length = "+ arr.length)
    console.log("Times = "+times)

    return new Promise((resolve,reject)=>{

        var total = 0.00;
        for(let i = 0; i < arr.length; i++){
            for(let j = 0; j<arr[i].length; j++){
                if(j%2 != 0){
                    console.log("Odd")
                    console.log(arr[i][j])
                    total = total + arr[i][j]
                    
                }
            }
            
        }

        setTimeout(()=>{

        console.log(total)

        var avg = total/times

        resolve(avg)


        },1000)
 

    })
}

module.exports.calculateSD = function(data, mean, times){

    return new Promise((resolve,reject)=>{

    var sd = math.std(data)
 
    resolve(sd)

    })
}

module.exports.sdDataPrep = function (result) {
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



