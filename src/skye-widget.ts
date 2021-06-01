import * as jq from 'jquery';
const { detect } = require('detect-browser');
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
    let mode: string;

    /* Option to display payment calculation fixed term instead of relying on what is setup for the merchant*/
    let term: string;
    
    /* Merchant id to check against term conifgured based on amount*/
    let merchantId: string;

    /* You can pass debug=true to the query string to enable console error messages */
    let debug: boolean;

    // You can pass in min="" and max="" in the script tag.
    let min: number;
    let max: number;
    let used_in: string;
    let element: any;    
    let skyePlansUrl: string;
    let intRate: string;

    // Append widget to element
    let target: any;
    let browser = detect();

    /**
     * The extracted product price from either parsing the content from HTML (via css selector)
     * or a specifically passed in value
     */
    let productPrice: number;

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
    min       = scriptElement.dataset.min || 0;
    max       = scriptElement.dataset.max || 999999;
    used_in   = (getParameterByName('used_in', srcString));
    term      = (getParameterByName('term', srcString));
    mode      = (getParameterByName('mode', srcString));
    target    = (getParameterByName('target', srcString));

    element = (getParameterByName('element', srcString))? jq(getParameterByName('element', srcString)) : jq(scriptElement);    

     
    let priceStr = getParameterByName('productPrice', srcString);

    if (debug) {
        skyePlansUrl = Config.skyePlansUrlDev;
     } else {
         skyePlansUrl = Config.skyePlansUrlProd;
     }

    if (priceStr) {
        priceStr = priceStr.replace(/^\D+/, '');
        productPrice = parseFloat(priceStr.replace(',', ''));
        if (term)
        {   
            if (parseInt(term) > 12) 
            {
                jq.when(manyRequests(merchantId, productPrice, term, skyePlansUrl)).then( function (skyePlans: SkyePlan) {    
                                
                    const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);
                    
                    if (Object.keys(skyePlans).length > 0)
                    {            
                        term? term : term = skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod;
                        intRate = skyePlans[Object.keys(skyePlans).length - 1].PrefIntRate;
                        widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate, prevProductPrice = 0, element);
                    } else {
                        if (term)
                        {
                          widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate = '0', prevProductPrice = 0, element);
                        } 
                    }
                })
            }else{
                let skyePlans = [];
                const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);
                widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate = '0', prevProductPrice = 0, element);
            }
        }else{  
            jq.when(manyRequests(merchantId, productPrice, term, skyePlansUrl)).then( function (skyePlans: SkyePlan) {    
                                
                const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);
                    
                if (Object.keys(skyePlans).length > 0)
                {            
                    term? term : term = skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod;
                    intRate = skyePlans[Object.keys(skyePlans).length - 1].PrefIntRate;
                    console.log('term:'+term)
                    widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate, prevProductPrice = 0, element);
                } else {
                    if (term)
                    {
                      widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate = '0', prevProductPrice = 0, element);
                    } 
                }
            })
        }
    } else {        
        
        // we haven't been passed a URL, try to get the css selector for
        let selector = getParameterByName('price-selector', srcString);

        if (!selector) {
            logDebug("Can't locate an element with selector :  " + selector);
            return false;
        }
        
        let el = jq(selector, document.body);
        
        if (el.exists()) {

            productPrice = extractPrice(el); 
            
            if (productPrice)
            {
                if (term)
                {
                    if (parseInt(term) > 12) 
                    {
                        jq.when(manyRequests(merchantId, productPrice, term, skyePlansUrl)).then( function (skyePlans: SkyePlan) {    
                                
                            const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);
                    
                            if (Object.keys(skyePlans).length > 0)
                            {            
                                term? term : term = skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod.toString();
                                intRate = skyePlans[Object.keys(skyePlans).length - 1].PrefIntRate;
                                widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate, prevProductPrice = 0, element);
                            } else {
                                if (term)
                                {
                                    widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate = '0', prevProductPrice = 0, element);
                                } 
                            }
                        })
                    }else{
                        let skyePlans = [];
                        const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);
                        widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate = '0', prevProductPrice = 0, element);
                    }
                }else{
                    jq.when(manyRequests(merchantId, productPrice, term, skyePlansUrl)).then( function (skyePlans: SkyePlan) {                        
                        const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);  
                        if (Object.keys(skyePlans).length > 0)
                        {            
                            term? term : term = skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod.toString();
                            intRate = skyePlans[Object.keys(skyePlans).length - 1].PrefIntRate;
                            widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate, prevProductPrice = 0, element);
                        } else {
                            if (term)
                            {
                                widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate = '0', prevProductPrice = 0, element);
                            } 
                        }

                    })
                }
            }
            // register event handler to update the price
            if (monitor){
                let target = jq(selector)[0]; 
                
                //Options for the observer (which mutations to observe)
                let config = { attributes: true, childList: true };

                let callback = function(mutationsList) {
                    for(var mutation of mutationsList) {
                        if (mutation.type == 'childList') {                          
                            let checkProductPrice = extractPrice(jq(selector));                              
                            updatePrice(el, jq, noLogo, min, max, used_in, merchantId, term, mode, skyePlansUrl, productPrice);
                        }
                    }
                }
                // Create an observer instance linked to the callback function
                let observer = new MutationObserver(callback);

                // Start observing the target node for configured mutations
                observer.observe(target, config);

                // Later, you can stop observing
                //observer.disconnect();

            } 
        }
    }

    function logDebug(msg: string) {
        if (debug === true) {
            console.log(msg);
        }
    }


    if (merchantId != 'E0843')
    {
        jq(document).on('click','.'+productPrice.toString().replace('.','-'), function(e) {      
        /*if (merchantId == 'E0843')
        {
            console.log('redirect');
            window.open('https://apply.flexicards.com.au/seller='+merchantId, '_blank', '', false);
        }else{*/  
            $(this).magnificPopup({
                type:'iframe',
                mainClass: 'skye-price',
                midClick: true,
                preloader: false,
                fixedContentPos: true          
            }).magnificPopup('open');
            e.preventDefault();
        /*}*/
        //e.preventDefault();
        })
    
    jq(document).on('click','a', function(e) {                
        if (monitor){                        
            let selector = getParameterByName('price-selector', srcString);
            let checkProductPrice = extractPrice(jq(selector));
            let clickClass = checkProductPrice.toString().replace('.','-')
            if ($(this).attr('class') == clickClass)
            {  
                /*if (merchantId == 'E0843')
                {
                    console.log('redirect');
                    window.open('https://apply.flexicards.com.au/seller='+merchantId, '_blank', '', false);
                }else{*/
                     $(this).magnificPopup({
                        type:'iframe',
                        mainClass: 'skye-price',
                        midClick: true,
                        preloader: false,
                        fixedContentPos: true
                    }).magnificPopup('open');
                    e.preventDefault();
                /*}*/
            }
            //e.preventDefault();
        }   
    })
    }
})(jq);

