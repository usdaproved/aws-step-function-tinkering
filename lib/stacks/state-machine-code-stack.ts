import { Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Chain, JsonPath, Map, StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import * as path from 'path';

export class StateMachineCodeStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Lambda handler definition
        const preStepLambda = new Function(this, "PreStep", {
            handler: "sm-pre-setup.handler",
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const firstStepLambda = new Function(this, "FirstStep", {
            handler: "sm-first-step.handler",
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const secondStepLambda = new Function(this, "SecondStep", {
            handler: "sm-second-step.handler",
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const finalStepLambda = new Function(this, "FinalStep", {
            handler: "sm-final-step.handler",
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        // step functions definition
        const firstPreStepTask = new LambdaInvoke(this, "FirstPreSetupTask", {
            lambdaFunction: preStepLambda,
            outputPath: "$.Payload"
        });

        const secondPreStepTask = new LambdaInvoke(this, "SecondPreSetupTask", {
            lambdaFunction: preStepLambda,
            outputPath: "$.Payload"
        });

        const firstStepTask = new LambdaInvoke(this, "FirstStepTask", {
            lambdaFunction: firstStepLambda,
            outputPath: "$.Payload"
        });

        const secondStepTask = new LambdaInvoke(this, "SecondStepTask", {
            lambdaFunction: secondStepLambda,
            outputPath: "$.Payload"
        });

        const finalStepTask = new LambdaInvoke(this, "FinalStepTask", {
            lambdaFunction: finalStepLambda,
            outputPath: "$.Payload"
        });

        const firstChain: Chain = firstPreStepTask.next(firstStepTask);

        const firstMap = new Map(this, "FirstStepMap", {
            itemsPath: "$.firstSteps",
            parameters: {
                "id.$" : "$.id",
                "state.$" : "$$.Map.Item.Value"
            },
            resultPath: "$.firstSteps"
        });
        firstMap.iterator(firstChain);
        
        const secondChain: Chain = secondPreStepTask.next(secondStepTask);

        const secondMap = new Map(this, "SecondStepMap", {
            itemsPath: "$.secondSteps",
            parameters: {
                "id.$" : "$.id",
                "state.$" : "$$.Map.Item.Value"
            },
            resultPath: "$.secondSteps"
        });
        secondMap.iterator(secondChain);

        const stateMachineDefinition = firstMap
            .next(secondMap)
            .next(finalStepTask);

        const stateMachine = new StateMachine(this, "TestStateMachine", {
            definition: stateMachineDefinition
        });
    }
}