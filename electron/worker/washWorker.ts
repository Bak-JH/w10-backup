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
    Resume = "resume",
    Error = "error"
}

export class WashWorker {
    //variables
    private _actions: Array<Action> = [];
    private _stopwatch: Stopwatch = new Stopwatch();
    private _workingState: WorkingState = WorkingState.Start;

    private _actionIdx: number = 0;
    private _totalTime : number = 0;
    private _progress : number = 0;

    get workingState() { return this._workingState; }

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

        for(this._actionIdx; this._actionIdx < this._actions.length; this._actionIdx++) {
            try {
                await this._actions[this._actionIdx].run();
            } catch (e) {
                console.log("stop");
                throw e;
            }
        }

        this._actionIdx = 0;
        console.log("done");
    }

    public stop() {
        this._workingState = WorkingState.Stop;
        this._onWorkingStateChangedCallback && this._onWorkingStateChangedCallback(this._workingState);
        this._stopwatch.stop();

        this._actions[this._actionIdx].stop();
        this._actionIdx = 0;
    }

    public pause() {
        this._workingState = WorkingState.Pause;
        this._onWorkingStateChangedCallback && this._onWorkingStateChangedCallback(this._workingState);

        this._stopwatch.stop();
        this._actions[this._actionIdx].pause();
    }

    public async resume() {
        this._workingState = WorkingState.Resume;
        this._onWorkingStateChangedCallback && this._onWorkingStateChangedCallback(this._workingState);
        this._stopwatch.start();

        try {
            await this._actions[this._actionIdx].resume();
            ++this._actionIdx;
        } catch(e) {
            console.log("resume stopped");
            console.log(this._actions[this._actionIdx]);
            throw e;
        }
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