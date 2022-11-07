#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StateMachineCodeStack } from '../lib/stacks/state-machine-code-stack';

const app = new cdk.App();
new StateMachineCodeStack(app, 'StateMachineCodeStackThingy');
