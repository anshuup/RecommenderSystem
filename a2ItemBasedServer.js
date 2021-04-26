const {Matrix} = require("ml-matrix");
const fs = require("fs");
const express = require("express")
const bodyParser = require('body-parser');
const readline = require('readline');


let app = express();
const http = require('http').createServer(app);



fileRead("assignment2-ratings-data.txt")
function fileRead(filename){
  let nameArray = [];
  let jsonArray = {}
  let neighbourVal = 5;

  //reading the file data
  var lineno = 0;
  let rows;
  let columns;
  let m = 0;
  //reading files line by line
  var myInterface = readline.createInterface({
    input: fs.createReadStream(filename)
  });

  //saving them in json array to create matrix later on
  myInterface.on('line', function (line) {
  	line = line.trim()
  	let splittedLine = line.split(" ")

  	if(lineno == 0){
  		rows = splittedLine[0]
  		columns = splittedLine[1]
    }
  	if(lineno == 1){
  		for(i =0;i<rows;i++){
  			jsonArray = {}
  			jsonArray["name" + i] = splittedLine[i]
  			nameArray.push(jsonArray)
  		}
  	}
  	if(lineno == 2){
  		for(i=0;i<rows;i++){
  			nameArray[i].products = []
  			for(j =0;j<columns;j++){
  				let products = "name"+j
  				nameArray[i].products.push(splittedLine[j])
  			}
  		}
  	}
  	if(lineno > 2 && m < rows){
  		nameArray[m].rate = []
  		for(i=0;i<columns;i++){
  			nameArray[m].rate.push(parseFloat(splittedLine[i]))
  		}
  		m++;
  	}
  	lineno++;
  });

  myInterface.on('close', function(){
    console.log("With neighbour value of " + neighbourVal)
  	let rowsAvg

  	let similarityVal;
    let predArray = []
    //creating matrix of zeroes with number of rows and columns
  	let mat = Matrix.zeros(parseInt(columns),parseInt(rows))
    //setting the matrix with teh rating, transposing matrix to make calculatione easier with rows
  	for(i=0;i<mat.columns;i++){
  		for(j=0;j<mat.rows;j++){
  			mat.set(j,i,nameArray[i].rate[j])
  		}
  	}
    //transposing the mtrix again to get correct rowsavg
    let newMatTrans = mat.transpose();
    rowsAvg = []
    let sumArray = []
    let numArray = []
    for(i=0;i<newMatTrans.rows;i++){
      let num =0;
      let sum=0;
      for(j=0;j<newMatTrans.columns;j++){
        if(newMatTrans.get(i,j) != 0){
          sum += newMatTrans.get(i,j)
          num++;
        }
      }
      rowsAvg.push(sum/num)
      sumArray.push(sum)
      numArray.push(num)
    }
    //calculates similarityVal
    for(m=0;m<mat.rows;m++){
      for(n=0;n<mat.columns;n++){
        let currVal = mat.get(m,n)
        if(currVal != 0){
          let indexToLookForX = m
          let indexToLookForY = n
          mat.set(m,n,0)

          let firstPerson = m;
          let personNum = 1
          let array = []
          let newSimArray = []
          //updatinfg the rows to visit from current row
          for(i=0;i<mat.rows;i++){
            let denom1 = 0;
            let denom2 = 0;
            let numerator = 0;
            if(m <= 1){
              if(i < firstPerson && personNum <= firstPerson){
                personNum = personNum-1
              }
              else if(personNum == firstPerson){
                personNum++
              }
            }
            else{
              if(i == 0 && personNum < firstPerson){
                personNum = personNum - 1
              }
              else if(i > 0 && personNum < firstPerson){
                personNum = personNum++
              }
              else if(personNum == firstPerson){
                personNum++
              }
            }
            let valNum = 0
            //calculating similarityValues
            for(j=0;j<mat.columns;j++){
              valNum++
              if(mat.get(firstPerson,j) != 0 && personNum < mat.rows){
                let currVal1 = mat.get(firstPerson,j)
                let nextVal = mat.get(personNum,j)
                if(mat.get(personNum,j) != 0 ){
                  avgFirstPerson = (sumArray[j])/ (numArray[j])
                  avgPersonNum  = (sumArray[j]) /(numArray[j])
                  numerator += (currVal1 - avgFirstPerson)*(nextVal-avgPersonNum)
                  denom1 += Math.pow((currVal1-avgFirstPerson),2)
                  denom2 += Math.pow((nextVal-avgPersonNum),2)
                }
              }
            }
            valNum = 0
            similarityVal = numerator / (Math.sqrt(denom1) * Math.sqrt(denom2))
            //if similarityVal is NaN then place it with average of the row
            if(isNaN(similarityVal)){
              if(numArray[i] == 0 || numArray[i] == undefined){
                similarityVal = 0
              }
              else{
                similarityVal = sumArray[i]/numArray[i]
              }
            }
            array[i] = parseFloat(similarityVal.toFixed(2))
            personNum++
          }
          //adjusting the array for each row by placing zeros where matrix matches to 1-1 or 2-2
          array.splice(m,0,0)
          array.splice(array.length-1,1)
          let newArray = [] //stores the sorted similarityVal
          let indexArray = [] //stores the indes of originalSimMat
          let topValArray = []//stores the topVal based on neighbourVal parameter
          newArray = array.slice()
          //sorting array from largest to smallest
          newArray.sort(function(a,b){return b - a})

          //getting top 5 values
          for(j=0;j<neighbourVal;j++){
            topValArray[j] = newArray[j]
          }
          //storing index of similarityVal
          for(j=0;j<array.length;j++){
            if(array.includes(topValArray[j])){
              indexArray[j] = array.indexOf(topValArray[j])
            }
          }
          let pdNum
          let userToLookForArray = []
          if(mat.get(indexToLookForX,indexToLookForY) == 0){
            let sumSimilarity =0;
            let pddenom2 = 0

            for(k=0;k<neighbourVal;k++){
              //to select top k similarityVal and not use threshold comment out if statement
              if(topValArray[k] < 0){
                topValArray[k] = sumArray[indexToLookForX]/numArray[indexToLookForX]
              }
              sumSimilarity+=topValArray[k] * (mat.get(indexArray[k],indexToLookForY))
              //caclulating denominator
              pddenom2 += topValArray[k]
              userToLookForArray.push(indexArray[k])
            }
            //calcualting numerator
            pdNum = sumSimilarity
            //performing prediction calculation
            let finalVal = pdNum / pddenom2
            if(isNaN(finalVal) || finalVal == 0){
              finalVal = sumArray[indexToLookForX]/numArray[indexToLookForX]
            }
            predArray.push(finalVal)
          }
          mat.set(m,n,currVal)
        }
        else{}
        console.log("rows completed "+m + " columns "+n)
      }
    }
    let newMat = Matrix.zeros(parseInt(columns),parseInt(rows))
    let sumUser = 0;
    let count = 0;
    let newMat1 = Matrix.zeros(parseInt(columns),parseInt(rows))

    //placing the predicted value from array to matrix
    for(i=0;i<newMat1.rows;i++){
      for(j=0;j<newMat1.columns;j++){
        if(mat.get(i,j) != 0){
          newMat1.set(i,j,predArray[0])
          predArray.splice(0,1)
        }
      }
    }
    mat = mat.transpose()
    newMat1 = newMat1.transpose()
    let altsum1 = 0

    //calculating MAE
    console.log(newMat1)
    for(i=0;i<mat.rows;i++){
      let val = 0;
      let altval = 0;
      for(j=0;j<mat.columns;j++){
        if(mat.get(i,j) != 0){
          if(newMat1.get(i,j) > 0 && newMat1.get(i,j) < 6){
            val += Math.abs(newMat1.get(i,j) - mat.get(i,j))
          }
          count++
          newMat.set(i,j,Math.abs(newMat1.get(i,j) - mat.get(i,j)).toFixed(2))
        }
      }
      sumUser += val
    }
    console.log(sumUser)
    console.log(count)
    console.log(sumUser/(count))
  })
}
