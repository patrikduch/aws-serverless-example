'use strict';

module.exports.hello = async (event) => {
  return {
    statusCode: 200, headers: {
          'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        message: 'Patrik Duch',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
