const Gpio = require('pigpio').Gpio
import { Worker } from 'worker_threads';
import { log } from './logging'
import { Stopwatch } from 'ts-stopwatch';
import { AbortablePromise } from 'simple-abortable-promise';

//enum
enum GPIOPin {
    pump1         = 6,
    pump2         = 16,
    propeller1    = 19,
    propeller2    = 20, // not in use
    valve         = 21
}

enum PWMPin {
    pump          = 12,
    propeller     = 13
}

//const
const ActivePins = new Array<{pin: GPIOPin | PWMPin, duty?:number}>();
const PinMap = new Map<GPIOPin|PWMPin, typeof Gpio>([
    [GPIOPin.pump1,      new Gpio(GPIOPin.pump1,      {mode:Gpio.OUTPUT})],
    [GPIOPin.pump2,      new Gpio(GPIOPin.pump2,      {mode:Gpio.OUTPUT})],
    [GPIOPin.valve,      new Gpio(GPIOPin.valve,      {mode:Gpio.OUTPUT})],
    [GPIOPin.propeller1, new Gpio(GPIOPin.propeller1, {mode:Gpio.OUTPUT})],
    
    [PWMPin.pump,        new Gpio(PWMPin.pump,        {mode:Gpio.OUTPUT})],
    [PWMPin.propeller,   new Gpio(PWMPin.propeller,   {mode:Gpio.OUTPUT})]
])

//function
export function initializePWM() : void {
    PinMap.get(PWMPin.pump).pwmRange(100);
    PinMap.get(PWMPin.propeller).pwmRange(100);
}

function disableAllPins() {
    ActivePins.forEach((obj) => {
        PinMap.get(obj.pin).digitalWrite(0);
    });
}

function enableDisabledPins() {
    ActivePins.forEach((obj) => {
        if(obj.duty) PinMap.get(obj.pin).pwmWrite(obj.duty);
        else PinMap.get(obj.pin).digitalWrite(1);
    });
}

//class
abstract class Action {
    //variable
    protected _promise!:AbortablePromise<unknown>;

    //method
    public abstract run():Promise<unknown>;

    public stop():void {
        disableAllPins();
        this._promise.abort();
    }

    public pause():void {
        this.stop();
    }

    public resume():Promise<unknown> {
        enableDisabledPins();
        return this.run();
    }
}

abstract class GPIOAction extends Action {
    //variable
    private readonly _pin!:GPIOPin 

    //getter
    get pin() : GPIOPin { return this._pin; }

    //method
    constructor(pin:GPIOPin) { 
        super(); 
        this._pin = pin; 
    }
}
abstract class PWMAction extends Action {
    //variable
    private readonly _pin!:PWMPin;

    //getter
    get pin () : PWMPin { return this._pin; }

    //method
    constructor(pin:PWMPin) {
        super(); 
        this._pin = pin;
    }
}

class GPIOEnable extends GPIOAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:GPIOPin, enable:boolean) { 
        super(pin); 
        this._enable = enable; 
    }
    public run() {
        this._promise = new AbortablePromise((resolve) => {
            log("GPIOAction: GPIOEnable(" + this.pin + "," + this._enable + ")");
            PinMap.get(this.pin).digitalWrite(this.enable);

            if(this.enable && this.pin != GPIOPin.valve) 
                ActivePins.push({pin: this.pin});
            else ActivePins.splice(ActivePins.indexOf({pin: this.pin}));

            resolve("done");
        });

        return this._promise;
    }
}

class PWMEnable extends PWMAction {
    //variable
    private readonly _enable!:boolean
    private readonly _frequency:number = 0;
    private readonly _duty:number = 0;

    //getter
    get enable() : boolean { return this._enable; }
    get duty() : number { return this._duty; }

    //method
    constructor(pin:PWMPin, enable:boolean, frequency?:number, duty?:number) { 
        super(pin); 
        this._enable = enable;
        if(frequency) PinMap.get(pin).pwmFrequency(frequency)
        if(duty) this._duty = duty
    }

    public async run() {
        this._promise = new AbortablePromise((resolve) => {
            log("PWMAction: PWMEnable " + this.enable + ", " + this.duty);
            if(this.enable) {
                PinMap.get(this.pin).pwmWrite(this.duty);
                ActivePins.push({pin: this.pin, duty: this.duty});
            }
            else {
                PinMap.get(this.pin).digitalWrite(0);
                ActivePins.splice(ActivePins.indexOf({pin: this.pin}));
            }
            resolve("done");
        });

        return this._promise;
    }
}

class PWMLinearAccel extends PWMAction {
    //variable
    private readonly _startSpeed!:number
    private readonly _targetSpeed!:number
    private readonly _duration!:number;
    private readonly _stopWatch = new Stopwatch();

    private readonly wait = (timeToDelay:number) => new AbortablePromise((resolve) => setTimeout(resolve, timeToDelay));

    //getter
    get startSpeed() : number { return this._startSpeed; }
    get targetSpeed() : number { return this._targetSpeed; }
    get duration() : number { return this._duration; }

    //method
    constructor(pin:PWMPin, startSpeed:number, targetSpeed:number, duration:number) {
        super(pin);

        this._startSpeed = startSpeed; 
        this._targetSpeed = targetSpeed;
        this._duration = duration;
    }

    public run() {
        log("PWMAction: PWMLinearAccel");

        this._stopWatch.reset();
        
        this._promise = new AbortablePromise ((resolve) => {

        });
        
        return this._promise;
    }
    
    public async stop() {
        log("Stopped: PWMLinearAccel");
        this._stopWatch.stop();

        await new Promise ((resolve) => {

        });
        
        super.stop();
    }

    public pause() {
        this._stopWatch.stop();
        super.pause();
    }
}

class Wait extends Action {
    //variable
    private _duration!:number;
    private readonly _stopWatch = new Stopwatch();

    private readonly wait = (timeToDelay:number) => new AbortablePromise((resolve) => setTimeout(resolve, timeToDelay));

    //getter
    get duration() : number { return this._duration; }

    //method
    constructor(duration:number) {
        super();
        this._duration = duration;
    }

    public run() {
        log("Action: Wait - " + this.duration);
        this._stopWatch.reset();
        this._promise = this.wait(this.duration);
        this._stopWatch.start();
        return this._promise;
    }

    public stop() {
        this._stopWatch.stop();
        super.stop();
    }

    public pause() {
        this._stopWatch.stop();
        super.pause();
    }

    public async resume() {
        log("RE: wait " + (this._duration - this._stopWatch.getTime()));
        await enableDisabledPins();
        this._promise = this.wait(this.duration - this._stopWatch.getTime());
        this._stopWatch.start();
        return this._promise;
    }
}

export {Action} // abstract class
export {GPIOPin, PWMPin} // enum
export {Wait, GPIOEnable, PWMEnable, PWMLinearAccel} // actions
export {ActivePins} // const