/* Interface for https://vyrvuhxi9a.execute-api.ap-southeast-2.amazonaws.com/production/?id=IKEA&amount=1000&callback=test */
interface EmptyPlan {
    SkyePlan;
}

interface SkyePlan {
    [index: number]: { TransactionCode: string, Description: string, PrefIntRate: string, PrefIntPeriod: string, HolidayPeriod: string; }
}

function extractPrice(el: any) {    
    let textValue =  el.text().trim();
    textValue = textValue.replace(/^\D+/, "");
    textValue = textValue.replace(/,/, "");    
    return parseFloat(textValue);
}

function generateWidget(skyePlans: SkyePlan, merchantId: string, productPrice: number, noLogo: boolean, min: number, max: number, used_in: string, term: string, mode: string): string {    
    let template;
    let templateCheckout;
    let templatenologo;
    let templateList;
    let templateRedirect;
    let productPriceDividedBy;
    let productPriceDivisor;
    let interestFreeStr = '';  
    let prefIntRate;
    let clickApply = 'more info';   
    let productPriceStr = productPrice.toString().replace('.','-');
    console.log(Config.baseContentUrl);
    if (Object.keys(skyePlans).length > 0)
    {
        prefIntRate = skyePlans[Object.keys(skyePlans).length - 1].PrefIntRate;
        console.log('term:'+skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod);
    } else {
        prefIntRate = 0;
    }
    if (merchantId == 'E0843')
    {
        clickApply = 'click here';
    }
    term? productPriceDivisor = term : productPriceDivisor = skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod;
    
    if (parseFloat(prefIntRate) == 0)
    {
        interestFreeStr = 'Interest free ';
    }
    if (productPrice < min){
        template = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>or </p><p>Interest free with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\"></p>
                            <br>
                        </a>`;

        templateCheckout = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>Interest free with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\"></p>
                        </a>`;

        templatenologo = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" id=\"skye-tag\" class=\"`+productPriceStr+`\">\n<p>or <b>*Interest free</b></p></a>`;

        templateList = `<a href=\"#skye-dialog-`+productPriceStr+`\" id=\"skye-tag\" class=\"`+productPriceStr+`\">\n<p>or <b>*Interest free</b></p></a>`;

        templateRedirect = `<a href=\"https://apply.flexicards.com.au/seller=`+merchantId+`\" target=\"_blank\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>or </p><p>Interest free with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\"></p>
                            <br>
                        </a>`;
    }
    else if (productPrice <= max) {

            if (parseFloat(prefIntRate) == 0)
            {
                productPriceDividedBy = productPrice / productPriceDivisor;
            } else {
                productPriceDividedBy = (productPrice + (productPrice * (parseFloat(prefIntRate)/100+1))) / productPriceDivisor;
            }

            // Banking Rounding
            let roundedDownProductPrice = Math.floor( productPriceDividedBy * Math.pow(10, 2) ) / Math.pow(10, 2);
            // Compute for weekly
            if (mode == 'weekly')
            {
                let weeklyRoundedDownProductPrice = Math.floor((roundedDownProductPrice * 12/52) * Math.pow(10,2)) / Math.pow(10, 2);
                template = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>or <b>$${weeklyRoundedDownProductPrice.toFixed(2)}</b> weekly payments </p><p>`+interestFreeStr+`with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\">&nbsp;&nbsp;<span class="more-info">`+clickApply+`</span></p>
                            <br>
                        </a>`;

                templateCheckout = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p><b>$${weeklyRoundedDownProductPrice.toFixed(2)}</b> weekly payments </p><p>`+interestFreeStr+`with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\">&nbsp;&nbsp;<span class="more-info">`+clickApply+`</span></p>
                        </a>`;

                templatenologo = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" id=\"skye-tag\" class=\"`+productPriceStr+`\">\n<p>or <b>$`+weeklyRoundedDownProductPrice.toFixed(2)+`</b>/week </p></a>`;

                templateList = `<a href=\"#skye-dialog-`+productPriceStr+`\" id=\"skye-tag\" class=\"`+productPriceStr+`&int=`+prefIntRate.toString()+`\">\n<p>or <b>$`+weeklyRoundedDownProductPrice.toFixed(2)+`</b>/week&nbsp;<span class="more-info">`+clickApply+`</span></p></a>`;

                templateRedirect =`<a href=\"https://apply.flexicards.com.au/seller=`+merchantId+`\" target=\"_blank\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>or <b>$${weeklyRoundedDownProductPrice.toFixed(2)}</b> weekly payments </p><p>`+interestFreeStr+`with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\">&nbsp;&nbsp;<span class="more-info">`+clickApply+`</span></p>
                            <br>
                        </a>`;
            } else {
                template = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>or `+productPriceDivisor.toString()+` monthly payments of <b>$${roundedDownProductPrice.toFixed(2)}</b></p><p>`+interestFreeStr+`with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\">&nbsp;&nbsp;<span class="more-info">`+clickApply+`</span></p>
                            <br>
                        </a>`;

                templateCheckout = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>`+productPriceDivisor.toString()+` monthly payments of <b>$${roundedDownProductPrice.toFixed(2)}</b></p><p>`+interestFreeStr+`with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\">&nbsp;&nbsp;<span class="more-info">`+clickApply+`</span></p>
                        </a>`;

                templatenologo = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" id=\"skye-tag\" class=\"`+productPriceStr+`\">\n<p>or <b>$${roundedDownProductPrice.toFixed(2)}</b>/month </p></a>`;

                templateList = `<a href=\"`+Config.priceInfoUrl+`?id=`+merchantId+`&terms=`+productPriceDivisor.toString()+`&productPrice=`+productPriceStr+`&int=`+prefIntRate.toString()+`\" id=\"skye-tag\" class=\"`+productPriceStr+`\">\n<p>or <b>$${roundedDownProductPrice.toFixed(2)}</b>/month&nbsp;<span class="more-info">`+clickApply+`</span></p></a>`;

                templateRedirect =`<a href=\"https://apply.flexicards.com.au/seller=`+merchantId+`\" target=\"_blank\" class=\"`+productPriceStr+`\" id=\"skye-tag\">
                            <p>or `+productPriceDivisor.toString()+` monthly payments of <b>$${roundedDownProductPrice.toFixed(2)}</b></p><p>`+interestFreeStr+`with&nbsp;&nbsp;<img src=\"`+Config.baseContentUrl+`/content/images/humm90/humm90_logo_63px.png\">&nbsp;&nbsp;<span class="more-info">`+clickApply+`</span></p>
                            <br>
                        </a>`;
            }
    } else {
        return '<a id=\"skye-tag\"></a>'
    }
    if(used_in == "checkout"){
        return templateCheckout;
    }else {
        if (used_in == "list"){
            return templateList;
        } else {
            if (merchantId == 'E0843')
            {
                return templateRedirect;
            }else{
               return (noLogo) ? templatenologo : template;
            }
        }
    }
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

function updatePrice(el: JQuery, jq: JQueryStatic, noLogo: boolean, min: number, max: number, used_in: string, merchantId: string, term: string, mode: string, skyePlansUrl: string, checkProductPrice: number) {
    let productPrice = extractPrice(el);
    let parent =  jq(getCurrentScriptById());       
        if (term)
        {
            if (parseInt(term) > 12) 
            {
                console.log(parent);
                jq.when(manyRequests(merchantId, productPrice, term, skyePlansUrl)).then( function (skyePlans: SkyePlan) {                                   
                    const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);
                    
                    if (Object.keys(skyePlans).length > 0)
                    {            
                        term? term : term = skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod;
                        let intRate = skyePlans[Object.keys(skyePlans).length - 1].PrefIntRate;
                        widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate, checkProductPrice, parent);
                    } else {
                        if (term)
                        {
                            widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, '0', checkProductPrice, parent);
                        } 
                    }
                })
            }else{
                let skyePlans = [];
                const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);  
                widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, '0', checkProductPrice, parent);  
            }          
        }else{
            jq.when(manyRequests(merchantId, productPrice, term, skyePlansUrl)).then( function (skyePlans: SkyePlan) {                        
                const template: string = generateWidget(skyePlans, merchantId, productPrice, noLogo, min, max, used_in, term, mode);      
                if (Object.keys(skyePlans).length > 0)
                {            
                    term? term : term = skyePlans[Object.keys(skyePlans).length - 1].PrefIntPeriod;
                    let intRate = skyePlans[Object.keys(skyePlans).length - 1].PrefIntRate;
                    widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, intRate, checkProductPrice, parent);
                } else {
                    if (term)
                    {
                      widget.injectBanner(template, Config.priceInfoUrl, productPrice, merchantId, term, '0', checkProductPrice, parent);
                    } 
                }
            })
        }
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

function manyRequests(merchantId: string, productPrice: number, term: string, skyePlansUrl: string) {
    var promise = jq.Deferred();
    console.log(term);
    if (term == null)
    {
        term = ''
    }
    makeOneRequest(promise, merchantId, productPrice, term, skyePlansUrl);
    return promise;
}

function makeOneRequest(promise: any, merchantId: string, productPrice: number, term: string, skyePlansUrl: string) {    
    let productPriceString = productPrice.toString();
    jq.ajax({
        method: 'GET',
        async: false,            
        url: skyePlansUrl,      
        data: 'id='+merchantId+'&amount='+productPriceString+'&term='+term,
        dataType: "jsonp",                
        success: function (response) {             
            promise.resolve(response); 
        },
        error: function (request, status, error) {
            promise.resolve(JSON.parse('[{"TransactionCode": "31404","Description": "6 Months Interest Free","PrefIntRate": "0","PrefIntPeriod": "6","HolidayPeriod": "0"},{"TransactionCode": "31406","Description": "12 Months Interest Free","PrefIntRate": "0","PrefIntPeriod": "12","HolidayPeriod": "0"}]'));
        }
    }); 
}
