/**
 * Easy easy graph
 *
 * Library to build force directed graphs, based on d3 and jQuery
 *

Usage:

var eeg = new Eeg('#id', options);

Where options:

{
  title: "My graph",                // ( optional ) default ""
  showLegend: true/false            // ( optional ) default true
  baseURL: ''                       // ( optional ) default "" - baseUrl for resources (img,css,js)
  debug: true,                      // ( optional ) default false
  forceDistance: 100,               // ( optional ) default 200
  forceGravity: 0.5,                // ( optional ) default 0.01
  groupingForce:{                   // ( optional ) default - no additional force will be applied in any direction
    nodeType1: {x: +8, y: +3},
    nodeType1: {x: -8, y: -3}
  }
  minNodeSize: 10,                  // ( optional ) default 10
  maxNodeSize: 30,                  // ( optional ) default 30
  monitorContainerSize: true/false, // ( optional ) default false
  nodeR: 10,                        // ( optional ) default 10
  draggable: true/false             // ( optional ) default true
  colors: {                         // ( optional ) if not present the d3.scale.category10() function is used to assign colors to nodes
    nodeType1: "#ff0",
    nodeType2: "#0f0"
  },
  nodeIcons: {                            // ( optional ) if not present the nodes are shown as colored circles
    nodeType1: {                          // if present the nodes will be presented as the provided images, scale according to the node.size property
      img: "http://placehold.it/48x48",   // all images size has to be exactly 48px x 48px
      type:"round|square"                 // there are built in ones with urls "person", "place", "organization"
    },
    nodeType1: {
      img: "http://placehold.it/48x48",
      type:"round|square"
    }
  },


  linkColor: '#dedede',             // ( optional ) default: '#dedede' - color of the graph edge
  linkHoverColor : '#444',          // ( optional ) default: '#444'    - color of the graph edge on hover
  alwaysShowLinksLabels : false,    // ( optional ) default: false     - flag to indicate that links labels should be shown all time, not only on hover

  // if any of the callbacks is provided, some default actions might get broken
  // Please check the source to see what default callbacks are doing, before providing your custom ones
  onNodeUnsticky:   function(){},
  onNodeSticky:     function(){},
  onNodeDragEnd:    function(){},
  onNodeMouseOver:  function(){},
  onNodeMouseOut:   function(){},
  onNodeClick:      function(self,d,i){},
  onNodeDoubleClick:function(){},
  onNodeRemove:     function(self,clickedNode, node, i){},
  onNodeExpand:     function(self,THIS,d,i,clickedEl){  $(clickedEl).closest("div").fadeOut(); },
  onNodeCollapse:   function(self,THIS,d,i,clickedEl){},

  onLinkMouseOver:  function(){},
  onLinkMouseOut:   function(){},
  onLinkClick:      function(){},
}

To add nodes and edges to the graph use:

eeg.addNode(node)
eeg.addLink(link)

Where:
node = {
  id:string,      // mandatory
  label:string,   // mandatory
  nodeType:string,// mandatory
  size: integer   // optional - when present all nodes will have normalized sizes where min,max  ->  options.minNodeSize, options.maxNodeSize
}

link = {
  source:node,          // mandatory
  target:node,          // mandatory
  linkType:string,      // mandatory
  undirected: boolean   // optional - default false, when true no arrow is draw
  html: string,         // optional - html content as a string
  htmlElement: element, // optional - html content as dom element
  size: integer         // optional - when present all links will have normalized thickness where  min,max -> options.minLinkSize, options.maxLinkSize
  onLinkClick: function // optional if present will take preference over the one from options
                        // and will be attached only to this particular link
}

Other methods:

eeg.getOptions()
eeg.setTitle(title)

eeg.addNodes(nodes)
eeg.replaceNodes(nodes)
eeg.removeNodes(ids)
eeg.removeNode(id)
eeg.getNode(id)
eeg.getNodes()

eeg.addLinks(links)
eeg.replaceLinks(links)
eeg.removeLinks(ids)
eeg.removeLink(id)
eeg.getLink(id)
eeg.getLinks()

eeg.exportGraph()
eeg.importGraph(exportedGraph)

eeg.start()
eeg.stop()
eeg.silentlyAddNode(node)
eeg.silentlyAddLink(link)
eeg.update()

 *
 * author: szydan
 */


/*global define, window, jQuery, d3*/

