import {parentPort} from 'worker_threads';
import { Gpio } from 'onoff';
import { exit } from 'process';

enum WorkerMethod{
    SetPin = "setPin",
    SetPeriod = "setPeriod",
    SetDuty = "setDuty",
    LinearAccel = "linearAccel",
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
                if (!gpioObj) gpioObj = new Gpio(pin, 'out');
                duty = 0;
                period = 0;
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
                breakLoop = true;
                accelLoop(value[1], value[2], value[3]);
                break;
	        case WorkerMethod.Stop:
                breakLoop = true;
                break;
            case WorkerMethod.Resume:
                breakLoop = false;
                if(stopInAccelLoop) accelLoop(duty, value[1], value[2]);
                else loop();
                break;
        }

        console.log("pin: " + pin + " period: " + period + " duty: " + duty);

        if( value[0] != WorkerMethod.LinearAccel && 
            value[0] != WorkerMethod.Stop &&
            value[0] != WorkerMethod.Resume &&
            period > 0 && duty > 0 && duty < 1)// && gpioObj)
        {
            loop();
        }
    })
}

async function loop() {
    console.log("pin " + pin + " start loop");
    parentPort?.postMessage('starts loop');

    breakLoop = false;
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

    console.log("loop done");
    parentPort?.postMessage([period, duty]);
}

async function accelLoop(startDuty:number, targetDuty:number, totalTime:number) {
    console.log("pin " + pin + " start accel loop for " + totalTime);
    parentPort?.postMessage('starts accel');

    const timeStep = 1000; // 1s
    const stepCnt = Math.ceil(totalTime / timeStep);
    const spdInc = (targetDuty - startDuty) / stepCnt;
    
    duty = startDuty;
    breakLoop = false;
    stopInAccelLoop = true;

    for(let step = 0; step < stepCnt; ++step)
    {
        if(breakLoop)
            break;

        for (let loopCount = 0; loopCount < timeStep / period && !breakLoop; ++loopCount) {
            await wait(period * Math.abs(1 - duty));
            // console.log("1")
            gpioObj.writeSync(ON);
            await wait(period * duty);
            // console.log("0")
            gpioObj.writeSync(OFF);
        }

        if (Math.abs(duty - targetDuty) > 0){
            duty += spdInc;
            console.log("accel: " + duty);
        }
    }

    console.log("accel done");
    
    if(!breakLoop) loop();
    else parentPort?.postMessage([period, duty]);
}

export {WorkerMethod}
