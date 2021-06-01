///<reference path="../../skye-widgets/typings/jquery/jquery.d.ts"/>
require('../../skye-widgets/css/styles-landing.css');

import * as jq from 'jquery';
import { Config } from "./config";

export class PageInjector {
    public static inject(url: string) {
        const htmlLink = Config.baseContentUrl + url;
        const element = jq(document.currentScript);
        const scriptElement = getCurrentScript();
        const srcString = scriptElement.getAttribute('src');
        const merchantId = (getParameterByName('id', srcString));
        console.log(merchantId);
        const term = (getParameterByName('term', srcString));
        console.log(term)
        const productPrice = (getParameterByName('productPrice', srcString));

        const modalDiv =
            `<div class="iframe-container">
                    <iframe src='${htmlLink}?id=${merchantId}&terms=${term}&productPrice=${productPrice}' frameborder="0" scrolling="no"></iframe>
                </div>`;

        element.append(modalDiv);
    }
}

function getCurrentScript(): any {

    let currentScript = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    return currentScript;
}

function getParameterByName(name: string, url: string): string {
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);

    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

