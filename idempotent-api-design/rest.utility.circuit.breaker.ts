import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { StatusCodes } from "http-status-codes"; // Import the library
import CircuitBreaker from "opossum"; // Circuit breaker library

class RestUtility {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    // Set up circuit breaker with configuration
    this.circuitBreaker = new CircuitBreaker(this.makeRequest.bind(this), {
      timeout: 5000, // Timeout for requests in milliseconds
      errorThresholdPercentage: 50, // Open the circuit if 50% of requests fail
      resetTimeout: 10000, // Time after which the circuit breaker will try again (10 seconds)
    });

    // Log circuit breaker events for visibility
    this.circuitBreaker.on("open", () => console.log("Circuit breaker opened"));
    this.circuitBreaker.on("halfOpen", () => console.log("Circuit breaker half-open"));
    this.circuitBreaker.on("close", () => console.log("Circuit breaker closed"));
  }

  /**
   * Apply retry logic for a specific axios instance.
   * @param {Boolean} shouldRetry - Whether to attempt retries.
   * @param {Number} retryCount - Number of retry attempts.
   * @param {AxiosInstance} instance - Axios instance to apply retry logic.
   */
  private applyRetry(shouldRetry: boolean, retryCount: number, instance: AxiosInstance): void {
    if (shouldRetry) {
      axiosRetry(instance, {
        retries: retryCount,
        retryCondition: (error) => {
          return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= StatusCodes.INTERNAL_SERVER_ERROR);
        },
        retryDelay: (retryCount) => {
          // Exponential backoff: 2^retryCount * 1000 milliseconds
          return Math.pow(2, retryCount) * 1000; // Delay in milliseconds
        },
      });
    }
  }

  /**
   * Helper function to make the request via circuit breaker
   */
  private async makeRequest(config: object): Promise<any> {
    const axiosInstance = axios.create(config);
    try {
      const response = await axiosInstance.request(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET request handler with dynamic baseURL, endpoint, timeout, and retry logic.
   */
  async get(baseURL: string, endpoint: string, headers: object = {}, retry: boolean = false, retryCount: number = 3, timeout: number = 5000): Promise<any> {
    const config = {
      method: "get",
      baseURL: baseURL,
      url: endpoint,
      headers: headers,
      timeout: timeout,
    };

    this.applyRetry(retry, retryCount, axios.create(config));

    // Use the circuit breaker to make the GET request
    try {
      return await this.circuitBreaker.fire(config);
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST request handler with dynamic baseURL, endpoint, timeout, and retry logic.
   */
  async post(baseURL: string, endpoint: string, data: object = {}, headers: object = {}, retry: boolean = false, retryCount: number = 3, timeout: number = 5000): Promise<any> {
    const config = {
      method: "post",
      baseURL: baseURL,
      url: endpoint,
      data: data,
      headers: headers,
      timeout: timeout,
    };

    this.applyRetry(retry, retryCount, axios.create(config));

    // Use the circuit breaker to make the POST request
    try {
      return await this.circuitBreaker.fire(config);
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT request handler with dynamic baseURL, endpoint, timeout, and retry logic.
   */
  async put(baseURL: string, endpoint: string, data: object = {}, headers: object = {}, retry: boolean = false, retryCount: number = 3, timeout: number = 5000): Promise<any> {
    const config = {
      method: "put",
      baseURL: baseURL,
      url: endpoint,
      data: data,
      headers: headers,
      timeout: timeout,
    };

    this.applyRetry(retry, retryCount, axios.create(config));

    // Use the circuit breaker to make the PUT request
    try {
      return await this.circuitBreaker.fire(config);
    } catch (error) {
      throw error;
    }
  }
}

export default RestUtility;
