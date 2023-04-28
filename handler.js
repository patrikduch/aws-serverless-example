'use strict';

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: 'region, // Replace with your desired AWS region',
    accessKeyId: 'your-access-key', // Replace with your AWS access key
    secretAccessKey: 'your-secret-key', // Replace with your AWS secret key
});

// Create a CloudWatchLogs instance
const cloudwatchlogs = new AWS.CloudWatchLogs();

// Define parameters for the query
const params = {
    logGroupName: 'log-group-name', // Replace with your CloudWatch Logs log group name
    startTime: Date.now() - 24 * 60 * 60 * 1000, // Logs from the last 24 hours
    endTime: Date.now(),
    queryString: `
    fields @timestamp, @message
    | sort @timestamp desc
  `,
};

const ipAddressPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
const requestTimePattern = /\b\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4}\b/;
const httpMethodPattern = /"httpMethod":"(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|CONNECT)"/;
const resourcePathPattern = /"resourcePath":"([^"]*)"/;
const statusPattern = /"status":"(\d{3})"/;
const protocolPattern = /"protocol":"(HTTP\/\d\.\d)"/;
const responseLengthPattern = /"responseLength":"(\d+)"/;
const requestIdPattern = /"requestId":"([\w\d-]+)"/;

module.exports.hello = async () => {
    try {
        const startQueryResponse = await cloudwatchlogs.startQuery(params).promise();
        const queryId = startQueryResponse.queryId;
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for query to complete

        const resultsParams = {
            queryId: queryId,
        };
        const getQueryResultsResponse = await cloudwatchlogs.getQueryResults(resultsParams).promise();

        const extractedData = getQueryResultsResponse.results.map((result) => {
            const message = result.find((field) => field.field === '@message').value;
            const ipMatch = message.match(ipAddressPattern);
            const requestTimeMatch = message.match(requestTimePattern);
            const httpMethodMatch = message.match(httpMethodPattern);
            const resourcePathMatch = message.match(resourcePathPattern);
            const statusMatch = message.match(statusPattern);
            const protocolMatch = message.match(protocolPattern);
            const responseLengthMatch = message.match(responseLengthPattern);
            const requestIdMatch = message.match(requestIdPattern);

            return {
                requestId: requestIdMatch ? requestIdMatch[1] : null,
                requestTime: requestTimeMatch ? requestTimeMatch[0] : null,
                ip: ipMatch ? ipMatch[0] : null,
                httpMethod: httpMethodMatch ? httpMethodMatch[1] : null,
                resourcePath: resourcePathMatch ? resourcePathMatch[1] : null,
                status: statusMatch ? statusMatch[1] : null,
                protocol: protocolMatch ? protocolMatch[1] : null,
                responseLength: responseLengthMatch ? responseLengthMatch[1] : null,
            };
        }).filter(res => res !== null);

        return {
            statusCode: 200,
            body: JSON.stringify(extractedData),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Internal Server Error'}),
        };
    }
};
