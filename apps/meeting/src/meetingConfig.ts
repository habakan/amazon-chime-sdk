// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  ConsoleLogger,
  LogLevel,
  VideoPriorityBasedPolicy,
} from 'amazon-chime-sdk-js';

const simulcastEnabled = true;
const logger = new ConsoleLogger('SDK', LogLevel.INFO);
export const priorityBasedPolicy = new VideoPriorityBasedPolicy(logger);

const config = {
  simulcastEnabled,
  logger,
  videoDownlinkBandwidthPolicy: priorityBasedPolicy,
};

export default config;
