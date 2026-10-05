// Which site this is. scripts/build-site.sh overwrites this file with the value of ARCADE_ENV:
// "dev" for the test site (the azurestaticapps.net address, deployed from main) and
// "production" for nzdogames.com (deployed from the production branch).
window.ARCADE_ENV = window.ARCADE_ENV || "dev";
