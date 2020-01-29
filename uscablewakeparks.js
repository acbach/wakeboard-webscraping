const puppeteer = require("puppeteer");
const fs = require("fs");
const chalk = require("chalk");

// MY OCD of colorful console.logs for debugging... IT HELPS
var error = chalk.bold.red;
var success = chalk.keyword("green");

(async () => {
  var browser;

  try {
    //var files = fs.readdirSync("data/wakescout/28012020/");
    //console.log(files);

    // open the headless browser
    browser = await puppeteer.launch(
      { headless: true },
      { waitUntil: "networkidle2" }
    );
    var hasMoreLinks = true;
    const page = await browser.newPage();
    var root = "http://uscablewakeparks.com/";
    var endUrl = "http://uscablewakeparks.com/keys_cable.html";
    var startUrl = "http://uscablewakeparks.com/bsr_cable_park.html";
    var id = 0;
    while (hasMoreLinks) {
      await page.goto(startUrl, {
        timeout: 0
      });

      const wakepark = await page.evaluate(() => {
        var obj = {};
        if (document.querySelector("#txt_3") == null) return null;

        var phone = document.querySelector("#txt_383 a");

        var addressContainer = document.querySelectorAll(".Normal-C");
        var address = "";
        if (
          addressContainer.length > 4 &&
          addressContainer[5] !== null &&
          addressContainer[5].innerText.includes("Address:")
        ) {
          address = addressContainer[5].innerText.trim();
          address = address.replace("Address:", "").trim();
        }

        if (addressContainer.length > 4 && addressContainer[5] !== null) {
          address += addressContainer[6].innerText.trim();
        }

        var contactNameNode = document.querySelector("#txt_9");
        var contactName;
        if (
          contactNameNode != undefined &&
          contactNameNode.innerText != undefined
        )
          contactName = contactNameNode.innerText.trim();

        var tempFbLinks = document.querySelectorAll("a");
        var fbLinks = [];
        for (var i = 0; i < tempFbLinks.length; i++) {
          var href = tempFbLinks[i].getAttribute("href");
          if (href.includes("facebook")) fbLinks.push(href);
        }

        obj.name = document.querySelector("#txt_3").innerText.trim();
        if (phone != null) {
          obj.phone = phone.getAttribute("href").replace("tel:", "");
        }

        var countrySplit = obj.name.split(" ");
        obj.country = countrySplit[countrySplit.length - 1];

        var splitBy = obj.name.includes("-") ? "-" : "~F";
        var addressSplit = obj.name.split(splitBy);
        obj.address = addressSplit[1];

        obj.contactName = contactName;
        if (fbLinks.length > 1) obj.contactFb = fbLinks[0];

        ["#btn_285", "#btn_11"].forEach(tag => {
          var website = document.querySelector(tag);
          if (website != null) obj.website = website.getAttribute("href");
        });

        ["#btn_12", "#btn_284"].forEach(tag => {
          var facebook = document.querySelector(tag);
          if (facebook != null) obj.facebook = facebook.getAttribute("href");
        });

        var description = document.querySelector(".Normal-P");
        if (description != null) {
          obj.description = description.innerText.trim();
        }
        var description2 = document.querySelector(".Normal-C");
        if (description2 != null)
          obj.description2 = description2.innerText.trim();

        return obj;
      });
      if (wakepark != null) {
        wakepark.id = id;
        wakepark.crawledFrom = startUrl;
        fs.writeFile(
          `data/uscablewakeparks/29012020/${id}.json`,
          JSON.stringify(wakepark),
          function(err) {
            if (err) throw err;
            console.log("Saved!");
          }
        );
      }
      console.log(wakepark);

      var pageLink = await page.evaluate(() => {
        //Backward
        ["#btn_2", "#btn_4"].forEach(tag2 => {
          var btn = document.querySelector(tag2);
          if (btn != null) return btn.getAttribute("href");
        });

        return null;
        //Forward
        //document.querySelector("#btn_4").getAttribute("href");
      });

      if (pageLink == null) {
        hasMoreLinks = false;
        console.log(error("no more links"));
      } else {
        startUrl = root + pageLink;
        console.log(success("more links"));
        id++;
      }
      console.log("current url", startUrl);
    }
  } catch (err) {
    // Catch and display errors
    console.log(error(err));
    // await browser.close();
    await browser.close();
  }
})();
