//(target:command),(parameter:type),(parameter:type),...,(RT:return type) 
//if return type is void, it can be empty

//*RM - Renderer to Main
//*MR - Main to Renderer
//*TW - Renderer to Main Two Way

enum WorkerCH {  
    startRM          = "worker:start",
    commandRM          = "worker:command, cmd:string",
    shutdownRM          = "worker:shutdown",
    factoryResetRM          = "worker:factoryReset",

    onWorkingStateChangedMR = "worker:onWorkingStateChanged,state:string,message:string",
    onProgressMR = "worker:onProgress,progress:number",
    onSetTotalTimeMR = "worker:onSetTotalTimeMR",
}

enum ProductCH {
    onShutDownEventMR = "product:onShutDownEvent",

    shutDownRM = "product:onShutDown",
}

export {WorkerCH, ProductCH}