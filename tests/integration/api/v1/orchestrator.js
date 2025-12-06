import retry from "async-retry";

async function awaitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (!response.ok) {
        throw Error(`HTTP error ${response.status}`);
      }
    }
  }
}

const orchestrator = {
  awaitForAllServices,
};

export default orchestrator;
