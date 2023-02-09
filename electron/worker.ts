import { parentPort } from 'worker_threads';
import { Stopwatch } from 'ts-stopwatch';
import { Action } from './actions';

if(parentPort){
    parentPort.on("message",(value)=>{
        console.log("Worker: start",value)
    })
}

export class WashWorker {
    //variables
    private _actions : Array<Action> = [];
    private _currentStep : number = 0;
    private _stopwatch : Stopwatch = new Stopwatch();

    private _totalTime : number = 0;
    private _progress : number = 0;

    //callback
    private _onProgressCallback? : (progress:number) => void;
    private _onSetTotalTime? : (time:number) => void;

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
}