import fetch from 'node-fetch';
import cheerio from 'cheerio';


async function spider(start_url) {


    spider_data_catalog(start_url, []);


}


async function spider_data_catalog(url, url_history) {
    try {
        let res = await fetch(url);
        if (!res.ok) {
            throw res.status + " - " + res.statusText;
        }
        let json = await res.json();
        let new_url_history = [...url_history];
        new_url_history.push(url);

        if ('hasPart' in json && Array.isArray(json['hasPart'])) {
            for (var idx in json['hasPart']) {
                // TODO If I take these await's out I start seeing random errors loading actual data sets.
                // 403 on legendonlineservices.co.uk. Rate Limited?
                await spider_data_catalog(json['hasPart'][idx], new_url_history);
            }
        }

        if ('dataset' in json && Array.isArray(json['dataset'])) {
            for (var idx in json['dataset']) {
                // TODO If I take these await's out I start seeing random errors loading actual data sets.
                // 403 on legendonlineservices.co.uk. Rate Limited?
                await spider_data_set(json['dataset'][idx], new_url_history);
            }
        }
    } catch(error) {
        console.error("ERROR spider_data_catalog");
        console.error(url_history);
        console.error(url);
        console.error(error);
    }

}

async function spider_data_set(url, url_history) {
    try {

        let res = await fetch(url);
        if (!res.ok) {
            throw res.status + " - " + res.statusText;
        }
        let text = await res.text();
        let $ = await cheerio.load(text);
        let json_ld = $('script[type="application/ld+json"]').html();
        let json = JSON.parse(json_ld);

        let out = {
            'url': json['url'],
            'name': json['name'],
            'data-urls': {}
        }

         if ('distribution' in json && Array.isArray(json['distribution'])) {
            for (var idx in json['distribution']) {
                out['data-urls'][json['distribution'][idx]['name']] = json['distribution'][idx]['contentUrl'];
            }
        }

        console.log(out);
    } catch(error) {
        console.error("ERROR spider_data_set");
        console.error(url_history);
        console.error(url);
        console.error(error);
    }
}

export {
  spider,
  spider_data_catalog,
  spider_data_set,
};

export default spider;