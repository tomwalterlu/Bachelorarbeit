const puppeteer = require('puppeteer');
var rl = require('readline')
var prompts = rl.createInterface(process.stdin, process.stdout);
const fs = require('fs').promises;

var validResults = 1285;

(async () => {

    const browser = await puppeteer.launch({
        executablePath: './chromium/chrome.exe',
        headless:false,
        product:'chrome',
        userDataDir: './cache'
    });
    const page = (await browser.pages())[0];
    await page.setViewport({width:1920, height:1080});
    await page.goto("https://www.immotop.lu/de/search/");   
    scrapeProduct();

async function getAmountSites(page){
    var amountPages = 1
    try {
        for(index = 10; index >= 1; index--){
            const pagesAddress = '//*[@id="paginator"]/nav/ul/li['+ index +']/a'
            const [pageEl] = await page.$x(pagesAddress);
            if(typeof pageEl !== 'undefined'){
                const amountpagesProperty = await pageEl.getProperty('textContent');
                amountPages = await amountpagesProperty.jsonValue();
                amountPages = amountPages.replace(/\D/g,'');
                return amountPages;
            }
        }
    }
    catch(Exception){
    }
    finally{
        return amountPages;
    }
}
async function scrapeProduct() {
    var resultNumber = 1;
    var page = (await browser.pages())[0];
    var o = {};
    for(var year = 2001; year <= 2020; year++) {
        await page.$eval('#search_form > div.filt-but-block > button.button-l3.filter-pan', el => el.click());
        await page.$eval("#year_build", (el, yearFromNode) => (el.value = "" + yearFromNode), year );
        await page.$eval('#search_form > div.filt-but-block > button.button-l3.filter-pan', el => el.click());
        await page.click("#search_form > div.filt-but-block > button:nth-child(3)")
        await page.waitForNavigation();
        const amountPages = await getAmountSites(page);
        console.log("Year is " + year)
        for(i = 1; i<= amountPages; i++){
            const nextUrl = "https://www.immotop.lu/de/search" + "/index" + i + ".html";
            await page.goto(nextUrl);

            for(listing = 5; listing <= 21; listing++){

                const titleAddress = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div[2]/p/a" //CONTAINS TITLE AND LINK 
                const priceTagAddress = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div[2]/div[1]/div[1]/nobr/text()" //CONTAINS PRICE
                const spaceAddress = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div[2]/div[1]/div[2]/nobr"
                const chambersAddress = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div[2]/div[1]/div[3]/nobr"
                const bathroomsAddress = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div[2]/div[1]/div[4]/nobr"
                const garageAddress = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div[2]/div[1]/div[5]/nobr"
                const gardenAddress = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div[2]/div[1]/div[6]/i"

                // SOME TOP ARTICLES

                const titleAddressB = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div/div/div[2]/p/a"
                const priceTagAddressB = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div/div/div[2]/div[1]/div[1]/nobr"
                const spaceAddressB = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div/div/div[2]/div[1]/div[2]/nobr"
                const chambersAddressB = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div/div/div[2]/div[1]/div[3]/nobr"
                const bathroomsAddressB = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div/div/div[2]/div[1]/div[4]/nobr"
                const garageAddressB = "/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div/div/div[2]/div[1]/div[5]/nobr"
                const gardenAddressB ="/html/body/div[1]/div[3]/div[1]/div[1]/div[1]/div[" + listing + "]/div/div/div/div[2]/div[1]/div[6]/i"

                const [el1] = await page.$x(titleAddress);
                const [el2] = await page.$x(priceTagAddress);
                const [el3] = await page.$x(spaceAddress);
                const [el4] = await page.$x(chambersAddress);
                const [el5] = await page.$x(bathroomsAddress);
                const [el6] = await page.$x(garageAddress);
                const [el7] = await page.$x(gardenAddress);

                var hasGarden = false
                if(typeof el7 !== 'undefined'){
                    hasGarden = true
                }

                if(typeof el1 !== 'undefined' && typeof el2 !== 'undefined' && typeof el3 !== 'undefined' && typeof el4 !== 'undefined' && typeof el5 !== 'undefined' && typeof el6 !== 'undefined'){

                    const linkProperty = await el1.getProperty('href');
                    const titleProperty = await el1.getProperty('textContent');
                    const priceProperty = await el2.getProperty('textContent');
                    const spaceProperty = await el3.getProperty('textContent');
                    const chambersProperty = await el4.getProperty('textContent')
                    const bathroomsProperty = await el5.getProperty('textContent')
                    const garageProperty = await el6.getProperty('textContent')

                    const link = await linkProperty.jsonValue();
                    const title = await titleProperty.jsonValue();
                    const price = await priceProperty.jsonValue();
                    var space = await spaceProperty.jsonValue();
                    space = space.replace(/\D/g,'');

                    var chambers = await chambersProperty.jsonValue();
                    chambers = chambers.replace(/\D/g,'');
                    const bathrooms = await bathroomsProperty.jsonValue();
                    const garage = await garageProperty.jsonValue();

                    //Typ der Immobilie, Stadtname und Land aus Titel lesen
                    [typ, stadt, land] = await getTypeCityCountry(""+title)

                    //create json Object
                    var key = '' + validResults;
                    o[key] = []; // empty Array, which you can push() values into
                    var data = {
                        typ : typ,
                        baujahr: year,
                        stadt: stadt,
                        land: land,
                        kaufpreis: price,
                        fläche_m2: space,
                        schlafzimmer: chambers,
                        badezimmer: bathrooms,
                        parkplätze: garage,
                        garten: hasGarden
                    }
                    o[key].push(data);
                    validResults++;
                }
                else {
                    // TOP ANNONCES
                    const [el1b] = await page.$x(titleAddressB);
                    const [el2b] = await page.$x(priceTagAddressB);
                    const [el3b] = await page.$x(spaceAddressB);
                    const [el4b] = await page.$x(chambersAddressB);
                    const [el5b] = await page.$x(bathroomsAddressB);
                    const [el6b] = await page.$x(garageAddressB);
                    const [el7b] = await page.$x(gardenAddressB);

                    if(typeof el1b !== 'undefined' && typeof el2b !== 'undefined' && typeof el3b !== 'undefined' && typeof el4b !== 'undefined' && typeof el5b !== 'undefined' && typeof el6b !== 'undefined'){
                        var hasGardenB = false
                        if(typeof el7b !== 'undefined'){
                            hasGardenB = true
                        }

                        const linkProperty = await el1b.getProperty('href');
                        const titleProperty = await el1b.getProperty('textContent');
                        const priceProperty = await el2b.getProperty('textContent');
                        const spaceProperty = await el3b.getProperty('textContent');
                        const chambersProperty = await el4b.getProperty('textContent')
                        const bathroomsProperty = await el5b.getProperty('textContent')
                        const garageProperty = await el6b.getProperty('textContent')
        
                        const link = await linkProperty.jsonValue();
                        const title = await titleProperty.jsonValue();
                        const price = await priceProperty.jsonValue();
                        var space = await spaceProperty.jsonValue();
                        space = space.replace(/\D/g,'');
                        var chambers = await chambersProperty.jsonValue();
                        chambers = chambers.replace(/\D/g,'');
                        const bathrooms = await bathroomsProperty.jsonValue();
                        const garage = await garageProperty.jsonValue();
        
                        //Typ der Immobilie, Stadtname und Land aus Titel lesen
                        [typ, stadt, land] = await getTypeCityCountry(""+title)
        
                        //create json Object
                        var key = '' + validResults;
                        o[key] = []; // empty Array, which you can push() values into
                        var data = {
                            typ : typ,
                            baujahr: year,
                            stadt: stadt,
                            land: land,
                            kaufpreis: price,
                            fläche_m2: space,
                            schlafzimmer: chambers,
                            badezimmer: bathrooms,
                            parkplätze: garage,
                            garten: hasGardenB
                        }
                        o[key].push(data);
                        validResults++;
                    }

                }
        }
        
    }
        var str = JSON.stringify(o, null, 2) // spacing level = 2
    }
    
    try {
        
        await fs.writeFile('kaufen.json', str);
    } 
    catch(error) {
        console.log(error)
    }
    //await browser.close();
}


async function getTypeCityCountry(title){
    var land
    var typImmobilie = "undefined"
    var stadt = "undefined"
    if(title.includes("(BE)")){
        land = "Belgien"
    }
    else if(title.includes("(FR)")){
        land = "Frankreich"
    }
    else if(title.includes("(DE)")){
        land = "Deutschland"
    }
    else {
        land = "Luxemburg"
    }
    typImmobilie = title.substr(0, title.indexOf('zu verkaufen')-1)
    stadt = title.substr(title.indexOf(' in ') + 4, title.length)
    if(stadt.includes("(FR)") || stadt.includes("(DE)") || stadt.includes("BE")){
        stadt = stadt.substr(0,stadt.length - 5)
    }
    return [typImmobilie, stadt, land]
}


})();
