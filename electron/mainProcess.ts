import fs from 'fs'
import { WashWorker, WorkingState } from './worker/washWorker';
import { Wait, GPIOEnable, PWMEnable, PWMSetDuty, PWMSetPeriod, PWMLinearAccel, wait } from './actions';
import { GPIOPin, PWMPin } from './actions';
import { exit } from 'process';
import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { WorkerCH } from './ipc/cmdChannels';

export class Process
{
    private _filePath: string | undefined;
    private _worker: WashWorker = new WashWorker();
    private _totalTime: number = 0;
    private _renderEvent: any;

    constructor(mainWindow:BrowserWindow, filePath: string) {
        try {
            this._renderEvent = mainWindow.webContents;
            console.log(filePath);
            if(fs.existsSync(filePath))
                this._filePath = filePath;
            else throw "FileNotFound";

            this.connectEvents(mainWindow);
            this.readCommandFile();
        } catch(err) {
            console.log(err);
            exit();
        }
    }

    /**
    * name
    */
    private readCommandFile() {    
        if(this._filePath) {
            //read file
            fs.readFile(this._filePath, (err, data) => {                
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
                            this._worker.addAction(new Wait(parseInt(pin)));
                            break;
                        case "GPIOEnable":
                            try {
                                this._worker.addAction(new GPIOEnable(this.parseGPIO(pin), this.parseBoolean(tokens[2])));
                            } catch (error) {
                                console.log(error);
                            }
                            break;
                        case "PWMEnable":
                            try {
                                this._worker.addAction(new PWMEnable(this.parsePWM(pin), this.parseBoolean(tokens[2])));
                            } catch (error) {
                                console.log(error);
                            }
                            break;
                        case "PWMSetPeriod":
                            try {
                                this._worker.addAction(new PWMSetPeriod(this.parsePWM(pin), parseFloat(tokens[2])));
                            } catch (error) {
                                console.log(error);
                            }
                            break;
                        case "PWMSetDuty":
                            try {
                                this._worker.addAction(new PWMSetDuty(this.parsePWM(pin), parseFloat(tokens[2])));
                            } catch (error) {
                                console.log(error);
                            }
                            break;
                        case "PWMLinearAccel":
                            try {
                                this._worker.addAction(new PWMLinearAccel(this.parsePWM(pin), parseFloat(tokens[2]), parseFloat(tokens[3]), parseFloat(tokens[4])));
                            } catch (error) {
                                console.log(error);
                            }
                            break;
                        default: console.log(command);;
                    }
                }
            });
        }
    }
    
    public async run() {
        await this._worker.run();
        this._renderEvent.send(WorkerCH.onWorkingStateChangedMR, WorkingState.Stop);
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
        this._renderEvent.send(WorkerCH.onSetTotalTimeMR, this._totalTime);
        ipcMain.on(WorkerCH.commandRM,(event:IpcMainEvent,cmd:string)=>{
            switch(cmd)
            {
                case WorkingState.Stop:
                    this._worker.stop();
            }
        });
    }
}