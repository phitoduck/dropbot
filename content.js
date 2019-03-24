// console.log('content.js runs whenever we switch pages');
'use strict';



/**
 * Manages (creates, deletes, selects) all PathSelector objects on the page.
 */
class SelectionManager {
    constructor() {

        // list of all PathSelector objs
        this.pathSelectors = [];
        this.activePathSelector = null;

    }

    // create and return new path selector
    createPathSelector(self) {
        let selector = new PathSelector(self);
        this.pathSelectors.push(selector);
        return selector;
    }

    // delete path selector element from parent element and from selector array
    deletePathSelector(selector) {
        // console.log("in deletePathSelector!");

        // remove selector element from DOM
        let element = selector.getElement();
        // console.log("element", element, "parent Element", element.parentElement);
        element.parentElement.removeChild(element);

        // remove selector from list
        this.pathSelectors = this.pathSelectors.filter(
            select => select !== selector
        );
    }

    // set the active PathSelector to recieve xpaths
    select(self, selector) {

        if (!selector instanceof PathSelector) {
            throw new Error("The object ", selector, " is not a PathSelector");
        }

        // ensure that selector is in pathSelectors array
        if (!self.pathSelectors.includes(selector)) {
            self.pathSelectors.push(selector);
        }

        // set active
        self.activePathSelector = selector;

    }

    getActiveSelector(self) {
        return self.activePathSelector;
    }

}

/**
 * Creates an element of the form 
 * "<div>Select<div> <p>Path: </p><label> Xpath Here</label>"
 * 
 * Click "Select" and then right click on a DOM element
 * to store the Xpath in the <label> element.
 * 
 * When used properly, these are managed by a SelectionManager
 * so that only one PathSelector object is ever in the "selected"
 * state.
 */
class PathSelector {

    // parent should be Action or Option
    constructor(selectionManager) {

        this.selectionManager = selectionManager;

        /*
            Select Button / XPath Label
        */
        this.selectorDiv = document.createElement("div");
        this.selectButton = document.createElement("div");
        this.pathText = document.createElement("p");
        this.pathLabel = document.createElement("Label");
        
        this.selectorDiv.appendChild(this.selectButton);
        this.selectorDiv.appendChild(this.pathText);
        this.selectorDiv.appendChild(this.pathLabel);

        // configure elements
        this.pathText.style.display = "inline";
        this.pathText.innerHTML = "Path: ";
        // this.pathText.style.marginLeft = '10px';
        this.pathLabel.innerHTML = 'Click "Select" and right click on element';
        this.pathLabel.style.display = "inline";
        this.selectButton.innerHTML = "Select";
        this.selectButton.style.marginRight = "10px";
        this.selectButton.style.display = "inline";
        this.selectButton.setAttribute('class', 'dropbot-button');

        var self = this;
        this.selectButton.onclick = function() {
            self.select(self);
        }

    }

    getElement() {
        return this.selectorDiv;
    }

    select(self) {
        self.selectorDiv.classList.value += "dropbot-active-path-selector";
        self.selectionManager.select(self.selectionManager, self);
    }

    deselect(self) {
        let classList = self.selectorDiv.classList.value;
        if (classList.includes("dropbot-active-path-selector")) {
            let classIndex = classList.indexOf("dropbot-active-path-selector");
            classList.splice(classIndex, 1); 
        }   
    }

    setXpath(self, xpath) {
        self.pathLabel.innerHTML = xpath;
    }

    getXpath(self) {
        return self.pathLabel.innerHTML; 
    }

}

class SideBar {

