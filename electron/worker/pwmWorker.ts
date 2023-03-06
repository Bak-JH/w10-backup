import {parentPort} from 'worker_threads';
const Gpio = require('onoff').Gpio
import { log } from '../logging';

//enum
export enum PWMWorkerMethod{
    SetPin      = "setPin",
    SetPeriod   = "setPeriod",
    SetDuty     = "setDuty",
    LinearAccel = "linearAccel",
    Resume      = "resume",
    Stop        = "stop"
}

//const
const ON = 1;
const OFF = 0;

//variable
let breakLoop = false;
let stopInAccelLoop = false;
let period:number = 0;
let duty:number = 0;
let pin:number;
let gpioObj:typeof Gpio;

//function
const wait = (timeToDelay:number) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

if(parentPort){
    parentPort.on("message",(value)=>{
        log("Worker" + pin + " receive - " + value);

        switch(value[0])
        {
            case PWMWorkerMethod.SetPin:
                pin = value[1];
                if (!gpioObj) gpioObj = new Gpio(pin, 'out');
                breakLoop = true;
                duty = 0;
                period = 0;
                break;
            case PWMWorkerMethod.SetPeriod:
                period = value[1];
                breakLoop = true;
                break;
            case PWMWorkerMethod.SetDuty:
                duty = value[1];
                breakLoop = true;
                break;
            case PWMWorkerMethod.LinearAccel:
                breakLoop = true;
                accelLoop(value[1], value[2], value[3]);
                break;
	        case PWMWorkerMethod.Stop:
                breakLoop = true;
                break;
            case PWMWorkerMethod.Resume:
                breakLoop = false;
                if(stopInAccelLoop) accelLoop(duty, value[1], value[2]);
                else loop();
                return;
        }

        if( value[0] != PWMWorkerMethod.LinearAccel && 
            value[0] != PWMWorkerMethod.Stop &&
            value[0] != PWMWorkerMethod.Resume &&
            period > 0 && duty > 0 && duty < 1 && gpioObj)
        {
            loop();
        }
    })
}

async function loop() {
    log("pin " + pin + " start loop");
    log(" period: " + period + " duty: " + duty);
    parentPort?.postMessage('starts loop');

    breakLoop = false;
    stopInAccelLoop = false;

    while(!breakLoop)
    {
        await wait(period * Math.abs(1 - duty));
        gpioObj.writeSync(ON);
        await wait(period * duty);
        gpioObj.writeSync(OFF);
    }

    log("loop done");
    parentPort?.postMessage([period, duty]);
}

async function accelLoop(startDuty:number, targetDuty:number, totalTime:number) {
    log("pin " + pin + " start accel loop for " + totalTime);

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
            gpioObj.writeSync(ON);
            await wait(period * duty);
            gpioObj.writeSync(OFF);
        }

        if (Math.abs(duty - targetDuty) > 0){
            duty += spdInc;
            log("accel: " + duty);
        }
    }

    log("accel done");
    
    if(!breakLoop) { 
        parentPort?.postMessage("accel done"); 
        loop(); 
    }
    else parentPort?.postMessage([duty]);
    
}