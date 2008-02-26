/***************************************************************
*  Copyright notice
*
* (c) 2007-2008 Stanislas Rolland <stanislas.rolland(arobas)fructifor.ca>
*  All rights reserved
*
*  This script is part of the TYPO3 project. The TYPO3 project is
*  free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  The GNU General Public License can be found at
*  http://www.gnu.org/copyleft/gpl.html.
*  A copy is found in the textfile GPL.txt and important notices to the license
*  from the author is found in LICENSE.txt distributed with these scripts.
*
*
*  This script is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  This script is a modified version of a script published under the htmlArea License.
*  A copy of the htmlArea License may be found in the textfile HTMLAREA_LICENSE.txt.
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/
/*
 * Block Style Plugin for TYPO3 htmlArea RTE
 *
 * TYPO3 SVN ID: $Id: block-style.js $
 */
BlockStyle = HTMLArea.Plugin.extend({
		
	constructor : function(editor, pluginName) {
		this.base(editor, pluginName);
	},
	
	/*
	 * This function gets called by the class constructor
	 */
	configurePlugin : function(editor) {
		this.cssLoaded = false;
		this.cssTimeout = null;
		this.cssParseCount = 0;
		this.cssArray = new Object();
		
		this.classesUrl = this.editorConfiguration.classesUrl;
		this.pageTSconfiguration = this.editorConfiguration.buttons.blockstyle;
		this.tags = this.pageTSconfiguration.tags;
		if (!this.tags) {
			this.tags = new Object();
		}
		if (typeof(this.editorConfiguration.classesTag) !== "undefined") {
			if (this.editorConfiguration.classesTag.div) {
				if (!this.tags.div) {
					this.tags.div = new Object();
				}
				if (!this.tags.div.allowedClasses) {
					this.tags.div.allowedClasses = this.editorConfiguration.classesTag.div;
				}
			}
			if (this.editorConfiguration.classesTag.td) {
				if (!this.tags.td) {
					this.tags.td = new Object();
				}
				if (!this.tags.td.allowedClasses) {
					this.tags.td.allowedClasses = this.editorConfiguration.classesTag.td;
				}
			}
			if (this.editorConfiguration.classesTag.table) {
				if (!this.tags.table) {
					this.tags.table = new Object();
				}
				if (!this.tags.table.allowedClasses) {
					this.tags.table.allowedClasses = this.editorConfiguration.classesTag.table;
				}
			}
		}
		this.showTagFreeClasses = this.pageTSconfiguration.showTagFreeClasses || this.editorConfiguration.showTagFreeClasses;
		this.prefixLabelWithClassName = this.pageTSconfiguration.prefixLabelWithClassName;
		this.postfixLabelWithClassName = this.pageTSconfiguration.postfixLabelWithClassName;
		
		/*
		 * Registering plugin "About" information
		 */
		var pluginInformation = {
			version		: "1.2",
			developer	: "Stanislas Rolland",
			developerUrl	: "http://www.fructifor.ca/",
			copyrightOwner	: "Stanislas Rolland",
			sponsor		: "Fructifor Inc. " + this.localize("Technische Universitat Ilmenau"),
			sponsorUrl	: "http://www.tu-ilmenau.de/",
			license		: "GPL"
		};
		this.registerPluginInformation(pluginInformation);
		
		/*
		 * Registeringthe drop-down list
		 */
		var dropDownId = "BlockStyle";
		var dropDownConfiguration = {
			id		: dropDownId,
			tooltip		: this.localize(dropDownId + "-Tooltip"),
			textMode	: false,
			options		: {"":""},
			action		: "onChange",
			refresh		: "generate",
			context		: null
		};
		this.registerDropDown(dropDownConfiguration);
		
		return true;
	},
	
	/*
	 * This function gets called when some block style was selected in the drop-down list
	 */
	onChange : function(editor, dropDownId) {
		var select = document.getElementById(this.editor._toolbarObjects[dropDownId].elementId);
		var className = select.value;
		
		this.editor.focusEditor();
		var blocks = this.getSelectedBlocks();
		for (var k = 0; k < blocks.length; ++k) {
			var parent = blocks[k];
			while (parent && !HTMLArea.isBlockElement(parent) && parent.nodeName.toLowerCase() != "img") {
				parent = parent.parentNode;
			}
			if (!k) {
				var tagName = parent.tagName.toLowerCase();
			}
			if (parent.tagName.toLowerCase() == tagName) {
				this.applyClassChange(parent, className);
			}
		}
	},
	
	/*
	 * This function applies the class change to the node
	 */
	applyClassChange : function (node, className) {
		if (className == "none") {
			var classNames = node.className.trim().split(" ");
			for (var i = classNames.length; --i >= 0;) {
				if (!HTMLArea.reservedClassNames.test(classNames[i])) {
					HTMLArea._removeClass(node, classNames[i]);
					if (node.nodeName.toLowerCase() === "table" && this.editor.plugins.TableOperations) {
						this.editor.plugins.TableOperations.instance.removeAlternatingClasses(node, classNames[i]);
					}
					break;
				}
			}
		} else {
			var nodeName = node.nodeName.toLowerCase();
			if (this.tags && this.tags[nodeName]) {
				var allowedClasses = this.tags[nodeName].allowedClasses;
				if (allowedClasses && allowedClasses.indexOf(className) !== -1) {
					HTMLArea._addClass(node, className);
				}
			} else if (this.tags && this.tags.all) {
				var allowedClasses = this.tags.all.allowedClasses;
				if (allowedClasses && allowedClasses.indexOf(className) !== -1) {
					HTMLArea._addClass(node, className);
				}
			} else {
				HTMLArea._addClass(node, className);
			}
			if (nodeName === "table" && this.editor.plugins.TableOperations) {
				this.editor.plugins.TableOperations.instance.reStyleTable(node);
			}
		}
	},
	
	/*
	 * This function gets the list of selected blocks
	 */
	getSelectedBlocks : function() {
		var block, range, i = 0, blocks = [];
		if (HTMLArea.is_gecko && !HTMLArea.is_safari && !HTMLArea.is_opera) {
			var selection = this.editor._getSelection();
			try {
				while (range = selection.getRangeAt(i++)) {
					block = this.editor.getParentElement(selection, range);
					blocks.push(block);
				}
			} catch(e) {
				/* finished walking through selection */
			}
		} else {
			blocks.push(this.editor.getParentElement());
		}
		return blocks;
	},
	
	/*
	 * This function gets called when the editor is generated
	 */
	onGenerate : function() {
		if (HTMLArea.is_gecko) {
			this.generate(this.editor, "BlockStyle");
		}
	},
	
	/*
	 * This function gets called when the toolbar is being updated
	 */
	onUpdateToolbar : function() {
		if (this.editor.getMode() === "wysiwyg") {
			this.generate(this.editor, "BlockStyle");
		}
	},
	
	/*
	 * This function gets called when the editor has changed its mode to "wysiwyg"
	 */
	onMode : function(mode) {
		if (this.editor.getMode() === "wysiwyg") {
			this.generate(this.editor, "BlockStyle");
		}
	},
	
	/*
	 * This function gets called on plugin generation, on toolbar update and  on change mode
	 * Re-initiate the parsing of the style sheets, if not yet completed, and refresh our toolbar components
	 */
	generate : function(editor, dropDownId) {
		if (this.cssLoaded && this.editor.getMode() === "wysiwyg" && this.editor.isEditable()) {
			this.updateValue(dropDownId);
		} else {
			if (this.cssTimeout) {
				if (editor._iframe.contentWindow) {
					editor._iframe.contentWindow.clearTimeout(this.cssTimeout);
				} else {
					window.clearTimeout(this.cssTimeout);
				}
				this.cssTimeout = null;
			}
			if (this.classesUrl && (typeof(HTMLArea.classesLabels) === "undefined")) {
				this.getJavascriptFile(this.classesUrl);
			}
			this.buildCssArray(editor, dropDownId);
		}
	},
	
	/*
	 * This function updates the current value of the dropdown list
	 */
	updateValue : function(dropDownId) {
		var select = document.getElementById(this.editor._toolbarObjects[dropDownId].elementId);
		this.initializeDropDown(select);
		select.disabled = true;
		
		var classNames = new Array();
		var tagName = null;
		var parent = this.editor.getParentElement();
		while (parent && !HTMLArea.isBlockElement(parent) && parent.nodeName.toLowerCase() != "img") {
			parent = parent.parentNode;
		}
		if (parent) {
			tagName = parent.nodeName.toLowerCase();
			classNames = this.getClassNames(parent);
		}
		if (tagName && tagName !== "body"){
			this.buildDropDownOptions(select, tagName);
			this.setSelectedOption(select, classNames);
		}
		select.className = "";
		if (select.disabled) {
			select.className = "buttonDisabled";
		}
	},
	
	/*
	 * This function returns an array containing the class names assigned to the node
	 */
	getClassNames : function (node) {
		var classNames = new Array();
		if (node) {
			if (node.className && /\S/.test(node.className)) {
				classNames = node.className.trim().split(" ");
			}
			if (HTMLArea.reservedClassNames.test(node.className)) {
				var cleanClassNames = new Array();
				var j = -1;
				for (var i = 0; i < classNames.length; ++i) {
					if (!HTMLArea.reservedClassNames.test(classNames[i])) {
						cleanClassNames[++j] = classNames[i];
					}
				}
				return cleanClassNames;
			}
		}
		return classNames;
	},
	
	/*
	 * This function reinitializes the options of the dropdown
	 */
	initializeDropDown : function (dropDown) {
		if (HTMLArea.is_gecko) {
			while(dropDown.options.length > 0) {
				dropDown.remove(dropDown.options.length-1);
			}
		} else {
			while(dropDown.options.length > 0) {
				dropDown.options[dropDown.options.length-1] = null;
			}
		}
		var option = dropDown.ownerDocument.createElement("option");
		option.value = "none";
		option.innerHTML = this.localize("No style");
		dropDown.appendChild(option);
	},
	
	/*
	 * This function builds the options to be displayed in the dropDown box
	 */
	buildDropDownOptions : function (dropDown, tagName) {
		var cssArray = new Array();
		this.initializeDropDown(dropDown);
			// Get classes allowed for all tags
		if (typeof(this.cssArray.all) !== "undefined") {
			if (this.tags && this.tags[tagName]) {
				var allowedClasses = this.tags[tagName].allowedClasses;
				for (var cssClass in this.cssArray.all) {
					if (allowedClasses.indexOf(cssClass) !== -1) {
						cssArray[cssClass] = this.cssArray.all[cssClass];
					}
				}
			} else {
				for (var cssClass in this.cssArray.all) {
					if (this.cssArray.all.hasOwnProperty(cssClass)) {
						cssArray[cssClass] = this.cssArray.all[cssClass];
					}
				}
			}
		}
			// Merge classes allowed for tagName and sort the array
		if (typeof(this.cssArray[tagName]) !== "undefined") {
			if (this.tags && this.tags[tagName]) {
				var allowedClasses = this.tags[tagName].allowedClasses;
				for (var cssClass in this.cssArray[tagName]) {
					if (allowedClasses.indexOf(cssClass) !== -1) {
						cssArray[cssClass] = this.cssArray[tagName][cssClass];
					}
				}
			} else {
				for (var cssClass in this.cssArray[tagName]) {
					if (this.cssArray[tagName].hasOwnProperty(cssClass)) {
						cssArray[cssClass] = this.cssArray[tagName][cssClass];
					}
				}
			}
			var sortedCssArray = new Object();
			var cssArrayKeys = new Array();
			for (var cssClass in cssArray) {
				if (cssArray.hasOwnProperty(cssClass)) {
					cssArrayKeys.push(cssClass);
				}
			}
			function compare(a, b) {
				x = cssArray[a];
				y = cssArray[b];
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			}
			cssArrayKeys = cssArrayKeys.sort(compare);
			for (var i = 0; i < cssArrayKeys.length; ++i) {
				sortedCssArray[cssArrayKeys[i]] = cssArray[cssArrayKeys[i]];
			}
			cssArray = sortedCssArray;
		}
		var doc = dropDown.ownerDocument;
		for (var cssClass in cssArray) {
			if (cssArray.hasOwnProperty(cssClass) && cssArray[cssClass]) {
				if (cssClass == "none") {
					dropDown.options[0].innerHTML = cssArray[cssClass];
				} else {
					var option = doc.createElement("option");
					option.value = cssClass;
					option.innerHTML = cssArray[cssClass];
					dropDown.appendChild(option);
					if (!this.editor.config.disablePCexamples && HTMLArea.classesValues && HTMLArea.classesValues[cssClass] && !HTMLArea.classesNoShow[cssClass]) {
						dropDown.options[dropDown.options.length-1].setAttribute("style", HTMLArea.classesValues[cssClass]);
					}
				}
			}
		}
	},
	
	/*
	 * This function sets the selected option of the dropDown box
	 */
	setSelectedOption : function (select, classNames, noUnknown) {
		select.selectedIndex = 0;
		if (classNames.length) {
			for (var i = select.options.length; --i >= 0;) {
				if (classNames[classNames.length-1] == select.options[i].value) {
					select.options[i].selected = true;
					select.selectedIndex = i;
					select.options[0].text = this.localize("Remove style");
					break;
				}
			}
			if (select.selectedIndex == 0 && !noUnknown) {
				select.options[select.options.length] = new Option(this.localize("Unknown style"), classNames[classNames.length-1]);
				select.options[select.options.length-1].selected = true;
				select.selectedIndex = select.options.length-1;
			}
			for (var i = select.options.length; --i >= 0;) {
				if (("," + classNames.join(",") + ",").indexOf("," + select.options[i].value + ",") !== -1) {
					if (select.selectedIndex != i) {
						select.options[i] = null;
					}
				}
			}
		}
		if (select.options.length > 1) {
			select.disabled = false;
		} else {
			select.disabled = true;
		}
	},
	
	/*
	 * This function builds the main array of class selectors
	 */
	buildCssArray : function(editor, dropDownId) {
		this.cssArray = this.parseStyleSheet();
		if (!this.cssLoaded && (this.cssParseCount < 17)) {
			var buildCssArrayLaterFunctRef = this.makeFunctionReference("buildCssArray");
			this.cssTimeout = editor._iframe.contentWindow ? editor._iframe.contentWindow.setTimeout(buildCssArrayLaterFunctRef, 200) : window.setTimeout(buildCssArrayLaterFunctRef, 200);
			this.cssParseCount++;
		} else {
			this.cssTimeout = null;
			this.cssLoaded = true;
			this.cssArray = this.sortCssArray(this.cssArray);
			this.updateValue(dropDownId);
		}
	},
	
	/*
	 * This function parses the stylesheets
	 */
	parseStyleSheet : function() {
		var iframe = this.editor._iframe.contentWindow ? this.editor._iframe.contentWindow.document : this.editor._iframe.contentDocument;
		var newCssArray = new Object();
		this.cssLoaded = true;
		for (var i = 0; i < iframe.styleSheets.length; i++) {
			if (HTMLArea.is_gecko) {
				try {
					newCssArray = this.parseCssRule(iframe.styleSheets[i].cssRules, newCssArray);
				} catch(e) {
					this.cssLoaded = false;
				}
			} else {
				try{
						// @import StyleSheets (IE)
					if (iframe.styleSheets[i].imports) {
						newCssArray = this.parseCssIEImport(iframe.styleSheets[i].imports, newCssArray);
					}
					if (iframe.styleSheets[i].rules) {
						newCssArray = this.parseCssRule(iframe.styleSheets[i].rules, newCssArray);
					}
				} catch(e) {
					this.cssLoaded = false;
				}
			}
		}
		return newCssArray;
	},
	
	/*
	 * This function parses IE import rules
	 */
	parseCssIEImport : function(cssIEImport, cssArray) {
		var newCssArray = new Object();
		newCssArray = cssArray;
		for (var i=0; i < cssIEImport.length; i++) {
			if (cssIEImport[i].imports) {
				newCssArray = this.parseCssIEImport(cssIEImport[i].imports, newCssArray);
			}
			if (cssIEImport[i].rules) {
				newCssArray = this.parseCssRule(cssIEImport[i].rules, newCssArray);
			}
		}
		return newCssArray;
	},
	
	/*
	 * This function parses gecko css rules
	 */
	parseCssRule : function(cssRules, cssArray) {
		var newCssArray = new Object();
		newCssArray = cssArray;
		for (var rule = 0; rule < cssRules.length; rule++) {
				// StyleRule
			if (cssRules[rule].selectorText) {
				newCssArray = this.parseSelectorText(cssRules[rule].selectorText, newCssArray);
			} else {
					// ImportRule (Mozilla)
				if (cssRules[rule].styleSheet) {
					newCssArray = this.parseCssRule(cssRules[rule].styleSheet.cssRules, newCssArray);
				}
					// MediaRule (Mozilla)
				if (cssRules[rule].cssRules) {
					newCssArray = this.parseCssRule(cssRules[rule].cssRules, newCssArray);
				}
			}
		}
		return newCssArray;
	},
	
	/*
	 * This function parses each selector rule
	 */
	parseSelectorText : function(selectorText, cssArray) {
		var cssElements = new Array();
		var cssElement = new Array();
		var tagName, className;
		var newCssArray = new Object();
		newCssArray = cssArray;
		if (selectorText.search(/:+/) == -1) {
				// split equal Styles (Mozilla-specific) e.q. head, body {border:0px}
				// for ie not relevant. returns allways one element
			cssElements = selectorText.split(",");
			for (var k = 0; k < cssElements.length; k++) {
				cssElement = cssElements[k].split(".");
				tagName = cssElement[0].toLowerCase().trim();
				if (!tagName) {
					tagName = "all";
				}
				className = cssElement[1];
				if (!HTMLArea.reservedClassNames.test(className)) {
					if (((tagName != "all") && (!this.tags || !this.tags[tagName]))
						|| ((tagName == "all") && (!this.tags || !this.tags[tagName]) && this.showTagFreeClasses)
						|| (this.tags && this.tags[tagName] && this.tags[tagName].allowedClasses.indexOf(className) != -1)) {
							if (!newCssArray[tagName]) {
								newCssArray[tagName] = new Object();
							}
							if (className) {
								cssName = className;
								if (HTMLArea.classesLabels && HTMLArea.classesLabels[className]) {
									cssName = this.prefixLabelWithClassName ? (className + " - " + HTMLArea.classesLabels[className]) : HTMLArea.classesLabels[className];
									cssName = this.postfixLabelWithClassName ? (cssName + " - " + className) : cssName;
								}
							} else {
								className = "none";
								cssName = this.localize("Element style");
							}
							newCssArray[tagName][className] = cssName;
					}
				}
			}
		}
		return newCssArray;
	},
	
	/*
	 * This function sorts the main array of class selectors
	 */
	sortCssArray : function(cssArray) {
		var newCssArray = new Object();
		for (var tagName in cssArray) {
			if (cssArray.hasOwnProperty(tagName)) {
				newCssArray[tagName] = new Object();
				var tagArrayKeys = new Array();
				for (var cssClass in cssArray[tagName]) {
					if (cssArray[tagName].hasOwnProperty(cssClass)) {
						tagArrayKeys.push(cssClass);
					}
				}
				function compare(a, b) {
					x = cssArray[tagName][a];
					y = cssArray[tagName][b];
					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				}
				tagArrayKeys = tagArrayKeys.sort(compare);
				for (var i = 0; i < tagArrayKeys.length; ++i) {
					newCssArray[tagName][tagArrayKeys[i]] = cssArray[tagName][tagArrayKeys[i]];
				}
			}
		}
		return newCssArray;
	}
});

