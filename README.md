# Expense Tracker

A simple web app for tracking expenses: add an expense (title, amount, category, date), edit or delete it, and see a summary plus charts of your spending by category and by month. The frontend is plain HTML/CSS/JS, and the backend is an Express.js API connected to a PostgreSQL database.

## Recent updates

Mobile UI improvements to the Expenses section (`frontend/index.html`, `frontend/css/style.css`, `frontend/js/app.js`):

- **Collapsible filters on mobile** — the Search / Month / Category filters are now hidden by default on small screens and open with a dedicated filter (funnel) button, instead of always taking up screen space.
- **Icon-only action buttons on mobile** — "Export CSV" and the new filter toggle are now compact, same-sized square icon buttons on mobile (professional inline SVG icons: download tray + funnel), with the "Export CSV" label still shown in full on desktop.
- **Fixed a Bootstrap conflict** — removed the `d-flex` utility class from the filters container, since its `!important` was overriding the `display: none` used to hide the filters panel on mobile.
- **Consistent, aligned filter fields** — on mobile, each filter's label now sits above its input/select (instead of beside it), and every field is a uniform 100% width, so the Search, Month, and Category boxes all line up with the same left/right edges.
- **Branded hover/active states** — the Export CSV and filter toggle buttons now use the app's purple brand color (`--brand-primary`) on hover and on click/active, and the filter button stays highlighted purple while the filters panel is open, so its state is clear at a glance.

## Project structure

```text
Expense-Tracker-main/
├── README.md
├── .gitignore
├── backend/
│   ├── server.js          # Express API (routes for /api/expenses)
│   ├── schema.sql         # PostgreSQL table definition + sample data
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html         # App markup (form, expenses table, filters, modals)
│   ├── css/
│   │   └── style.css      # Styling, theming (light/dark), responsive rules
│   └── js/
│       └── app.js         # API calls, rendering, filters/sort, charts, CSV export
└── screenshots/
    ├── home-desktop-light.png
    ├── home-desktop-dark.png
    └── mobile-view-dark.png
```

## Project architecture

```mermaid
flowchart LR
    subgraph Browser["Browser"]
        FE["Frontend
        index.html + app.js
        (Bootstrap + Chart.js)"]
    end

    subgraph Server["Node.js"]
        BE["Backend
        Express API
        server.js — Port 3000"]
    end

    subgraph DB["PostgreSQL"]
        T[("expenses table")]
    end

    FE -- "fetch()
    GET/POST/PUT/DELETE
    /api/expenses" --> BE
    BE -- "pg (node-postgres)" --> T
    T -- "JSON data" --> BE
    BE -- "JSON response" --> FE
```

## Database schema (ERD)

```mermaid
erDiagram
    expenses {
        SERIAL id PK
        VARCHAR_100 title "NOT NULL, cannot be empty"
        NUMERIC_10_2 amount "NOT NULL, must be greater than 0"
        VARCHAR_20 category "Food / Transport / Bills / Entertainment / Other"
        DATE date "NOT NULL"
    }
```

## Request flow: adding an expense

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (app.js)
    participant A as Backend (Express API)
    participant D as PostgreSQL

    U->>F: Fills the form and clicks "Add expense"
    F->>F: validateForm() — local field validation
    F->>A: POST /api/expenses (title, amount, category, date)
    A->>A: Validates fields on the server
    A->>D: INSERT INTO expenses ... RETURNING *
    D-->>A: New row
    A-->>F: 201 Created + expense JSON
    F->>F: Updates table, summary cards, and charts
    F-->>U: Shows the new expense + success message
```

## Prerequisites

- Node.js (any recent version, with npm)
- PostgreSQL installed and running on your machine
- VS Code (or any editor you prefer)

## How to run the project from scratch

### 1. Create the database

Open a terminal and log into PostgreSQL:

```bash
psql -U postgres
```

Then create a new database (rename it if you want):

```sql
CREATE DATABASE expense_tracker;
\q
```

### 2. Run schema.sql

From the project's root folder:

```bash
psql -U postgres -d expense_tracker -f backend/schema.sql
```

This creates the `expenses` table and inserts some sample data. **Note:** running this file again drops the existing table and recreates it with the same sample data.

### 3. Write the .env file

Inside the `backend/` folder, create a file named `.env` with your database connection details:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=expense_tracker
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

> Adjust `DB_PASSWORD` and the other values to match your local PostgreSQL setup.

### 4. Install the packages

From inside the `backend/` folder:

```bash
cd backend
npm install
```

### 5. Start the server (Backend)

Still inside `backend/`:

```bash
npm start
```

If it starts correctly you'll see in the terminal:

```
Server is running on http://localhost:3000
```

### 6. Open the frontend

Open `frontend/index.html` directly in your browser (double-click it), or use the Live Server extension in VS Code. Since `cors` is enabled on the backend, the frontend can talk to `http://localhost:3000` without any issues.

## Features

- [x] Add an expense (with validation on both frontend and backend)
- [x] Delete an expense (with a confirmation dialog)
- [x] Edit an expense (edit modal)
- [x] Filter by category, month, and search by title
- [x] Sort the table by any column (Title, Amount, Category, Date)
- [x] Summary cards (total, count, highest expense)
- [x] Charts: spending by category, and spending over time
- [x] Export expenses as a CSV file
- [x] Dark mode
- [x] Data is saved in a PostgreSQL database

## Screenshots

**Home page — light mode (desktop)**

![Home page, light mode, desktop](./screenshots/home-desktop-light.png)

**Home page — dark mode (desktop)**

![Home page, dark mode, desktop](./screenshots/home-desktop-dark.png)

**Mobile view — dark mode**

![Mobile view, dark mode](./screenshots/mobile-view-dark.png)
