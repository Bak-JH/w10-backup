import fs from 'fs'
import { WashWorker, WorkingState } from './worker/washWorker';
import { Wait, GPIOEnable, PWMEnable, PWMSetDuty, PWMSetPeriod, PWMLinearAccel } from './actions';
import { GPIOPin, PWMPin } from './actions';
import { exit } from 'process';
import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { WorkerCH } from './ipc/cmdChannels';

export class Process
{
    private _worker: WashWorker = new WashWorker();
    private _totalTime: number = 0;
    private _renderEvent: any;
    private _filePath!:string;

    get filePath() { return this._filePath; }

    constructor(mainWindow:BrowserWindow) {
        this._renderEvent = mainWindow.webContents;
        this.connectEvents(mainWindow);
    }

    /**
    * name
    */
    private async readCommandFile(filePath:string) {
        return new Promise((resolve, reject) => {
            if(!fs.existsSync(filePath)) {
                reject("FileNotFound - " + filePath);
            }

            this._worker.clearActions();
            this._totalTime = 0;

            //read file
            fs.readFile(filePath, (err, data) => {                
                //read line
                for(const line of data.toString().split('\n')) {
                    //read commands
                    const tokens = line.split(' ');
                    if(tokens.length < 2)
                        continue;
                    
                    const command = tokens[0];
                    const pin = tokens[1];

                    switch(command) {
                        case "Wait":
                        case "wait":
                            this._worker.addAction(new Wait(parseInt(tokens[1]))); // duration
                            this._totalTime += parseInt(tokens[1]);
                            break;

                        case "gpioenable":
                        case "gpioEnable":
                        case "GPIOEnable":
                            this._worker.addAction(
                                new GPIOEnable(this.parseGPIO(pin),            // pin
                                               this.parseBoolean(tokens[2]))); // enable or disable
                            break;

                        case "pwmenable":
                        case "pwmEnable":
                        case "PWMEnable":
                            this._worker.addAction(
                                new PWMEnable(this.parsePWM(pin),             // pin
                                              this.parseBoolean(tokens[2]))); // enable or disable
                            break;

                        case "pwmsetperiod":
                        case "pwmSetPeriod":
                        case "PWMSetPeriod":
                            this._worker.addAction(
                                new PWMSetPeriod(this.parsePWM(pin),      // pin
                                                 parseFloat(tokens[2]))); // period
                            break;

                        case "pwmsetduty":
                        case "pwmSetDuty":
                        case "PWMSetDuty":
                            this._worker.addAction(
                                new PWMSetDuty(this.parsePWM(pin),      // pin
                                               parseFloat(tokens[2]))); // duty
                            break;

                        case "pwmlinearaccel":
                        case "pwmLinearAccel":
                        case "PWMLinearAccel":
                            this._worker.addAction(
                                new PWMLinearAccel(this.parsePWM(pin),      // pin
                                                   parseFloat(tokens[2]),   // start speed
                                                   parseFloat(tokens[3]),   // target speed
                                                   parseInt(tokens[4])));   // duration
                            this._totalTime += parseInt(tokens[4]);
                            break;

                        default: console.log(command);
                    }
                }

                resolve("File read done");
            });
        });
    }
    
    public run(quick?:boolean) {
        if(quick != null)
            this._filePath = quick ? "./quick.hc" : "./wash.hc";

        this.readCommandFile(this.filePath).then(()=>{
            this._renderEvent.send(WorkerCH.onSetTotalTimeMR, this._totalTime);
            this._worker.run().then(() => {
                this._renderEvent.send(WorkerCH.onWorkingStateChangedMR, WorkingState.Stop);
            }).catch((e) => {
                console.log("run error")}
            );
        }).catch((err)=>{
            console.error(err);
            exit(1);
        });

    }

    private parseBoolean(input:string):boolean {
        return input == "true";
    }

    private parseGPIO(input:string):GPIOPin {
        switch(input) {
            case "pump1":
                return GPIOPin.pump1;
            case "pump2":
                return GPIOPin.pump2;
            case "valve":
                return GPIOPin.valve;
            case "propeller1":
                return GPIOPin.propeller1;
            default:
                throw "GPIO Pin out of range";
        }
    }

    private parsePWM(input:string):PWMPin {
        switch(input) {
            case "pump":
                return PWMPin.pump;
            case "propeller":
                return PWMPin.propeller;
            default:
                throw "PWM Pin out of range";
        }
    }

    private connectEvents(mainWindow: BrowserWindow) {
        ipcMain.on(WorkerCH.commandRM,(event:IpcMainEvent,cmd:string)=>{
            switch(cmd)
            {
                case WorkingState.Stop:
                    this._worker.stop();
                    break;
                case WorkingState.Pause:
                    this._worker.pause();
                    break;
                case WorkingState.Resume:
                    this._worker.resume().then(()=>{
                        this._worker.run().catch(()=>{});
                    }).catch(() => {});
                    break;
            }
        });

        this._worker.onProgressCB((progress:number)=>{
            mainWindow.webContents.send(WorkerCH.onProgressMR,progress)
        })
        this._worker.onStateChangeCB((state:WorkingState,message?:string)=>{
            mainWindow.webContents.send(WorkerCH.onWorkingStateChangedMR,state,message)
        })
    }
}