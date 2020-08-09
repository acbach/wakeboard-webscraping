const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  var browser;
  try {
    // open the headless browser
    browser = await puppeteer.launch(
      { headless: false },
      { waitUntil: "networkidle2" }
    );

    var startId = 3133;
    var batchSize = 10;

    while (startId < 4000) {
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const promise = new Promise(async function (resolve, reject) {
          try {
            const page = await browser.newPage();

            const id = startId++; // Copenhagen
            console.log(id);
            //var id = 199;
            //http://www.wakescout.com/listing/1
            var link = `http://www.wakescout.com/listing/${id}`;
            await page.goto(link, {
              timeout: 0,
            });
            // await page.waitForSelector(".location-header--types");

            const wakepark = await page.evaluate(() => {
              if (document.querySelector(`#location_about`) == null) return;
              var types = document
                .querySelector(
                  `#wrapper > section.mb-4.mb-md-6.mb-lg-10.px-3.px-md-4.px-lg-5.pt-3.pt-md-0 > div > div > article > ul`
                )
                .innerText.trim();
              if (!types.includes("Cable Wake Parks")) return;

              var name = document
                .querySelector(
                  `#wrapper > section.mb-4.mb-md-6.mb-lg-10.px-3.px-md-4.px-lg-5.pt-3.pt-md-0 > div > div > article > h1`
                )
                .innerText.trim();

              var obj = {};
              obj.name = name;
              obj.types = types;

              var phone = document.querySelector(
                `#location_address > dl > dd:nth-child(4) > a`
              );

              if (phone != undefined) obj.phone = phone.innerText.trim();

              var address = document.querySelector(
                `#location_address > p > span:nth-child(2)`
              );

              if (address != undefined) {
                obj.address = address.innerText.trim().replace(/\n/gi, " ");
                obj.country = address.split(" ")[addressSplit.length - 1];
              }

              var website = document.querySelector(
                `body > section > div > section > div > div.col-xs-12.col-sm-8 > div > div.row.text-page > div:nth-child(1) > ul > li:nth-child(1) > a`
              );
              if (website != undefined) obj.website = website.innerText.trim();

              var email = document.querySelector(
                `#location_address > dl > dd:nth-child(2) > a`
              );
              if (email != undefined) obj.email = email.innerText.trim();

              // if (contactInfoList[2].innerText.includes("Facebook")) {
              //   obj.facebook = contactInfoList[2].innerText
              //     .trim()
              //     .split(" ")[1];
              // } else {
              //   var alternateemail = contactInfoList[2].innerText
              //     .trim()
              //     .split(" ");
              //   if (alternateemail.length < 3)
              //     obj.alternateemail = alternateemail[2];
              //   obj.facebook = contactInfoList[3].innerText
              //     .trim()
              //     .split(" ")[1];
              // }
              return obj;
            });

            if (wakepark == undefined) console.log(`Not cable park id:${id}`);
            else {
              wakepark.crawledFrom = link;
              console.log(wakepark);
              fs.writeFile(
                `data/wakescout/28012020/${id}.json`,
                JSON.stringify(wakepark),
                function (err) {
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
