I made this for FBLA *coding and programming event*. Unfortunately at the time I could not present at all...and since FBLA is mostly all about presenting, although this app was good(for the time I had to make it), I did not make it past my school regionals. :(

tbf tho, with my UI/UX designing skills, I would not have made it past states :p

Hey but its okay I won Nationals first place for Network Design event :)

Andy, if you're reading this, I carried us, HARD


***

# FinTrack Source Code

## Project Description
This project is a finance tracking application named FinTrack. It allows users to manage their financial transactions by adding their transactions, which will be saved locally on IndexedDB. The program is simple and easy to use with an easily understandable UI, suitable for beginners and those who just want a simple way to keep track of their expenses/incomes.

## Features
- Add, edit, and delete transactions
- Group transactions by date, item, category, amount, or date range
- Apply filters to transactions based on date, item, category, or amount
- Calculate and display running totals
- Search transactions

## Getting Started
1. Download the source code
2. Open the `index.html` file in your preferred web browser.

## File Structure
- `src/`: Contains the source code for the application.
    - `table/`: Contains JavaScript files for table functionalities.
        - `addRow.js`: Handles adding new rows to the table.
        - `db.js`: Manages IndexedDB operations for transactions.
        - `group.js`: Handles grouping functionalities.
        - `init.js`: Initializes the table and sets up event listeners.
        - `search.js`: Handles search functionalities.
        - `utils.js`: Contains utility functions.
    - `styles.css`: Contains the main CSS styles for the application.
- `assets/`: Contains image assets used in the application.
- `pages/`: Contains HTML files for different pages of the application.
    - `table.html`: The main page for managing transactions.
    - `index.html`: The landing page, or dashboard, of the application.
- `readme.md`: This file, containing project documentation.

## Templates/Libraries Used
- [Tabulator](https://tabulator.info/): 
    Tabulator is a JavaScript library designed to create interactive tables. It provides a wide range of features such as sorting, filtering, pagination, and custom formatting. In this project, I used Tabulator to display data in a user-friendly table format, allowing users to easily manipulate and view the data.

- [Luxon](https://moment.github.io/luxon/): 
    Luxon is a powerful and easy-to-use library for working with dates and times in JavaScript. In this project, I used Luxon to handle date and time operations, such as parsing, formatting, and manipulating dates. This helped me ensure that date and time data was consistently and accurately managed across the application.

- [Chart.js](https://www.chartjs.org/): 
    Chart.js is a simple yet flexible JavaScript charting library for designers and developers. It provides a variety of chart types, including bar, line, and pie charts, which can be easily customized. In this project, I used Chart.js to visualize financial data, helping users to better understand their spending and income patterns.

> They are all used under the MIT license.

## Copyrighted Material
> All images and icons used in this project are either created by me or sourced from free-to-use repositories with appropriate licenses.

## How to Use
1. **Adding Transactions**: Click the "Add Transaction" button to add a new transaction. Fill in the required fields and press Enter to save.
2. **Editing Transactions**: Click on any cell to edit its value. Press Enter to save changes.
3. **Deleting Transactions**: Right-click on a row and select "Delete Row" from the context menu.
4. **Grouping Transactions**: Type a field name in the "Type to group by..." input box and select from the suggestions to group transactions.
5. **Filtering Transactions**: Click the filter icon next to a column header to open the filter modal. Apply the desired filter and click "Apply".
6. **Searching Transactions**: Type in the search input box to filter transactions based on the search term.

## Future Development Plans
- [x] Better warning when inputting invalid date
- [x] More chart functions
- [x] Import/export to CSV
- [x] More advanced filter function (and/or conditions)


