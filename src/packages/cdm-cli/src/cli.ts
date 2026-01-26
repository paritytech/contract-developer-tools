#!/usr/bin/env node
import { Command } from "commander";
import { buildCommand } from "./commands/build.js";
import { deployCommand } from "./commands/deploy.js";

const program = new Command();

program
    .name("cdm")
    .description("Contract Deployment Manager for ink! smart contracts")
    .version("0.1.0");

program.addCommand(buildCommand);
program.addCommand(deployCommand);

program.parse();
