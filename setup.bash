#!/bin/bash
# -------------------------------------------------------------------------
# Here is what we did to set this all up...
rm package*
rm -fr node_modules

npm init
# npm init creates a package.json
# http://browsenpm.org/package.json
# https://docs.npmjs.com/files/package.json

npm install --save express
npm install --save cookie-parser
npm install --save url
npm install --save http
npm install --save body-parser
npm install --save sqlite3
npm install --save jsonwebtoken
npm install --save crypto
npm install --save react
npm install --save react-dom
npm install --save babel
npm install --save ws

# check out the package.json now
# check out node_modules

nodejs ftd.js
# http://142.1.200.148:PORT_NUMBER