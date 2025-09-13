import { table } from './init.js';

let searchFilterFunction = null;

function applySearchFilter(searchTerm) {
    // Remove the previous search filter
    if (searchFilterFunction) {
        table.removeFilter(searchFilterFunction);
    }

    // Apply the new search filter
    if (searchTerm) {
        searchFilterFunction = function(data) {
            const searchTermLower = searchTerm.toLowerCase();
            return data.date.toLowerCase().includes(searchTermLower) ||
                   data.item.toLowerCase().includes(searchTermLower) ||
                   data.category.toLowerCase().includes(searchTermLower) ||
                   data.amount.toString().includes(searchTerm);
        };
        table.addFilter(searchFilterFunction);
    } else searchFilterFunction = null;
}

function addSearchEventListeners() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => applySearchFilter(searchInput.value.trim()));
}



export { addSearchEventListeners };