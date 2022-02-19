/*
 * Copyright 2018 Google LLC.
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
 */

// if (process.env.DISABLE_PROFILER) {
//   console.log("Profiler disabled.")
// }
// else {
//   console.log("Profiler enabled.")
//   require('@google-cloud/profiler').start({
//     serviceContext: {
//       service: 'filterservice',
//       version: '1.0.0'
//     }
//   });
// }


// if (process.env.DISABLE_TRACING) {
//   console.log("Tracing disabled.")
// }
// else {
//   console.log("Tracing enabled.")
//   require('@google-cloud/trace-agent').start();
// }

// if (process.env.DISABLE_DEBUGGER) {
//   console.log("Debugger disabled.")
// }
// else {
//   console.log("Debugger enabled.")
//   require('@google-cloud/debug-agent').start({
//     serviceContext: {
//       service: 'filterservice',
//       version: 'VERSION'
//     }
//   });
// }

const path = require('path');
const grpc = require('@grpc/grpc-js');
const pino = require('pino');
const protoLoader = require('@grpc/proto-loader');

const MAIN_PROTO_PATH = path.join(__dirname, './proto/demo.proto');
const HEALTH_PROTO_PATH = path.join(__dirname, './proto/grpc/health/v1/health.proto');

const PORT = 5001;

const shopProto = _loadProto(MAIN_PROTO_PATH).hipstershop;
const healthProto = _loadProto(HEALTH_PROTO_PATH).grpc.health.v1;

const logger = pino({
  name: 'filterservice-server',
  messageKey: 'message',
  levelKey: 'severity',
  useLevelLabels: true
});

/**
 * Helper function that loads a protobuf file.
 */
function _loadProto(path) {
  const packageDefinition = protoLoader.loadSync(
    path,
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    }
  );
  return grpc.loadPackageDefinition(packageDefinition);
}

/**
 * Helper function that gets currency data from a stored JSON file
 * Uses public data from European Central Bank
 */
function _getProducts(callback) {
  const data = require('./data/product_catalog.json');
  console.log(data.products);
  if (callback) {
    callback(data.products);
  }
}

/**
 * Lists the supported currencies
 */
function getSupportedCategories(products, callback) {
  logger.info('Getting supported categories...');
  cat = []
  if (products) {
      products.forEach(ele => ele.categories.forEach(item => cat.push(item)))
  }
  else {
    _getProducts((data) => {
      // callback(null, {categories: Object.keys(data.categories)});
      data.forEach(ele => ele.categories.forEach(item => cat.push(item)))
      
    });
  }
  if (callback) {
  callback(cat);
  }
}

/**
 * Filters the products according to the 'from' in request
 */
function filter(call, callback) {
  try {
    _getProducts((data) => {
      const request = call.request;
      // Convert: from_currency --> EUR
      // const from = request.from;
      results = []
      data.map(ele => {
        ele.categories.includes(request.filter_code) ? results.push(ele) : null
      })
      logger.info(`filter request successful`);
      console.log(results)
      if (callback) {
        callback(null, results);
      }
    });
  } catch (err) {
    logger.error(`filter request failed: ${err}`);
    callback(err.message);
  }
}

/**
 * Endpoint for health checks
 */
function check(call, callback) {
  callback(null, { status: 'SERVING' });
}
/**
 * Starts an RPC server that receives requests for the
 * CurrencyConverter service at the sample server port
 */
function main () {
  logger.info(`Starting gRPC server on port ${PORT}...`);
  const server = new grpc.Server();
  server.addService(shopProto.FilterService.service, {getSupportedCategories, filter});
    // , convert});
  server.addService(healthProto.Health.service, {check});

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    function() {
      logger.info(`FilterService gRPC server started on port ${PORT}`);
      server.start();
    },
   );
  // console.log('\n')
  //  _getProducts(data => console.log(data))
  //  getSupportedCategories(data => console.log(data))
  //  filter({request : {filter_code: 'kitchen'}}, data => console.log(data))
}

main();

