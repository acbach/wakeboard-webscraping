const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  var browser;
  try {
    // open the headless browser
    browser = await puppeteer.launch(
      { headless: true },
      { waitUntil: "networkidle2" }
    );

    var startId = 2830;
    var batchSize = 10;

    while (startId < 4000) {
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const promise = new Promise(async function(resolve, reject) {
          try {
            const page = await browser.newPage();

            const id = startId++; // Copenhagen
            console.log(id);
            //var id = 199;
            //http://www.wakescout.com/listing/1
            var link = `http://www.wakescout.com/listing/${id}`;
            await page.goto(link, {
              timeout: 0
            });
            // await page.waitForSelector(".location-header--types");

            const wakepark = await page.evaluate(() => {
              if (document.querySelector(`.location-header--types`) == null)
                return;
              var types = document
                .querySelector(`.location-header--types`)
                .innerText.trim();
              if (!types.includes("Cable Wake Park")) return;

              var name = document
                .querySelector(`.col-md-12.col-lg-8 h1`)
                .innerText.trim();

              var contactInfoList = document.querySelectorAll(
                `.col-sm-12.col-md-6 ul li`
              );

              var address = document
                .querySelectorAll(`.col-sm-12.col-md-6 table`)[0]
                .innerText.trim()
                .replace(/\n/gi, " ");

              var phone = document
                .querySelectorAll(`.col-sm-12.col-md-6 p a`)[0]
                .innerText.trim();

              var obj = {};
              obj.name = name;
              obj.types = types;
              obj.phone = phone;
              obj.address = address;
              var addressSplit = address.split(" ");
              obj.country = addressSplit[addressSplit.length - 1];
              obj.website = contactInfoList[0].innerText.trim().split(" ")[1];
              obj.email = contactInfoList[1].innerText.trim().split(" ")[1];
              if (contactInfoList[2].innerText.includes("Facebook")) {
                obj.facebook = contactInfoList[2].innerText
                  .trim()
                  .split(" ")[1];
              } else {
                var alternateemail = contactInfoList[2].innerText
                  .trim()
                  .split(" ");
                if (alternateemail.length < 3)
                  obj.alternateemail = alternateemail[2];
                obj.facebook = contactInfoList[3].innerText
                  .trim()
                  .split(" ")[1];
              }
              return obj;
            });

            if (wakepark == undefined) console.log(`Not cable park id:${id}`);
            else {
              wakepark.crawledFrom = link;
              console.log(wakepark);
              fs.writeFile(
                `data/wakescout/28012020/${id}.json`,
                JSON.stringify(wakepark),
                function(err) {
                  if (err) throw err;
                  console.log("Saved!");
                }
              );
            }
            await page.close();
            resolve("Stuff worked!");
          } catch (e) {
            console.log(e);
            resolve("Stuff did not work!" + e);
          }
        });
        promises.push(promise);
      }
      const results = await Promise.all(promises);
    }
    console.log("Browser Closed");

    await browser.close();
  } catch (err) {
    // Catch and display errors
    console.log(err);
    // await browser.close();
    await browser.close();
  }
})();