    constructor() {

        var self = this;

        // inject dropbot styles into <head>
        this.initCustomStyle();
        this.sideBarIsHidden = false;

        // use this to handle selection
        this.selectionManager = new SelectionManager();

        /*
            SIDEBAR
        */
        this.sideBar = document.createElement('div');
        this.sideBar.setAttribute('id', 'dropbot-sidebar');
        document.body.appendChild(this.sideBar);

        /*
            SCRIPT NAME INPUT
        */
        this.input_scriptName = document.createElement('input');
        this.input_scriptName.setAttribute('placeholder', 'Script Name');
        this.input_scriptName.setAttribute('class', 'dropbot-input')
        this.sideBar.appendChild(this.input_scriptName);

        /*
            SAVE BUTTON
        */
        this.saveButton = document.createElement('div');
        this.saveButton.setAttribute('class', 'dropbot-button');
        this.saveButton.setAttribute('id', 'save-btn');
        this.saveButton.innerHTML = "Save";
        this.saveButton.style.display = 'inline';
        this.saveButton.style.float = 'right';
        this.sideBar.appendChild(this.saveButton);
        this.saveButton.onclick = function() {
            self.clickedSaveButton(self);
        }

        /*
            ADD ACTION BUTTON
        */
        this.numberOfActions = 0;
        this.allActions = []

        this.addActionButton = document.createElement('div');
        this.addActionButton.setAttribute('class', 'dropbot-button');
        this.addActionButton.setAttribute('id', 'add-action-btn');
        this.addActionButton.innerHTML = '+ Add Action';
        this.addActionButton.style.display = 'inline';
        this.addActionButton.style.float = 'right';

        this.addActionButton.onclick = function () {
            self.clickedActionButton(self);
            return false;
        };;

        this.sideBar.appendChild(this.addActionButton);

        /*
            HIDE BUTTON
        */
        this.hideButton = document.createElement('div');
        this.hideButton.setAttribute('id', 'hide-btn');
        this.hideButton.setAttribute('class', 'dropbot-button');
        this.hideButton.innerHTML = 'Hide';
        this.sideBar.appendChild(this.hideButton);
        this.hideButton.style.display = 'inline';
        this.hideButton.style.float = 'right';

        self.allActions = [];
        this.hideButton.onclick = function() {
            self.clickedHideButton(self);
        }
    }

    clickedSaveButton(self) {

        // get script name
        let scriptName = self.input_scriptName.value;

        if (scriptName === "") {
            alert("Dropot: The script needs a title!");
            throw new Error("No title in script.")
        }
        
        // convert fields to json
        let jsonString = self.toJson(self);

        console.log("Script json");
        console.log(jsonString);
        console.log(JSON.parse(jsonString));

        // save
        var blob = new Blob([jsonString], {type: "text/plain;charset=utf-8"});
        saveAs(blob, scriptName + ".txt");

    }

    // write entire script to json format
    toJson(self) {

        // get script name
        let scriptName = self.input_scriptName.value;

        // json string that we will build and save
        let json = '{"script_name":"' + scriptName + '",' + 
                    '"actions": [';
        self.allActions.forEach( (action, index) => {

            // 1. get action number
            let actionString = '{"index":"' + index + '",'; 

            // 2. get action type
            let actionType = action.getType(action);
            actionString += '"type":"' + actionType + '",';

            if (actionType === "Click" || actionType === "Fill Field") {

                // 3. get xpath
                let xpath = action.pathSelector.getXpath(action.pathSelector);
                actionString += '"xpath":"' + xpath + '"}';

                console.log("current action", actionString);

            } else if (actionType === "Click One Of") {
                            
                actionString += '"options":';

                // 3. get json array of all actions
                let actionArray = "[";
                action.options.forEach( (option) => {

                    let optionName = option.getOptionName(option);
                    let xpath = option.pathSelector.getXpath(option.pathSelector);

                    // 3.1 add single option
                    actionArray += '{"name":"' + optionName + '","xpath":"' + xpath + '"},'; 

                });
                actionArray = actionArray.substring(0, actionArray.length - 1) + ']}';
                actionString += actionArray;

            } else {
                alert("Dropot error: All actions must have a selected type.");
                throw new Error("There is at least one action that needs more configuration!");
            }

            json += actionString + ',';
            
        });
        json = json.substring(0, json.length - 1) + "]}";

        return json;

    }

    clickedActionButton(self) {
        self.allActions.push(new Action(self, ++this.numberOfActions));
    }

