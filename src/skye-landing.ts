import * as jq from 'jquery';
import { ModalInjector } from './modal-injector';
import { Config } from './config';

let widget;

(($: JQueryStatic) => {

    /**
     * The src attribute from the script we are executing e.g
     * <script src="http://tools.skyecard.com.au/scripts/skye-widget.js?foo"
     */
    let srcString: string;
    let scriptElement: any;
    
    widget = new ModalInjector($);

    /* Choose if we want to render the Skye Logo or not */
    let noLogo: boolean;

    /* Choose if we want to monitor price change every half second */
    let monitor: boolean;

    /* Choose if we want to display weekly payments instead of monthly */
    let channel: string;

    /* Option to display payment calculation fixed term instead of relying on what is setup for the merchant*/
    let terms: string;
    
    /* Merchant id to check against term conifgured based on amount*/
    let merchantId: string;

    /* Payment terms for disclaimer message*/
    let pmt: string;

    /* You can pass debug=true to the query string to enable console error messages */
    let debug: boolean;

    let element: any;    
    let intRate: string;
    
    /**
     * Minimum amount for the calculator
     */
    let minAmount: number;

    let prevProductPrice: number;

    jq.fn.exists = function () {
        return this.length !== 0;
    };
    

    // get current script
    scriptElement = getCurrentScript();
    if (!scriptElement && !scriptElement.getAttribute('src')) {
        // bail if we don't have anything
        return false;
    }

    srcString = scriptElement.getAttribute('src');
    merchantId = (getParameterByName('id', srcString));
    noLogo    = (getParameterByName('noLogo', srcString) !== null);
    monitor   = (getParameterByName('monitor', srcString) !== null);
    debug     = scriptElement.getAttribute('debug')? true:false;
    terms      = (getParameterByName('terms', srcString));
    channel   = (getParameterByName('channel', srcString));
    pmt       = (getParameterByName('pmt', srcString));

    element = (getParameterByName('element', srcString))? jq(getParameterByName('element', srcString)) : jq(scriptElement);

    let priceStr = getParameterByName('minAmount', srcString);
    //let priceStr = "10000";
    priceStr = priceStr.replace(/^\D+/, '');
    minAmount = parseFloat(priceStr.replace(',', ''));  

    let intViewportHeight = window.innerHeight;
    console.log('intViewportHeight',intViewportHeight);
    const template = '<div id="in-page" class="iframe-container"><iframe src=\"'+Config.landingInfourl+'?id='+merchantId+'&minAmount='+minAmount+'&terms='+terms+'&channel='+channel+'&pmt='+pmt+'\" frameborder="0" scrolling="no" /></div></div>'

     widget.injectBanner(template, Config.landingInfourl, minAmount, merchantId, terms, intRate, prevProductPrice = 0, element);
    


    function logDebug(msg: string) {
        if (debug === true) {
            console.log(msg);
        }
    }
     
})(jq); 


function extractPrice(el: any) {
    let textValue =  el.text().trim();
    textValue = textValue.replace(/^\D+/, "");
    textValue = textValue.replace(/,/, "");
    return parseFloat(textValue);
}

function getCurrentScript(): any {

    let currentScript = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    return currentScript;
}

function getCurrentScriptById(): any {

    let currentScript = document.currentScript || (function() {
        const script = document.getElementById('skye-widget');
        return script;
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
