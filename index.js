// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const http = require('http');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

const host = 'api.worldweatheronline.com';
const wwoApiKey = '?';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request: request, response: response });

  console.log('Headers: ' + JSON.stringify(request.headers));
  console.log('Body: ' + JSON.stringify(request.body));

  var index = 0;
  for (index in request.body.result.contexts) {
    var contexto = request.body.result.contexts[index].name;
    console.log('Context: ' + contexto);

    if (contexto == 'localizacao') {
      let city = request.body.result.parameters['geo-city']; // city is a required param
      console.log('City: ' + city);

      // Get the date for the weather forecast (if present)
      let date = '';
      if (request.body.result.parameters.date) {
        date = request.body.result.parameters.date;
        console.log('Date: ' + date);
      }

      // Create the path for the HTTP request to get the weather
      // encodeURIComponent(city)
      let path = '/premium/v1/weather.ashx?format=json&num_of_days=1&lang=pt' +
        '&q=' + city + '&key=' + wwoApiKey + '&date=' + date;
      console.log('API Request: ' + host + path);

      // Make the HTTP request to get the weather
      http.get({ host: host, path: path }, (res) => {
        let body = ''; // var to store the response chunks
        res.on('data', (d) => { body += d; }); // store each response chunk
        res.on('end', () => {
          // After all the data has been received parse the JSON for desired data
          let resJson = JSON.parse(body);
          let forecast = resJson.data.weather[0];
          let location = resJson.data.request[0];
          let conditions = resJson.data.current_condition[0];
          let currentConditions = conditions.lang_pt[0].value;

          // Create response
          var output = `Condições atuais em ${location.query} são:
                ${currentConditions} com projeção de temperatura máxima de
                ${forecast.maxtempC}°C e mínima de 
                ${forecast.mintempC}°C em ${forecast.date}.`;

          // Resolve the promise with the output text
          console.log(output);
          response.json({ 'displayText': output, 'speech': output }); //v1
          // response.json({ 'fulfillmentText': output }); // v2
          agent.add(output);
        });
        res.on('error', (error) => {
          console.log(`Error calling the weather API: ${error}`)
        });
      });
    }
  }
});