    clickedHideButton(self) {
        self.sideBarIsHidden = !self.sideBarIsHidden;

        if(self.sideBarIsHidden) {
            
            self.hideButton.innerHTML = 'Show';

            // hide each element
            self.sideBar.childNodes.forEach(element => {
                if (element && element.style && element.id !== 'hide-btn') {
                    element.style.display = 'none';
                }
            });

            // put sidebar in bottom left corner
            self.sideBar.setAttribute('id', 'dropbot-sidebar-hidden');
        } else {

            self.hideButton.innerHTML = 'Hide';

            // show each element
            self.sideBar.childNodes.forEach( element => {
                if (element && element.style && element.id !== 'hide-btn') {
                    element.style.display = '';
                }
            })

            // put sidebar in top right corner
            self.sideBar.setAttribute('id', 'dropbot-sidebar');
        }
    }

    initCustomStyle() {
        let css = `

            .dropbot-button {
                margin-top: 5px;
                background-color: DodgerBlue; /* Blue background */
                border: none; /* Remove borders */
                border-radius: 5px;
                color: white; /* White text */
                padding: 5px 7px; /* Some padding */
                font-size: 16px; /* Set a font size */
                cursor: pointer; /* Mouse pointer on hover */
                margin-left: 10px;
                text-align: center;
            }

            .dropbot-button:hover {
                background-color: royalblue;
            }

            .dropbot-option-button {
                position: relative;
                right: 60 px;
                padding: 3px 5px;
            }

            .dropbot-remove-button {
                // position: absolute;
                // right: 20px;
                // float: right;
                background-color: #D8000C;
                font-size: 20px;
                font-weight: 100;
            }

            .dropbot-remove-button:hover {
                background-color: darkred;
            }

            .dropbot-active-path-selector {
                border-color: yellow;
            }

            .dropbot-input {
                padding: 2px 8px;
                margin: 8px 0;
                display: inline-block;
                border: 1px solid #ccc;
                border-radius: 10px;
                box-sizing: border-box;
            }

            .dropbot-action {
                border-color: darkgra;
                border: solid
                border-width: 1px;
                margin-top: 4px;
                min-width: 100%;
                min-height: 65px;
                overflow: auto;
                padding: 10px;
                border-radius: 3px;
                background-color: rgb(255, 230, 180);
            }

            .dropbot-option:first-of-type {
                margin-top: 20px;
                // border-top-left-radius: 10px;
                // border-top-right-radius: 10px;
            }

            .dropbot-option:last-of-type {
                // border-bottom-style: solid;
                // border-bottom-left-radius: 10px;
                // border-bottom-right-radius: 10px;
            }

            .dropbot-option {
                // border-color: darkgray;
                // border-top-style: solid;
                // border-left-style: solid;
                // border-right-style: solid;
                // border-width: 1px;
                padding: 5px 0px 5px 0px; // top right bottom left
            }

            #dropbot-sidebar {
                position: absolute;
                top: 2%;
                right: 2%;
                min-width: 500px;
                min-height: 200px;
                z-index: 999;
                background-color: rgba(206, 235, 255, 0.203);
                padding: 15px;
                transition-duration: .25s;
                border-radius: 6px;
            }

            #dropbot-sidebar:hover {
                background-color: white;
                border: solid;
                border-color: darkgray;
                border-width: 1px;
            }

            #dropbot-sidebar-hidden {
                transition-duration: .25s;
                z-index: 999;
                background-color: rgba(0, 51, 134, 0.267);
                position: fixed;
                bottom: 10px;
                left: 10px;
                min-width = 50px;
                min-height = 50px;
                border-radius = 100px;
            }
            
            #add-option-btn {
                background-color: orange;
                color: white;
                font-size: 20px;
                border-radius: 10px;
                padding: 5px;
            }

            #add-option-btn:hover {
                
            }

            #save-btn {

            }

            #hide-btn {

            }
            `;

        // append <style> to header
        this.style = document.createElement('style');
        this.style.innerHTML = css;
        document.head.appendChild(this.style);

        /*
            Insert stylesheet link for icons
        */
        this.iconStyleSheet = document.createElement('link');
        this.iconStyleSheet.setAttribute('rel', 'stylesheet')
        this.iconStyleSheet.setAttribute('href', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        document.head.appendChild(this.iconStyleSheet);

    }
    
}

class Action {

