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


module.exports.calculateAvg = function(arr, days){

    console.log("In calculate function: ")
    console.log("Arr = " + JSON.stringify(arr))
    console.log("Length = "+ arr.length)

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

        var avg = total/days

        resolve(avg)


        },3000)

        

    })
}



