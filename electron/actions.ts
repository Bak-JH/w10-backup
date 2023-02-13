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
    // protected _pinObj!:Gpio;

    //getter
    get pin() : GPIOPin { return this._pin; }
    // get pinObj() : Gpio { return this._pinObj; }

    //method
    constructor(pin:GPIOPin) { 
        super(); 
        this._pin = pin; 
        // this._pinObj = new Gpio(pin, "out");
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
        // this.pinObj.writeSync(toBinaryValue(this._enable));
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
        console.log("PWMAction: PWMEnable " + this.enable);

        if (PWMWorkers[this.pin] == null) {
            PWMWorkers[this.pin] = await new Worker(__dirname + '/worker/pwmWorker.js');
            await PWMWorkers[this.pin].postMessage(["setPin", this.pin])
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
        await PWMWorkers[this.pin].on('message', () => {});
    }
}

class PWMLinearAccel extends PWMAction {
    //variable
    private readonly _startSpeed!:number
    private readonly _targetSpeed!:number
    private readonly _duration!:number;

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

    public async run() {
        console.log("PWMAction: PWMLinearAccel");

        await PWMWorkers[this.pin].postMessage(["linearAccel", this.startSpeed, this.targetSpeed, this.duration]);
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
