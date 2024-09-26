import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { StatusCodes } from "http-status-codes"; // Import the library

class RestUtility {
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
   * GET request handler with dynamic baseURL, endpoint, timeout, and retry logic.
   */
  async get(baseURL: string, endpoint: string, headers: object = {}, retry: boolean = false, retryCount: number = 3, timeout: number = 5000): Promise<any> {
    const axiosInstance = axios.create({
      baseURL: baseURL,
      timeout: timeout, // Set dynamic timeout for the request
    });

    this.applyRetry(retry, retryCount, axiosInstance);

    try {
      const response = await axiosInstance.get(endpoint, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST request handler with dynamic baseURL, endpoint, timeout, and retry logic.
   */
  async post(baseURL: string, endpoint: string, data: object = {}, headers: object = {}, retry: boolean = false, retryCount: number = 3, timeout: number = 5000): Promise<any> {
    const axiosInstance = axios.create({
      baseURL: baseURL,
      timeout: timeout, // Set dynamic timeout for the request
    });

    this.applyRetry(retry, retryCount, axiosInstance);

    try {
      const response = await axiosInstance.post(endpoint, data, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT request handler with dynamic baseURL, endpoint, timeout, and retry logic.
   */
  async put(baseURL: string, endpoint: string, data: object = {}, headers: object = {}, retry: boolean = false, retryCount: number = 3, timeout: number = 5000): Promise<any> {
    const axiosInstance = axios.create({
      baseURL: baseURL,
      timeout: timeout, // Set dynamic timeout for the request
    });

    this.applyRetry(retry, retryCount, axiosInstance);

    try {
      const response = await axiosInstance.put(endpoint, data, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default RestUtility;
