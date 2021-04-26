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
    //stores the similarity matrix score with sorted values
    let similarityMat = Matrix.zeros(1,parseInt(rows))

    //stores the similarity matrix without sorting
    let originalSimMat = Matrix.zeros(1,parseInt(rows))
  	let similarityVal;
    let predEachMat = Matrix.zeros(parseInt(rows),parseInt(columns))
    let predArray = []
    //creating matrix of zeroes with number of rows and columns
  	let mat = Matrix.zeros(parseInt(rows),parseInt(columns))
  	for(i=0;i<mat.rows;i++){
  		for(j=0;j<mat.columns;j++){
  			mat.set(i,j,nameArray[i].rate[j])
  		}
  	}
    rowsAvg = []
    let sumArray = []
    let numArray = []
    for(i=0;i<mat.rows;i++){
      let num =0;
      let sum=0;
      for(j=0;j<mat.columns;j++){
        if(mat.get(i,j) != 0){
          sum += mat.get(i,j)
          num++;
        }
      }
      rowsAvg.push(sum/num)
      sumArray.push(sum)
      numArray.push(num)
    }
    for(m=0;m<mat.rows;m++){
      for(n=0;n<mat.columns;n++){
        let currVal = mat.get(m,n)
        if(currVal != 0){
          let indexToLookForX = m
          let indexToLookForY = n
          mat.set(m,n,0)

          //calculating similarityVal for each rows and column
          let firstPerson = m;
          let personNum = 1
          let array = []
          let newSimArray = []
          for(i=0;i<mat.rows;i++){
            let denom1 = 0;
            let denom2 = 0;
            let numerator = 0;
            //updatinf personNum when  personNum > 1 so that it also counts rows before 1 or 2 and so on
            if(m <= 1){
              //if i is less than firPerson < current rows && personNum <= current row then decrease by 1
              if(i < firstPerson && personNum <= firstPerson){
                personNum = personNum-1
              }
              //when incrementing personNum later on after loop it comes out to 1 so if it equal to 1 when rows is 1 then increment by 1
              else if(personNum == firstPerson){
                personNum++
              }
            }
            else{
              //doing same thing as if sttaemnet but for rows > 2
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
            //calculating similarityValues
            for(j=0;j<mat.columns;j++){
              if(mat.get(firstPerson,j) != 0 && personNum < mat.rows){
                let currVal1 = mat.get(firstPerson,j)
                let nextVal = mat.get(personNum,j)
                if(mat.get(personNum,j) != 0 ){
                  if(m!= firstPerson ){
                    if(m == personNum){
                      //caclulating average for current rows minusing the value where there is zero
                      avgFirstPerson = (sumArray[firstPerson])/ (numArray[firstPerson])
                      avgPersonNum  = (sumArray[personNum] - currVal) /(numArray[personNum]-1)
                    }
                    else{
                      avgFirstPerson = (sumArray[firstPerson])/ (numArray[firstPerson])
                      avgPersonNum  = (sumArray[personNum]) /(numArray[personNum])
                    }
                  }
                  else{
                    avgFirstPerson = (sumArray[firstPerson] - currVal)/ (numArray[firstPerson] - 1)
                    avgPersonNum  = sumArray[personNum] /numArray[personNum]
                  }
                  //calcualting numerator,denominator
                  numerator += (currVal1 - avgFirstPerson)*(nextVal-avgPersonNum)
                  denom1 += Math.pow((currVal1-avgFirstPerson),2)
                  denom2 += Math.pow((nextVal-avgPersonNum),2)
                }
              }
            }
            similarityVal = numerator / (Math.sqrt(denom1) * Math.sqrt(denom2))
            if(isNaN(similarityVal)){
              similarityVal = sumArray[i]/numArray[i]
            }
            array[i] = parseFloat(similarityVal.toFixed(2))
            personNum++
          }
          array.splice(m,0,0)
          array.splice(array.length-1,1)
          let newArray = []
          let indexArray = []
          let topValArray = []
          newArray = array.slice()
          //sorting array from largest to smallest
          newArray.sort(function(a,b){return b - a})

          //getting top 5 values
          for(j=0;j<neighbourVal;j++){
            topValArray[j] = newArray[j]
          }
          for(j=0;j<array.length;j++){
            for(k=0;k<newArray.length;k++){
              if(topValArray[j] == array[k]){
                indexArray[j] = k
              }
            }
          }
          let pdNum
          let pddenom
          let userToLookForArray = []
          //calculating prediction value
          //if the value for which we are predicting index is 0
          if(mat.get(indexToLookForX,indexToLookForY) == 0){
            let sumSimilarity =0;
            let pddenom2 = 0

            for(k=0;k<neighbourVal;k++){
              //making sure values are not less than 0
              //to select top k similarityVal and not use threshold comment out if statement
              if(topValArray[k] < 0){
                topValArray[k] = 0
              }
              //summing the similarity
              sumSimilarity+=topValArray[k]
              let avgVal
              //assigning average for the rows based on different cases
              if(m == indexArray[k]){
                avgVal = (sumArray[indexArray[k]] - currVal)/(numArray[indexArray[k]]-1)
              }
              else{
                avgVal = sumArray[indexArray[k]]/numArray[indexArray[k]]

              }
              //caclulating denominator
              pddenom2 += topValArray[k] * (mat.get(indexArray[k],indexToLookForY) - avgVal)
              userToLookForArray.push(indexArray[k])
            }
            //calcualting numerator
            if(indexToLookForX == m){
              pdNum = (sumArray[indexToLookForX]-currVal)/(numArray[indexToLookForX]-1)
            }
            else{
              pdNum = sumArray[indexToLookForX]/numArray[indexToLookForX]
            }
            //performing prediction calculation
            pddenom = 1/(sumSimilarity)
            let finalVal = pdNum + pddenom * pddenom2
            //if finalVal is NaN then take the average of that row
            if(isNaN(finalVal)){
              //if denominator while calculating rows avg is 0 then finalVal = 0 and if the row is before m then
              if(indexToLookForX == m){
                if((numArray[indexToLookForX]-1) == 0){
                  finalVal = (sumArray[indexToLookForX]-currVal)/(numArray[indexToLookForX]-1);
                }
                else{
                  finalVal = (sumArray[indexToLookForX]-currVal)/(numArray[indexToLookForX]-1)
                }
              }
              //if the row is after m then check for denominator and put 0
              else{
                if(numArray[indexToLookForX]== 0){
                  finalVal =  sumArray[indexToLookForX]/numArray[indexToLookForX];
                }
                else{
                  finalVal = sumArray[indexToLookForX]/numArray[indexToLookForX]
                }
              }
            }
            predArray.push(finalVal.toFixed(2))
          }
          mat.set(m,n,currVal)
        }
        else{}
        console.log("rows completed "+m + " columns "+n)
      }
    }
    let newMat = Matrix.zeros(parseInt(rows),parseInt(columns))
    let sumUser = 0;
    let count = 0;
    let newMat1 = Matrix.zeros(parseInt(rows),parseInt(columns))
    for(i=0;i<newMat1.rows;i++){
      for(j=0;j<newMat1.columns;j++){
        if(mat.get(i,j) != 0){
          newMat1.set(i,j,predArray[0])
          predArray.splice(0,1)
        }
      }
    }
    console.log(newMat1)
    let discardCount = 0
    for(i=0;i<mat.rows;i++){
      let val = 0;
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
