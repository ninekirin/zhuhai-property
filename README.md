# zhuhai-property

Zhuhai Property Pulse: Uncovering Historical Transaction Prices through Data Analysis and Visualization

## Directly access our deployed site

I have deployed it on my own cloud server.

[Here](https://zhproperty.bakaawt.com/) (https://zhproperty.bakaawt.com/)

## Naming Specification

- `Zhuhai Property`: The name of the project
- `zhuhai-property`: The name of the repository, the yarn workspace, and the root folder
- `zhproperty`: The name of the SQL database and the user

## Directory Structure

- `design`: The project's design prototypes, including software design specifications, project reports, database design prototypes, ER diagrams, etc.
- `src`: Project source code repository, covering all frontend, backend, and database-related code files.
  - `frontend`: Frontend source code repository
    - `build`: Contains precompiled static web page files
    - `config`: Used to set some style specifications for the page
    - `node_modules`: All package files
    - `public`: Static web page generation template
    - `scripts`: Used for debugging
    - `src`: React code repository, containing all page source files
      - `assets`: Some non-JSX files
      - `common`: Layout files, etc.
      - `hooks`: React Router related
      - `models`: JSX page preprocessors
      - `pages`: **Core**, all frontend pages
      - `router`: Used for indexing and navigation between pages
  - `backend`: Backend source code repository
    - `api`: Backend core code
  - `database`: Database-related code
- `LICENSE`: Open-source license file
- `README.md`: Project README file in Markdown format (English)
- `README_zh.md`: Project README file in Markdown format (Chinese)

## Frontend File Usage Guide

Made with React, package manager configuration is required to build and run.

### Directly run the compiled static files (using XAMPP as an example) Using our deployed back-end site

The compiled static files was placed on the folder `./src/frontend/build`, and you just need to put the content of the `build` folder in the root directory into the XAMPP website directory, and access it via a browser.

### Running in development environment

#### Change backend API address

In `src/frontend/src/assets/js/config.js`, there is such a line:

```javascript
const siteName = 'Zhuhai Property';
const siteUrl = 'https://zhproperty.bakaawt.com';
const siteDescription = 'Zhuhai Property';
const apiBaseUrl = 'https://zhproperty-api.bakaawt.com';
// const apiBaseUrl = 'http://localhost:8000';

export { siteName, siteUrl, siteDescription, apiBaseUrl };
```

Comment out the line 4, and uncomment the line 5, like this:

```javascript
const siteName = 'Zhuhai Property';
const siteUrl = 'https://zhproperty.bakaawt.com';
const siteDescription = 'Zhuhai Property';
// const apiBaseUrl = 'https://zhproperty-api.bakaawt.com';
const apiBaseUrl = 'http://localhost:8000';

export { siteName, siteUrl, siteDescription, apiBaseUrl };
```

This successfully changes the address of the API server used by the frontend.

#### Install dependencies and run directly

You should install NodeJS and yarn(optional) to run it via development environment.

How to install NodeJS: https://nodejs.dev/en/learn/how-to-install-nodejs/

```shell
cd frontend
yarn install
yarn start
```

or

```shell
cd frontend
npm install
npm start
```

Visit [here](http://localhost:3000/) then. (http://localhost:3000/)

#### Compile static files

```shell
cd frontend
yarn install
yarn build
```

### Layouts

Sidebar layout: The main navigation is placed in a fixed position on the left side of the page, and the secondary menu is placed at the top of the workspace. Suitable for systems with multi-level navigation menus and multiple layers of nested menus.

Top-bottom layout: The main navigation is placed at the top of the page. Due to the limited horizontal space of the navigation bar, this layout is suitable for systems with fewer top-level navigation items.

Top-side layout: Having both the top navigation and sidebar, this layout is suitable for application-type websites, but it sacrifices some content space.

## Backend File Usage Guide

Written in Python, but some packages need to be installed in advance.

#### Install the dependency packages and run

```shell
cd src/backend
pip3 install -r requirements.txt
python3 run.py
```
