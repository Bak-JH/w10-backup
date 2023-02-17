import { parentPort } from 'worker_threads';
import { Stopwatch } from 'ts-stopwatch';
import { Action } from '../actions';

if(parentPort){
    parentPort.on("message",(value)=>{
        console.log("Worker: start",value)
    })
}

export enum WorkingState{
    Start = "start",
    Stop = "stop",
    Pause = "pause",
    Error = "error"
}

export class WashWorker {
    //variables
    private _actions : Array<Action> = [];
    private _stopwatch : Stopwatch = new Stopwatch();
    private _workingState : WorkingState = WorkingState.Start;

    private _totalTime : number = 0;
    private _progress : number = 0;

    addAction(action:Action) {
        this._actions.push(action);
    }

    private reset() {
        this._stopwatch.reset()
        this._totalTime = 0;
        this._progress = 0;
        this._workingState = WorkingState.Start;
    }

    public async run() {
        this.reset();

        for(const action of this._actions) {
            await action.run();
            if (this._workingState == WorkingState.Stop || this._workingState == WorkingState.Error)
            {
                action.stop();
                break;
            }
        }

        console.log("done");
    }

    public async stop() {
        this._workingState = WorkingState.Stop;
        this._stopwatch.stop();

        if(this._onWorkingStateChangedCallback) 
            this._onWorkingStateChangedCallback(this._workingState);
    }

    //callback
    private _onProgressCallback? : (progress:number) => void;
    private _onWorkingStateChangedCallback?: (state : WorkingState,message?:string) => void;
    private _onSetTotalTime? : (time:number) => void;
    
    onProgressCB(callback: (progress:number) => void) {
        this._onProgressCallback = callback;
    }

    onStateChangeCB(callback : (state : WorkingState,message?:string) => void){
        this._onWorkingStateChangedCallback = callback;
    }

    onSetTotalTimeCB(callback : (time : number) => void){
        this._onSetTotalTime = callback;
    }
}