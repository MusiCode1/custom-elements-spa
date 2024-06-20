import { getComponent, Router } from "./util.js";

main();

const url = location.href.substring(0, location.href.lastIndexOf('/'));

globalThis.thisUrl = url;

const router = new Router();

globalThis.router = router;

async function main() {

    const path = 'src/pages/';

    const pages = ['main', 'layout', 'about'];

    const p = pages.map(page =>
        getComponent(path + page + '.html', 'spa-' + page)
    );

    await Promise.all(p)

    const mainElement = document.createElement("spa-layout")

    document.body.appendChild(mainElement);

    router.subscribe(mainElement)

    router.component = "spa-main";

}