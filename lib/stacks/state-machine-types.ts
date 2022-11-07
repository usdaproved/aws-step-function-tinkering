export type FirstMap = {
    passPre: boolean;
    preSetupResult?: string;
    passFirst: boolean;
    firstStepResult?: string;
};

export type FirstMapInput = {
    id: string;
    state: {
        passPre: boolean;
        preSetupResult?: string;
        passFirst: boolean;
        firstStepResult?: string;
    }
};

export type SecondMap = {
    passPre: boolean;
    preSetupResult?: string;
    passSecond: boolean;
    secondStepResult?: string;
};

export type SecondMapInput = {
    id: string;
    state: {
        passPre: boolean;
        preSetupResult?: string;
        passSecond: boolean;
        secondStepResult?: string;
    }
};

export type StateMachine = {
    id: string;
    firstSteps: FirstMap[];
    secondSteps: SecondMap[];
    passFinal: boolean;
    finalStepResult?: string;
};