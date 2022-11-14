import { FirstMapInput, SecondMapInput } from '../stacks/state-machine-types';

export const handler = async (event: FirstMapInput | SecondMapInput): Promise<FirstMapInput | SecondMapInput> => {
    console.log(`Executing pre-setup for ${event.id}`);
    let result: string = "FAIL";
    
    if(event.state.passPre === true){
        result = "PASS";
    }

    event.state.preSetupResult = result;

    return event;
};