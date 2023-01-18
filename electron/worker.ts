import {parentPort} from 'worker_threads';


if(parentPort){
    parentPort.on("message",(value)=>{
        console.log("Worker: start",value)
    })
}