    constructor(sideBar, numberOfActions) {

        var self = this;
        this.sideBar = sideBar;

        /*
            Mode Dependent Instance Variables
        */
        this.id = "dropbot-action-" + numberOfActions;
        this.numberOfOptions = 0;
        this.options = []; // all options associated with this action (For ClickOneOf mode)
        this.pathSelector = null; // For Click and FillField modes
        this.inputField = null;

        /*
            ACTION DIV
        */
        this.action = document.createElement('div');
        this.action.setAttribute('class', 'dropbot-action');
        this.action.setAttribute('id', this.id)
        this.sideBar.sideBar.appendChild(this.action);

        /*
            TYPE DROPDOWN
        */
        this.typeDropdown = document.createElement('select');
        this.typeDropdown.style.marginBottom = '10px';
        this.action.appendChild(this.typeDropdown);

        this.optionSelect = document.createElement('option');
        this.optionSelect.setAttribute('value', 'Select Action Type');
        this.optionSelect.innerHTML = "Select Action Type";
        this.typeDropdown.appendChild(this.optionSelect);

        this.optionClick = document.createElement('option');
        this.optionClick.setAttribute('value', 'Click');
        this.optionClick.innerHTML = "Click";
        this.typeDropdown.appendChild(this.optionClick);

        this.optionClickOneOf = document.createElement('option');
        this.optionClickOneOf.setAttribute('value', 'Click One Of');
        this.optionClickOneOf.innerHTML = "Click One Of"
        this.typeDropdown.appendChild(this.optionClickOneOf)

        this.optionFillField = document.createElement('option');
        this.optionFillField.setAttribute('value', 'Fill Field');
        this.optionFillField.innerHTML = "Fill Field"
        this.typeDropdown.appendChild(this.optionFillField);

        // span for "Add Option" and "Remove Action"
        this.buttonSpan = document.createElement('span');
        this.action.appendChild(this.buttonSpan);

        // <select> can only fire onchange
        this.typeDropdown.onchange = function() {
            self.reset(self);
        }

        /*
            REMOVE BUTTON
        */
       this.removeButton = document.createElement('button');
       this.removeButton.setAttribute('class', 'dropbot-button dropbot-remove-button');
       this.removeButton.innerHTML = "<i class=\"fa fa-close\"></i>";
       this.buttonSpan.appendChild(this.removeButton);

        this.removeButton.onclick = function() {
            self.clickRemoveButton(self)
        }
        
    }

    clickAddOption(self, optionNumber) {
        self.options.push(new Option(self, optionNumber));
        return false;
    }

    clickRemoveButton(self) {

        // PROPERLY DELETE PATH SELECTOR!
        if (self.pathSelector) {
            self.sideBar.selectionManager.deletePathSelector(self.pathSelector);
            self.pathSelector = null;
        }

        // remove this action element from sideBar.sideBar
        let actionElement = self.action;
        self.sideBar.sideBar.removeChild(actionElement);

        // remove this action from sideBar.allActions
        self.sideBar.allActions = self.sideBar.allActions.filter(
            action => action !== self
        );

    }

    reset(self) {

        // console.log("RESET!");

        // delete all options
        self.options.forEach( option => option.clickRemoveButton(option) );
        self.numberOfOptions = 0;

        // delete path selector
        if (self.pathSelector && self.pathSelector instanceof PathSelector) {
            self.sideBar.selectionManager.deletePathSelector(self.pathSelector);
            self.pathSelector = null;
        }

        // delete Add Option button
        if (self.addOptionButton && self.addOptionButton instanceof Node) {
            self.addOptionSpan.removeChild(self.addOptionButton);
            self.addOptionButton = null;
        }

        // delete input field
        if (self.inputField && self.inputField instanceof Node) {
            self.action.removeChild(self.inputField);
            self.inputField = null;
        }

        // identify Action Type
        let selectedOption = self.typeDropdown[self.typeDropdown.selectedIndex].value;
        // console.log("selected option", selectedOption);
        if (selectedOption === "Click One Of") {
            self.initClickOneOf(self);
        } else if (selectedOption === "Click") {
            self.initClick(self);
        } else if (selectedOption === "Fill Field") {
            self.initFillField(self);
        }

    }

