/**
 * @license Copyright 2021 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Mock fraggle rock driver for testing.
 */

import {jest} from '@jest/globals';

import {
  createMockOnFn,
  createMockOnceFn,
  createMockSendCommandFn,
} from '../../gather/mock-commands.js';
import * as constants from '../../../config/constants.js';
import {fnAny} from '../../test-utils.js';
import {LH_ROOT} from '../../../../root.js';

/** @typedef {import('../../../fraggle-rock/gather/driver.js').Driver} Driver */
/** @typedef {import('../../../gather/driver/execution-context.js')} ExecutionContext */

function createMockSession() {
  return {
    setTargetInfo: fnAny(),
    sendCommand: createMockSendCommandFn({useSessionId: false}),
    setNextProtocolTimeout: fnAny(),
    once: createMockOnceFn(),
    on: createMockOnFn(),
    off: fnAny(),
    addProtocolMessageListener: createMockOnFn(),
    removeProtocolMessageListener: fnAny(),
    dispose: fnAny(),

    /** @return {LH.Gatherer.FRProtocolSession} */
    asSession() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

/**
 * @param {string} sessionId
 */
function createMockCdpSession(sessionId = 'DEFAULT_ID') {
  const connection = createMockCdpConnection();

  return {
    id: () => sessionId,
    send: createMockSendCommandFn({useSessionId: false}),
    once: createMockOnceFn(),
    on: createMockOnFn(),
    off: fnAny(),
    removeAllListeners: fnAny(),
    detach: fnAny(),

    connection() {
      return connection;
    },

    /** @return {LH.Puppeteer.CDPSession} */
    asCdpSession() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

function createMockCdpConnection() {
  return {
    on: createMockOnFn(),
    off: fnAny(),

    /** @return {LH.Puppeteer.Connection} */
    asCdpConnection() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

/**
 * @param {LH.Gatherer.AnyFRGathererInstance['meta']} meta
 */
function createMockGathererInstance(meta) {
  return {
    meta,
    startInstrumentation: fnAny(),
    stopInstrumentation: fnAny(),
    startSensitiveInstrumentation: fnAny(),
    stopSensitiveInstrumentation: fnAny(),
    getArtifact: fnAny(),

    /** @return {LH.Gatherer.AnyFRGathererInstance} */
    asGatherer() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

function createMockPage() {
  return {
    url: fnAny().mockReturnValue('https://example.com'),
    goto: fnAny(),
    target: () => ({createCDPSession: () => createMockSession()}),

    /** @return {LH.Puppeteer.Page} */
    asPage() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

function createMockExecutionContext() {
  return {
    evaluate: fnAny(),
    evaluateAsync: fnAny(),
    evaluateOnNewDocument: fnAny(),
    cacheNativesOnNewDocument: fnAny(),

    /** @return {ExecutionContext} */
    asExecutionContext() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

/** @param {ReturnType<typeof createMockSession>} session */
function createMockTargetManager(session) {
  return {
    rootSession: () => session,
    enable: fnAny(),
    disable: fnAny(),
    on: createMockOnFn(),
    off: fnAny(),

    /** @return {import('../../../gather/driver/target-manager.js')} */
    asTargetManager() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

function createMockDriver() {
  const page = createMockPage();
  const session = createMockSession();
  const context = createMockExecutionContext();
  const targetManager = createMockTargetManager(session);

  return {
    _page: page,
    _executionContext: context,
    _session: session,
    url: jest.fn(() => page.url()),
    defaultSession: session,
    connect: fnAny(),
    disconnect: fnAny(),
    executionContext: context.asExecutionContext(),
    targetManager: targetManager.asTargetManager(),

    /** @return {Driver} */
    asDriver() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

function mockRunnerModule() {
  const runnerModule = {
    getAuditList: fnAny().mockReturnValue([]),
    getGathererList: fnAny().mockReturnValue([]),
    audit: fnAny(),
    gather: fnAny(),
    reset,
  };

  jest.unstable_mockModule(`${LH_ROOT}/lighthouse-core/runner.js`, () => ({Runner: runnerModule}));

  function reset() {
    runnerModule.getGathererList.mockReturnValue([]);
    runnerModule.getAuditList.mockReturnValue([]);
    runnerModule.audit.mockReset();
    runnerModule.gather.mockReset();
  }

  return runnerModule;
}

/** @param {() => Driver} driverProvider */
function mockDriverModule(driverProvider) {
  // This must be a regular function becaues Driver is always invoked as a constructor.
  // Arrow functions cannot be invoked with `new`.
  return function() {
    return driverProvider();
  };
}

/**
 * @returns {LH.FRBaseArtifacts}
 */
function createMockBaseArtifacts() {
  return {
    fetchTime: new Date().toISOString(),
    URL: {
      initialUrl: 'about:blank',
      requestedUrl: 'https://example.com',
      mainDocumentUrl: 'https://example.com',
      finalUrl: 'https://example.com',
    },
    PageLoadError: null,
    settings: constants.defaultSettings,
    BenchmarkIndex: 500,
    LighthouseRunWarnings: [],
    Timing: [],
    HostFormFactor: 'desktop',
    HostUserAgent: 'Chrome/93.0.1449.0',
    GatherContext: {gatherMode: 'navigation'},
  };
}

function createMockContext() {
  return {
    driver: createMockDriver(),
    url: 'https://example.com',
    gatherMode: 'navigation',
    computedCache: new Map(),
    dependencies: {},
    baseArtifacts: createMockBaseArtifacts(),
    settings: constants.defaultSettings,

    /** @return {LH.Gatherer.FRTransitionalContext} */
    asContext() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },

    /** @return {LH.Gatherer.PassContext} */
    asLegacyContext() {
      // @ts-expect-error - We'll rely on the tests passing to know this matches.
      return this;
    },
  };
}

function mockDriverSubmodules() {
  const navigationMock = {gotoURL: fnAny()};
  const prepareMock = {
    prepareThrottlingAndNetwork: fnAny(),
    prepareTargetForTimespanMode: fnAny(),
    prepareTargetForNavigationMode: fnAny(),
    prepareTargetForIndividualNavigation: fnAny(),
  };
  const storageMock = {clearDataForOrigin: fnAny()};
  const emulationMock = {
    clearThrottling: fnAny(),
    emulate: fnAny(),
  };
  const networkMock = {
    fetchResponseBodyFromCache: fnAny(),
  };

  function reset() {
    navigationMock.gotoURL = fnAny().mockResolvedValue({finalUrl: 'https://example.com', warnings: [], timedOut: false});
    prepareMock.prepareThrottlingAndNetwork = fnAny().mockResolvedValue(undefined);
    prepareMock.prepareTargetForTimespanMode = fnAny().mockResolvedValue(undefined);
    prepareMock.prepareTargetForNavigationMode = fnAny().mockResolvedValue({warnings: []});
    prepareMock.prepareTargetForIndividualNavigation = fnAny().mockResolvedValue({warnings: []});
    storageMock.clearDataForOrigin = fnAny();
    emulationMock.clearThrottling = fnAny();
    emulationMock.emulate = fnAny();
    networkMock.fetchResponseBodyFromCache = fnAny().mockResolvedValue('');
  }

  /**
   * @param {Record<string, (...args: any[]) => any>} target
   * @param {string} name
   * @return {(...args: any[]) => void}
   */
  const get = (target, name) => {
    // @ts-expect-error: hack? What is going on here? Should we just remove the proxy stuff?
    if (name === 'then') return target;
    if (!target[name]) throw new Error(`Target does not have property "${name}"`);
    return (...args) => target[name](...args);
  };

  /* eslint-disable max-len */
  jest.unstable_mockModule('../../../gather/driver/navigation.js', () => new Proxy(navigationMock, {get}));
  jest.unstable_mockModule('../../../gather/driver/prepare.js', () => new Proxy(prepareMock, {get}));
  jest.unstable_mockModule('../../../gather/driver/storage.js', () => new Proxy(storageMock, {get}));
  jest.unstable_mockModule('../../../gather/driver/network.js', () => new Proxy(networkMock, {get}));
  jest.unstable_mockModule('../../../lib/emulation.js', () => new Proxy(emulationMock, {get}));
  /* eslint-enable max-len */

  reset();

  return {
    navigationMock,
    prepareMock,
    storageMock,
    emulationMock,
    networkMock,
    reset,
  };
}

export {
  mockRunnerModule,
  mockDriverModule,
  mockDriverSubmodules,
  createMockDriver,
  createMockPage,
  createMockSession,
  createMockCdpSession,
  createMockGathererInstance,
  createMockBaseArtifacts,
  createMockContext,
};
