import RestUtility from "./RestUtility";

const restUtil = new RestUtility();

// Example of a GET request with retries
restUtil
  .get("https://api.example.com", "/data", {}, true, 5, 10000)
  .then((data) => console.log("Response:", data))
  .catch((error) => console.error("Error:", error));

// Example of a POST request without retries
restUtil
  .post("https://api.example.com", "/create", { key: "value" }, {}, false)
  .then((data) => console.log("Response:", data))
  .catch((error) => console.error("Error:", error));
