import axios from "axios";

const makeApi = ({
  apiKey,
  backendUrl,
}: {
  apiKey: string;
  backendUrl: string;
}) => {
  const api = axios.create({
    baseURL: backendUrl,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  // Add request interceptor for common headers
  api.interceptors.request.use((config) => {
    // You can add common headers here
    return config;
  });

  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle common error cases here
      return Promise.reject(error);
    }
  );

  return api;
};

export default makeApi;
