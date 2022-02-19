/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
// require('@google-cloud/trace-agent').start();

const path = require('path');
const grpc = require('grpc');
const leftPad = require('left-pad');
const pino = require('pino');

const PROTO_PATH = path.join(__dirname, './proto/demo.proto');
const PORT = 5001;

const shopProto = grpc.load(PROTO_PATH).hipstershop;
const client = new shopProto.FilterService(`localhost:${PORT}`,
  grpc.credentials.createInsecure());

const logger = pino({
  name: 'filterservice-client',
  messageKey: 'message',
  changeLevelName: 'severity',
  useLevelLabels: true
});

const request = {
    filter_code: 'kitchen',
};

client.getSupportedCategories({}, (err, response) => {
  if (err) {
    logger.error(`Error in getSupportedCategories: ${err}`);
  } else {
    logger.info(`filter codes: ${response.filter_codes}`);
  }
});

client.filter(request, (err, response) => {
  if (err) {
    logger.error(`Error in filter: ${err}`);
  } else {
    logger.log(`Filter: ${request} res ${_filterCatalog(response)}`);
  }
});
