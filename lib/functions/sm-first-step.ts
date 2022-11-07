import { FirstMap, FirstMapInput } from '../stacks/state-machine-types';

export const handler = async (event: FirstMapInput): Promise<FirstMap> => {
    console.log(`Executing first-step for ${event.id}`);
    let result: string = "FAIL";
    
    if(event.state.preSetupResult === "PASS"){
        result = "PASS";
    }

    if(event.state.passFirst !== true){
        throw new Error("First step was set not to pass.");
    }

    return { ...event.state, firstStepResult: result };
};