/*\
created: 20180113145438225
title: $:/plugins/TheDiveO/TwTube/widgets/videojs.js
tags:
modified: 20180113150322040
type: application/javascript
module-type: widget
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

//
var VIDEOJS_PLUGINCFG_FILTER =
  "["
  + "all[shadows+tiddlers]"
  + "tag[$:/tags/VideojsPluginConfig]"
  + "type[application/json]"
  + "]";

// Stuff we need...
var Widget = require("$:/core/modules/widgets/widget.js").widget;

// Here be Dragons! During development we might be loaded and executed
// not only in a web browser as usual, but also in Node.js. However,
// the Video.js library won't work in Node.js -- for obvious reasons --
// and crash. Thus, when we're run inside Node.js we need to avoid
// doing anything with the Video.js library and thus just keep a
// useless stub.
var videojs = null;
if ($tw.browser) {
  // Even more dragons here: we need to lazy load the Video.js plugins.
  // That's not due to the Video.js but instead to startup issues with
  // the TiddlyWiki boot/core mechanics. To cut a long story short: we
  // simply load only when this widget module gets pulled in for the
  // first time. This seems to be safe, otherwise the plugin loader
  // might get run **after** this module initializes.
  require("$:/plugins/TheDiveO/TwTube/libraries/videojspluginloader.js")
    .loadplugins();
  videojs = require("$:/plugins/TheDiveO/TwTube/libraries/video.js");
}

// Widget constructor
var VideojsWidget = function(parseTreeNode, options) {
  this.initialise(parseTreeNode, options);
};

// Inherit from the base widget "class".
VideojsWidget.prototype = new Widget();

// Render widget into the DOM...
VideojsWidget.prototype.render = function(parent, nextSibling) {
  this.parentDomNode = parent;
  this.computeAttributes();
  this.execute();
  // Create our DOM elements...
  this.shellDomNode = this.document.createElement("div");
  this.shellDomNode.setAttribute("data-vjs-player", "");
  this.videojsDomNode = this.document.createElement("video-js");
  // General
  if (this.vidClass) {
    this.videojsDomNode.setAttribute("class", "video-js " + this.vidClass);
  } else {
    this.videojsDomNode.setAttribute("class", "video-js");
  }

  // Lump all the many video/video-js element attributes into
  // a JSON object and later hand that over in one go.
  var dataSetup = {};

  // Multikulti
  if (this.vidLanguage) {
    dataSetup["language"] = this.vidLanguage;
  }
  // Geometry
  if (this.vidAspectRatio) {
    dataSetup["aspectratio"] = this.vidAspectRatio;
  }
  if (this.vidFluid) {
    dataSetup["fluid"] = this.vidFluid;
  }
  if (this.vidWidth) {
    dataSetup["width"] = this.vidWidth;
  }
  if (this.vidHeight) {
    dataSetup["height"] = this.vidHeight;
  }
  // Player control
  if (this.vidAutoplay) {
    dataSetup["autoplay"] = this.vidAutoplay;
  }
  if (this.vidControls) {
    dataSetup["controls"] = this.vidControls;
  }
  if (this.vidLoop) {
    dataSetup["loop"] = this.vidLoop;
  }
  if (this.vidMuted) {
    dataSetup["muted"] = this.vidMuted;
  }
  if (this.vidPreload) {
    dataSetup["preload"] = this.vidPreload;
  }
  if (this.vidPoster) {
    dataSetup["poster"] = this.vidPoster;
  }
  // Plugin configuration data
  // Step (1): fetch any plugin configuration data tiddlers that might
  // be present in this TiddlyWiki. Merge the configuration data from
  // all these configuration data tiddlers.
  var pluginsdata = {};
  var pluginsdatatiddlers = $tw.wiki.filterTiddlers(VIDEOJS_PLUGINCFG_FILTER);
  $tw.utils.each(pluginsdatatiddlers, function loadplugin(pluginDataTitle, index) {
    var data = $tw.wiki.getTiddlerDataCached(pluginDataTitle, {});
    $tw.utils.extend(pluginsdata, data);
  });
  // Step (2): merge in the configuration data from the pluginsdata=
  // attribute, if specified.
  try {
    $tw.utils.extend(pluginsdata, JSON.parse(this.vidPluginsData));
  } catch (e) {};
  dataSetup["plugins"] = pluginsdata;

  // Finalize the setup parameters and then add our video element.
  this.videojsDomNode.setAttribute("data-setup", JSON.stringify(dataSetup));
  this.shellDomNode.appendChild(this.videojsDomNode);
  // ...and insert them into the DOM.
  parent.insertBefore(this.shellDomNode, nextSibling);
  this.renderChildren(this.videojsDomNode, null);
  this.domNodes.push(this.shellDomNode);
  // Now let's do the Video.js library its magic...
  if (videojs !== null) {
    videojs(this.videojsDomNode);
  }
};

// Compute the internal state of the videojs widget. Also make
// sure that all child widgets/elements get correctly created.
VideojsWidget.prototype.execute = function() {
  // Get our parameters...
  // General
  this.vidClass = this.getAttribute("class");
  // CSS classes: we take additional CSS class definitions from
  // skin plugins into account.
  var skinClasses = this.getVariable("twtube-skin-classes");
  if (skinClasses !== undefined) {
    this.vidClass += " " + skinClasses;
  }
  // Multikulti
  this.vidLanguage = this.getAttribute("language");
  //this.vidLanguages = this.getAttribute("languages");
  // Geometry
  this.vidAspectRatio = this.getAttribute("aspectratio");
  this.vidFluid = this.getAttribute("fluid");
  this.vidWidth = this.getAttribute("width");
  this.vidHeight = this.getAttribute("height");
  // Player control
  this.vidAutoplay = this.getAttribute("autoplay");
  this.vidControls = this.getAttribute("controls");
  this.vidLoop = this.getAttribute("loop");
  this.vidMuted = this.getAttribute("muted");
  this.vidPreload = this.getAttribute("preload");
  this.vidPoster = this.getAttribute("poster");
  // (plugin) configuration mechanism
  this.vidPluginsData = this.getAttribute("pluginsdata")
  // "Don't forget about the Children!"
  this.makeChildWidgets();
};

// Decide whether the video widget needs to be refreshed, either
// because its own state changed or its children.
VideojsWidget.prototype.refresh = function(changedTiddlers) {
  var changedAttributes = this.computeAttributes();
  if (
    changedAttributes["class"]
    || changedAttributes["language"]
    || changedAttributes["aspectratio"]
    || changedAttributes["fluid"]
    || changedAttributes.width
    || changedAttributes.height
    || changedAttributes["autoplay"]
    || changedAttributes["controls"]
    || changedAttributes["loop"]
    || changedAttributes["muted"]
    || changedAttributes["preload"]
    || changedAttributes["poster"]
    || changedAttributes["pluginsdata"]
  ) {
    this.refreshSelf();
    return true;
  }
  return false;
};

// Finally export our Video.js player widget so that it can be
// used as <$videojs />.
exports.videojs = VideojsWidget;

})();
