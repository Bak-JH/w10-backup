//(target:command),(parameter:type),(parameter:type),...,(RT:return type) 
//if return type is void, it can be empty

//*RM - Renderer to Main
//*MR - Main to Renderer
//*TW - Renderer to Main Two Way

enum WorkerCH {  
    startRM          = "worker:start,       quick?:boolean",
    commandRM        = "worker:command,     cmd:string",
    shutdownRM       = "worker:shutdown",
    factoryResetRM   = "worker:factoryReset",
    setTimeRM        = "worker:setTime,     time:number",
    pageChangedRM    = "worker:pageChanged",

    onWorkingStateChangedMR = "worker:onWorkingStateChanged, state:string, message:string",
    onProgressMR            = "worker:onProgress,            progress:number",
    onSetTotalTimeMR        = "worker:onSetTotalTimeMR,      totalTime:number",
}

export {WorkerCH}