    getType(self) {
        return self.typeDropdown[self.typeDropdown.selectedIndex].value;
    }

    initClick(self) {
        /*
            Path Selector
        */
       let selectionManager = self.sideBar.selectionManager;
       self.pathSelector = selectionManager.createPathSelector(selectionManager);
       self.selectorElement = self.pathSelector.getElement();
       self.action.appendChild(self.selectorElement);
    }

    initClickOneOf(self) {
        /*
            ADD OPTION BUTTON
        */
       self.addOptionButton = document.createElement('div');
       self.addOptionButton.setAttribute('class', 'dropbot-button dropbot-option-button');
       self.addOptionButton.innerHTML = "+ Add Option";

       // add to button span
       self.addOptionSpan = document.createElement('span');
       self.addOptionSpan.appendChild(self.addOptionButton);
       self.buttonSpan.appendChild(self.addOptionSpan);

       self.addOptionButton.onclick = function() {
           self.clickAddOption(self, self.numberOfOptions);
           return false; // necessary, so that child of <form> does not refresh page
       };
    }

    initFillField(self) {
        // create Path Selector
        let selectionManager = self.sideBar.selectionManager;
        self.pathSelector = selectionManager.createPathSelector(selectionManager);
        self.action.appendChild(self.pathSelector.getElement());
    }

}

class Option {
    constructor(action, optionNumber) {
        // Label: [Option Input] [Delete Button]

        var self = this;
        this.action = action;
        this.actionElement = action.action;

        /*
            Option Div
        */
        this.option = document.createElement("div");
        this.option.setAttribute('class', 'dropbot-option')
        this.actionElement.appendChild(this.option);
        
        this.input = document.createElement('input');
        this.input.placeholder = 'Option Name';
        this.input.setAttribute('class', 'dropbot-input')
        this.option.appendChild(this.input);

        this.removeButton = document.createElement('span');
        this.removeButton.setAttribute('class', 'dropbot-button dropbot-remove-button')
        this.removeButton.innerHTML = "<i class=\"fa fa-close\"></i>"
        this.option.appendChild(this.removeButton);
        this.removeButton.onclick = function() {
            self.clickRemoveButton(self);
        }

        /*
            Path Selector
        */
       let selectionManager = sideBar.selectionManager;
       this.pathSelector = selectionManager.createPathSelector(selectionManager);
       this.selector = this.pathSelector.getElement();
       this.option.appendChild(this.selector);

    }

    getOptionName(self) {
        return self.input.value;
    }

    clickRemoveButton(self) {

        // PROPERLY DELETE PATH SELECTOR!
        self.action.sideBar.selectionManager.deletePathSelector(self.pathSelector);

        // remove this action element from sideBar.sideBar
        let optionElement = self.option;
        self.actionElement.removeChild(optionElement);

        // remove this action from sideBar.allActions
        self.action.options = self.action.options.filter(
            option => option !== self
        )
    }
}

////////////////////////////////
//   CREATE DROPBOT SIDEBAR   //
////////////////////////////////

var sideBar = null;

/**
    * Identify whether to display the program menu
*/

var paused = null;
function getDropbotPaused() {
    chrome.storage.sync.get(['paused'], function(dropbotStorage) {
        paused = dropbotStorage['paused'];
        console.log(dropbotStorage);
    });
}
getDropbotPaused();

var init = function () {
    if (!paused) {
        sideBar = new SideBar();
    }
}
setTimeout(init, 1000);



// send the clicked object to the background script
document.body.addEventListener("contextmenu", (event) => {

    // get xpath of clicked element
    let xpath = getElementXPath(event.target);
    // sideBar.innerHTML += '</br>' + xpath;

    // write xpath to script
    let selectionManager = sideBar.selectionManager;
    let activePathSelector = selectionManager.getActiveSelector(selectionManager);
    // console.log("active path selector", activePathSelector);
    if (activePathSelector) {
        activePathSelector.setXpath(activePathSelector, xpath);
    }
    
    sideBar.innerHTML += event.target.getAttribute('title');
    chrome.runtime.sendMessage({
            message: "element clicked",
            element: event,
            xpath: xpath
        },
        function (response) {
            // console.log(xpath);
            // console.log("received response: " + response.message);
        });
});

// select all input fields
// let inputElements = document.querySelectorAll("input");

// listen for messages
// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         console.log(sender.tab ?
//             "from a content script:" + sender.tab.url :
//             "from the extension");
//         if (request.greeting == "hello")
//             sendResponse({
//                 farewell: "goodbye"
//             });

