import { writeSync } from 'fs';
import { BinaryValue, Gpio} from 'onoff';
import { Worker } from 'worker_threads';

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

interface IndexedWorkerArray {
    [pinNumber:number]: Worker;
}

const PWMWorkers:IndexedWorkerArray = [];

function toBinaryValue(boolValue:boolean):BinaryValue {
    return boolValue ? 1 : 0;
}

abstract class Action {
    //method
    public abstract run():void;
}
 
abstract class GPIOAction extends Action {
    //variable
    private readonly _pin!:GPIOPin 
    protected _pinObj!:Gpio;

    //getter
    get pin() : GPIOPin { return this._pin; }
    get pinObj() : Gpio { return this._pinObj; }

    //method
    constructor(pin:GPIOPin) { 
        super(); 
        this._pin = pin; 
        this._pinObj = new Gpio(pin, "out");
    }
}
abstract class PWMAction extends Action {
    //variable
    private readonly _pin!:PWMPin

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
        this.pinObj.writeSync(toBinaryValue(this._enable));
        console.log("GPIOAction: GPIOEnable(" + this.pin + "," + toBinaryValue(this._enable) + ")");
    }
}

class PWMEnable extends PWMAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:PWMPin, enable:boolean) { 
        super(pin); 
        this._enable = enable; 
    }

    public async run() {
        console.log("GPIOAction: PWMEnable " + this.enable);

        if (PWMWorkers[this.pin] == null) {
            PWMWorkers[this.pin] = await new Worker(__dirname + '/worker/pwmWorker.js');
            PWMWorkers[this.pin].postMessage(["setPin", this.pin])
        }

        if(!this.enable)
            PWMWorkers[this.pin].terminate();
    }
}

class PWMSetPeriod extends PWMAction {
    //variable
    private readonly _period!:number;
    private _stopPWM:boolean = false

    //getter
    get period() : number { return this._period; }

    //method
    constructor(pin:PWMPin, period:number) {
        super(pin); 
        
        if(period < 0) return; 
        this._period = period; 
    }

    public async run() {
        console.log("PWMAction: PWMSetPeriod");
        await PWMWorkers[this.pin].postMessage(["setPeriod", this.period]);        
    }
}

class PWMSetDuty extends PWMAction {
    //variable
    private readonly _duty!:number;

    //getter
    get duty() : number { return this._duty; }

    //method
    constructor(pin:PWMPin, duty:number) { 
        super(pin); 
        if(duty < 0 || duty > 1) return;
        this._duty = duty; 
    }
    public async run() {
        console.log("PWMAction: PWMDuty");
        await PWMWorkers[this.pin].postMessage(["setDuty", this.duty]);
    }
}

class PWMLinearAccel extends PWMAction {
    //variable
    private readonly _minSpeed!:number
    private readonly _maxSpeed!:number
    private readonly _duration!:number;
    private readonly _timeStep = 1000;

    //method
    constructor(pin:PWMPin, minSpeed:number, maxSpeed:number, duration:number) {
        super(pin);

        this._minSpeed = minSpeed;
        this._maxSpeed = maxSpeed;
        this._duration = duration;
    }

    stepTransform():Array<Action>
    {
        const stepCnt = Math.ceil(this._duration / this._timeStep);
        const spdInc = (this._maxSpeed - this._minSpeed)/ stepCnt;
        const actions:Array<Action> = [];

        for(var i = 0; i < stepCnt - 1; ++i)
        {
            actions.push(new PWMSetDuty(this.pin, this._minSpeed + spdInc*i));
            actions.push(new Wait(this._timeStep));
        }
        //we add last step by hand to ensure float error as following:
        //1. total duration must equal to actual duration
        //2. final speed must be exact equal to given end speed
        actions.push(new PWMSetDuty(this.pin, this._maxSpeed));
        if(this._duration < this._timeStep)
        actions.push(new Wait(this._duration));
        else
        actions.push(new Wait(this._duration - this._timeStep * (stepCnt - 1)));
        return actions;
    }

    public async run() {
        console.log("PWMAction: PWMLinearAccel");
        await PWMWorkers[this.pin].postMessage("linearAccel");
    }
}

const wait = (timeToDelay:number) => new Promise((resolve) => setTimeout(resolve, timeToDelay));
class Wait extends Action {
    //variable
    private readonly _duration!:number;

    //getter
    get duration() : number { return this._duration; }

    //method
    constructor(duration:number) {
        super();
        this._duration = duration;
    }

    public async run() {
        console.log("Action: Wait");        
        await wait(this._duration);
    }
}

export {Action} // abstract class
export {GPIOPin, PWMPin} // enum
export {Wait, GPIOEnable, PWMEnable, PWMLinearAccel, PWMSetDuty, PWMSetPeriod} // actions
export {wait} // function