import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Chain, Choice, Condition, Fail, IChainable, IntegrationPattern, JsonPath, Map, Parallel, StateMachine, Succeed, TaskInput } from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke, SqsSendMessage } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import * as path from 'path';

export class StateMachineCodeStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const deadLetterQueue = new Queue(this, "DeadLetterQueue");

        const successState = new Succeed(this, "State Machine Success", {
            comment: "We did it boiii"
        });

        const failureState = new Fail(this, "State Machine Failure");

        // Lambda handler definition
        const preStepLambda = new Function(this, "PreStep", {
            handler: "sm-pre-setup.handler",
            runtime: Runtime.NODEJS_16_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const firstStepLambda = new Function(this, "FirstStep", {
            handler: "sm-first-step.handler",
            runtime: Runtime.NODEJS_16_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const secondStepLambda = new Function(this, "SecondStep", {
            handler: "sm-second-step.handler",
            runtime: Runtime.NODEJS_16_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const mapTransformOutputLambda = new Function(this, "MapTransformOutput", {
            functionName: "MapTransformOutputLambda",
            handler: "map-transform-output.handler",
            runtime: Runtime.NODEJS_16_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const mapCheckErrorLambda = new Function(this, "MapCheckError", {
            functionName: "MapCheckError",
            handler: "map-check-error.handler",
            runtime: Runtime.NODEJS_16_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const finalStepLambda = new Function(this, "FinalStep", {
            handler: "sm-final-step.handler",
            runtime: Runtime.NODEJS_16_X,
            code: Code.fromAsset(path.join(__dirname, "../functions"))
        });

        const makeMap = (
            idPrefix: string,
            name: string,
            itemsPath: string,
            lambdas: Function[],
            next: IChainable
        ): Map => {
            const mapTransformOutputInvoke = new LambdaInvoke(this, 
                `${idPrefix}-${mapTransformOutputLambda.functionName}`,
                {
                    lambdaFunction: mapTransformOutputLambda,
                    outputPath: "$.Payload"
                }).addRetry({
                    maxAttempts: 3,
                    backoffRate: 2,
                    interval: Duration.seconds(2)
                });

            const lambdaInvokes = lambdas.map(
                (lambda) => {
                    return new LambdaInvoke(this, `${idPrefix}-${lambda.functionName}`,
                    {
                        lambdaFunction: lambda,
                        outputPath: "$.Payload"
                    }).addRetry({
                        maxAttempts: 3,
                        backoffRate: 2,
                        interval: Duration.seconds(2)
                    }).addCatch(mapTransformOutputInvoke, {
                        errors: ["States.ALL"],
                        resultPath: "$.error"
                    });
                }
            );
            
            const lambdaInvokeCount = lambdaInvokes.length;
            for(const [index, lambdaInvoke] of lambdaInvokes.entries()){
                if(index === lambdaInvokeCount - 1){
                    continue;
                }

                lambdaInvoke.next(lambdaInvokes[index + 1]);
            }

            lambdaInvokes[lambdaInvokeCount - 1].next(mapTransformOutputInvoke);

            const result = new Map(this, name, {
                itemsPath: itemsPath,
                parameters: {
                    "id.$" : "$.id",
                    "state.$" : "$$.Map.Item.Value"
                },
                resultPath: itemsPath
            });
            result.iterator(lambdaInvokes[0]);

            const recordErrorAndWait = new SqsSendMessage(this, `${idPrefix} Report and Wait`, {
                integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
                queue: deadLetterQueue,
                messageBody: TaskInput.fromObject({
                    executionId: JsonPath.stringAt("$$.Execution.Id"),
                    taskToken: JsonPath.taskToken,
                    currentState: JsonPath.jsonToString(JsonPath.objectAt("$"))
                })
            });

            const checkErrorInvoke = new LambdaInvoke(this, `${idPrefix}-check-error-lambda`, {
                lambdaFunction: mapCheckErrorLambda,
                resultSelector: { "result.$" : "$.Payload" },
                resultPath: `$.is${name}ErrorFound`,
                inputPath: itemsPath
            }).addRetry({
                maxAttempts: 3,
                backoffRate: 2,
                interval: Duration.seconds(2)
            }).next(new Choice(this, `${idPrefix} Check Errors`)
                .when(Condition.isBoolean(`$.is${name}ErrorFound.result`), recordErrorAndWait)
                .otherwise(next));

            result.next(checkErrorInvoke);

            return result;
        }

        const finalStepTask = new LambdaInvoke(this, "FinalStepTask", {
            lambdaFunction: finalStepLambda,
            outputPath: "$.Payload"
        }).next(successState);

        const secondMap = makeMap("second-map", "SecondMap", "$.secondSteps", [preStepLambda, secondStepLambda], finalStepTask);
        const firstMap = makeMap("first-map", "FirstMap", "$.firstSteps", [preStepLambda, firstStepLambda], secondMap);
        
        const stateMachineDefinition = firstMap;

        const stateMachine = new StateMachine(this, "TestStateMachine", {
            definition: stateMachineDefinition,
            stateMachineName: "TestStateMachine"
        });

        deadLetterQueue.grantSendMessages(stateMachine);
    }
}