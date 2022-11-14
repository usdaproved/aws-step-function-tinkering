import { SecondMapInput } from '../stacks/state-machine-types';

export const handler = async (event: SecondMapInput): Promise<SecondMapInput> => {
    console.log(`Executing second-step for ${event.id}`);
    let result: string = "FAIL";
    
    if(event.state.preSetupResult === "PASS"){
        result = "PASS";
    }

    if(event.state.passSecond !== true){
        throw new Error("Second step was set not to pass.");
    }

    event.state.secondStepResult = result;

    return event;
};