import { StateMachine } from '../stacks/state-machine-types';

export type FinalStepResult = {
    result: string;
}

export const handler = async (event: StateMachine): Promise<StateMachine> => {
    console.log(`Executing final-step for ${event.id}`);
    let result: string = "FAIL";
    
    const failCount = event.firstSteps.filter((step) => {
        return step.preSetupResult === "FAIL"
        && step.firstStepResult === "FAIL"
    }).length
    +
    event.secondSteps.filter((step) => {
        return step.preSetupResult === "FAIL"
        && step.secondStepResult === "FAIL"
    }).length;

    if(failCount === 0){
        result = "PASS";
    }

    if(event.passFinal !== true){
        throw new Error("Final step was set not to pass.");
    }

    return { ...event, finalStepResult: result };
};