(function (window, $, d3) {

  'use strict';

  function Eeg(selector, opt) {
    var self = this;

    if (typeof selector === 'string' && selector.indexOf('#') === 0) {
      this.selector = selector;     // use this one in d3 select
      this.$el = $(selector); // use this one everywhere else
    } else if (selector.jquery) {
      // in case user pass in already jQuery or JqLite element
      this.selector = selector[0];
      this.$el = selector; // use this one everywhere else
    } else {
      throw 'Error wrong Eeg selector [selector]. Currenty only "#id" is supported.';
    }


    // try to figure out baseURL
    var baseURL = $('script[src*="eg.js"]').attr('src');
    if (baseURL) {
      var lastIndex = baseURL.lastIndexOf('/');
      baseURL = baseURL.substring(0, lastIndex + 1);
    } else {
      // TODO: this will brake when library is loaded via require.js
      console.log('Could not figure out baseULR. This might happen if you renamed the js file to something else than *fdg*.js.');
      baseURL = '';
    }
    // end

    // now set the default options
    var defaultOptions = {
      autostart: true,
      baseURL: baseURL,
      debug: false,
      draggable: true,
      colors: undefined,
      fontSize: 10,
      minNodeSize: 10,
      maxNodeSize: 30,
      minLinkSize: 0.8,
      maxLinkSize: 3,
      nodeR: 10,
      title: null,
      showLegend: true,
      forceGravity: 0.01,
      forceDistance: 200,
      monitorContainerSize: false,
      // links options
      linkColor: '#dedede',
      linkHoverColor: '#444',
      linkSize: 1,
      alwaysShowLinksLabels: false,
      // nodes options
      groupingForce: {},
      nodeIcons: {},
      onNodeDragStart: function (draggedEl, d, i) {
        $(draggedEl).closest('div.nodeContextMenu').fadeOut();
        d3.event.sourceEvent.stopPropagation();
        d.fixed = true;
        d3.select(draggedEl).classed('fixed', true);
      },
      onNodeDragEnd:     function (draggedEl, d, i) {},
      onNodeSticky:      function (self, THIS, d, i, clickedEl) {
        $(clickedEl).closest('div.nodeContextMenu').fadeOut();
      },
      onNodeUnsticky:    function (self, THIS, d, i, clickedEl) {
        $(clickedEl).closest('div.nodeContextMenu').fadeOut();
      },

      onNodeClick:       function (self, d, i) {},
      onNodeDoubleClick: function () {},
      onNodeRemove:      function (clickedNode, node, i) {},
      onNodeExpand:      function (self, THIS, d, i, clickedEl) {
        $(clickedEl).closest('div').fadeOut();
      },
      onNodeCollapse:    function (self, THIS, d, i, clickedEl) {},
      onNodeMouseOver:   function (THIS, node, i) {
        d3.select(THIS).style('stroke-width', 2);
        d3.select(THIS).style('stroke', self.options.linkHoverColor);

        this.vis.selectAll('.link').filter(function (d) {
          return d.source.id === node.id || d.target.id === node.id;
        })
        .style('stroke', self.options.linkHoverColor);


        this.vis.selectAll('.linkText').filter(function (d) {
          return d.source.id === node.id || d.target.id === node.id;
        })
        .attr('style', function (d) {
          return d.htmlElement ? 'font-weight:normal' : 'font-weight:bold' ;
        })
        .attr('visibility', 'visible');

        this.vis.selectAll('.linkTextBack').filter(function (d) {
          return d.source.id === node.id || d.target.id === node.id;
        })
        .attr('visibility', 'visible');
      },
      onNodeMouseOut:    function (THIS, node, i) {
        d3.select(THIS).style('stroke-width', 1);
        d3.select(THIS).style('stroke', self.options.linkColor);

        this.vis.selectAll('.link')
        .style('stroke', self.options.linkColor);

        this.vis.selectAll('.linkText')
        .attr('style', 'font-weight:normal')
        .attr('visibility', this.options.alwaysShowLinksLabels ? 'visible' : 'hidden');

        this.vis.selectAll('.linkTextBack')
        .attr('visibility', this.options.alwaysShowLinksLabels ? 'visible' : 'hidden');
      },

      // link callbacks
      onLinkClick: function (el, d, i) {  },
      onLinkMouseOver: function (el, node, i) {

        this.vis.selectAll('.link').filter(function (d) {
          return d.source.id === node.source.id && d.target.id === node.target.id;
        })
        .style('stroke', self.options.linkHoverColor);


        this.vis.selectAll('.linkText').filter(function (d) {
          return d.source.id === node.source.id && d.target.id === node.target.id;
        })
        .attr('style', function (d) {
          return d.htmlElement ? 'font-weight:normal' : 'font-weight:bold' ;
        })
        .attr('visibility', 'visible');


        this.vis.selectAll('.linkTextBack').filter(function (d) {
          return d.source.id === node.source.id && d.target.id === node.target.id;
        })
        //.style("stroke",self.options.linkHoverColor)
        .attr('visibility', 'visible');
      },
      onLinkMouseOut: function (el, d, i) {

        this.vis.selectAll('.link')
        .style('stroke', self.options.linkColor);


        this.vis.selectAll('.linkText')
        .attr('style', 'font-weight:normal')
        .attr('visibility', this.options.alwaysShowLinksLabels ? 'visible' : 'hidden');

        this.vis.selectAll('.linkTextBack')
        .attr('visibility', this.options.alwaysShowLinksLabels ? 'visible' : 'hidden');
        //.style("stroke",self.options.linkColor)
      }
    };


    this._isFunction = function (f) {
      return Object.prototype.toString.call(f) === '[object Function]';
    };

    var _assignCallbackFunction = function (opt, name) {
      if ( opt[name] && !self._isFunction(opt[name]) ) {
        throw name +' is not a function';
      } else {
        self.options[name] = opt[name] || defaultOptions[name];
      }
    };

    this.init = function (opt) {
      this.options = {};

      // if opt provided ovveride the defaults
      if (opt) {
        this.options.autostart   = typeof opt.autostart !== 'undefined' ? opt.autostart : defaultOptions.autostart;
        this.options.baseURL     = opt.baseURL ? opt.baseURL : defaultOptions.baseURL;
        this.options.debug       = opt.debug || defaultOptions.debug;
        this.options.draggable   = typeof opt.draggable !== 'undefined' ? opt.draggable : defaultOptions.draggable;
        this.options.colors      = typeof opt.colors !== 'undefined' ? opt.colors : defaultOptions.colors;
        this.options.fontSize    = opt.fontSize || defaultOptions.fontSize;;
        this.options.minNodeSize = opt.minNodeSize || defaultOptions.minNodeSize;
        this.options.maxNodeSize = opt.maxNodeSize || defaultOptions.maxNodeSize;
        this.options.minLinkSize = opt.minLinkSize || defaultOptions.minLinkSize;
        this.options.maxLinkSize = opt.maxLinkSize || defaultOptions.maxLinkSize;
        this.options.nodeR          = opt.nodeR || defaultOptions.nodeR;
        this.options.title          = opt.title || defaultOptions.title;
        this.options.showLegend     = opt.showLegend !== undefined ? opt.showLegend : defaultOptions.showLegend;
        this.options.forceGravity   = opt.forceGravity || defaultOptions.forceGravity;
        this.options.forceDistance  = opt.forceDistance || defaultOptions.forceDistance;
        this.options.monitorContainerSize = opt.monitorContainerSize || defaultOptions.monitorContainerSize;
        // links options
        this.options.linkColor      = opt.linkColor ? opt.linkColor : defaultOptions.linkColor;
        this.options.linkHoverColor = opt.linkHoverColor ? opt.linkHoverColor : defaultOptions.linkHoverColor;
        this.options.linkSize       = opt.linkSize || defaultOptions.linkSize;
        this.options.alwaysShowLinksLabels = opt.alwaysShowLinksLabels || defaultOptions.alwaysShowLinksLabels;
        // nodes options
        this.options.groupingForce  = opt.groupingForce || defaultOptions.groupingForce;
        this.options.nodeIcons      = opt.nodeIcons     || defaultOptions.nodeIcons;

        _assignCallbackFunction(opt, 'onNodeDragStart');
        _assignCallbackFunction(opt, 'onNodeDragEnd');
        _assignCallbackFunction(opt, 'onNodeMouseOver');
        _assignCallbackFunction(opt, 'onNodeMouseOut');

        _assignCallbackFunction(opt, 'onNodeClick');
        _assignCallbackFunction(opt, 'onNodeDoubleClick');
        _assignCallbackFunction(opt, 'onNodeSticky');
        _assignCallbackFunction(opt, 'onNodeUnsticky');
        _assignCallbackFunction(opt, 'onNodeRemove');
        _assignCallbackFunction(opt, 'onNodeExpand');
        _assignCallbackFunction(opt, 'onNodeCollapse');

        _assignCallbackFunction(opt, 'onLinkClick');
        _assignCallbackFunction(opt, 'onLinkMouseOver');
        _assignCallbackFunction(opt, 'onLinkMouseOut');
      }

      // set color function
      if (this.options.colors && this.options.colors.toString() === '[object Function]') {
        this._colorFunction = opt.colors;
      } else if (this.options.colors && this.options.colors.toString() === '[object Object]') {
        this._colorFunction = function (c) {
          return opt.colors[c];
        };
      } else {
        this._colorFunction = d3.scale.category10();
      }

      // array to stored legend entries - they are collected every time when the new node is added
      this.legend = [];
      this.nodes = [];
      this.links = [];
    };

    this.init(opt);

    if (this.options.autostart) {
      this.start();
    }
  }


  Eeg.prototype = (function () {


    // private constants used later in points coordinates computation
    var C0 = 2 / Math.SQRT2;
    var C1 = (Math.SQRT2 - 1) * 0.5;


    // PRIVATE METHODS - for public pnes look at the bottom
    function _appendNodeIconPattern(d, r) {
      // we want to fit the image (square) into circle of given radius r

      // compute imge size based on r
      var iw = C0 * r;
      var ih = iw;
      // image dx = dy = iw * C1
      // compute the image dx dy based on image dimentsion
      var idx = iw * C1;
      var idy = idx;

      // having w,h, dx, dy can now create a properly sized pattern
      // to fill the circle
      // but I would need different pattern for each node size
      var imageLink = this.options.nodeIcons[d.nodeType];
      if (imageLink.indexOf('http://') !== 0) {
        imageLink = this.options.baseURL + '../img/icons/' + imageLink;
      }

      this.vis.select('defs').append('svg:pattern')
        .attr('id', 'image-' + d.nodeType + d.size)
        .attr('patternUnits', 'objectBoundingBox')
        .attr('patternContentUnits', 'userSpaceOnUse')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', '100%')
        .attr('height', '100%')
        .append('image')
        .attr('xlink:href', imageLink)
        .attr('x', idx)
        .attr('y', idy)
        .attr('width', iw)
        .attr('height', ih);
    }

    function _computeLinkSizeScale() {
      var minLinkSize = d3.min(this.links, function (d) {return d.size;}) || this.options.minLinkSize;
      var maxLinkSize = d3.max(this.links, function (d) {return d.size;}) || this.options.maxLinkSize;
      return d3.scale.linear().domain([minLinkSize, maxLinkSize]).range([this.options.minLinkSize, this.options.maxLinkSize]);
    }

    function _computeNodeSizeScale() {
      var maxRValue = d3.max(this.nodes, function (d) {return d.size;}) || this.options.maxNodeSize;
      var minRValue = d3.min(this.nodes, function (d) {return d.size;}) || this.options.minNodeSize;
      return d3.scale.linear().domain([minRValue, maxRValue]).range([this.options.minNodeSize, this.options.maxNodeSize]);
    }

    function _watch(dim, fn) {
      var self = this;

      var oldVal = self.$el.height();

      if (dim === 'width') {
        oldVal = self.$el.width();
      }

      var t = function () {
        var newVal = self.$el.height();
        if (dim === 'width') {
          newVal = self.$el.width();
        }
        if (newVal !== oldVal) {
          fn.call(self, oldVal, newVal);
          oldVal = newVal;
        }
        setTimeout(t, 250);
      };

      t();
    }


    function _drawTitle() {
      this.vis.select('.graph-title').remove();
      this.vis.append('text')
        .attr('class', 'graph-title')
        .attr('text-anchor', 'middle')
        .attr('dx', this.w / 2)
        .attr('dy', 20)
        .text(this.options.title);
    }

    function _drawLegend() {
      if (this.options.showLegend === false) {
        return;
      }
      var self = this;

      //TODO: fix it select only inside this svg
      var legendLayer = this.vis.select('#legendLayer');
      legendLayer.select('g').remove();

      legendLayer.insert('g')
        .attr('class', 'legend')
        .attr('fill', '#fff');

      var legend = legendLayer.select('.legend');
      var legendWidth = 200;

      legend.selectAll('g').data(self.legend)
      .enter()
      .append('g')
      .each(function (d, i) {
        var g = d3.select(this);

        if (d.color) {
          /*
          g.append("rect")
            .attr("x", self.w - (legendWidth +10))
            .attr("y", i*25 +10)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", d.color);
          */
          g.append('circle')
            .attr('r', d.size)
            .attr('cx', self.w - (legendWidth))
            .attr('cy', i * 25 + 10 + d.size / 2)
            .style('fill', d.color);



          g.append('text')
            .attr('x', self.w - (legendWidth - 25 + 10))
            .attr('y', i * 25 + 20)
            .attr('height', 30)
            .attr('width', 175)
            .style('fill', d.color)
            .text(d.nodeType);
        }

        if (d.icon) {
          // compute the pattern of size 10 and draw circle with fill = pattern
          if ( window.document.getElementById('image-' + d.nodeType + d.size) == null ) {
            _appendNodeIconPattern.call(self, d, d.size);
          }
          g.append('circle')
            .attr('stroke', '#dedede')
            .attr('stroke-dasharray', '3,3')
            .attr('r', d.size)
            .attr('cx', self.w - (legendWidth))
            .attr('cy', i * 25 + 10 + d.size / 2)
            .style('fill', 'url(#image-' + d.nodeType + d.size + ')');

          g.append('text')
            .attr('x', self.w - (legendWidth - 25 + 10))
            .attr('y', i * 25 + 20)
            .attr('height', 30)
            .attr('width', 175)
            .style('fill', '#000')
            .text(d.nodeType);
        }
      });

      // Now once the legend elements are there
      // grab the legend bbox width and position it properly
      var legendEl = legendLayer.select('.legend')[0][0];
      if (legendEl) {
        var gBBox;
        try {
          // this try-catch is needed because of Firefox issue
          // https://bugzilla.mozilla.org/show_bug.cgi?id=612118
          // when svg element is not visible it will throw an error
          gBBox = legendEl.getBBox();
        } catch (err) {}

        if (gBBox && gBBox.width > 0) {
          legendWidth =  gBBox.width;

          // here recalculate the position
          legend.selectAll('circle')
          .attr('cx', self.w - (legendWidth));

          legend.selectAll('text')
          .attr('x', self.w - (legendWidth - 25 + 10));
        }
      }
    }

    function _clone(o) {
      var clone;
      if (Object.prototype.toString.call(o) === '[object Array]') {
        clone = [];
        for (var i = 0; i < o.length; i++) {
          clone[i] = _clone(o[i]);
        }
      } else if (Object.prototype.toString.call(o) === '[object Object]') {
        clone = {};
        for (var p in o) {
          if (o.hasOwnProperty(p)) {
            clone[p] = o[p];
          }
        }
      } else {
        return o;
      }
      return clone;
    }


    function _sanitizeId(id) {
      // as we use the ids as querySelectors
      // replace all characters used in selectors
      // and make sure it starts a letter [A-Za-z]
      // in our case lets put a prefix id-

      // convert to string
      var safeId = '' + id;
      // add prefix if not there
      if (safeId.indexOf('eegid-') !== 0) {
        safeId = 'eegid-' + safeId;
      } else {
        console.log('TODO: fix it')
        // TODO: when calling replace nodes
        // the node with already sanitized id is passed to removeNode function
        // it might be possible to avoid this
      }

      return safeId
        .replace(/\*/g, '-star-')
        .replace(/#/g,  '-hash-')
        .replace(/\./g, '-dot-')
        .replace(/\s/g, '-space-')
        .replace(/>/g,  '-gt-')
        .replace(/:/g,  '-colon-');
    }

    function _doesNodeAlreadyExists(id) {
      for (var i = 0; i < this.nodes.length; i++) {
        if (id === this.nodes[i].id) {
          return true;
        }
      }
      return false;
    }

    function _addSingleNode(node) {
      var self = this;
      // make a copy of node object - assume a bean type of object
      var nodeCopy = {};
      for (var p in node) {
        if (node.hasOwnProperty(p)) {
          nodeCopy[p] = node[p];
        }
      }

      nodeCopy.id = _sanitizeId.call(this, nodeCopy.id);

      // first check if node with the same id already exists
      if (_doesNodeAlreadyExists.call(this, nodeCopy.id)) {
        return;
      }
      if ( !node.size) {
        nodeCopy.size = this.options.nodeR;
      }

      this.nodes.push(nodeCopy);
      _addNodeToLegend.call(this, nodeCopy);
    }


    //Return the no describing how many there are alredy links between the source and target of provided link
    //Direction does not count
    // Should work well if source and target are just ids of nodes
    //Returns -1 if there is no such link yet
    function _getTheHighestLinkNumber(link) {
      var no = -1;
      for (var i = 0; i < this.links.length; i++) {
        var l = this.links[i];
        var sourceId = link.source.id !== undefined ? link.source.id : link.source;
        var targetId = link.target.id !== undefined ? link.target.id : link.target;
        sourceId = _sanitizeId.call(this, sourceId);
        targetId = _sanitizeId.call(this, targetId);

        if (
          (sourceId === l.source.id && targetId === l.target.id ) ||
          (sourceId === l.target.id && targetId === l.source.id )
        ) {
          if (l.no > no) {
            no = l.no;
          }
        }
      }
      return no;
    }

    function _updateTotalLinksNoOnAllLinksLikeThisOne(link, totalLinksNo) {
      for (var i = 0; i < this.links.length; i++) {
        var l = this.links[i];
        var sourceId = link.source.id !== undefined ? link.source.id : link.source;
        var targetId = link.target.id !== undefined ? link.target.id : link.target;
        sourceId = _sanitizeId.call(this, sourceId);
        targetId = _sanitizeId.call(this, targetId);

        if (sourceId === targetId) {
          // self referencing links
          l.normalDirection = i % 2 === 0 ? 1 : -1;
          l.totalLinksNo = totalLinksNo;
        } else {
          // here set also normal direction
          if (sourceId === l.source.id && targetId === l.target.id) {
            l.normalDirection = 1;
            l.totalLinksNo = totalLinksNo;
          }
          if (sourceId === l.target.id && targetId === l.source.id) {
            l.normalDirection = -1;
            l.totalLinksNo = totalLinksNo;
          }
        }
      }
    }

    function _addSingleLink(link) {
      var sourceId = link.source.id !== undefined ? link.source.id : link.source;
      var targetId = link.target.id !== undefined ? link.target.id : link.target;
      sourceId = _sanitizeId.call(this, sourceId);
      targetId = _sanitizeId.call(this, targetId);

      var linkType = link.linkType || '';

      var htmlElement;
      var htmlElementWidth;
      var htmlElementHeight;
      var id = 'eeg-hidden-element-';
      if (link.htmlElement) {
        htmlElement = link.htmlElement;
        var el = $('<div id="' + id + '" style="visibility: hidden; display: inline-block;">').append(htmlElement);
        $('body').append(el);
        // calculate the width and height
        htmlElementWidth = el.width() + 2;
        htmlElementHeight = el.height() + 2;
        $('#'+ id).remove();
      } else if (link.html) {
        var el = $('<div id="' + id + '" style="visibility: hidden; display: inline-block;">').html(link.html);
        htmlElement = el.get(0);

        $('body').append(el);
        // calculate the width and height
        htmlElementWidth = el.width() + 2;
        htmlElementHeight = el.height() + 2;
        $('#'+ id).remove();
      }

      var html = link.html;
      var onLinkClick = link.onLinkClick;

      var undirected = link.undirected || false;
      var size = link.size ? link.size : this.options.linkSize;
      // here if link.no not specified generate one

      var source = _findNode.call(this, sourceId);
      var target = _findNode.call(this, targetId);
      //TODO: Why sometimes target is null ??
      if (source && target) {
        var linkNo = _getTheHighestLinkNumber.call(this, link) + 1;
        var linkId = sourceId + '-' + targetId + '-' + linkType + '-' + linkNo;
        this.links.push({
          source: source,
          target: target,
          linkType: linkType,
          undirected: undirected,
          html: html,
          htmlElement: htmlElement,
          htmlElementWidth: htmlElementWidth,
          htmlElementHeight: htmlElementHeight,
          onLinkClick: onLinkClick,
          size: size,
          no: linkNo,
          totalLinksNo: linkNo + 1,
          normalDirection: 1,
          id:linkId
        });

        if (linkNo >= 0) {
          // update totalLinkNumber on all links like this one
          _updateTotalLinksNoOnAllLinksLikeThisOne.call(this, link, linkNo + 1);
        }
      }

    }


    function _findLinkIndex(id) {
      for (var i in this.links) {
        if (this.links[i].id === id) {
          return i;
        }
      }
    }

    function _findLink(id) {
      return this.links[  _findLinkIndex.call(this, id)  ];
    }

    function _findNodeIndex(id) {
      for (var i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].id === id) return i;
      }
    }

    function _findNode(id) {
      return this.nodes[_findNodeIndex.call(this, id)];
    }

    function _removeNodeFromLegend(node) {
      // check that only 1 node with given type exists
      // if yes remove that type from legend
      var found = 0;
      var foundIndex = -1;
      for (var i = 0; i < this.legend.length; i++) {
        var l = this.legend[i];
        if (l.id === node.nodeType) {
          foundIndex = i;
          found++;
          if (found > 1) {
            break;
          }
        }
      }
      if (found === 1) {
        this.legend.splice(foundIndex, 1);
      }
    }

    function _addNodeToLegend(nodeCopy) {
      var self = this;
      // add nodeTypeToLegend
      var found = false;
      for (var i = 0; i < this.legend.length; i++) {
        var l = this.legend[i];
        if (l.id === nodeCopy.nodeType) {
          found = true;
          break;
        }
      }
      if (!found) {
        // here check that icons were used
        if ( self.options.nodeIcons[nodeCopy.nodeType]) {
          self.legend.push({
            id: nodeCopy.nodeType,
            nodeType: nodeCopy.nodeType,
            color: null,
            icon: self.options.nodeIcons[nodeCopy.nodeType],
            size: 10
          });
        }else {
          self.legend.push({
            id: nodeCopy.nodeType,
            nodeType: nodeCopy.nodeType,
            color: self._colorFunction( nodeCopy.nodeType ),
            icon: null,
            size: 7
          });
        }
      }
    }

    function _removeNode(id) {
      var safeId = _sanitizeId.call(this, id);
      var n = _findNode.call(this, safeId);

      // we have to iterate backwords as we modify the array of links at the same time
      var i = this.links.length - 1;
      while (i >= 0 ) {
        if (this.links[i] && (this.links[i].source === n || this.links[i].target === n)) {
          this.links.splice(i, 1);
        } else {
          i--;
        }
      }

      this.nodes.splice(_findNodeIndex.call(this, safeId), 1);
      _removeNodeFromLegend.call(this, n);
    }

    function _computeBuazierCurveControlPoints(P0, P3, link, nodeSizeScale) {
      var controlPoints = {
          type: 'cubiccurve'
        };

      var r;
      var dy;
      var dx;
      var P1, P2;
      // =====================================
      // self referene link
      // =====================================
      if (link.source.id === link.target.id) {
        // compute the dx and dy factors for colculating control points
        // they depend on link.no and link.normalDirection
        if (link.no % 2 === 0) {
          dy = (link.no + 1) * link.normalDirection * 4;
          dx = (link.no + 1) * 6;
        }else {
          dy = (link.no) * link.normalDirection * 4;
          dx = link.no * 6;
        }


        P1 = {
          x: P0.x - P0.size * dx,
          y: P0.y - P0.size * dy
        };
        P2 = {
          x: P3.x + P3.size * dx,
          y: P3.y - P3.size * dy
        };


        controlPoints.P1 = P1;
        controlPoints.P2 = P2;
        return controlPoints;

    // =====================================
    // links between to different nodes
    // =====================================
      } else {

        // =====================================
        // when the total links number is even
        // =====================================
        if (link.totalLinksNo % 2 === 0) {
          //var Z = _computeDistanceBetweenNodes.call(this,link);

          if (link.no % 2 === 0) {
            r = 0.1  * (link.no + 1) * link.normalDirection;
          } else {
            r = 0.1  * (link.no) * link.normalDirection;
          }

          dx = r * ( link.target.y - link.source.y);
          dy = r * ( link.target.x - link.source.x);

          if (link.no % 2 === 0) {
            // even goes two one side
            P1 = {
              x: P0.x - dx,
              y: P0.y + dy
            };
            P2 = {
              x: P3.x - dx,
              y: P3.y + dy
            };
          }else {
            //odd goes to another side
            P1 = {
              x: P0.x + dx,
              y: P0.y - dy
            };
            P2 = {
              x: P3.x + dx,
              y: P3.y - dy
            };
          }

          // move P1 of vector P0P3 * 0.2
          // move P2 of vector P3P0 * 0.2
          P1 = _movePointOfAVector.call(this, P1, P0, P3, 0.2);
          P2 = _movePointOfAVector.call(this, P2, P3, P0, 0.2);


          controlPoints.P1 = P1;
          controlPoints.P2 = P2;
          return controlPoints;


      // =====================================
      // when the total links number is odd
      // =====================================
        } else {
          if (link.no === 0 ) {
            // first link
            var cc = _computeCircleCoordinates.call(this, link, nodeSizeScale);

            controlPoints.type = 'line';
            controlPoints.P1 = {x:cc.x1, y:cc.y1};
            controlPoints.P2 = {x:cc.x2, y:cc.y2};
            return controlPoints;

          } else {
            //var Z = _computeDistanceBetweenNodes.call(this,link);

            r = 0.1 * Math.ceil(link.no / 2) * link.normalDirection;
            dx = r * ( link.target.y - link.source.y);
            dy = r * ( link.target.x - link.source.x);

            if (link.no % 2 === 0) {
              // even goes two one side
              P1 = {
                x: P0.x - dx,
                y: P0.y + dy
              };
              P2 = {
                x: P3.x - dx,
                y: P3.y + dy
              };
            } else {
              //odd goes to another side
              P1 = {
                x: P0.x + dx,
                y: P0.y - dy
              };
              P2 = {
                x: P3.x + dx,
                y: P3.y - dy
              };
            }

            // move P1 of vector P0P3 * 0.2
            // move P2 of vector P3P0 * 0.2
            P1 = _movePointOfAVector.call(this, P1, P0, P3, 0.2);
            P2 = _movePointOfAVector.call(this, P2, P3, P0, 0.2);


            controlPoints.P1 = P1;
            controlPoints.P2 = P2;
            return controlPoints;
          }
        }
      }
    }

    function _movePointOfAVector(P, V1, V2, a) {
      if (!a) {
        a = 1;
      }
      return {
        x: P.x + ( V2.x - V1.x ) * a,
        y: P.y + ( V2.y - V1.y ) * a
      };
    }

    function _computePointOnCurve(P0, P1, P2, P3, t) {
      return {
        x: Math.pow(1 - t, 3) * P0.x + 3 * Math.pow(1 - t, 2) * t * P1.x + 3 * (1 - t) * t * t * P2.x + t * t * t * P3.x,
        y: Math.pow(1 - t, 3) * P0.y + 3 * Math.pow(1 - t, 2) * t * P1.y + 3 * (1 - t) * t * t * P2.y + t * t * t * P3.y,
      };
    }

    function _computeDistanceBetweenPoints(P0, P1) {
      return Math.sqrt( Math.pow( P1.x - P0.x, 2) + Math.pow( P1.y - P0.y, 2)  );
    }

    function _computeDistanceBetweenNodes(d) {
      var Dx = d.source.x - d.target.x;
      var Dy = d.source.y - d.target.y;
      return Math.sqrt( Math.pow( Dx, 2) + Math.pow( Dy, 2)  );
    }

    function _computeBuazierCurveIntersectionWithNodeBorder(P0, P1, P2, P3) {
      // this will be done by computing the C0, C3 for series of t values and testing
      // the distance to P0C0 , P3C3
      // if the distance P0C0 > rp0

      // for C0
      var C0 = {x:P0.x, y:P0.y};
      var C3 = {x:P3.x, y:P3.y};
      var dist;
      var t;
      for (t = 0.01; t < 0.5 ; t += 0.01) {
        C0 = _computePointOnCurve.call(this, P0, P1, P2, P3, t);
        dist =  _computeDistanceBetweenPoints.call(this, P0, C0);
        if (dist > P0.size) {
          break;
        }
      }
      for (t = 0.99; t > 0.5; t -= 0.01) {
        C3 = _computePointOnCurve.call(this, P0, P1, P2, P3, t);
        dist =  _computeDistanceBetweenPoints.call(this, P3, C3);
        if (dist > P3.size) {
          break;
        }
      }

      return [C0, C3];
    }


    function _makeSureNodeStayInsideContainer(d, nodeSizeScale) {
      var r = nodeSizeScale(d.size ? d.size : this.options.nodeR );
      d.x = Math.max(r, Math.min(this.w - r, d.x));
      d.y = Math.max(r, Math.min(this.h - r, d.y));
    }

    /*
     Computes intersection of node circle and link line
     for now assumes that all links are straight lines - which is not true
     TODO: better effect if the intersection point is calculated between
     circle and actuall buazier curve
     */
    function _computeCircleCoordinates(d, nodeSizeScale) {

      //bounding box
      _makeSureNodeStayInsideContainer.call(this, d.source, nodeSizeScale);
      _makeSureNodeStayInsideContainer.call(this, d.target, nodeSizeScale);


      var Dx = d.source.x - d.target.x;
      var Dy = d.source.y - d.target.y;
      var Z = Math.sqrt( Math.pow( Dx, 2) + Math.pow( Dy, 2) );

      var sourceNodeSize = nodeSizeScale(d.source.size ? d.source.size : this.options.nodeR );
      var targetNodeSize = nodeSizeScale(d.target.size ? d.target.size : this.options.nodeR );

      var dxsource = Z !== 0 ? (sourceNodeSize * Dx) / Z : 0;
      var dysource = Z !== 0 ? (sourceNodeSize * Dy) / Z : 0;

      var dxtarget = Z !== 0 ? (targetNodeSize * Dx) / Z : 0;
      var dytarget = Z !== 0 ? (targetNodeSize * Dy) / Z : 0;

      var x1 = d.source.x - dxsource;
      var y1 = d.source.y - dysource;

      var x2 = d.target.x + dxtarget;
      var y2 = d.target.y + dytarget;

      return { x1:x1, y1:y1, x2:x2, y2:y2 };

    }

    function _computeBezierCubicCurve(P0, P3, link, nodeSizeScale) {

      // compute control points
      var controllPoints = _computeBuazierCurveControlPoints.call(this, P0, P3, link, nodeSizeScale);
      var P1 = controllPoints.P1;
      var P2 = controllPoints.P2;

      //here check that it is straight line
      if (controllPoints.type === 'line') {
        return {
          type: 'line',
          P0: controllPoints.P1,
          P1: null,
          P2: null,
          P3: controllPoints.P2
        };
      }

      // 3) compute common points of bezier curve and circle common points C0 C3
      var intersectionPoints = _computeBuazierCurveIntersectionWithNodeBorder.call(this, P0, P1, P2, P3);
      var C0 = intersectionPoints[0];
      var C3 = intersectionPoints[1];

      // 4) move control points P1 of a vector P0C0
      //    move control point  P2 of a vector P3C3
      P1 = _movePointOfAVector(P1, P0, C0);
      P2 = _movePointOfAVector(P2, P3, C3);

      return {
        type: 'cubicCurve',
        P0: C0,
        P1: P1,
        P2: P2,
        P3: C3
      };
    }



    function _update() {
      var self = this;
      _drawLegend.call(this);
      _drawTitle.call(this);


      var nodeSizeScale = _computeNodeSizeScale.call(self);
      var linkSizeScale = _computeLinkSizeScale.call(self);

      // LINKS
      var link = this.vis.select('#linksLayer').selectAll('path.link')
          .data(this.links, function (d) { return d.source.id + '-' + d.target.id + '-' + d.no; });


      link.enter().insert('path')
          .attr('class', 'link')
          .attr('fill', 'none')
          .style('stroke', self.options.linkColor)
        .attr('stroke-width', function (d) {
          return linkSizeScale( d.size );
        })
        .attr('marker-end', function (d, i) {
          return !d.undirected ? 'url(#Triangle)' : '';
        })
        .on('mouseover', function (d, i) {  self.options.onLinkMouseOver.call(self, this, d, i);  })
        .on('mouseout', function (d, i) {   self.options.onLinkMouseOut.call(self, this, d, i);  })
        .on('click', function (d, i) {      self.options.onLinkClick.call(self, this, d, i);  });


      link.exit().remove();


      // LINKS CONTROL POINT (debuging purpose)
      var createLinkNodeId = function (prefix, d) {
        return prefix + d.source.id + '-' + d.target.id + '-' + d.no;
      };

      if (this.options.debug) {
        var linkControlPoints1 = this.vis.select('#controlPoints1Layer').selectAll('circle')
            .data(this.links, function (d) {
              return createLinkNodeId('controlPoints1-', d);
            });

        var linkControlPoints2 = this.vis.select('#controlPoints2Layer').selectAll('circle')
            .data(this.links, function (d) {
              return createLinkNodeId('controlPoints2-', d);
            });

        linkControlPoints1.enter().insert('circle')
            .attr('fill', 'green')
            .attr('stroke', 'green')
            .attr('r', 2)
            .attr('stroke-width', 1);

        linkControlPoints1.exit().remove();

        linkControlPoints2.enter().insert('circle')
            .attr('fill', 'red')
            .attr('stroke', 'red')
            .attr('r', 2)
            .attr('stroke-width', 1);

        linkControlPoints2.exit().remove();
      }

      // LINK LABELS
      // experiment with foreignObject
      var filterLinks = function (flag) {
      var links = [];
      for (var i = 0; i < self.links.length; i++) {
        if (flag && self.links[i].htmlElement) {
          links.push(self.links[i]);
        } else if (!flag && !self.links[i].htmlElement) {
          links.push(self.links[i]);
        }
      }
      return links;
    };

      // TODO: refactor linkTextForeign and linkText
      // fix the positioning
      // and code duplications
      var linkTextForeign = this.vis.select('#linksLabelsLayer').selectAll('.linkText').filter(function (d) {
      return d.htmlElement ? true : false;
    }).data( filterLinks(true), function (d) {
      return createLinkNodeId('', d);
    });

      linkTextForeign.enter()
      .insert('foreignObject')
      .attr('class', 'linkText')
      .attr('dx', 0)
      .attr('dy', 0)
    .attr('width', function (d) {
      return d.htmlElementWidth;
    })
    .attr('height', function (d) {
      return d.htmlElementHeight;
    })
    .attr('id', function (d) {
      return createLinkNodeId('label-', d);
    })
    .append('xhtml:body')
    .html(function (d) {
      // here meke it so the element is added with all event handlers
      if (d.htmlElement) {
        // add a style so body does not have any padding or margin
        return '<style>body{margin:0; padding:0;}</style>' + d.htmlElement.innerHTML;
      }
      return null;
    })
    .on('mouseover', function (d, i) {  self.options.onLinkMouseOver.call(self, this, d, i);  })
    .on('mouseout', function (d, i) {   self.options.onLinkMouseOut.call(self, this, d, i);  })
    .on('click', function (d, i) {
      if (self._isFunction(d.onLinkClick)) {
        d.onLinkClick.call(self, this, d, i);
      } else {
        self.options.onLinkClick.call(self, this, d, i);
      }
    });


      linkTextForeign.exit().remove();


      var linkText = this.vis.select('#linksLabelsLayer').selectAll('.linkText').filter(function (d) {
      return d.htmlElement ? false : true;
    }).data(filterLinks(false), function (d) {
      return createLinkNodeId('', d);
    });

      linkText.enter().insert('text')
        .attr('class', 'linkText')
        .attr('text-anchor', 'middle')
        .attr('visibility', this.options.alwaysShowLinksLabels ? 'visible' : 'hidden')
        .attr('dx', 0)
        .attr('dy', 0)
      .attr('id', function (d) {
        return createLinkNodeId('label-', d);
      })
      .text(function (d) {
        return d.linkType;
      })
      .on('mouseover', function (d, i) {  self.options.onLinkMouseOver.call(self, this, d, i);  })
      .on('mouseout', function (d, i) {   self.options.onLinkMouseOut.call(self, this, d, i);  })
      .on('click', function (d, i) {
      if (self._isFunction(d.onLinkClick)) {
        d.onLinkClick.call(self, this, d, i);
      } else {
        self.options.onLinkClick.call(self, this, d, i);
      }
    });


      linkText.exit().remove();

      // LINK LABELS BACK
      var linkTextBack = this.vis.select('#linksLabelsBacklayer').selectAll('rect.linkTextBack')
    .data(this.links, function (d) {
      return createLinkNodeId('labelBack-', d);
    });

      linkTextBack.enter().insert('rect')
      .attr('class', 'linkTextBack')
      .attr('visibility', this.options.alwaysShowLinksLabels ? 'visible' : 'hidden')
    .attr('width',  function (d) {
      if (!d.linkTextBackBBox) {
        d.linkTextBackBBox = {width:60, height:12};
      }
      if (d.htmlElement) {
        d.linkTextBackBBox.width = d.htmlElementWidth;
        return d.linkTextBackBBox.width;
      }

      var linkTextEl = self.vis.select(createLinkNodeId('#label-', d))[0][0];
      if (linkTextEl) {
        var bbox = linkTextEl.getBBox();
        if (bbox.width && bbox.width > 0 ) {
          d.linkTextBackBBox = {width:bbox.width + 4, height:bbox.height + 4};
          return d.linkTextBackBBox.width;
        }
      }
      // in case there was no bbox or something went wrong return default value
      return d.linkTextBackBBox.width;
    })
    .attr('height', function (d) {
      if (!d.linkTextBackBBox) {
        d.linkTextBackBBox = {width:60, height:12};
      }

      if (d.htmlElement) {
        d.linkTextBackBBox.height = d.htmlElementHeight;
        return d.linkTextBackBBox.height;
      }
      var linkTextEl = self.vis.select(createLinkNodeId('#label-', d))[0][0];

      if (linkTextEl) {
        var bbox = linkTextEl.getBBox();
        if (bbox.width && bbox.width > 0 ) {
          d.linkTextBackBBox = {width:bbox.width + 4, height:bbox.height + 4};
          return d.linkTextBackBBox.height;
        }
      }
      // in case there was no bbox or something went wrong return default value
      return d.linkTextBackBBox.height;
    })
    .attr('stroke', function (d) {
      return self.options.debug === true ? '#000' : '#fff';
    })
    .attr('fill', '#fff')
    .on('mouseover', function (d, i) {  self.options.onLinkMouseOver.call(self, this, d, i);  })
    .on('mouseout', function (d, i) {   self.options.onLinkMouseOut.call(self, this, d, i);  })
    .on('click', function (d, i) {      self.options.onLinkClick.call(self, this, d, i);  });


      linkTextBack.exit().remove();

      //NODES

      var node = this.vis.select('#nodesLayer').selectAll('g.node')
          .data(this.nodes, function (d) { return d.id;});



      var nodeEnter = node.enter().insert('g')
          .attr('class', 'node')

      if (this.options.draggable === true) {
        nodeEnter.call(this.force.drag);
      }

      var circle = nodeEnter.append('svg:circle')
        .attr('fill', function (d) {
          var r = nodeSizeScale( d.size ? d.size : self.options.nodeR );
          if ( self.options.nodeIcons[d.nodeType] ) {
            // here create new pattern only if it does NOT exists already
            // TODO: select only from this vis
            if ( window.document.getElementById('image-' + d.nodeType + d.size) == null ) {
              _appendNodeIconPattern.call(self, d, r);
            }
            return 'url(#image-' + d.nodeType + d.size + ')';
          }
          return self._colorFunction(d.nodeType);
        })
        .attr('class', 'circle')
        .attr('r', function (d) {
          return nodeSizeScale( d.size ? d.size : self.options.nodeR );
        })
        .on('contextmenu', function (d, i) {
          var THIS = this;

          var $contextMenu  = self.$el.find('.nodeContextMenu');
          $contextMenu.find('.sticky, .unsticky, .remove, .expand, .collapse, .cancel, .info').unbind();

          // here logic what to show on context menu
          // decide based on configuration

          if (d.fixed === true) {
            $contextMenu.find('.sticky').hide();
            $contextMenu.find('.unsticky').show();
          } else {
            $contextMenu.find('.unsticky').hide();
            $contextMenu.find('.sticky').show();
          }

          if (d.expanded === true) {
            $contextMenu.find('.expand').hide();
            $contextMenu.find('.collapse').show();
          }else {
            $contextMenu.find('.collapse').hide();
            $contextMenu.find('.expand').show();
          }


          //TODO remove dependency on jQuery
          $contextMenu.css({
            'display':'block',
            'position':'absolute',
            'left': (d.x + 2  ) + 'px',
            'top':(d.y + 5 ) + 'px'
          });

          /*
          self.vis.select('.nodeContextMenu')
            .style('display', 'block')
            .style('position', 'absolute')
            .style('left', (d.x + 10 + dx )+ 'px')
            .style('top', (d.y + 10 + dy)+ 'px');
          */

          d3.event.preventDefault();


          $contextMenu.find('.info').click(function () {
            $(this).closest('div.nodeContextMenu').fadeOut();
            console.log(d);
          });

          $contextMenu.find('.cancel').click(function () {
            $(this).closest('div').fadeOut();
          });

          $contextMenu.find('.remove').click(function () {
            self.options.onNodeRemove.call(self, THIS, d, i);
            $(this).closest('div.nodeContextMenu').fadeOut();
          });


          $contextMenu.find('.expand').click(function () {
            self.options.onNodeExpand(self, THIS, d, i, this);
            $(this).closest('div').fadeOut();
          });

          $contextMenu.find('.collapse').click(function () {
            self.options.onNodeCollapse(self, THIS, d, i, this);
            $(this).closest('div').fadeOut();
          });

          $contextMenu.find('.sticky').click(function () {
            d.fixed = true;
            d3.select(THIS.parentNode).classed('fixed', true);
            self.options.onNodeSticky(self, THIS, d, i, this, function () {
              $(this).closest('div').fadeOut();
            });
          });

          $contextMenu.find('.unsticky').click(function () {
            d.fixed = false;
            d3.select(THIS.parentNode).classed('fixed', false);

            self.options.onNodeUnsticky(self, THIS, d, i, this, function () {
              $(this).closest('div').fadeOut();
            });
          });
        })
        .on('mouseover', function (d, i) {  self.options.onNodeMouseOver.call(self, this, d, i);  })
        .on('mouseout', function (d, i) {   self.options.onNodeMouseOut.call(self, this, d, i);  })
        .on('click', function (d, i) {      self.options.onNodeClick(self, d, i);  })
        .on('dblclick', function (d, i) {   self.options.onNodeDoubleClick(self, this, d, i);  });


      nodeEnter.append('text')
        .attr('class', 'nodetext')
        .attr('dx', function (d) {
          return nodeSizeScale( d.size ? d.size : self.options.nodeR );
        })
        .attr('dy', function (d) {
          return nodeSizeScale( d.size ? d.size : self.options.nodeR );
        })
        .text(function (d) {return d.label;});

      node.exit().remove();

      //here bunch of helper functions
      function movetoP(P) {
        return 'M ' + P.x + ',' + P.y;
      }


      function linetoP(P) {
        return 'L ' + P.x + ',' + P.y;
      }

      // not used at the moment
      function curvetoS(x1, y1, x2, y2) {
        return 'Q  ' + x1 + ',' + y1 + ' ' + x2 + ',' + y2;
      }

      function curvetoCubic(P1, P2, P3) {
        return 'C  ' + P1.x + ',' + P1.y + ' ' + P2.x + ',' + P2.y + ' ' + P3.x + ',' + P3.y;
      }

      // TICK
      this.force.on('tick', function (e) {
        var k = 10 * e.alpha;

        node.attr('stroke-dasharray', function (d) {
          //indicates is node fully expanded
          // '3,0' fully expanded
          // '3,3' not fully expanded
          return d.expanded === true ? '3,0' : '3,3';
        })
        .attr('transform', function (d) {

          if (self.options.groupingForce) {
            // here depends on node type give it a little push in N directions to group nodes per type
            if (self.options.groupingForce[d.nodeType]) {
              d.x += self.options.groupingForce[d.nodeType].x * k;
              d.y += self.options.groupingForce[d.nodeType].y * k;
            }
          }

          //bounding box
          _makeSureNodeStayInsideContainer.call(self, d, nodeSizeScale);
          return 'translate(' + d.x + ',' + d.y + ')';
        });



        if (self.options.debug) {
          linkControlPoints1
          .attr('cx', function (d) {
            var P0 = {
              x: d.source.x,
              y: d.source.y,
              size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
            };
            var P3 = {
              x: d.target.x,
              y: d.target.y,
              size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
            };
            var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);
            return bezierPoints.type === 'line' ? bezierPoints.P0.x : bezierPoints.P1.x;
          })
          .attr('cy', function (d) {
            var P0 = {
              x: d.source.x,
              y: d.source.y,
              size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
            };
            var P3 = {
              x: d.target.x,
              y: d.target.y,
              size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
            };
            var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);
            return bezierPoints.type === 'line' ? bezierPoints.P0.y : bezierPoints.P1.y;
          });

          linkControlPoints2
          .attr('cx', function (d) {
            var P0 = {
              x: d.source.x,
              y: d.source.y,
              size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
            };
            var P3 = {
              x: d.target.x,
              y: d.target.y,
              size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
            };
            var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);
            return bezierPoints.type === 'line' ? bezierPoints.P3.x : bezierPoints.P2.x;
          })
          .attr('cy', function (d) {
            var P0 = {
              x: d.source.x,
              y: d.source.y,
              size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
            };
            var P3 = {
              x: d.target.x,
              y: d.target.y,
              size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
            };
            var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);
            return bezierPoints.type === 'line' ? bezierPoints.P3.y : bezierPoints.P2.y;
          });
        }


        linkTextBack
        .attr('x', function (d) {
          var P0 = {
            x: d.source.x,
            y: d.source.y,
            size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
          };
          var P3 = {
            x: d.target.x,
            y: d.target.y,
            size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
          };
          var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);

          if ( bezierPoints.type === 'line') {
            return (d.source.x + d.target.x) / 2  - d.linkTextBackBBox.width / 2;
          }
          // here compute middle point

          var M = _computePointOnCurve.call(self, bezierPoints.P0, bezierPoints.P1, bezierPoints.P2, bezierPoints.P3, 0.5);
          return M.x - d.linkTextBackBBox.width / 2;
        })
        .attr('y', function (d) {
          var P0 = {
            x: d.source.x,
            y: d.source.y,
            size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
          };
          var P3 = {
            x: d.target.x,
            y: d.target.y,
            size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
          };
          var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);

          var dy;
          if (bezierPoints.type === 'line') {
            dy = (d.source.y + d.target.y - d.linkTextBackBBox.height) / 2;
            if (!d.htmlElement) {
              dy -= self.options.fontSize / 2;
            }
            return dy;
          }

          // here compute middle point
          var M = _computePointOnCurve.call(self, bezierPoints.P0, bezierPoints.P1, bezierPoints.P2, bezierPoints.P3, 0.5);
          dy = M.y - d.linkTextBackBBox.height / 2;
          if (!d.htmlElement) {
            dy -= self.options.fontSize / 2;
          }
          return dy;
        });



        linkText
        .attr('x', function (d) {
          var P0 = {
            x: d.source.x,
            y: d.source.y,
            size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
          };
          var P3 = {
            x: d.target.x,
            y: d.target.y,
            size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
          };
          var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);

          if (bezierPoints.type === 'line') {
            return (d.source.x + d.target.x) / 2;
          }
          // here compute middle point
          var M = _computePointOnCurve.call(self, bezierPoints.P0, bezierPoints.P1, bezierPoints.P2, bezierPoints.P3, 0.5);
          return M.x;
        })
        .attr('y', function (d) {
          var P0 = {
            x: d.source.x,
            y: d.source.y,
            size: nodeSizeScale(d.source.size ? d.source.size : self.options.nodeR)
          };
          var P3 = {
            x: d.target.x,
            y: d.target.y,
            size: nodeSizeScale(d.target.size ? d.target.size : self.options.nodeR)
          };
          var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);

          if (bezierPoints.type === 'line') {
            return (d.source.y + d.target.y) / 2;
          }

          // here compute middle point
          var M = _computePointOnCurve.call(self, bezierPoints.P0, bezierPoints.P1, bezierPoints.P2, bezierPoints.P3, 0.5);
          return M.y;
        });


        // this one should take into account the size of foreignObject
        linkTextForeign.attr('x', function (d) {
          var P0 = {
            x: d.source.x,
            y: d.source.y,
            size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
          };
          var P3 = {
            x: d.target.x,
            y: d.target.y,
            size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
          };
          var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);

          if (bezierPoints.type === 'line') {
            return (d.source.x + d.target.x) / 2 - d.htmlElementWidth / 2;
          }
          // here compute middle point
          var M = _computePointOnCurve.call(self, bezierPoints.P0, bezierPoints.P1, bezierPoints.P2, bezierPoints.P3, 0.5);
          return M.x - d.htmlElementWidth / 2;
        })
        .attr('y', function (d) {
          var P0 = {
            x: d.source.x,
            y: d.source.y,
            size: nodeSizeScale(d.source.size ? d.source.size : self.options.nodeR)
          };
          var P3 = {
            x: d.target.x,
            y: d.target.y,
            size: nodeSizeScale(d.target.size ? d.target.size : self.options.nodeR)
          };
          var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);

          if (bezierPoints.type === 'line') {
            return (d.source.y + d.target.y) / 2 - d.htmlElementHeight / 2;
          }

          // here compute middle point
          var M = _computePointOnCurve.call(self, bezierPoints.P0, bezierPoints.P1, bezierPoints.P2, bezierPoints.P3, 0.5);
          return M.y - d.htmlElementHeight / 2;
        });


        // depends on link.no property draw either straight line or curve
        link.attr('d', function (d) {

          // 1) take source and target centres points P0 P3 plus coresponding circles sizes
          var P0 = {
            x: d.source.x,
            y: d.source.y,
            size: nodeSizeScale ( d.source.size ? d.source.size : self.options.nodeR )
          };
          var P3 = {
            x: d.target.x,
            y: d.target.y,
            size: nodeSizeScale ( d.target.size ? d.target.size : self.options.nodeR )
          };
          var bezierPoints = _computeBezierCubicCurve.call(self, P0, P3, d, nodeSizeScale);

          if (bezierPoints.type === 'line') {
            return movetoP(bezierPoints.P0) + linetoP(bezierPoints.P3);
          }

          return movetoP(bezierPoints.P0) + curvetoCubic(bezierPoints.P1, bezierPoints.P2, bezierPoints.P3);

        })
        .attr('stroke-width', function (d) {
          // change the stroke on a ticks - investigate later why setting them on _update does not works as expected
          return linkSizeScale(d.size);
        });
      });

      this.force.start();
    }

    // ============
    // public API
    // ============

    return {
      getOptions: function () {
        return this.options;
      },

      addNode: function (node) {
        _addSingleNode.call(this, node);
        _update.call(this);
      },

      addLink: function ( link ) {
        _addSingleLink.call(this, link);
        _update.call(this);
      },

      start: function () {
        var self = this;

        self.w = self.$el.innerWidth();
        self.h = self.$el.innerHeight();

        // warn do not use self.$el here !!!
        self.vis = d3.select(self.selector).append('svg:svg')
          .attr('id', 'svg')
          .attr('style', 'width:100%; height:100%;')
          .attr('view-box', '0 0 ' + self.w + ' ' + self.h)
          .attr('preserveAspectRatio', 'xMidYMid')
          .attr('pointer-events', 'all')
          .append('svg:g');

        // Add layers
        self.vis.append('g').attr('id', 'legendLayer');
        self.vis.append('g').attr('id', 'linksLayer');
        self.vis.append('g').attr('id', 'linksLabelsBacklayer');
        self.vis.append('g').attr('id', 'linksLabelsLayer');
        self.vis.append('g').attr('id', 'nodesLayer');

        if (self.options.debug) {
          self.vis.append('g').attr('id', 'controlPoints1Layer');
          self.vis.append('g').attr('id', 'controlPoints2Layer');
        }

        var defs = this.vis.append('svg:defs');
        defs.selectAll('marker')
          .data(['normal'])
          .enter().append('svg:marker')
          .attr('id', 'Triangle')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 6)
          .attr('refY', 0)
          .attr('markerWidth', 8)
          .attr('markerHeight', 8)
          .attr('orient', 'auto')
          .append('svg:path')
          .attr('d', 'M 0,-6 L 12,0 L0,6');

        defs.append('svg:pattern')
          .attr('id', 'image')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 16)
          .attr('height', 16)
          .append('image')
          .attr('x', 2)
          .attr('y', 2)
          .attr('xlink:href', this.options.baseURL + '../img/ajax-loader.gif');

        self.force = d3.layout.force()
          .gravity(self.options.forceGravity)
          .distance(self.options.forceDistance)
          .charge(-400)
          .size([self.w, self.h]);


        var contextMenuHtml =
          '<div class="nodeContextMenu" style="display:none; position:absolute;">' +
            '<ul class="list">' +
              '<li class="cancel">Cancel</li>' +
              '<li class="expand">Expand</li>' +
              '<li class="remove">Remove</li>' +
              '<li class="collapse">Collapse</li>' +
              '<li class="sticky">Sticky</li>' +
              '<li class="unsticky">Unsticky</li>' +
            '</ul>' +
          '</div>';

        self.$el.css('position', 'relative').append(contextMenuHtml);

        var drag = this.force.drag();
        drag.on('dragstart', function (d, i) {
         self.options.onNodeDragStart.call(self, this, d, i);
        });
        drag.on('dragend', function (d, i) {
         self.options.onNodeDragEnd.call(self, this, d, i);
        });

        this.nodes = this.force.nodes();
        this.links = this.force.links();

        $(window).resize(function () {
          self.w = self.$el.width();
          self.h = self.$el.height();
          _drawLegend.call(self);
          _drawTitle.call(self);
        });

        // here watch it only when set in options
        if (this.options.monitorContainerSize) {
          _watch.call(this, 'width', function (oldVal, newVal) {
            self.w = newVal;
            _drawLegend.call(self);
            _drawTitle.call(self);
          });

          _watch.call(this, 'height', function (oldVal, newVal) {
            self.h = newVal;
            _drawLegend.call(self);
            _drawTitle.call(self);
          });
        }

        _update.call(this);
      },

      stop: function () {
        // make all nodes sticky
        for (var i = 0; i < this.nodes.length; i++) {
          this.nodes[i].fixed = 1;
        }
        this.force.stop();
      },

      addNodes: function () {
        var a = Array.prototype.slice.apply(arguments);
        var i;
        if (a.length === 1 && a[0] instanceof Array) {
          for (i = 0; i < a[0].length; i++) {
            _addSingleNode.call(this, a[0][i]);
          }
        } else {
          for (i = 0; i < a.length; i++) {
            _addSingleNode.call(this, a[i]);
          }
        }
        _update.call(this);
      },

      replaceLinks: function () {
        var a = Array.prototype.slice.apply(arguments);
        var linksToReplace = a;
        if (a.length === 1 && a[0] instanceof Array) {
          linksToReplace = a[0];
        }

        var linksToRemove = [];
        var linksToAdd = [];

        /*
        // compute links to remove - however they should already be removed when replacing nodes
        for(var i=0;i<this.links.length;i++){
            var link = this.links[i];
            var keepIt = false;
            for(var j=0;j<linksToReplace.length;j++){
                var linkCandidate = linksToReplace[j];
                if(link.source.id == linkCandidate.source.id && link.target.id == linkCandidate.target.id ){
                    keepIt = true;
                    break;
                }
            }

            if( ! keepIt){
                linksToRemove.push(link);
            }
        }
        */

        // compute links to add
        for (var j = 0; j < linksToReplace.length; j++) {
          var linkCandidate = linksToReplace[j];
          var exist = false;
          for (var i = 0; i < this.links.length; i++) {
            var l = this.links[i];
            var sourceId = linkCandidate.source.id !== undefined ? linkCandidate.source.id : linkCandidate.source;
            var targetId = linkCandidate.target.id !== undefined ? linkCandidate.target.id : linkCandidate.target;
            sourceId = _sanitizeId.call(this, sourceId);
            targetId = _sanitizeId.call(this, targetId);
            if (l.source.id === sourceId && l.target.id === targetId ) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            linksToAdd.push(linkCandidate);
          }
        }


        // add
        this.addLinks(linksToAdd);
      },

      // expect either comma separated nodes, or array of nodes
      replaceNodes: function () {
        var a = Array.prototype.slice.apply(arguments);
        var nodesToReplace = a;
        if (a.length === 1 && a[0] instanceof Array) {
          nodesToReplace = a[0];
        }

        // first clone all nodes to replace
        nodesToReplace = _clone.call(this, nodesToReplace);

        var nodesToRemove = [];
        var nodesToAdd = [];

        // compute nodes to remove
        var i, j, nodeCandidate, nodeCandidateId, node, keepIt;
        for (i = 0; i < this.nodes.length; i++) {
          node = this.nodes[i];
          keepIt = false;
          for (j = 0; j < nodesToReplace.length; j++) {
            nodeCandidate = nodesToReplace[j];
            nodeCandidateId = _sanitizeId.call(this, nodeCandidate.id);
            if (node.id === nodeCandidateId) {
              keepIt = true;
              break;
            }
          }

          if (!keepIt) {
            nodesToRemove.push(node);
          }
        }

        // remove nodes which needs to be removed
        for (i = 0; i < nodesToRemove.length; i++) {
          this.removeNode( nodesToRemove[i].id );
        }
        // compute nodes which needs to be added



        // compute links to add
        var exist;
        for (j = 0; j < nodesToReplace.length; j++) {
          nodeCandidate = nodesToReplace[j];
          nodeCandidateId = _sanitizeId.call(this, nodeCandidate.id);
          exist = false;
          for (i = 0; i < this.nodes.length; i++) {
            node = this.nodes[i];
            if (node.id === nodeCandidateId) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            nodesToAdd.push(nodeCandidate);
          }
        }

        // add
        this.addNodes(nodesToAdd);
      },

      removeNodes:function (ids) {
        for (var i = 0; i < ids.length; i++) {
          _removeNode.call(this, ids[i]);
        }
        _update.call(this);
      },

      removeNode: function (id) {
        _removeNode.call(this, id);
        _update.call(this);
      },

      getNodes: function () {
        return this.nodes;
      },

      getNode: function (id) {
        var safeId = _sanitizeId.call(this, id);
        for (var i = 0; i < this.nodes.length; i++) {
          if (this.nodes[i].id === safeId) {
            return this.nodes[i];
          }
        }
        return null;
      },

      addLinks:function () {
        var i, link;
        if (arguments.length === 1 && arguments[0] instanceof Array) {
          for (i = 0; i < arguments[0].length; i++) {
            link = arguments[0][i];
            _addSingleLink.call(this, link);
          }
        } else {
          for (i = 0; i < arguments.length; i++) {
            link = arguments[i];
            _addSingleLink.call(this, link);
          }
        }
        _update.call(this);
      },

      removeLink: function (id) {
        var safeId = _sanitizeId.call(this, id);
        var linkIndex  = _findLinkIndex.call(this, safeId);
        this.links.splice(linkIndex, 1);
        _update.call(this);
      },

      getLink: function (id) {
        var safeId = _sanitizeId.call(this, id);
        for (var i = 0; i < this.links.length; i++) {
          if (this.links[i].id === safeId) {
            return this.links[i];
          }
        }
        return null;
      },

      getLinks: function () {
        return this.links;
      },

      importGraph: function (g) {
        if (Object.prototype.toString.call(g) === '[object String]') {
          try {
            g = JSON.parse(g);
          } catch (e) {
            throw new Error('Import data should a valid JSON either as an javascript object or serialized string');
          }
        }
        this.init(g.options);
        this.start();
        this.addNodes(g.nodes);
        this.addLinks(g.links);
      },

      exportGraph: function () {
        var g = {
          options: {},
          nodes: [],
          links: []
        };

        for (var p in this.options) {
          if (this.options.hasOwnProperty(p) && p.indexOf('on') !== 0) {
            g.options[p] = _clone.call(this, this.options[p]);
          }
        }

        var i;
        for (i = 0; i < this.nodes.length; i++) {
          g.nodes.push($.extend({}, this.nodes[i]));
        }
        for (i = 0; i < this.links.length; i++) {
          var link = $.extend({}, this.links[i]);
          link.source = link.source.id;
          link.target = link.target.id;
          if (!link.html && link.htmlElement) {
            link.html = $(link.htmlElement).html();
          }
          delete link.htmlElement;
          delete link.htmlElementWidth;
          delete link.htmlElementHeight;
          delete link.totalLinksNo;
          delete link.normalDirection;
          delete link.no;
          delete link.linkTextBackBBox;
          g.links.push(link);
        }
        return g;
      },

      silentlyAddNode: function (node) {
        _addSingleNode.call(this, node);
      },

      silentlyAddLink: function (link) {
        _addSingleLink.call(this, link);
      },

      update: function () {
        _update.call(this);
      },

      setTitle: function (title) {
        this.options.title = title;
        _update.call(this);
      }
    }; // end of public API

  })();

  // Make it to work in node and browser and AMD style
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Eeg;
  } else {
    if (typeof define === 'function' && define.amd) {
      define([], function () {
        return Eeg;
      });
    } else {
      window.Eeg = Eeg;
    }
  }

})(window, jQuery, d3);


