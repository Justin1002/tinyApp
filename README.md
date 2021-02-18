# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).


## Final Product

!["Screenshot of URLs page"](https://raw.githubusercontent.com/Justin1002/tinyapp/master/docs/tinyApp_url_index.png)
!["screenshot of specific URL page"](https://raw.githubusercontent.com/Justin1002/tinyapp/master/docs/tinyApp_url.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` or `npm start` command.

## Extras

Added Extras include:

1. Method Override to modify routes, adding PUT/DELETE functionality

2. Number of visits("hits") a shortened URL link has received.

3. Number of unique visitors to a shortened URL link.

4. Customized error handling.

5. Timestamp of all visits by unique visitor ID.

6. URL input can omit http:// or https:// for added user functionality.

