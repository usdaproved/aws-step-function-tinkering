import { FirstMapInput } from '../stacks/state-machine-types';

export const handler = async (event: FirstMapInput): Promise<FirstMapInput> => {
    console.log(`Executing first-step for ${event.id}`);
    let result: string = "FAIL";
    
    if(event.state.preSetupResult === "PASS"){
        result = "PASS";
    }

    if(event.state.passFirst !== true){
        throw new Error("First step was set not to pass.");
    }

    event.state.firstStepResult = result;

    return event;
};