        // print out the xpath
        // console.log(request.xpath);
    // });










////////////////////////////////////////////////////////////////////////
//                           XPath Code                               //
////////////////////////////////////////////////////////////////////////

"use strict";
/**
 * Gets an XPath for an element which describes its hierarchical location.
 */
var getElementXPath = function (element) {
    if (element && element.id)
        return '//*[@id="' + element.id + '"]';
    else
        return getElementTreeXPath(element);
};

var getElementTreeXPath = function (element) {
    var paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentNode) {
        var index = 0;
        var hasFollowingSiblings = false;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
            // Ignore document type declaration.
            if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                continue;

            if (sibling.nodeName == element.nodeName)
                ++index;
        }

        for (var sibling = element.nextSibling; sibling && !hasFollowingSiblings; sibling = sibling.nextSibling) {
            if (sibling.nodeName == element.nodeName)
                hasFollowingSiblings = true;
        }

        var tagName = (element.prefix ? element.prefix + ":" : "") + element.localName;
        var pathIndex = (index || hasFollowingSiblings ? "[" + (index + 1) + "]" : "");
        paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
};

var cssToXPath = function (rule) {
    var regElement = /^([#.]?)([a-z0-9\\*_-]*)((\|)([a-z0-9\\*_-]*))?/i;
    var regAttr1 = /^\[([^\]]*)\]/i;
    var regAttr2 = /^\[\s*([^~=\s]+)\s*(~?=)\s*"([^"]+)"\s*\]/i;
    var regPseudo = /^:([a-z_-])+/i;
    var regCombinator = /^(\s*[>+\s])?/i;
    var regComma = /^\s*,/i;

    var index = 1;
    var parts = ["//", "*"];
    var lastRule = null;

    while (rule.length && rule != lastRule) {
        lastRule = rule;

        // Trim leading whitespace
        rule = Str.trim(rule);
        if (!rule.length)
            break;

        // Match the element identifier
        var m = regElement.exec(rule);
        if (m) {
            if (!m[1]) {
                // XXXjoe Namespace ignored for now
                if (m[5])
                    parts[index] = m[5];
                else
                    parts[index] = m[2];
            } else if (m[1] == '#')
                parts.push("[@id='" + m[2] + "']");
            else if (m[1] == '.')
                parts.push("[contains(concat(' ',normalize-space(@class),' '), ' " + m[2] + " ')]");

            rule = rule.substr(m[0].length);
        }

        // Match attribute selectors
        m = regAttr2.exec(rule);
        if (m) {
            if (m[2] == "~=")
                parts.push("[contains(@" + m[1] + ", '" + m[3] + "')]");
            else
                parts.push("[@" + m[1] + "='" + m[3] + "']");

            rule = rule.substr(m[0].length);
        } else {
            m = regAttr1.exec(rule);
            if (m) {
                parts.push("[@" + m[1] + "]");
                rule = rule.substr(m[0].length);
            }
        }

        // Skip over pseudo-classes and pseudo-elements, which are of no use to us
        m = regPseudo.exec(rule);
        while (m) {
            rule = rule.substr(m[0].length);
            m = regPseudo.exec(rule);
        }

        // Match combinators
        m = regCombinator.exec(rule);
        if (m && m[0].length) {
            if (m[0].indexOf(">") != -1)
                parts.push("/");
            else if (m[0].indexOf("+") != -1)
                parts.push("/following-sibling::");
            else
                parts.push("//");

            index = parts.length;
            parts.push("*");
            rule = rule.substr(m[0].length);
        }

        m = regComma.exec(rule);
        if (m) {
            parts.push(" | ", "//", "*");
            index = parts.length - 1;
            rule = rule.substr(m[0].length);
        }
    }

    var xpath = parts.join("");
    return xpath;
};

