import fs from 'fs'
import { stdout } from 'process';

export class ReadCommandFile
{
    private _filePath: string | undefined;
    private _commands: Array<string> = [];

    constructor(filePath: string) {
        try {
            if(fs.existsSync(filePath))
                this._filePath = filePath;
            else throw "FileNotFound";
        } catch(err) {
            console.log(err)
        }   
    }

   /**
    * name
    */
   public read() {    
        if(this._filePath)
            //read file
            fs.readFile(this._filePath, (err, data) => {
                //read line
                for(const line of data.toString().split('\n')) {
                    //read commands
                    for (const tokens of line) {
                        if(tokens.length < 2)
                            continue;
                        
                        switch(tokens[0]) {
                            case "Wait":
                                
                            case "GPIOEnable":
                            case "PWMEnable":
                            case "PWMSetPeriod":
                            case "PWMSetDuty":
                            case "PWMLinearAccel":
                        }   
                    };
                }
            });
   }

   private parseGPIO():GPIOPin {
        return GPIOPin.pump2;
   }

   private parsePWM():PWMPin {
        return PWMPin.propeller
   }
}