// Copyright (c) CURRENT-YEAR. ORGANISATION-NAME <ORGANISATION-EMAIL>. All rights reserved.

import { ProcessUtils } from "./fi/hg/core/ProcessUtils";

// Must be first import to define environment variables before anything else
ProcessUtils.initEnvFromDefaultFiles();

import {
    BACKEND_SCRIPT_NAME,
    BACKEND_LOG_LEVEL,
    BACKEND_URL
} from "./constants/runtime";

import { LogService } from "./fi/hg/core/LogService";
import { LogLevel } from "./fi/hg/core/types/LogLevel";

LogService.setLogLevel(BACKEND_LOG_LEVEL);

import { RequestClientImpl } from "./fi/hg/core/RequestClientImpl";
import { CommandExitStatus } from "./fi/hg/core/cmd/types/CommandExitStatus";
import { CommandArgumentUtils } from "./fi/hg/core/cmd/utils/CommandArgumentUtils";
import { ParsedCommandArgumentStatus } from "./fi/hg/core/cmd/types/ParsedCommandArgumentStatus";
import { ServerServiceImpl } from "./fi/hg/node/requestServer/ServerServiceImpl";
import { RequestServerImpl } from "./fi/hg/node/RequestServerImpl";
import { RequestServerEvent } from "./fi/hg/core/RequestServer";
import { BackendController } from "./controllers/BackendController";
import { RequestRouterImpl } from "./fi/hg/core/requestServer/RequestRouterImpl";
import { Headers } from "./fi/hg/core/request/types/Headers";
import { BUILD_USAGE_URL, BUILD_WITH_FULL_USAGE } from "./constants/build";

const LOG = LogService.createLogger('main');

export async function main (
    args: string[] = []
) : Promise<CommandExitStatus> {
    try {
        Headers.setLogLevel(LogLevel.INFO);
        RequestRouterImpl.setLogLevel(LogLevel.INFO);
        RequestClientImpl.setLogLevel(LogLevel.INFO);
        RequestServerImpl.setLogLevel(LogLevel.INFO);

        LOG.debug(`Loglevel as ${LogService.getLogLevelString()}`);

        const {scriptName, parseStatus, exitStatus, errorString} = CommandArgumentUtils.parseArguments(BACKEND_SCRIPT_NAME, args);

        if ( parseStatus === ParsedCommandArgumentStatus.HELP || parseStatus === ParsedCommandArgumentStatus.VERSION ) {
            console.log(getMainUsage(scriptName));
            return exitStatus;
        }

        if (errorString) {
            console.error(`ERROR: ${errorString}`);
            return exitStatus;
        }

        const server = RequestServerImpl.create(
            ServerServiceImpl.create(BACKEND_URL),
            RequestRouterImpl.create(),
        );
        server.attachController(BackendController);
        server.start();

        let serverListener : any = undefined;
        const stopPromise = new Promise<void>((resolve, reject) => {
            try {
                LOG.debug('Stopping server from RequestServer stop event');
                serverListener = server.on(RequestServerEvent.STOPPED, () => {
                    serverListener = undefined;
                    resolve();
                });
            } catch(err) {
                reject(err);
            }
        });
        ProcessUtils.setupDestroyHandler( () => {

            LOG.debug('Stopping server from process utils event');

            server.stop();

            if (serverListener) {
                serverListener();
                serverListener = undefined;
            }

        }, (err : any) => {
            LOG.error('Error while shutting down the service: ', err);
        });
        await stopPromise;

        return CommandExitStatus.OK;
    } catch (err) {
        LOG.error(`Fatal error: `, err);
        return CommandExitStatus.FATAL_ERROR;
    }
}

/**
 *
 * @param scriptName
 * @nosideeffects
 * @__PURE__
 */
export function getMainUsage (
    scriptName: string
): string {

    /* @__PURE__ */if ( /* @__PURE__ */BUILD_WITH_FULL_USAGE ) {

        return `USAGE: ${/* @__PURE__ */scriptName} [OPT(s)] ARG(1) [...ARG(N)]

  HG Oy backend.
  
...and OPT is one of:

    -h --help          Print help
    -v --version       Print version
    --                 Disables option parsing

  Environment variables:

    BACKEND_LOG_LEVEL as one of:
    
      ALL
      DEBUG
      INFO
      WARN
      ERROR
      NONE
`;
    } else {
        return `USAGE: ${/* @__PURE__ */scriptName} ARG(1) [...ARG(N)]
See ${/* @__PURE__ */BUILD_USAGE_URL}
`;
    }
}