var getElementsBySelector = function (doc, css) {
    var xpath = cssToXPath(css);
    return getElementsByXPath(doc, xpath);
};

var getElementsByXPath = function (doc, xpath) {
    try {
        return evaluateXPath(doc, xpath);
    } catch (ex) {
        return [];
    }
};

/**
 * Evaluates an XPath expression.
 *
 * @param {Document} doc
 * @param {String} xpath The XPath expression.
 * @param {Node} contextNode The context node.
 * @param {int} resultType
 *
 * @returns {*} The result of the XPath expression, depending on resultType :<br> <ul>
 *          <li>if it is XPathResult.NUMBER_TYPE, then it returns a Number</li>
 *          <li>if it is XPathResult.STRING_TYPE, then it returns a String</li>
 *          <li>if it is XPathResult.BOOLEAN_TYPE, then it returns a boolean</li>
 *          <li>if it is XPathResult.UNORDERED_NODE_ITERATOR_TYPE
 *              or XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, then it returns an array of nodes</li>
 *          <li>if it is XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
 *              or XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, then it returns an array of nodes</li>
 *          <li>if it is XPathResult.ANY_UNORDERED_NODE_TYPE
 *              or XPathResult.FIRST_ORDERED_NODE_TYPE, then it returns a single node</li>
 *          </ul>
 */
var evaluateXPath = function (doc, xpath, contextNode, resultType) {
    if (contextNode === undefined)
        contextNode = doc;

    if (resultType === undefined)
        resultType = XPathResult.ANY_TYPE;

    var result = doc.evaluate(xpath, contextNode, null, resultType, null);

    switch (result.resultType) {
        case XPathResult.NUMBER_TYPE:
            return result.numberValue;

        case XPathResult.STRING_TYPE:
            return result.stringValue;

        case XPathResult.BOOLEAN_TYPE:
            return result.booleanValue;

        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
            var nodes = [];
            for (var item = result.iterateNext(); item; item = result.iterateNext())
                nodes.push(item);
            return nodes;

        case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
        case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
            var nodes = [];
            for (var i = 0; i < result.snapshotLength; ++i)
                nodes.push(result.snapshotItem(i));
            return nodes;

        case XPathResult.ANY_UNORDERED_NODE_TYPE:
        case XPathResult.FIRST_ORDERED_NODE_TYPE:
            return result.singleNodeValue;
    }
};

var getRuleMatchingElements = function (rule, doc) {
    var css = rule.selectorText;
    var xpath = cssToXPath(css);
    return getElementsByXPath(doc, xpath);
};

// ********************************************************************************************* //
// Registration


// ********************************************************************************************* //







//////////////////////////////////////////////////////////////////////////////////////////////////
//                                      FILE SAVER CODE                                         //
//////////////////////////////////////////////////////////////////////////////////////////////////

/*
* FileSaver.js
* A saveAs() FileSaver implementation.
*
* By Eli Grey, http://eligrey.com
*
* License : https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md (MIT)
* source  : http://purl.eligrey.com/github/FileSaver.js
*/


// The one and only way of getting global scope in all environments
// https://stackoverflow.com/q/3277182/1008999
var _global = typeof window === 'object' && window.window === window
  ? window : typeof self === 'object' && self.self === self
  ? self : typeof global === 'object' && global.global === global
  ? global
  : this

