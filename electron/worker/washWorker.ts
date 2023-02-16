import { parentPort } from 'worker_threads';
import { Stopwatch } from 'ts-stopwatch';
import { Action } from '../actions';

if(parentPort){
    parentPort.on("message",(value)=>{
        console.log("Worker: start",value)
    })
}

export enum WorkingState{
    Stop = "stop",
    Pause = "pause",
    Error = "error"
}

export class WashWorker {
    //variables
    private _actions : Array<Action> = [];
    private _stopwatch : Stopwatch = new Stopwatch();
    private _workingState : WorkingState = WorkingState.Stop;

    private _totalTime : number = 0;
    private _progress : number = 0;

    addAction(action:Action) {
        this._actions.push(action);
    }

    public async run() {
        this._stopwatch.reset()
        this._totalTime = 0;
        this._progress = 0;

        for(const action of this._actions) {
            await action.run();
        }

        console.log("done");
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