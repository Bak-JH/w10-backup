import {parentPort} from 'worker_threads';
import { Gpio } from 'onoff';
import { exit } from 'process';

enum WorkerMethod{
    SetPin = "setPin",
    SetPeriod = "setPeriod",
    SetDuty = "setDuty",
    LinearAccel = "linearAccel",
    Pause = "pause",
    Resume = "resume",
    Stop = "stop"
}

const ON = 1;
const OFF = 0;

let breakLoop = false;
let stopInAccelLoop = false;

let period:number = 0;
let duty:number = 0;

let pin:number;
let gpioObj:Gpio;

const wait = (timeToDelay:number) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

if(parentPort){
    parentPort.on("message",(value)=>{
        console.log("Worker: receive - " + value);

        switch(value[0])
        {
            case WorkerMethod.SetPin:
                pin = value[1];
                gpioObj = new Gpio(pin, 'out');
                break;
            case WorkerMethod.SetPeriod:
                period = value[1];
                breakLoop = true;
                break;
            case WorkerMethod.SetDuty:
                duty = value[1];
                breakLoop = true;
                break;
            case WorkerMethod.LinearAccel:
                parentPort?.postMessage('starts accel');
                breakLoop = true;
                accelLoop(value[1], value[2], value[3]);
                break;
	        case WorkerMethod.Stop:
		        stop();
                break;
            case WorkerMethod.Pause:
                breakLoop = true;
                break;
            case WorkerMethod.Resume:
                breakLoop = false;
                if(stopInAccelLoop) accelLoop(duty, value[1], value[2]);
                else loop();
                break;
        }

        console.log("pin: " + pin + " period: " + period + " duty: " + duty);

        if(value[0] != WorkerMethod.LinearAccel && value[0] != WorkerMethod.Stop &&
            period > 0 && duty > 0 && duty < 1 && gpioObj)
        {
            parentPort?.postMessage('starts loop');
            breakLoop = false;
            loop();
        }
    })
}

// function resume(isAccelStopped: boolean, lastDuty?:number, lastTargetDuty?: number, lastTime?: number) {
//     breakLoop = false;
//     if(isAccelStopped) accelLoop(duty,dsfljk, lastTime);
//     else loop();
// }
    breakLoop = false;
    if(accelData) accelLoop(duty, accelData.targetDuty, accelData.lastTime);
    else loop();
}

function stop() {
    console.log("stop called");
    breakLoop = true;
    gpioObj.writeSync(OFF);
    gpioObj.unexport();
    exit();
}

async function loop() {
    console.log("pin " + pin + " start loop");
    stopInAccelLoop = false;

    while(!breakLoop)
    {
        await wait(period * Math.abs(1 - duty));
        // console.log("1")
        gpioObj.writeSync(ON);
        await wait(period * duty);
        // console.log("0")
        gpioObj.writeSync(OFF);
    }
}

async function accelLoop(startDuty:number, targetDuty:number, totalTime:number) {
    console.log("pin " + pin + " start accel loop");
 
    const timeStep = 1000;
    const stepCnt = Math.ceil(totalTime / timeStep);
    const spdInc = (targetDuty - startDuty)/ stepCnt;
    
    duty = startDuty;
    breakLoop = false;

    for(let step = 0; step < stepCnt; ++step)
    {
        if(breakLoop)
        {
            stopInAccelLoop = true;
            return;
            break;
        }

        for (let loopCount = 0; loopCount < timeStep / period; ++loopCount) {
            await wait(period * Math.abs(1 - duty));
            // console.log("1")
            gpioObj.writeSync(ON);
            await wait(period * duty);
            // console.log("0")
            gpioObj.writeSync(OFF);
        }

        if (duty < targetDuty){
            duty += spdInc;
            console.log("accel: " + duty);
        }
    }

    if(!breakLoop) loop();
}

export {WorkerMethod}
