import fs from "fs";
import axios, { AxiosResponse } from "axios";

// Type Definitions
interface ParameterConfig {
  source: string;
  path?: string;
  hostname?: string;
  method?: string;
  endpoint?: string;
  requestBody?: { [key: string]: string };
  queryParams?: { [key: string]: string };
  responsePath?: string;
  filter?: {
    key: string;
    value: string;
  };
}

interface Config {
  parameters: { [key: string]: ParameterConfig };
}

interface MessagePayload {
  [key: string]: any;
}

// Read the configuration JSON file from the repo (synchronously for simplicity)
const config: Config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

/**
 * Function to get the value of a parameter based on the configuration.
 * @param {string} paramName - The name of the parameter to fetch.
 * @param {MessagePayload} messagePayload - The message payload.
 * @returns {Promise<any>} - The value of the parameter.
 */
async function getParameterValue(paramName: string, messagePayload: MessagePayload): Promise<any> {
  const paramConfig = config.parameters[paramName];

  if (!paramConfig) {
    throw new Error(`Parameter ${paramName} not found in configuration`);
  }

  switch (paramConfig.source) {
    case "payload":
      return getFromPayload(paramConfig.path!, messagePayload);
    case "api":
      return await getFromAPI(paramConfig, messagePayload);
    default:
      throw new Error(`Unsupported source type: ${paramConfig.source}`);
  }
}

/**
 * Function to extract a value from the message payload based on a path.
 * @param {string} path - The dot notation path (e.g., 'order.id').
 * @param {object} obj - The object to extract the value from.
 * @returns {any} - The value found at the path in the object.
 */
function getFromPayload(path: string, obj: MessagePayload): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Function to make an API call and extract the value based on the config.
 * Supports both POST and GET methods with dynamic body or query parameters.
 * Handles array responses with filter conditions.
 * @param {ParameterConfig} paramConfig - The parameter config (including hostname, method, request body, and response path).
 * @param {MessagePayload} messagePayload - The message payload to inject dynamic data.
 * @returns {Promise<any>} - The value found in the API response.
 */
async function getFromAPI(paramConfig: ParameterConfig, messagePayload: MessagePayload): Promise<any> {
  const url = `${paramConfig.hostname}${paramConfig.endpoint}`;

  // Prepare request based on the method (GET or POST)
  let response: AxiosResponse<any>;
  try {
    if (paramConfig.method === "GET") {
      const queryParams = resolveDynamicData(paramConfig.queryParams, messagePayload);
      response = await axios.get(url, { params: queryParams });
    } else if (paramConfig.method === "POST") {
      const requestBody = resolveDynamicData(paramConfig.requestBody, messagePayload);
      response = await axios.post(url, requestBody);
    } else {
      throw new Error(`Unsupported HTTP method: ${paramConfig.method}`);
    }

    // Extract the response value based on the configured path
    let responseData = paramConfig.responsePath ? getFromPayload(paramConfig.responsePath, response.data) : response.data;

    // Apply filter if present and if response is an array
    if (Array.isArray(responseData) && paramConfig.filter) {
      const filterKey = paramConfig.filter.key;
      const filterValue = resolveDynamicData({ value: paramConfig.filter.value }, messagePayload).value;
      responseData = responseData.find((item: any) => item[filterKey] === filterValue);
    }

    return responseData;
  } catch (error) {
    console.error(`Error fetching external value for ${paramConfig.endpoint}:`, error);
    throw error;
  }
}

/**
 * Function to resolve dynamic placeholders in the config's requestBody or queryParams (e.g., $payload.order.id).
 * @param {object} dynamicDataConfig - The dynamic data template (either queryParams or requestBody).
 * @param {MessagePayload} messagePayload - The message payload.
 * @returns {object} - The resolved dynamic data.
 */
function resolveDynamicData(dynamicDataConfig: { [key: string]: string } | undefined, messagePayload: MessagePayload): { [key: string]: any } {
  if (!dynamicDataConfig) return {};

  let dynamicData = JSON.stringify(dynamicDataConfig);

  // Replace $payload.someKey with the actual value from the payload
  dynamicData = dynamicData.replace(/\$payload\.(\w+(\.\w+)*)/g, (_, key) => {
    return getFromPayload(key, messagePayload);
  });

  return JSON.parse(dynamicData);
}

// Example Usage:
const messagePayload = {
  order: {
    id: 1234,
    details: {
      amount: 250,
      currency: "USD",
      itemId: "item-002",
    },
  },
  customer: {
    id: "cust-001",
  },
  product: {
    id: "prod-001",
  },
};

// Fetch the orderId from the payload
getParameterValue("orderId", messagePayload)
  .then((value) => {
    console.log("Order ID:", value); // Output: 1234
  })
  .catch(console.error);

// Fetch externalValue from an API
getParameterValue("externalValue", messagePayload)
  .then((value) => {
    console.log("External Value:", value); // Output will depend on the API response
  })
  .catch(console.error);

// Fetch filteredItem from an API (array with filter)
getParameterValue("filteredItem", messagePayload)
  .then((value) => {
    console.log("Filtered Item:", value); // Output depends on the filtered result from API
  })
  .catch(console.error);
