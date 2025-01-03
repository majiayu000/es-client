import { invoke } from "@tauri-apps/api/tauri";

let isConnected = false;
const mainContainer = document.getElementById("root");

// Initial render
renderApp();

function renderApp() {
  mainContainer.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Elasticsearch Client
          </h1>
        </div>
      </header>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        ${!isConnected ? renderConnectionForm() : renderIndexList()}
      </main>
    </div>
  `;

  // Add event listeners after rendering
  if (!isConnected) {
    setupConnectionForm();
  } else {
    setupIndexList();
  }
}

function renderConnectionForm() {
  return `
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Connect to Elasticsearch</h2>
        <form id="connection-form" class="space-y-4">
          <div>
            <label for="host" class="block text-sm font-medium text-gray-700">
              Elasticsearch Host
            </label>
            <div class="mt-1">
              <input
                id="host"
                type="text"
                value="http://172.31.0.7:19200"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="http://localhost:9200"
                required
              />
            </div>
            <p class="mt-2 text-sm text-gray-500">
              Enter the URL of your Elasticsearch instance
            </p>
          </div>
          <div>
            <button
              type="submit"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function setupConnectionForm() {
  const form = document.getElementById("connection-form");
  const hostInput = document.getElementById("host");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const host = hostInput.value;

    try {
      const config = {
        hosts: [host],
        username: null,
        password: null,
        api_key: null,
        ca_cert_path: null,
        timeout_secs: 30,
      };

      const connected = await invoke("connect_elasticsearch", { config });
      
      if (connected) {
        isConnected = true;
        renderApp();
      } else {
        showError("Failed to connect to Elasticsearch");
      }
    } catch (err) {
      showError(err.message || "Unknown error occurred");
    }
  });
}

function renderIndexList() {
  return `
    <div class="bg-white shadow rounded-lg">
      <div class="p-4">
        <div class="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h2 class="text-lg font-medium text-gray-900">Elasticsearch Indices</h2>
            <p id="indices-count" class="mt-1 text-sm text-gray-500">Loading...</p>
          </div>
          <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
            <div class="max-w-xs flex-1">
              <label for="search" class="sr-only">Search Indices</label>
              <div class="relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  class="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search indices..."
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              id="refresh-button"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Refresh
            </button>
          </div>
        </div>

        <div id="indices-table" class="mt-4 flex flex-col">
          <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table class="min-w-full divide-y divide-gray-300">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Health</th>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Documents</th>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Size</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <tr>
                      <td colspan="5" class="px-3 py-4 text-sm text-gray-500 text-center">
                        Loading indices...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupIndexList() {
  const searchInput = document.getElementById("search");
  const refreshButton = document.getElementById("refresh-button");
  const indicesTable = document.getElementById("indices-table");
  const indicesCount = document.getElementById("indices-count");

  let indices = [];
  let searchTerm = "";

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderIndices();
  });

  refreshButton.addEventListener("click", fetchIndices);

  function getHealthColor(health) {
    switch (health) {
      case "green": return "bg-green-100 text-green-800";
      case "yellow": return "bg-yellow-100 text-yellow-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function renderIndices() {
    const filteredIndices = indices.filter(index => 
      index.name.toLowerCase().includes(searchTerm)
    );

    indicesCount.textContent = `${filteredIndices.length} ${filteredIndices.length === 1 ? 'index' : 'indices'} found`;

    const tableBody = document.createElement("tbody");
    tableBody.className = "divide-y divide-gray-200 bg-white";

    filteredIndices.forEach(index => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          ${index.name}
        </td>
        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(index.health)}">
            ${index.health || "unknown"}
          </span>
        </td>
        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          ${index.status || "-"}
        </td>
        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          ${index.docs_count?.toLocaleString() ?? "-"}
        </td>
        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          ${index.store_size ?? "-"}
        </td>
      `;
      tableBody.appendChild(row);
    });

    const table = indicesTable.querySelector("table");
    const oldBody = table.querySelector("tbody");
    table.replaceChild(tableBody, oldBody);
  }

  async function fetchIndices() {
    try {
      indices = await invoke("list_indices");
      renderIndices();
    } catch (err) {
      showError(err.message || "Failed to fetch indices");
    }
  }

  // Initial fetch
  fetchIndices();
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "rounded-md bg-red-50 p-4 mt-4";
  errorDiv.innerHTML = `
    <div class="flex">
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">Error</h3>
        <div class="mt-2 text-sm text-red-700">
          <p>${message}</p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById("connection-form");
  const existingError = form.parentNode.querySelector(".bg-red-50");
  if (existingError) {
    existingError.remove();
  }
  form.parentNode.insertBefore(errorDiv, form.nextSibling);
} 