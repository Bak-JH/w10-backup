import { parentPort } from 'worker_threads';
import { Stopwatch } from 'ts-stopwatch';
import { Action } from '../actions';
import { log } from '../logging';

if(parentPort){
    parentPort.on("message",(value)=>{
        log("Worker: start - " + value)
    })
}

//enum
export enum WorkingState{
    Start  = "start",
    Stop   = "stop",
    Pause  = "pause",
    Resume = "resume",
    Error  = "error"
}

export class WashWorker {
    //variables
    private _actions: Array<Action> = [];
    private _stopwatch: Stopwatch = new Stopwatch();
    private _workingState: WorkingState = WorkingState.Start;
    private _actionIdx: number = 0;

    //getter
    get workingState() { return this._workingState; }

    //method
    addAction(action:Action) {
        this._actions.push(action);
    }

    clearActions() {
        this._actions.length = 0;
    }

    public async run() {
        this._stopwatch.reset()
        this._workingState = WorkingState.Start;

        for(this._actionIdx; this._actionIdx < this._actions.length; this._actionIdx++) {
            try {
                await this._actions[this._actionIdx].run();
            } catch (e) {
                log("stop");
                throw e;
            }
        }

        this._actionIdx = 0;
        log("done");
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
            log("resume stopped");
            log(this._actions[this._actionIdx]);
            throw e;
        }
    }

    //callback
    private _onWorkingStateChangedCallback?: (state : WorkingState,message?:string) => void;

    onStateChangeCB(callback : (state : WorkingState,message?:string) => void){
        this._onWorkingStateChangedCallback = callback;
    }
}