function bom (blob, opts) {
  if (typeof opts === 'undefined') opts = { autoBom: false }
  else if (typeof opts !== 'object') {
    console.warn('Deprecated: Expected third argument to be a object')
    opts = { autoBom: !opts }
  }

  // prepend BOM for UTF-8 XML and text/* types (including HTML)
  // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
  if (opts.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
    return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type })
  }
  return blob
}

function download (url, name, opts) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url)
  xhr.responseType = 'blob'
  xhr.onload = function () {
    saveAs(xhr.response, name, opts)
  }
  xhr.onerror = function () {
    console.error('could not download file')
  }
  xhr.send()
}

function corsEnabled (url) {
  var xhr = new XMLHttpRequest()
  // use sync to avoid popup blocker
  xhr.open('HEAD', url, false)
  xhr.send()
  return xhr.status >= 200 && xhr.status <= 299
}

// `a.click()` doesn't work for all browsers (#465)
function click(node) {
  try {
    node.dispatchEvent(new MouseEvent('click'))
  } catch (e) {
    var evt = document.createEvent('MouseEvents')
    evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
                          20, false, false, false, false, 0, null)
    node.dispatchEvent(evt)
  }
}

var saveAs = _global.saveAs || (
  // probably in some web worker
  (typeof window !== 'object' || window !== _global)
    ? function saveAs () { /* noop */ }

  // Use download attribute first if possible (#193 Lumia mobile)
  : 'download' in HTMLAnchorElement.prototype
  ? function saveAs (blob, name, opts) {
    var URL = _global.URL || _global.webkitURL
    var a = document.createElement('a')
    name = name || blob.name || 'download'

    a.download = name
    a.rel = 'noopener' // tabnabbing

    // TODO: detect chrome extensions & packaged apps
    // a.target = '_blank'

    if (typeof blob === 'string') {
      // Support regular links
      a.href = blob
      if (a.origin !== location.origin) {
        corsEnabled(a.href)
          ? download(blob, name, opts)
          : click(a, a.target = '_blank')
      } else {
        click(a)
      }
    } else {
      // Support blobs
      a.href = URL.createObjectURL(blob)
      setTimeout(function () { URL.revokeObjectURL(a.href) }, 4E4) // 40s
      setTimeout(function () { click(a) }, 0)
    }
  }

  // Use msSaveOrOpenBlob as a second approach
  : 'msSaveOrOpenBlob' in navigator
  ? function saveAs (blob, name, opts) {
    name = name || blob.name || 'download'

    if (typeof blob === 'string') {
      if (corsEnabled(blob)) {
        download(blob, name, opts)
      } else {
        var a = document.createElement('a')
        a.href = blob
        a.target = '_blank'
        setTimeout(function () { click(a) })
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name)
    }
  }

  // Fallback to using FileReader and a popup
  : function saveAs (blob, name, opts, popup) {
    // Open a popup immediately do go around popup blocker
    // Mostly only available on user interaction and the fileReader is async so...
    popup = popup || open('', '_blank')
    if (popup) {
      popup.document.title =
      popup.document.body.innerText = 'downloading...'
    }

    if (typeof blob === 'string') return download(blob, name, opts)

    var force = blob.type === 'application/octet-stream'
    var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari
    var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent)

    if ((isChromeIOS || (force && isSafari)) && typeof FileReader === 'object') {
      // Safari doesn't allow downloading of blob URLs
      var reader = new FileReader()
      reader.onloadend = function () {
        var url = reader.result
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;')
        if (popup) popup.location.href = url
        else location = url
        popup = null // reverse-tabnabbing #460
      }
      reader.readAsDataURL(blob)
    } else {
      var URL = _global.URL || _global.webkitURL
      var url = URL.createObjectURL(blob)
      if (popup) popup.location = url
      else location.href = url
      popup = null // reverse-tabnabbing #460
      setTimeout(function () { URL.revokeObjectURL(url) }, 4E4) // 40s
    }
  }
)

_global.saveAs = saveAs.saveAs = saveAs

if (typeof module !== 'undefined') {
  module.exports = saveAs;
}