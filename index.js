import axios from 'axios';
import { launch } from "puppeteer";

/* Референс кода взял у -> 
Не сталкивался с парсингом ранее, пока копал информацию нашел реализацию от Юли.
Прочитал и протестировал в postman
Добавил правку для запуска, class slider изменился
И убрал бесячий браузер)))

https://github.com/AstreyaJulia/newmax-test  - спасибо
*/


/* Настройки */ 
let article = 146972802;
const storeName = 'Казань WB'

const baseLink = 'https://www.wildberries.ru/catalog/'; // путь для получения сведений по артикулу (подставить номер артикула в конце)
const storesList = 'https://static-basket-01.wbbasket.ru/vol0/data/stores-data.json'; // список складов с id, искать по названию склада
const dataReqLink = 'https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&spp=27&nm='; // путь для получения полных сведений по номеру артикула, в т.ч. и остатков, размеров, вариантов (подставить номер артикула в конце)

async function getArticles() {
    
    const browser = await launch({
        headless: true,
    });
    let page = await browser.newPage();
    await page.goto(baseLink + article + '/detail.aspx', {
        waitUntil: 'networkidle0', timeout: 0
    })

    // /** Список артикулов */
    const colors = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".slider-color > .custom-slider--colors > .custom-slider__list > .j-color > .img-plug")).map((item) => item.getAttribute('href').replace(/https:\/\/www.wildberries.ru\/catalog\//, '').replace(/\/detail.aspx/, ''))
    });

    /** ID нужного склада */
    const storeId = await axios.get(storesList).then((res) => res.data.find((store) => store.name === storeName).id)

    async function getArticleData(color){
        return await axios.get(dataReqLink + color);
    }

    const results = await Promise.all(
        colors.map(getArticleData)
    );

    const result = []

    results.map((res) => {
        const response = res.data.data.products[0];
        const sizes = response.sizes

        if (sizes && sizes.length > 0) {
            const stock = {}

            sizes.map((size) => {
                const qty = size.stocks.find((store) => store.wh === storeId)
                if (qty) stock[size.origName] = qty.qty
            })

            if (stock) {
                result.push({'art': response.id, 'stock': stock})
            }
        }
    })
return console.log(result)
}

getArticles()
