import { Gpio } from 'onoff';
import {parentPort} from 'worker_threads';
import { wait } from '../actions';

let period:number = 0;
let duty:number = 0;

let pin:number;
let gpioObj:Gpio;

enum WorkerMethod{
    SetPin = "setPin",
    SetPeriod = "setPeriod",
    SetDuty = "setDuty"
}

if(parentPort){
    parentPort.on("message",(value)=>{
        console.log("Worker: receive - ",value);

        switch(value[0])
        {
            case WorkerMethod.SetPin:
                pin = value[1];
                gpioObj = new Gpio(pin, 'out');
                break;
            case WorkerMethod.SetPeriod:
                period = value[1];
                break;
            case WorkerMethod.SetDuty:
                duty = value[1];
                break;
        }

        console.log("pin: " + pin + " period: " + period + " duty: " + duty);

        if(period > 0 && duty > 0 && duty < 1 && gpioObj)
            loop();
    })
}


async function loop() {
    console.log("pin " + pin + " start run");
    while(true)
    {
        await wait(period * Math.abs(1 - duty));
        gpioObj.writeSync(Gpio.HIGH);
        await wait(period * duty);
        gpioObj.writeSync(Gpio.LOW);
    }
}

export {WorkerMethod}
