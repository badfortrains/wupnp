/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.6.11
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
  'use strict';
  var oldOnClick, self = this;


  /**
   * Whether a click is currently being tracked.
   *
   * @type boolean
   */
  this.trackingClick = false;


  /**
   * Timestamp for when when click tracking started.
   *
   * @type number
   */
  this.trackingClickStart = 0;


  /**
   * The element being tracked for a click.
   *
   * @type EventTarget
   */
  this.targetElement = null;


  /**
   * X-coordinate of touch start event.
   *
   * @type number
   */
  this.touchStartX = 0;


  /**
   * Y-coordinate of touch start event.
   *
   * @type number
   */
  this.touchStartY = 0;


  /**
   * ID of the last touch, retrieved from Touch.identifier.
   *
   * @type number
   */
  this.lastTouchIdentifier = 0;


  /**
   * Touchmove boundary, beyond which a click will be cancelled.
   *
   * @type number
   */
  this.touchBoundary = 10;


  /**
   * The FastClick layer.
   *
   * @type Element
   */
  this.layer = layer;

  if (!layer || !layer.nodeType) {
    throw new TypeError('Layer must be a document node');
  }

  /** @type function() */
  this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

  /** @type function() */
  this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

  /** @type function() */
  this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

  /** @type function() */
  this.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };

  /** @type function() */
  this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

  /** @type function() */
  this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

  if (FastClick.notNeeded(layer)) {
    return;
  }

  // Set up event handlers as required
  if (this.deviceIsAndroid) {
    layer.addEventListener('mouseover', this.onMouse, true);
    layer.addEventListener('mousedown', this.onMouse, true);
    layer.addEventListener('mouseup', this.onMouse, true);
  }

  layer.addEventListener('click', this.onClick, true);
  layer.addEventListener('touchstart', this.onTouchStart, false);
  layer.addEventListener('touchmove', this.onTouchMove, false);
  layer.addEventListener('touchend', this.onTouchEnd, false);
  layer.addEventListener('touchcancel', this.onTouchCancel, false);

  // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
  // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
  // layer when they are cancelled.
  if (!Event.prototype.stopImmediatePropagation) {
    layer.removeEventListener = function(type, callback, capture) {
      var rmv = Node.prototype.removeEventListener;
      if (type === 'click') {
        rmv.call(layer, type, callback.hijacked || callback, capture);
      } else {
        rmv.call(layer, type, callback, capture);
      }
    };

    layer.addEventListener = function(type, callback, capture) {
      var adv = Node.prototype.addEventListener;
      if (type === 'click') {
        adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
          if (!event.propagationStopped) {
            callback(event);
          }
        }), capture);
      } else {
        adv.call(layer, type, callback, capture);
      }
    };
  }

  // If a handler is already declared in the element's onclick attribute, it will be fired before
  // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
  // adding it as listener.
  if (typeof layer.onclick === 'function') {

    // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
    // - the old one won't work if passed to addEventListener directly.
    oldOnClick = layer.onclick;
    layer.addEventListener('click', function(event) {
      oldOnClick(event);
    }, false);
    layer.onclick = null;
  }
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {

  // Don't send a synthetic click to disabled inputs (issue #62)
  case 'button':
  case 'select':
  case 'textarea':
    if (target.disabled) {
      return true;
    }

    break;
  case 'input':

    // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
    if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
      return true;
    }

    break;
  case 'label':
  case 'video':
    return true;
  }

  return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
  'use strict';
  switch (target.nodeName.toLowerCase()) {
  case 'textarea':
    return true;
  case 'select':
    return !this.deviceIsAndroid;
  case 'input':
    switch (target.type) {
    case 'button':
    case 'checkbox':
    case 'file':
    case 'image':
    case 'radio':
    case 'submit':
      return false;
    }

    // No point in attempting to focus disabled inputs
    return !target.disabled && !target.readOnly;
  default:
    return (/\bneedsfocus\b/).test(target.className);
  }
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
  'use strict';
  var clickEvent, touch;

  // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
  if (document.activeElement && document.activeElement !== targetElement) {
    document.activeElement.blur();
  }

  touch = event.changedTouches[0];

  // Synthesise a click event, with an extra attribute so it can be tracked
  clickEvent = document.createEvent('MouseEvents');
  clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
  clickEvent.forwardedTouchEvent = true;
  targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
  'use strict';

  //Issue #159: Android Chrome Select Box does not open with a synthetic click event
  if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
    return 'mousedown';
  }

  return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
  'use strict';
  var length;

  // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
  if (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
    length = targetElement.value.length;
    targetElement.setSelectionRange(length, length);
  } else {
    targetElement.focus();
  }
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
  'use strict';
  var scrollParent, parentElement;

  scrollParent = targetElement.fastClickScrollParent;

  // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
  // target element was moved to another parent.
  if (!scrollParent || !scrollParent.contains(targetElement)) {
    parentElement = targetElement;
    do {
      if (parentElement.scrollHeight > parentElement.offsetHeight) {
        scrollParent = parentElement;
        targetElement.fastClickScrollParent = parentElement;
        break;
      }

      parentElement = parentElement.parentElement;
    } while (parentElement);
  }

  // Always update the scroll top tracker if possible.
  if (scrollParent) {
    scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
  }
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
  'use strict';

  // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
  if (eventTarget.nodeType === Node.TEXT_NODE) {
    return eventTarget.parentNode;
  }

  return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
  'use strict';
  var targetElement, touch, selection;

  // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
  if (event.targetTouches.length > 1) {
    return true;
  }

  targetElement = this.getTargetElementFromEventTarget(event.target);
  touch = event.targetTouches[0];

  if (this.deviceIsIOS) {

    // Only trusted events will deselect text on iOS (issue #49)
    selection = window.getSelection();
    if (selection.rangeCount && !selection.isCollapsed) {
      return true;
    }

    if (!this.deviceIsIOS4) {

      // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
      // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
      // with the same identifier as the touch event that previously triggered the click that triggered the alert.
      // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
      // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
      if (touch.identifier === this.lastTouchIdentifier) {
        event.preventDefault();
        return false;
      }

      this.lastTouchIdentifier = touch.identifier;

      // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
      // 1) the user does a fling scroll on the scrollable layer
      // 2) the user stops the fling scroll with another tap
      // then the event.target of the last 'touchend' event will be the element that was under the user's finger
      // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
      // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
      this.updateScrollParent(targetElement);
    }
  }

  this.trackingClick = true;
  this.trackingClickStart = event.timeStamp;
  this.targetElement = targetElement;

  this.touchStartX = touch.pageX;
  this.touchStartY = touch.pageY;

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((event.timeStamp - this.lastClickTime) < 200) {
    event.preventDefault();
  }

  return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
  'use strict';
  var touch = event.changedTouches[0], boundary = this.touchBoundary;

  if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
    return true;
  }

  return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
  'use strict';
  if (!this.trackingClick) {
    return true;
  }

  // If the touch has moved, cancel the click tracking
  if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
    this.trackingClick = false;
    this.targetElement = null;
  }

  return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
  'use strict';

  // Fast path for newer browsers supporting the HTML5 control attribute
  if (labelElement.control !== undefined) {
    return labelElement.control;
  }

  // All browsers under test that support touch events also support the HTML5 htmlFor attribute
  if (labelElement.htmlFor) {
    return document.getElementById(labelElement.htmlFor);
  }

  // If no for attribute exists, attempt to retrieve the first labellable descendant element
  // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
  return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
  'use strict';
  var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

  if (!this.trackingClick) {
    return true;
  }

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((event.timeStamp - this.lastClickTime) < 200) {
    this.cancelNextClick = true;
    return true;
  }

  // Reset to prevent wrong click cancel on input (issue #156).
  this.cancelNextClick = false;

  this.lastClickTime = event.timeStamp;

  trackingClickStart = this.trackingClickStart;
  this.trackingClick = false;
  this.trackingClickStart = 0;

  // On some iOS devices, the targetElement supplied with the event is invalid if the layer
  // is performing a transition or scroll, and has to be re-detected manually. Note that
  // for this to function correctly, it must be called *after* the event target is checked!
  // See issue #57; also filed as rdar://13048589 .
  if (this.deviceIsIOSWithBadTarget) {
    touch = event.changedTouches[0];

    // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
    targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
    targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
  }

  targetTagName = targetElement.tagName.toLowerCase();
  if (targetTagName === 'label') {
    forElement = this.findControl(targetElement);
    if (forElement) {
      this.focus(targetElement);
      if (this.deviceIsAndroid) {
        return false;
      }

      targetElement = forElement;
    }
  } else if (this.needsFocus(targetElement)) {

    // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
    // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
    if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
      this.targetElement = null;
      return false;
    }

    this.focus(targetElement);

    // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
    if (!this.deviceIsIOS4 || targetTagName !== 'select') {
      this.targetElement = null;
      event.preventDefault();
    }

    return false;
  }

  if (this.deviceIsIOS && !this.deviceIsIOS4) {

    // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
    // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
    scrollParent = targetElement.fastClickScrollParent;
    if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
      return true;
    }
  }

  // Prevent the actual click from going though - unless the target node is marked as requiring
  // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
  if (!this.needsClick(targetElement)) {
    event.preventDefault();
    this.sendClick(targetElement, event);
  }

  return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
  'use strict';
  this.trackingClick = false;
  this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
  'use strict';

  // If a target element was never set (because a touch event was never fired) allow the event
  if (!this.targetElement) {
    return true;
  }

  if (event.forwardedTouchEvent) {
    return true;
  }

  // Programmatically generated events targeting a specific element should be permitted
  if (!event.cancelable) {
    return true;
  }

  // Derive and check the target element to see whether the mouse event needs to be permitted;
  // unless explicitly enabled, prevent non-touch click events from triggering actions,
  // to prevent ghost/doubleclicks.
  if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

    // Prevent any user-added listeners declared on FastClick element from being fired.
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    } else {

      // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
      event.propagationStopped = true;
    }

    // Cancel the event
    event.stopPropagation();
    event.preventDefault();

    return false;
  }

  // If the mouse event is permitted, return true for the action to go through.
  return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
  'use strict';
  var permitted;

  // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
  if (this.trackingClick) {
    this.targetElement = null;
    this.trackingClick = false;
    return true;
  }

  // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
  if (event.target.type === 'submit' && event.detail === 0) {
    return true;
  }

  permitted = this.onMouse(event);

  // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
  if (!permitted) {
    this.targetElement = null;
  }

  // If clicks are permitted, return true for the action to go through.
  return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
  'use strict';
  var layer = this.layer;

  if (this.deviceIsAndroid) {
    layer.removeEventListener('mouseover', this.onMouse, true);
    layer.removeEventListener('mousedown', this.onMouse, true);
    layer.removeEventListener('mouseup', this.onMouse, true);
  }

  layer.removeEventListener('click', this.onClick, true);
  layer.removeEventListener('touchstart', this.onTouchStart, false);
  layer.removeEventListener('touchmove', this.onTouchMove, false);
  layer.removeEventListener('touchend', this.onTouchEnd, false);
  layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
  'use strict';
  var metaViewport;

  // Devices that don't support touch don't need FastClick
  if (typeof window.ontouchstart === 'undefined') {
    return true;
  }

  if ((/Chrome\/[0-9]+/).test(navigator.userAgent)) {

    // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
    if (FastClick.prototype.deviceIsAndroid) {
      metaViewport = document.querySelector('meta[name=viewport]');
      if (metaViewport && metaViewport.content.indexOf('user-scalable=no') !== -1) {
        return true;
      }

    // Chrome desktop doesn't need FastClick (issue #15)
    } else {
      return true;
    }
  }

  // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
  if (layer.style.msTouchAction === 'none') {
    return true;
  }

  return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
  'use strict';
  return new FastClick(layer);
};


if (typeof define !== 'undefined' && define.amd) {

  // AMD. Register as an anonymous module.
  define(function() {
    'use strict';
    return FastClick;
  });
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = FastClick.attach;
  module.exports.FastClick = FastClick;
} else {
  window.FastClick = FastClick;
};/* Zepto v1.0-1-ga3cab6c - polyfill zepto detect event ajax form fx - zeptojs.com/license */
(function(a){String.prototype.trim===a&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}),Array.prototype.reduce===a&&(Array.prototype.reduce=function(b){if(this===void 0||this===null)throw new TypeError;var c=Object(this),d=c.length>>>0,e=0,f;if(typeof b!="function")throw new TypeError;if(d==0&&arguments.length==1)throw new TypeError;if(arguments.length>=2)f=arguments[1];else do{if(e in c){f=c[e++];break}if(++e>=d)throw new TypeError}while(!0);while(e<d)e in c&&(f=b.call(a,f,c[e],e,c)),e++;return f})})();var Zepto=function(){function E(a){return a==null?String(a):y[z.call(a)]||"object"}function F(a){return E(a)=="function"}function G(a){return a!=null&&a==a.window}function H(a){return a!=null&&a.nodeType==a.DOCUMENT_NODE}function I(a){return E(a)=="object"}function J(a){return I(a)&&!G(a)&&a.__proto__==Object.prototype}function K(a){return a instanceof Array}function L(a){return typeof a.length=="number"}function M(a){return g.call(a,function(a){return a!=null})}function N(a){return a.length>0?c.fn.concat.apply([],a):a}function O(a){return a.replace(/::/g,"/").replace(/([A-Z]+)([A-Z][a-z])/g,"$1_$2").replace(/([a-z\d])([A-Z])/g,"$1_$2").replace(/_/g,"-").toLowerCase()}function P(a){return a in j?j[a]:j[a]=new RegExp("(^|\\s)"+a+"(\\s|$)")}function Q(a,b){return typeof b=="number"&&!l[O(a)]?b+"px":b}function R(a){var b,c;return i[a]||(b=h.createElement(a),h.body.appendChild(b),c=k(b,"").getPropertyValue("display"),b.parentNode.removeChild(b),c=="none"&&(c="block"),i[a]=c),i[a]}function S(a){return"children"in a?f.call(a.children):c.map(a.childNodes,function(a){if(a.nodeType==1)return a})}function T(c,d,e){for(b in d)e&&(J(d[b])||K(d[b]))?(J(d[b])&&!J(c[b])&&(c[b]={}),K(d[b])&&!K(c[b])&&(c[b]=[]),T(c[b],d[b],e)):d[b]!==a&&(c[b]=d[b])}function U(b,d){return d===a?c(b):c(b).filter(d)}function V(a,b,c,d){return F(b)?b.call(a,c,d):b}function W(a,b,c){c==null?a.removeAttribute(b):a.setAttribute(b,c)}function X(b,c){var d=b.className,e=d&&d.baseVal!==a;if(c===a)return e?d.baseVal:d;e?d.baseVal=c:b.className=c}function Y(a){var b;try{return a?a=="true"||(a=="false"?!1:a=="null"?null:isNaN(b=Number(a))?/^[\[\{]/.test(a)?c.parseJSON(a):a:b):a}catch(d){return a}}function Z(a,b){b(a);for(var c in a.childNodes)Z(a.childNodes[c],b)}var a,b,c,d,e=[],f=e.slice,g=e.filter,h=window.document,i={},j={},k=h.defaultView.getComputedStyle,l={"column-count":1,columns:1,"font-weight":1,"line-height":1,opacity:1,"z-index":1,zoom:1},m=/^\s*<(\w+|!)[^>]*>/,n=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,o=/^(?:body|html)$/i,p=["val","css","html","text","data","width","height","offset"],q=["after","prepend","before","append"],r=h.createElement("table"),s=h.createElement("tr"),t={tr:h.createElement("tbody"),tbody:r,thead:r,tfoot:r,td:s,th:s,"*":h.createElement("div")},u=/complete|loaded|interactive/,v=/^\.([\w-]+)$/,w=/^#([\w-]*)$/,x=/^[\w-]+$/,y={},z=y.toString,A={},B,C,D=h.createElement("div");return A.matches=function(a,b){if(!a||a.nodeType!==1)return!1;var c=a.webkitMatchesSelector||a.mozMatchesSelector||a.oMatchesSelector||a.matchesSelector;if(c)return c.call(a,b);var d,e=a.parentNode,f=!e;return f&&(e=D).appendChild(a),d=~A.qsa(e,b).indexOf(a),f&&D.removeChild(a),d},B=function(a){return a.replace(/-+(.)?/g,function(a,b){return b?b.toUpperCase():""})},C=function(a){return g.call(a,function(b,c){return a.indexOf(b)==c})},A.fragment=function(b,d,e){b.replace&&(b=b.replace(n,"<$1></$2>")),d===a&&(d=m.test(b)&&RegExp.$1),d in t||(d="*");var g,h,i=t[d];return i.innerHTML=""+b,h=c.each(f.call(i.childNodes),function(){i.removeChild(this)}),J(e)&&(g=c(h),c.each(e,function(a,b){p.indexOf(a)>-1?g[a](b):g.attr(a,b)})),h},A.Z=function(a,b){return a=a||[],a.__proto__=c.fn,a.selector=b||"",a},A.isZ=function(a){return a instanceof A.Z},A.init=function(b,d){if(!b)return A.Z();if(F(b))return c(h).ready(b);if(A.isZ(b))return b;var e;if(K(b))e=M(b);else if(I(b))e=[J(b)?c.extend({},b):b],b=null;else if(m.test(b))e=A.fragment(b.trim(),RegExp.$1,d),b=null;else{if(d!==a)return c(d).find(b);e=A.qsa(h,b)}return A.Z(e,b)},c=function(a,b){return A.init(a,b)},c.extend=function(a){var b,c=f.call(arguments,1);return typeof a=="boolean"&&(b=a,a=c.shift()),c.forEach(function(c){T(a,c,b)}),a},A.qsa=function(a,b){var c;return H(a)&&w.test(b)?(c=a.getElementById(RegExp.$1))?[c]:[]:a.nodeType!==1&&a.nodeType!==9?[]:f.call(v.test(b)?a.getElementsByClassName(RegExp.$1):x.test(b)?a.getElementsByTagName(b):a.querySelectorAll(b))},c.contains=function(a,b){return a!==b&&a.contains(b)},c.type=E,c.isFunction=F,c.isWindow=G,c.isArray=K,c.isPlainObject=J,c.isEmptyObject=function(a){var b;for(b in a)return!1;return!0},c.inArray=function(a,b,c){return e.indexOf.call(b,a,c)},c.camelCase=B,c.trim=function(a){return a.trim()},c.uuid=0,c.support={},c.expr={},c.map=function(a,b){var c,d=[],e,f;if(L(a))for(e=0;e<a.length;e++)c=b(a[e],e),c!=null&&d.push(c);else for(f in a)c=b(a[f],f),c!=null&&d.push(c);return N(d)},c.each=function(a,b){var c,d;if(L(a)){for(c=0;c<a.length;c++)if(b.call(a[c],c,a[c])===!1)return a}else for(d in a)if(b.call(a[d],d,a[d])===!1)return a;return a},c.grep=function(a,b){return g.call(a,b)},window.JSON&&(c.parseJSON=JSON.parse),c.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){y["[object "+b+"]"]=b.toLowerCase()}),c.fn={forEach:e.forEach,reduce:e.reduce,push:e.push,sort:e.sort,indexOf:e.indexOf,concat:e.concat,map:function(a){return c(c.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return c(f.apply(this,arguments))},ready:function(a){return u.test(h.readyState)?a(c):h.addEventListener("DOMContentLoaded",function(){a(c)},!1),this},get:function(b){return b===a?f.call(this):this[b>=0?b:b+this.length]},toArray:function(){return this.get()},size:function(){return this.length},remove:function(){return this.each(function(){this.parentNode!=null&&this.parentNode.removeChild(this)})},each:function(a){return e.every.call(this,function(b,c){return a.call(b,c,b)!==!1}),this},filter:function(a){return F(a)?this.not(this.not(a)):c(g.call(this,function(b){return A.matches(b,a)}))},add:function(a,b){return c(C(this.concat(c(a,b))))},is:function(a){return this.length>0&&A.matches(this[0],a)},not:function(b){var d=[];if(F(b)&&b.call!==a)this.each(function(a){b.call(this,a)||d.push(this)});else{var e=typeof b=="string"?this.filter(b):L(b)&&F(b.item)?f.call(b):c(b);this.forEach(function(a){e.indexOf(a)<0&&d.push(a)})}return c(d)},has:function(a){return this.filter(function(){return I(a)?c.contains(this,a):c(this).find(a).size()})},eq:function(a){return a===-1?this.slice(a):this.slice(a,+a+1)},first:function(){var a=this[0];return a&&!I(a)?a:c(a)},last:function(){var a=this[this.length-1];return a&&!I(a)?a:c(a)},find:function(a){var b,d=this;return typeof a=="object"?b=c(a).filter(function(){var a=this;return e.some.call(d,function(b){return c.contains(b,a)})}):this.length==1?b=c(A.qsa(this[0],a)):b=this.map(function(){return A.qsa(this,a)}),b},closest:function(a,b){var d=this[0],e=!1;typeof a=="object"&&(e=c(a));while(d&&!(e?e.indexOf(d)>=0:A.matches(d,a)))d=d!==b&&!H(d)&&d.parentNode;return c(d)},parents:function(a){var b=[],d=this;while(d.length>0)d=c.map(d,function(a){if((a=a.parentNode)&&!H(a)&&b.indexOf(a)<0)return b.push(a),a});return U(b,a)},parent:function(a){return U(C(this.pluck("parentNode")),a)},children:function(a){return U(this.map(function(){return S(this)}),a)},contents:function(){return this.map(function(){return f.call(this.childNodes)})},siblings:function(a){return U(this.map(function(a,b){return g.call(S(b.parentNode),function(a){return a!==b})}),a)},empty:function(){return this.each(function(){this.innerHTML=""})},pluck:function(a){return c.map(this,function(b){return b[a]})},show:function(){return this.each(function(){this.style.display=="none"&&(this.style.display=null),k(this,"").getPropertyValue("display")=="none"&&(this.style.display=R(this.nodeName))})},replaceWith:function(a){return this.before(a).remove()},wrap:function(a){var b=F(a);if(this[0]&&!b)var d=c(a).get(0),e=d.parentNode||this.length>1;return this.each(function(f){c(this).wrapAll(b?a.call(this,f):e?d.cloneNode(!0):d)})},wrapAll:function(a){if(this[0]){c(this[0]).before(a=c(a));var b;while((b=a.children()).length)a=b.first();c(a).append(this)}return this},wrapInner:function(a){var b=F(a);return this.each(function(d){var e=c(this),f=e.contents(),g=b?a.call(this,d):a;f.length?f.wrapAll(g):e.append(g)})},unwrap:function(){return this.parent().each(function(){c(this).replaceWith(c(this).children())}),this},clone:function(){return this.map(function(){return this.cloneNode(!0)})},hide:function(){return this.css("display","none")},toggle:function(b){return this.each(function(){var d=c(this);(b===a?d.css("display")=="none":b)?d.show():d.hide()})},prev:function(a){return c(this.pluck("previousElementSibling")).filter(a||"*")},next:function(a){return c(this.pluck("nextElementSibling")).filter(a||"*")},html:function(b){return b===a?this.length>0?this[0].innerHTML:null:this.each(function(a){var d=this.innerHTML;c(this).empty().append(V(this,b,a,d))})},text:function(b){return b===a?this.length>0?this[0].textContent:null:this.each(function(){this.textContent=b})},attr:function(c,d){var e;return typeof c=="string"&&d===a?this.length==0||this[0].nodeType!==1?a:c=="value"&&this[0].nodeName=="INPUT"?this.val():!(e=this[0].getAttribute(c))&&c in this[0]?this[0][c]:e:this.each(function(a){if(this.nodeType!==1)return;if(I(c))for(b in c)W(this,b,c[b]);else W(this,c,V(this,d,a,this.getAttribute(c)))})},removeAttr:function(a){return this.each(function(){this.nodeType===1&&W(this,a)})},prop:function(b,c){return c===a?this[0]&&this[0][b]:this.each(function(a){this[b]=V(this,c,a,this[b])})},data:function(b,c){var d=this.attr("data-"+O(b),c);return d!==null?Y(d):a},val:function(b){return b===a?this[0]&&(this[0].multiple?c(this[0]).find("option").filter(function(a){return this.selected}).pluck("value"):this[0].value):this.each(function(a){this.value=V(this,b,a,this.value)})},offset:function(a){if(a)return this.each(function(b){var d=c(this),e=V(this,a,b,d.offset()),f=d.offsetParent().offset(),g={top:e.top-f.top,left:e.left-f.left};d.css("position")=="static"&&(g.position="relative"),d.css(g)});if(this.length==0)return null;var b=this[0].getBoundingClientRect();return{left:b.left+window.pageXOffset,top:b.top+window.pageYOffset,width:Math.round(b.width),height:Math.round(b.height)}},css:function(a,c){if(arguments.length<2&&typeof a=="string")return this[0]&&(this[0].style[B(a)]||k(this[0],"").getPropertyValue(a));var d="";if(E(a)=="string")!c&&c!==0?this.each(function(){this.style.removeProperty(O(a))}):d=O(a)+":"+Q(a,c);else for(b in a)!a[b]&&a[b]!==0?this.each(function(){this.style.removeProperty(O(b))}):d+=O(b)+":"+Q(b,a[b])+";";return this.each(function(){this.style.cssText+=";"+d})},index:function(a){return a?this.indexOf(c(a)[0]):this.parent().children().indexOf(this[0])},hasClass:function(a){return e.some.call(this,function(a){return this.test(X(a))},P(a))},addClass:function(a){return this.each(function(b){d=[];var e=X(this),f=V(this,a,b,e);f.split(/\s+/g).forEach(function(a){c(this).hasClass(a)||d.push(a)},this),d.length&&X(this,e+(e?" ":"")+d.join(" "))})},removeClass:function(b){return this.each(function(c){if(b===a)return X(this,"");d=X(this),V(this,b,c,d).split(/\s+/g).forEach(function(a){d=d.replace(P(a)," ")}),X(this,d.trim())})},toggleClass:function(b,d){return this.each(function(e){var f=c(this),g=V(this,b,e,X(this));g.split(/\s+/g).forEach(function(b){(d===a?!f.hasClass(b):d)?f.addClass(b):f.removeClass(b)})})},scrollTop:function(){if(!this.length)return;return"scrollTop"in this[0]?this[0].scrollTop:this[0].scrollY},position:function(){if(!this.length)return;var a=this[0],b=this.offsetParent(),d=this.offset(),e=o.test(b[0].nodeName)?{top:0,left:0}:b.offset();return d.top-=parseFloat(c(a).css("margin-top"))||0,d.left-=parseFloat(c(a).css("margin-left"))||0,e.top+=parseFloat(c(b[0]).css("border-top-width"))||0,e.left+=parseFloat(c(b[0]).css("border-left-width"))||0,{top:d.top-e.top,left:d.left-e.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||h.body;while(a&&!o.test(a.nodeName)&&c(a).css("position")=="static")a=a.offsetParent;return a})}},c.fn.detach=c.fn.remove,["width","height"].forEach(function(b){c.fn[b]=function(d){var e,f=this[0],g=b.replace(/./,function(a){return a[0].toUpperCase()});return d===a?G(f)?f["inner"+g]:H(f)?f.documentElement["offset"+g]:(e=this.offset())&&e[b]:this.each(function(a){f=c(this),f.css(b,V(this,d,a,f[b]()))})}}),q.forEach(function(a,b){var d=b%2;c.fn[a]=function(){var a,e=c.map(arguments,function(b){return a=E(b),a=="object"||a=="array"||b==null?b:A.fragment(b)}),f,g=this.length>1;return e.length<1?this:this.each(function(a,h){f=d?h:h.parentNode,h=b==0?h.nextSibling:b==1?h.firstChild:b==2?h:null,e.forEach(function(a){if(g)a=a.cloneNode(!0);else if(!f)return c(a).remove();Z(f.insertBefore(a,h),function(a){a.nodeName!=null&&a.nodeName.toUpperCase()==="SCRIPT"&&(!a.type||a.type==="text/javascript")&&!a.src&&window.eval.call(window,a.innerHTML)})})})},c.fn[d?a+"To":"insert"+(b?"Before":"After")]=function(b){return c(b)[a](this),this}}),A.Z.prototype=c.fn,A.uniq=C,A.deserializeValue=Y,c.zepto=A,c}();window.Zepto=Zepto,"$"in window||(window.$=Zepto),function(a){function b(a){var b=this.os={},c=this.browser={},d=a.match(/WebKit\/([\d.]+)/),e=a.match(/(Android)\s+([\d.]+)/),f=a.match(/(iPad).*OS\s([\d_]+)/),g=!f&&a.match(/(iPhone\sOS)\s([\d_]+)/),h=a.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),i=h&&a.match(/TouchPad/),j=a.match(/Kindle\/([\d.]+)/),k=a.match(/Silk\/([\d._]+)/),l=a.match(/(BlackBerry).*Version\/([\d.]+)/),m=a.match(/(BB10).*Version\/([\d.]+)/),n=a.match(/(RIM\sTablet\sOS)\s([\d.]+)/),o=a.match(/PlayBook/),p=a.match(/Chrome\/([\d.]+)/)||a.match(/CriOS\/([\d.]+)/),q=a.match(/Firefox\/([\d.]+)/);if(c.webkit=!!d)c.version=d[1];e&&(b.android=!0,b.version=e[2]),g&&(b.ios=b.iphone=!0,b.version=g[2].replace(/_/g,".")),f&&(b.ios=b.ipad=!0,b.version=f[2].replace(/_/g,".")),h&&(b.webos=!0,b.version=h[2]),i&&(b.touchpad=!0),l&&(b.blackberry=!0,b.version=l[2]),m&&(b.bb10=!0,b.version=m[2]),n&&(b.rimtabletos=!0,b.version=n[2]),o&&(c.playbook=!0),j&&(b.kindle=!0,b.version=j[1]),k&&(c.silk=!0,c.version=k[1]),!k&&b.android&&a.match(/Kindle Fire/)&&(c.silk=!0),p&&(c.chrome=!0,c.version=p[1]),q&&(c.firefox=!0,c.version=q[1]),b.tablet=!!(f||o||e&&!a.match(/Mobile/)||q&&a.match(/Tablet/)),b.phone=!b.tablet&&!!(e||g||h||l||m||p&&a.match(/Android/)||p&&a.match(/CriOS\/([\d.]+)/)||q&&a.match(/Mobile/))}b.call(a,navigator.userAgent),a.__detect=b}(Zepto),function(a){function g(a){return a._zid||(a._zid=d++)}function h(a,b,d,e){b=i(b);if(b.ns)var f=j(b.ns);return(c[g(a)]||[]).filter(function(a){return a&&(!b.e||a.e==b.e)&&(!b.ns||f.test(a.ns))&&(!d||g(a.fn)===g(d))&&(!e||a.sel==e)})}function i(a){var b=(""+a).split(".");return{e:b[0],ns:b.slice(1).sort().join(" ")}}function j(a){return new RegExp("(?:^| )"+a.replace(" "," .* ?")+"(?: |$)")}function k(b,c,d){a.type(b)!="string"?a.each(b,d):b.split(/\s/).forEach(function(a){d(a,c)})}function l(a,b){return a.del&&(a.e=="focus"||a.e=="blur")||!!b}function m(a){return f[a]||a}function n(b,d,e,h,j,n){var o=g(b),p=c[o]||(c[o]=[]);k(d,e,function(c,d){var e=i(c);e.fn=d,e.sel=h,e.e in f&&(d=function(b){var c=b.relatedTarget;if(!c||c!==this&&!a.contains(this,c))return e.fn.apply(this,arguments)}),e.del=j&&j(d,c);var g=e.del||d;e.proxy=function(a){var c=g.apply(b,[a].concat(a.data));return c===!1&&(a.preventDefault(),a.stopPropagation()),c},e.i=p.length,p.push(e),b.addEventListener(m(e.e),e.proxy,l(e,n))})}function o(a,b,d,e,f){var i=g(a);k(b||"",d,function(b,d){h(a,b,d,e).forEach(function(b){delete c[i][b.i],a.removeEventListener(m(b.e),b.proxy,l(b,f))})})}function t(b){var c,d={originalEvent:b};for(c in b)!r.test(c)&&b[c]!==undefined&&(d[c]=b[c]);return a.each(s,function(a,c){d[a]=function(){return this[c]=p,b[a].apply(b,arguments)},d[c]=q}),d}function u(a){if(!("defaultPrevented"in a)){a.defaultPrevented=!1;var b=a.preventDefault;a.preventDefault=function(){this.defaultPrevented=!0,b.call(this)}}}var b=a.zepto.qsa,c={},d=1,e={},f={mouseenter:"mouseover",mouseleave:"mouseout"};e.click=e.mousedown=e.mouseup=e.mousemove="MouseEvents",a.event={add:n,remove:o},a.proxy=function(b,c){if(a.isFunction(b)){var d=function(){return b.apply(c,arguments)};return d._zid=g(b),d}if(typeof c=="string")return a.proxy(b[c],b);throw new TypeError("expected function")},a.fn.bind=function(a,b){return this.each(function(){n(this,a,b)})},a.fn.unbind=function(a,b){return this.each(function(){o(this,a,b)})},a.fn.one=function(a,b){return this.each(function(c,d){n(this,a,b,null,function(a,b){return function(){var c=a.apply(d,arguments);return o(d,b,a),c}})})};var p=function(){return!0},q=function(){return!1},r=/^([A-Z]|layer[XY]$)/,s={preventDefault:"isDefaultPrevented",stopImmediatePropagation:"isImmediatePropagationStopped",stopPropagation:"isPropagationStopped"};a.fn.delegate=function(b,c,d){return this.each(function(e,f){n(f,c,d,b,function(c){return function(d){var e,g=a(d.target).closest(b,f).get(0);if(g)return e=a.extend(t(d),{currentTarget:g,liveFired:f}),c.apply(g,[e].concat([].slice.call(arguments,1)))}})})},a.fn.undelegate=function(a,b,c){return this.each(function(){o(this,b,c,a)})},a.fn.live=function(b,c){return a(document.body).delegate(this.selector,b,c),this},a.fn.die=function(b,c){return a(document.body).undelegate(this.selector,b,c),this},a.fn.on=function(b,c,d){return!c||a.isFunction(c)?this.bind(b,c||d):this.delegate(c,b,d)},a.fn.off=function(b,c,d){return!c||a.isFunction(c)?this.unbind(b,c||d):this.undelegate(c,b,d)},a.fn.trigger=function(b,c){if(typeof b=="string"||a.isPlainObject(b))b=a.Event(b);return u(b),b.data=c,this.each(function(){"dispatchEvent"in this&&this.dispatchEvent(b)})},a.fn.triggerHandler=function(b,c){var d,e;return this.each(function(f,g){d=t(typeof b=="string"?a.Event(b):b),d.data=c,d.target=g,a.each(h(g,b.type||b),function(a,b){e=b.proxy(d);if(d.isImmediatePropagationStopped())return!1})}),e},"focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select keydown keypress keyup error".split(" ").forEach(function(b){a.fn[b]=function(a){return a?this.bind(b,a):this.trigger(b)}}),["focus","blur"].forEach(function(b){a.fn[b]=function(a){return a?this.bind(b,a):this.each(function(){try{this[b]()}catch(a){}}),this}}),a.Event=function(a,b){typeof a!="string"&&(b=a,a=b.type);var c=document.createEvent(e[a]||"Events"),d=!0;if(b)for(var f in b)f=="bubbles"?d=!!b[f]:c[f]=b[f];return c.initEvent(a,d,!0,null,null,null,null,null,null,null,null,null,null,null,null),c.isDefaultPrevented=function(){return this.defaultPrevented},c}}(Zepto),function($){function triggerAndReturn(a,b,c){var d=$.Event(b);return $(a).trigger(d,c),!d.defaultPrevented}function triggerGlobal(a,b,c,d){if(a.global)return triggerAndReturn(b||document,c,d)}function ajaxStart(a){a.global&&$.active++===0&&triggerGlobal(a,null,"ajaxStart")}function ajaxStop(a){a.global&&!--$.active&&triggerGlobal(a,null,"ajaxStop")}function ajaxBeforeSend(a,b){var c=b.context;if(b.beforeSend.call(c,a,b)===!1||triggerGlobal(b,c,"ajaxBeforeSend",[a,b])===!1)return!1;triggerGlobal(b,c,"ajaxSend",[a,b])}function ajaxSuccess(a,b,c){var d=c.context,e="success";c.success.call(d,a,e,b),triggerGlobal(c,d,"ajaxSuccess",[b,c,a]),ajaxComplete(e,b,c)}function ajaxError(a,b,c,d){var e=d.context;d.error.call(e,c,b,a),triggerGlobal(d,e,"ajaxError",[c,d,a]),ajaxComplete(b,c,d)}function ajaxComplete(a,b,c){var d=c.context;c.complete.call(d,b,a),triggerGlobal(c,d,"ajaxComplete",[b,c]),ajaxStop(c)}function empty(){}function mimeToDataType(a){return a&&(a=a.split(";",2)[0]),a&&(a==htmlType?"html":a==jsonType?"json":scriptTypeRE.test(a)?"script":xmlTypeRE.test(a)&&"xml")||"text"}function appendQuery(a,b){return(a+"&"+b).replace(/[&?]{1,2}/,"?")}function serializeData(a){a.processData&&a.data&&$.type(a.data)!="string"&&(a.data=$.param(a.data,a.traditional)),a.data&&(!a.type||a.type.toUpperCase()=="GET")&&(a.url=appendQuery(a.url,a.data))}function parseArguments(a,b,c,d){var e=!$.isFunction(b);return{url:a,data:e?b:undefined,success:e?$.isFunction(c)?c:undefined:b,dataType:e?d||c:c}}function serialize(a,b,c,d){var e,f=$.isArray(b);$.each(b,function(b,g){e=$.type(g),d&&(b=c?d:d+"["+(f?"":b)+"]"),!d&&f?a.add(g.name,g.value):e=="array"||!c&&e=="object"?serialize(a,g,c,b):a.add(b,g)})}var jsonpID=0,document=window.document,key,name,rscript=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,scriptTypeRE=/^(?:text|application)\/javascript/i,xmlTypeRE=/^(?:text|application)\/xml/i,jsonType="application/json",htmlType="text/html",blankRE=/^\s*$/;$.active=0,$.ajaxJSONP=function(a){if("type"in a){var b="jsonp"+ ++jsonpID,c=document.createElement("script"),d=function(){clearTimeout(g),$(c).remove(),delete window[b]},e=function(c){d();if(!c||c=="timeout")window[b]=empty;ajaxError(null,c||"abort",f,a)},f={abort:e},g;return ajaxBeforeSend(f,a)===!1?(e("abort"),!1):(window[b]=function(b){d(),ajaxSuccess(b,f,a)},c.onerror=function(){e("error")},c.src=a.url.replace(/=\?/,"="+b),$("head").append(c),a.timeout>0&&(g=setTimeout(function(){e("timeout")},a.timeout)),f)}return $.ajax(a)},$.ajaxSettings={type:"GET",beforeSend:empty,success:empty,error:empty,complete:empty,context:null,global:!0,xhr:function(){return new window.XMLHttpRequest},accepts:{script:"text/javascript, application/javascript",json:jsonType,xml:"application/xml, text/xml",html:htmlType,text:"text/plain"},crossDomain:!1,timeout:0,processData:!0,cache:!0},$.ajax=function(options){var settings=$.extend({},options||{});for(key in $.ajaxSettings)settings[key]===undefined&&(settings[key]=$.ajaxSettings[key]);ajaxStart(settings),settings.crossDomain||(settings.crossDomain=/^([\w-]+:)?\/\/([^\/]+)/.test(settings.url)&&RegExp.$2!=window.location.host),settings.url||(settings.url=window.location.toString()),serializeData(settings),settings.cache===!1&&(settings.url=appendQuery(settings.url,"_="+Date.now()));var dataType=settings.dataType,hasPlaceholder=/=\?/.test(settings.url);if(dataType=="jsonp"||hasPlaceholder)return hasPlaceholder||(settings.url=appendQuery(settings.url,"callback=?")),$.ajaxJSONP(settings);var mime=settings.accepts[dataType],baseHeaders={},protocol=/^([\w-]+:)\/\//.test(settings.url)?RegExp.$1:window.location.protocol,xhr=settings.xhr(),abortTimeout;settings.crossDomain||(baseHeaders["X-Requested-With"]="XMLHttpRequest"),mime&&(baseHeaders.Accept=mime,mime.indexOf(",")>-1&&(mime=mime.split(",",2)[0]),xhr.overrideMimeType&&xhr.overrideMimeType(mime));if(settings.contentType||settings.contentType!==!1&&settings.data&&settings.type.toUpperCase()!="GET")baseHeaders["Content-Type"]=settings.contentType||"application/x-www-form-urlencoded";settings.headers=$.extend(baseHeaders,settings.headers||{}),xhr.onreadystatechange=function(){if(xhr.readyState==4){xhr.onreadystatechange=empty,clearTimeout(abortTimeout);var result,error=!1;if(xhr.status>=200&&xhr.status<300||xhr.status==304||xhr.status==0&&protocol=="file:"){dataType=dataType||mimeToDataType(xhr.getResponseHeader("content-type")),result=xhr.responseText;try{dataType=="script"?(1,eval)(result):dataType=="xml"?result=xhr.responseXML:dataType=="json"&&(result=blankRE.test(result)?null:$.parseJSON(result))}catch(e){error=e}error?ajaxError(error,"parsererror",xhr,settings):ajaxSuccess(result,xhr,settings)}else ajaxError(null,xhr.status?"error":"abort",xhr,settings)}};var async="async"in settings?settings.async:!0;xhr.open(settings.type,settings.url,async);for(name in settings.headers)xhr.setRequestHeader(name,settings.headers[name]);return ajaxBeforeSend(xhr,settings)===!1?(xhr.abort(),!1):(settings.timeout>0&&(abortTimeout=setTimeout(function(){xhr.onreadystatechange=empty,xhr.abort(),ajaxError(null,"timeout",xhr,settings)},settings.timeout)),xhr.send(settings.data?settings.data:null),xhr)},$.get=function(a,b,c,d){return $.ajax(parseArguments.apply(null,arguments))},$.post=function(a,b,c,d){var e=parseArguments.apply(null,arguments);return e.type="POST",$.ajax(e)},$.getJSON=function(a,b,c){var d=parseArguments.apply(null,arguments);return d.dataType="json",$.ajax(d)},$.fn.load=function(a,b,c){if(!this.length)return this;var d=this,e=a.split(/\s/),f,g=parseArguments(a,b,c),h=g.success;return e.length>1&&(g.url=e[0],f=e[1]),g.success=function(a){d.html(f?$("<div>").html(a.replace(rscript,"")).find(f):a),h&&h.apply(d,arguments)},$.ajax(g),this};var escape=encodeURIComponent;$.param=function(a,b){var c=[];return c.add=function(a,b){this.push(escape(a)+"="+escape(b))},serialize(c,a,b),c.join("&").replace(/%20/g,"+")}}(Zepto),function(a){a.fn.serializeArray=function(){var b=[],c;return a(Array.prototype.slice.call(this.get(0).elements)).each(function(){c=a(this);var d=c.attr("type");this.nodeName.toLowerCase()!="fieldset"&&!this.disabled&&d!="submit"&&d!="reset"&&d!="button"&&(d!="radio"&&d!="checkbox"||this.checked)&&b.push({name:c.attr("name"),value:c.val()})}),b},a.fn.serialize=function(){var a=[];return this.serializeArray().forEach(function(b){a.push(encodeURIComponent(b.name)+"="+encodeURIComponent(b.value))}),a.join("&")},a.fn.submit=function(b){if(b)this.bind("submit",b);else if(this.length){var c=a.Event("submit");this.eq(0).trigger(c),c.defaultPrevented||this.get(0).submit()}return this}}(Zepto),function(a,b){function s(a){return t(a.replace(/([a-z])([A-Z])/,"$1-$2"))}function t(a){return a.toLowerCase()}function u(a){return d?d+a:t(a)}var c="",d,e,f,g={Webkit:"webkit",Moz:"",O:"o",ms:"MS"},h=window.document,i=h.createElement("div"),j=/^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,k,l,m,n,o,p,q,r={};a.each(g,function(a,e){if(i.style[a+"TransitionProperty"]!==b)return c="-"+t(a)+"-",d=e,!1}),k=c+"transform",r[l=c+"transition-property"]=r[m=c+"transition-duration"]=r[n=c+"transition-timing-function"]=r[o=c+"animation-name"]=r[p=c+"animation-duration"]=r[q=c+"animation-timing-function"]="",a.fx={off:d===b&&i.style.transitionProperty===b,speeds:{_default:400,fast:200,slow:600},cssPrefix:c,transitionEnd:u("TransitionEnd"),animationEnd:u("AnimationEnd")},a.fn.animate=function(b,c,d,e){return a.isPlainObject(c)&&(d=c.easing,e=c.complete,c=c.duration),c&&(c=(typeof c=="number"?c:a.fx.speeds[c]||a.fx.speeds._default)/1e3),this.anim(b,c,d,e)},a.fn.anim=function(c,d,e,f){var g,h={},i,t="",u=this,v,w=a.fx.transitionEnd;d===b&&(d=.4),a.fx.off&&(d=0);if(typeof c=="string")h[o]=c,h[p]=d+"s",h[q]=e||"linear",w=a.fx.animationEnd;else{i=[];for(g in c)j.test(g)?t+=g+"("+c[g]+") ":(h[g]=c[g],i.push(s(g)));t&&(h[k]=t,i.push(k)),d>0&&typeof c=="object"&&(h[l]=i.join(", "),h[m]=d+"s",h[n]=e||"linear")}return v=function(b){if(typeof b!="undefined"){if(b.target!==b.currentTarget)return;a(b.target).unbind(w,v)}a(this).css(r),f&&f.call(this)},d>0&&this.bind(w,v),this.size()&&this.get(0).clientLeft,this.css(h),d<=0&&setTimeout(function(){u.each(function(){v.call(this)})},0),this},i=null}(Zepto);(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,v=e.reduce,h=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,_=Object.keys,j=i.bind,w=function(n){return n instanceof w?n:this instanceof w?(this._wrapped=n,void 0):new w(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=w),exports._=w):n._=w,w.VERSION="1.4.3";var A=w.each=w.forEach=function(n,t,e){if(null!=n)if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a in n)if(w.has(n,a)&&t.call(e,n[a],a,n)===r)return};w.map=w.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e[e.length]=t.call(r,n,u,i)}),e)};var O="Reduce of empty array with no initial value";w.reduce=w.foldl=w.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduce===v)return e&&(t=w.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},w.reduceRight=w.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduceRight===h)return e&&(t=w.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=w.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},w.find=w.detect=function(n,t,r){var e;return E(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},w.filter=w.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&(e[e.length]=n)}),e)},w.reject=function(n,t,r){return w.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},w.every=w.all=function(n,t,e){t||(t=w.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var E=w.some=w.any=function(n,t,e){t||(t=w.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};w.contains=w.include=function(n,t){return null==n?!1:y&&n.indexOf===y?-1!=n.indexOf(t):E(n,function(n){return n===t})},w.invoke=function(n,t){var r=o.call(arguments,2);return w.map(n,function(n){return(w.isFunction(t)?t:n[t]).apply(n,r)})},w.pluck=function(n,t){return w.map(n,function(n){return n[t]})},w.where=function(n,t){return w.isEmpty(t)?[]:w.filter(n,function(n){for(var r in t)if(t[r]!==n[r])return!1;return!0})},w.max=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.max.apply(Math,n);if(!t&&w.isEmpty(n))return-1/0;var e={computed:-1/0,value:-1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;a>=e.computed&&(e={value:n,computed:a})}),e.value},w.min=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.min.apply(Math,n);if(!t&&w.isEmpty(n))return 1/0;var e={computed:1/0,value:1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;e.computed>a&&(e={value:n,computed:a})}),e.value},w.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=w.random(r++),e[r-1]=e[t],e[t]=n}),e};var F=function(n){return w.isFunction(n)?n:function(t){return t[n]}};w.sortBy=function(n,t,r){var e=F(t);return w.pluck(w.map(n,function(n,t,u){return{value:n,index:t,criteria:e.call(r,n,t,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||void 0===r)return 1;if(e>r||void 0===e)return-1}return n.index<t.index?-1:1}),"value")};var k=function(n,t,r,e){var u={},i=F(t||w.identity);return A(n,function(t,a){var o=i.call(r,t,a,n);e(u,o,t)}),u};w.groupBy=function(n,t,r){return k(n,t,r,function(n,t,r){(w.has(n,t)?n[t]:n[t]=[]).push(r)})},w.countBy=function(n,t,r){return k(n,t,r,function(n,t){w.has(n,t)||(n[t]=0),n[t]++})},w.sortedIndex=function(n,t,r,e){r=null==r?w.identity:F(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;u>r.call(e,n[o])?i=o+1:a=o}return i},w.toArray=function(n){return n?w.isArray(n)?o.call(n):n.length===+n.length?w.map(n,w.identity):w.values(n):[]},w.size=function(n){return null==n?0:n.length===+n.length?n.length:w.keys(n).length},w.first=w.head=w.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:o.call(n,0,t)},w.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},w.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},w.rest=w.tail=w.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},w.compact=function(n){return w.filter(n,w.identity)};var R=function(n,t,r){return A(n,function(n){w.isArray(n)?t?a.apply(r,n):R(n,t,r):r.push(n)}),r};w.flatten=function(n,t){return R(n,t,[])},w.without=function(n){return w.difference(n,o.call(arguments,1))},w.uniq=w.unique=function(n,t,r,e){w.isFunction(t)&&(e=r,r=t,t=!1);var u=r?w.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:w.contains(a,r))||(a.push(r),i.push(n[e]))}),i},w.union=function(){return w.uniq(c.apply(e,arguments))},w.intersection=function(n){var t=o.call(arguments,1);return w.filter(w.uniq(n),function(n){return w.every(t,function(t){return w.indexOf(t,n)>=0})})},w.difference=function(n){var t=c.apply(e,o.call(arguments,1));return w.filter(n,function(n){return!w.contains(t,n)})},w.zip=function(){for(var n=o.call(arguments),t=w.max(w.pluck(n,"length")),r=Array(t),e=0;t>e;e++)r[e]=w.pluck(n,""+e);return r},w.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},w.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=w.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},w.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},w.range=function(n,t,r){1>=arguments.length&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=Array(e);e>u;)i[u++]=n,n+=r;return i};var I=function(){};w.bind=function(n,t){var r,e;if(n.bind===j&&j)return j.apply(n,o.call(arguments,1));if(!w.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));I.prototype=n.prototype;var u=new I;I.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},w.bindAll=function(n){var t=o.call(arguments,1);return 0==t.length&&(t=w.functions(n)),A(t,function(t){n[t]=w.bind(n[t],n)}),n},w.memoize=function(n,t){var r={};return t||(t=w.identity),function(){var e=t.apply(this,arguments);return w.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},w.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},w.defer=function(n){return w.delay.apply(w,[n,1].concat(o.call(arguments,1)))},w.throttle=function(n,t){var r,e,u,i,a=0,o=function(){a=new Date,u=null,i=n.apply(r,e)};return function(){var c=new Date,l=t-(c-a);return r=this,e=arguments,0>=l?(clearTimeout(u),u=null,a=c,i=n.apply(r,e)):u||(u=setTimeout(o,l)),i}},w.debounce=function(n,t,r){var e,u;return function(){var i=this,a=arguments,o=function(){e=null,r||(u=n.apply(i,a))},c=r&&!e;return clearTimeout(e),e=setTimeout(o,t),c&&(u=n.apply(i,a)),u}},w.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},w.wrap=function(n,t){return function(){var r=[n];return a.apply(r,arguments),t.apply(this,r)}},w.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},w.after=function(n,t){return 0>=n?t():function(){return 1>--n?t.apply(this,arguments):void 0}},w.keys=_||function(n){if(n!==Object(n))throw new TypeError("Invalid object");var t=[];for(var r in n)w.has(n,r)&&(t[t.length]=r);return t},w.values=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push(n[r]);return t},w.pairs=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push([r,n[r]]);return t},w.invert=function(n){var t={};for(var r in n)w.has(n,r)&&(t[n[r]]=r);return t},w.functions=w.methods=function(n){var t=[];for(var r in n)w.isFunction(n[r])&&t.push(r);return t.sort()},w.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},w.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},w.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)w.contains(r,u)||(t[u]=n[u]);return t},w.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)null==n[r]&&(n[r]=t[r])}),n},w.clone=function(n){return w.isObject(n)?w.isArray(n)?n.slice():w.extend({},n):n},w.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof w&&(n=n._wrapped),t instanceof w&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==t+"";case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;r.push(n),e.push(t);var a=0,o=!0;if("[object Array]"==u){if(a=n.length,o=a==t.length)for(;a--&&(o=S(n[a],t[a],r,e)););}else{var c=n.constructor,f=t.constructor;if(c!==f&&!(w.isFunction(c)&&c instanceof c&&w.isFunction(f)&&f instanceof f))return!1;for(var s in n)if(w.has(n,s)&&(a++,!(o=w.has(t,s)&&S(n[s],t[s],r,e))))break;if(o){for(s in t)if(w.has(t,s)&&!a--)break;o=!a}}return r.pop(),e.pop(),o};w.isEqual=function(n,t){return S(n,t,[],[])},w.isEmpty=function(n){if(null==n)return!0;if(w.isArray(n)||w.isString(n))return 0===n.length;for(var t in n)if(w.has(n,t))return!1;return!0},w.isElement=function(n){return!(!n||1!==n.nodeType)},w.isArray=x||function(n){return"[object Array]"==l.call(n)},w.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){w["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),w.isArguments(arguments)||(w.isArguments=function(n){return!(!n||!w.has(n,"callee"))}),w.isFunction=function(n){return"function"==typeof n},w.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},w.isNaN=function(n){return w.isNumber(n)&&n!=+n},w.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},w.isNull=function(n){return null===n},w.isUndefined=function(n){return void 0===n},w.has=function(n,t){return f.call(n,t)},w.noConflict=function(){return n._=t,this},w.identity=function(n){return n},w.times=function(n,t,r){for(var e=Array(n),u=0;n>u;u++)e[u]=t.call(r,u);return e},w.random=function(n,t){return null==t&&(t=n,n=0),n+(0|Math.random()*(t-n+1))};var T={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"}};T.unescape=w.invert(T.escape);var M={escape:RegExp("["+w.keys(T.escape).join("")+"]","g"),unescape:RegExp("("+w.keys(T.unescape).join("|")+")","g")};w.each(["escape","unescape"],function(n){w[n]=function(t){return null==t?"":(""+t).replace(M[n],function(t){return T[n][t]})}}),w.result=function(n,t){if(null==n)return null;var r=n[t];return w.isFunction(r)?r.call(n):r},w.mixin=function(n){A(w.functions(n),function(t){var r=w[t]=n[t];w.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(w,n))}})};var N=0;w.uniqueId=function(n){var t=""+ ++N;return n?n+t:t},w.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var q=/(.)^/,B={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\t|\u2028|\u2029/g;w.template=function(n,t,r){r=w.defaults({},r,w.templateSettings);var e=RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join("|")+"|$","g"),u=0,i="__p+='";n.replace(e,function(t,r,e,a,o){return i+=n.slice(u,o).replace(D,function(n){return"\\"+B[n]}),r&&(i+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(i+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),a&&(i+="';\n"+a+"\n__p+='"),u=o+t.length,t}),i+="';\n",r.variable||(i="with(obj||{}){\n"+i+"}\n"),i="var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n"+i+"return __p;\n";try{var a=Function(r.variable||"obj","_",i)}catch(o){throw o.source=i,o}if(t)return a(t,w);var c=function(n){return a.call(this,n,w)};return c.source="function("+(r.variable||"obj")+"){\n"+i+"}",c},w.chain=function(n){return w(n).chain()};var z=function(n){return this._chain?w(n).chain():n};w.mixin(w),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];w.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];w.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),w.extend(w.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}).call(this);;//     Backbone.js 0.9.10

//     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to array methods.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '0.9.10';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
    } else if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
    } else {
      return true;
    }
  };

  // Optimized internal dispatch function for triggering events. Tries to
  // keep the usual cases speedy (most Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length;
    switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx);
    return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0]);
    return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
    return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
    return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind one or more space separated events, or an events map,
    // to a `callback` function. Passing `"all"` will bind the callback to
    // all events fired.
    on: function(name, callback, context) {
      if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;
      this._events || (this._events = {});
      var list = this._events[name] || (this._events[name] = []);
      list.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind events to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!(eventsApi(this, 'once', name, [callback, context]) && callback)) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      this.on(name, once, context);
      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var list, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (list = this._events[name]) {
          events = [];
          if (callback || context) {
            for (j = 0, k = list.length; j < k; j++) {
              ev = list[j];
              if ((callback && callback !== ev.callback &&
                               callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                events.push(ev);
              }
            }
          }
          this._events[name] = events;
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // An inversion-of-control version of `on`. Tell *this* object to listen to
    // an event in another object ... keeping track of what it's listening to.
    listenTo: function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      obj.on(name, typeof name === 'object' ? this : callback, this);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return;
      if (obj) {
        obj.off(name, typeof name === 'object' ? this : callback, this);
        if (!name && !callback) delete listeners[obj._listenerId];
      } else {
        if (typeof name === 'object') callback = this;
        for (var id in listeners) {
          listeners[id].off(name, callback, this);
        }
        this._listeners = {};
      }
      return this;
    }
  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Create a new model, with defined attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options && options.collection) this.collection = options.collection;
    if (options && options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // ----------------------------------------------------------------------

    // Set a hash of model attributes on the object, firing `"change"` unless
    // you choose to silence it.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"` unless you choose
    // to silence it. `unset` is a noop if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // ---------------------------------------------------------------------

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overriden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
      };
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, success, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      success = options.success;
      options.success = function(model, resp, options) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
      };

      // Finish configuring and sending the Ajax request.
      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(model, resp, options) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
      };

      if (this.isNew()) {
        options.success(this, null, options);
        return false;
      }

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return !this.validate || !this.validate(this.attributes, options);
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire a general
    // `"error"` event and call the error callback, if specified.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, options || {});
      return false;
    }

  });

  // Backbone.Collection
  // -------------------

  // Provides a standard collection class for our sets of models, ordered
  // or unordered. If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this.models = [];
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, model, attrs, existing, doSort, add, at, sort, sortAttr;
      add = [];
      at = options.at;
      sort = this.comparator && (at == null) && options.sort != false;
      sortAttr = _.isString(this.comparator) ? this.comparator : null;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(attrs = models[i], options))) {
          this.trigger('invalid', this, attrs, options);
          continue;
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.merge) {
            existing.set(attrs === model ? model.attributes : attrs, options);
            if (sort && !doSort && existing.hasChanged(sortAttr)) doSort = true;
          }
          continue;
        }

        // This is a new model, push it to the `add` list.
        add.push(model);

        // Listen to added models' events, and index models for lookup by
        // `id` and by `cid`.
        model.on('all', this._onModelEvent, this);
        this._byId[model.cid] = model;
        if (model.id != null) this._byId[model.id] = model;
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (add.length) {
        if (sort) doSort = true;
        this.length += add.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(add));
        } else {
          push.apply(this.models, add);
        }
      }

      // Silently sort the collection if appropriate.
      if (doSort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = add.length; i < l; i++) {
        (model = add[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (doSort) this.trigger('sort', this, options);

      return this;
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      this._idAttr || (this._idAttr = this.model.prototype.idAttribute);
      return this._byId[obj.id || obj.cid || obj[this._idAttr] || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of `filter`.
    where: function(attrs) {
      if (_.isEmpty(attrs)) return [];
      return this.filter(function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) {
        throw new Error('Cannot sort a set without a comparator');
      }
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Smartly update a collection with a change set of models, adding,
    // removing, and merging as necessary.
    update: function(models, options) {
      options = _.extend({add: true, merge: true, remove: true}, options);
      if (options.parse) models = this.parse(models, options);
      var model, i, l, existing;
      var add = [], remove = [], modelMap = {};

      // Allow a single model (or no argument) to be passed.
      if (!_.isArray(models)) models = models ? [models] : [];

      // Proxy to `add` for this case, no need to iterate...
      if (options.add && !options.remove) return this.add(models, options);

      // Determine which models to add and merge, and which to remove.
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i];
        existing = this.get(model);
        if (options.remove && existing) modelMap[existing.cid] = true;
        if ((options.add && !existing) || (options.merge && existing)) {
          add.push(model);
        }
      }
      if (options.remove) {
        for (i = 0, l = this.models.length; i < l; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) remove.push(model);
        }
      }

      // Remove models (if applicable) before we add and merge the rest.
      if (remove.length) this.remove(remove, options);
      if (add.length) this.add(add, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any `add` or `remove` events. Fires `reset` when finished.
    reset: function(models, options) {
      options || (options = {});
      if (options.parse) models = this.parse(models, options);
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models.slice();
      this._reset();
      if (models) this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `update: true` is passed, the response
    // data will be passed through the `update` method instead of `reset`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(collection, resp, options) {
        var method = options.update ? 'update' : 'reset';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
      };
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Reset all internal state. Called when the collection is reset.
    _reset: function() {
      this.length = 0;
      this.models.length = 0;
      this._byId  = {};
    },

    // Prepare a model or hash of attributes to be added to this collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) return false;
      return model;
    },

    // Internal method to remove a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    },

    sortedIndex: function (model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (!callback) callback = this[name];
      Backbone.history.route(route, _.bind(function(fragment) {
        var args = this._extractParameters(route, fragment);
        callback && callback.apply(this, args);
        this.trigger.apply(this, ['route:' + name].concat(args));
        this.trigger('route', name, args);
        Backbone.history.trigger('route', this, name, args);
      }, this));
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted parameters.
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on URL fragments. If the
  // browser does not support `onhashchange`, falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Backbone.View
  // -------------

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) throw new Error('Method "' + events[key] + '" does not exist');
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(model, collection, id, className)*, are
    // attached directly to the view.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    var success = options.success;
    options.success = function(resp) {
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };

    var error = options.error;
    options.error = function(xhr) {
      if (error) error(model, xhr, options);
      model.trigger('error', model, xhr, options);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

}).call(this);;window.JST = {'category.container':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/category.container.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="popup"' + ">" + "</div>");
            __.line = 2, __.col = 1;
            __.push("<div" + ' id="category-container"' + ">" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'category.info':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/category.info.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            if (!servers.length) {
                {
                    __.line = 2, __.col = 3;
                    __.push("<div" + ' class="info no-server"' + ">" + "No upnp media servers detected on the network, add a server to begin" + "</div>");
                }
            } else {
                {
                    __.line = 4, __.col = 3;
                    __.push("<div" + ' class="info no-tracks"' + ">" + "No tracks selected, add tracks from a server:");
                    __.line = 5, __.col = 5;
                    __.push("<ul" + ' class="playlists"' + ">");
                    __.line = 6, __.col = 7;
                    servers.each(function(item) {
                        {
                            __.line = 7, __.col = 9;
                            var id = item.id;
                            __.line = 8, __.col = 9;
                            var status = item.get("status");
                            __.line = 9, __.col = 9;
                            __.push("<li");
                            __.r.attrs({
                                id: {
                                    v: id,
                                    e: 1
                                },
                                "class": {
                                    v: status,
                                    e: 1
                                }
                            }, __);
                            __.push(">");
                            __.line = 10, __.col = 11;
                            __.push("<a");
                            __.r.attrs({
                                href: {
                                    v: "/directory/" + id + "/0",
                                    e: 1
                                }
                            }, __);
                            __.push(">");
                            __.line = 11, __.col = 13;
                            __.push(__.r.escape(item.get("name")) + "</a>");
                            __.line = 12, __.col = 11;
                            __.push("<div" + ' class="loading"' + ">");
                            __.line = 13, __.col = 13;
                            __.push("[ loading");
                            __.line = 14, __.col = 13;
                            __.push("<i" + ' class="icon-refresh icon-spin"' + ">" + "</i>");
                            __.line = 15, __.col = 13;
                            __.push("]" + "</div>" + "</li>");
                        }
                    });
                    __.push("</ul>" + "</div>");
                }
            }
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'category.nav':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/category.nav.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<nav" + ">");
            __.line = 2, __.col = 3;
            __.push("<a" + ' href="/category/Artist"' + ' class="active Artist"' + ' cat="Artist"' + ">" + "Artists" + "</a>");
            __.line = 3, __.col = 3;
            __.push("<a" + ' href="/category/Album"' + ' cat="Album"' + ' class="Album"' + ">" + "Albums" + "</a>");
            __.line = 4, __.col = 3;
            __.push("<a" + ' href="/category/Title"' + ' cat="Title"' + ' class="Title"' + ">" + "Tracks" + "</a>" + "</nav>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'category.popup':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/category.popup.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="top-box"' + ">");
            __.line = 2, __.col = 3;
            __.push("<h1" + ' class="play"' + ">");
            __.line = 3, __.col = 5;
            __.push("<i" + ' class="icon-play-circle"' + ">" + "</i>");
            __.line = 4, __.col = 5;
            __.push("<span" + ' class="divider"' + ">" + "| " + "</span>");
            __.line = 5, __.col = 5;
            __.push("<span" + ' class="next"' + ">" + "Play Next" + "</span>" + "</h1>");
            __.line = 6, __.col = 3;
            __.push("<h1" + ' class="add"' + ">" + " Add to playlist" + "</h1>");
            __.line = 7, __.col = 3;
            __.push("<h1" + ' class="new"' + ">" + " Create new playlist" + "</h1>" + "</div>");
            __.line = 8, __.col = 1;
            __.push("<div" + ' class="bottom-box add"' + ">" + "</div>");
            __.line = 9, __.col = 1;
            __.push("<div" + ' class="bottom-box new"' + ">");
            __.line = 10, __.col = 3;
            __.push("<form" + ">");
            __.line = 11, __.col = 5;
            __.push("<input" + ' type="text"' + ' class="name"' + "/>");
            __.line = 12, __.col = 5;
            __.push("<input" + ' type="submit"' + ' class="submit"' + "/>" + "</form>" + "</div>");
            __.line = 13, __.col = 1;
            __.push("<span" + ' class="cancel"' + ">" + "cancel" + "</span>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'category.show':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/category.show.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            var title = model.getTitle();
            __.line = 2, __.col = 1;
            var docs = model.get("docs");
            __.line = 3, __.col = 1;
            var name;
            __.line = 5, __.col = 1;
            if (title) {
                __.line = 6, __.col = 3;
                __.push("<span" + ' class="title"' + ">");
                __.line = 7, __.col = 5;
                __.push(__.r.escape(title) + "</span>");
            }
            var current = jumper && docs && docs.length > 20 ? " " : String.fromCharCode(99999);
            __.line = 9, __.col = 1;
            __.push("<div" + ' class="category-list"' + ">");
            __.line = 10, __.col = 3;
            __.push("<ul" + ">");
            __.line = 11, __.col = 5;
            __.r.foreach(__, docs, function(item) {
                __.line = 12, __.col = 7;
                name = item.Title || item;
                __.line = 13, __.col = 7;
                if (name.toUpperCase()[0] > current) {
                    {
                        __.line = 14, __.col = 9;
                        current = name.toUpperCase()[0];
                        __.line = 15, __.col = 9;
                        __.push("<li" + ' class="jumper"');
                        __.r.attrs({
                            id: {
                                v: "jumper" + current,
                                e: 1
                            }
                        }, __);
                        __.push(">" + "</li>");
                    }
                }
                __.line = 17, __.col = 7;
                if (item._id) {
                    __.line = 18, __.col = 9;
                    __.push("<li");
                    __.r.attrs({
                        id: {
                            v: item._id,
                            e: 1
                        }
                    }, __);
                    __.push(">" + __.r.escape(name) + "</li>");
                } else {
                    __.line = 20, __.col = 9;
                    __.push("<li" + ">" + __.r.escape(name) + "</li>");
                }
            });
            __.push("</ul>" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'directory.container':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/directory.container.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="popup server"' + ">");
            __.line = 2, __.col = 3;
            __.push("<h1" + ">" + "Add tracks from current directory?" + "</h1>");
            __.line = 3, __.col = 3;
            __.push("<h2" + ' class="ok"' + ">" + "ok" + "</h2>");
            __.line = 4, __.col = 3;
            __.push("<h2" + ' class="cancel"' + ">" + "cancel" + "</h2>" + "</div>");
            __.line = 5, __.col = 1;
            __.push("<div" + ' id="category-container"' + ">" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'header':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/header.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="nav-wrap"' + ">");
            __.line = 2, __.col = 3;
            __.push("<span" + ' class="menuLink icon-reorder"' + ">" + "</span>");
            __.line = 3, __.col = 3;
            __.push("<div" + ' id="subnav"' + ">" + "</div>" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'loader':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/loader.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="icon-spinner icon-spin loader"' + ">" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'menu':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/menu.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="musicLink"' + ">");
            __.line = 2, __.col = 3;
            __.push("<i" + ' class="icon-chevron-left"' + ">" + "</i>");
            __.line = 3, __.col = 3;
            __.push("Music " + "</div>");
            __.line = 4, __.col = 1;
            __.push("<div" + ' class="lists"' + ">");
            __.line = 5, __.col = 3;
            __.push("<h1" + ">" + "Play To" + "</h1>");
            __.line = 6, __.col = 3;
            __.push("<ul" + ' class="renderers"' + ">");
            __.line = 7, __.col = 5;
            renderers.each(function(item) {
                {
                    __.line = 8, __.col = 7;
                    var uuid = item.get("uuid");
                    __.line = 9, __.col = 7;
                    __.push("<li");
                    __.r.attrs({
                        id: {
                            v: uuid,
                            e: 1
                        }
                    }, __);
                    __.push(">");
                    __.line = 10, __.col = 9;
                    __.push("<span" + ">");
                    __.line = 11, __.col = 11;
                    __.push(__.r.escape(item.get("name")) + "</span>");
                    __.line = 12, __.col = 9;
                    __.push("<i" + ' class="icon-circle"' + ">" + "</i>" + "</li>");
                }
            });
            __.push("</ul>");
            __.line = 14, __.col = 3;
            __.push("<h1" + ">" + "Playlists" + "</h1>");
            __.line = 15, __.col = 3;
            __.push("<ul" + ' class="playlists"' + ">");
            __.line = 16, __.col = 5;
            playlists.each(function(item) {
                {
                    __.line = 17, __.col = 7;
                    var id = item.get("_id");
                    __.line = 18, __.col = 7;
                    __.push("<li");
                    __.r.attrs({
                        id: {
                            v: id,
                            e: 1
                        }
                    }, __);
                    __.push(">");
                    __.line = 19, __.col = 9;
                    __.push("<a");
                    __.r.attrs({
                        href: {
                            v: "/playlist/" + id,
                            e: 1
                        }
                    }, __);
                    __.push(">");
                    __.line = 20, __.col = 11;
                    __.push(__.r.escape(item.get("name")) + "</a>");
                    __.line = 21, __.col = 9;
                    __.push("<i" + ' class="icon-volume-up"' + ">" + "</i>");
                    __.line = 22, __.col = 9;
                    if (!item.get("uuid")) {
                        __.line = 23, __.col = 11;
                        __.push("<i" + ' class="icon-trash"' + ">" + "</i>");
                    }
                    __.push("</li>");
                }
            });
            __.push("</ul>");
            __.line = 25, __.col = 3;
            __.push("<h1" + ">" + "Servers" + "</h1>");
            __.line = 26, __.col = 3;
            __.push("<ul" + ' class="playlists servers"' + ">");
            __.line = 27, __.col = 5;
            servers.each(function(item) {
                {
                    __.line = 28, __.col = 7;
                    var id = item.id;
                    __.line = 29, __.col = 7;
                    var status = item.get("status");
                    __.line = 30, __.col = 7;
                    __.push("<li");
                    __.r.attrs({
                        id: {
                            v: "ms" + id,
                            e: 1
                        },
                        "class": {
                            v: status,
                            e: 1
                        }
                    }, __);
                    __.push(">");
                    __.line = 31, __.col = 9;
                    __.push("<a");
                    __.r.attrs({
                        href: {
                            v: "/directory/" + id + "/0",
                            e: 1
                        }
                    }, __);
                    __.push(">");
                    __.line = 32, __.col = 11;
                    __.push(__.r.escape(item.get("name")));
                    __.line = 33, __.col = 11;
                    __.push("<i" + ' class="icon-refresh icon-spin"' + ">" + "</i>" + "</a>" + "</li>");
                }
            });
            __.push("</ul>" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'player.tab':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/player.tab.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="playing"' + ">");
            __.line = 2, __.col = 3;
            __.push("<a" + ' class="title"' + ">" + "Now Playing" + "</a>");
            __.line = 3, __.col = 3;
            __.push("<i" + ' class="icon-play play"' + ">" + "</i>");
            __.line = 4, __.col = 3;
            __.push("<i" + ' class="icon-chevron-right next"' + ">" + "</i>");
            __.line = 5, __.col = 3;
            __.push("<div" + ' class="ball"' + ">" + "</div>" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'playlist.dropdown':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/playlist.dropdown.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<ul" + ' class="dropDown closed"' + ">");
            __.line = 2, __.col = 3;
            __.push("<li" + ' class="current"' + ">");
            __.line = 3, __.col = 5;
            __.push(__.r.escape(currentList.get("name")));
            __.line = 4, __.col = 5;
            if (playlists.length > 1) {
                __.line = 5, __.col = 7;
                __.push("<i" + ' class="icon-angle-down down"' + ">" + "</i>");
            }
            __.push("</li>");
            __.line = 6, __.col = 3;
            playlists.each(function(item) {
                {
                    __.line = 7, __.col = 5;
                    var id = item.get("_id");
                    __.line = 8, __.col = 5;
                    if (id !== currentList.get("_id")) {
                        {
                            __.line = 9, __.col = 7;
                            __.push("<li" + ' class="option"' + ">");
                            __.line = 10, __.col = 9;
                            __.push("<a");
                            __.r.attrs({
                                href: {
                                    v: "/playlist/" + id,
                                    e: 1
                                }
                            }, __);
                            __.push(">");
                            __.line = 11, __.col = 11;
                            __.push(__.r.escape(item.get("name")) + "</a>" + "</li>");
                        }
                    }
                }
            });
            __.push("</ul>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'popup':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/popup.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="top-box"' + ">");
            __.line = 2, __.col = 3;
            __.push("<h1" + ">" + "add to now playing" + "</h1>");
            __.line = 3, __.col = 3;
            __.push("<h1" + ">" + "add to ..." + "</h1>");
            __.line = 4, __.col = 3;
            __.push("<h1" + ">" + "add to new list" + "</h1>");
            __.line = 5, __.col = 3;
            __.push("<span" + ">" + "cancel" + "</span>" + "</div>");
            __.line = 6, __.col = 1;
            __.push("<div" + ' class="bottom-box"' + ">" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'server.menu':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/server.menu.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            __.push("<div" + ' class="directory-button refresh"' + ">");
            __.line = 2, __.col = 3;
            __.push("<div" + ' class="refresh"' + ">");
            __.line = 3, __.col = 5;
            __.push("Refresh");
            __.line = 4, __.col = 5;
            __.push("<i" + ' class="icon-refresh"' + ">" + "</i>" + "</div>");
            __.line = 5, __.col = 3;
            __.push("<div" + ' class="load"' + ">");
            __.line = 6, __.col = 5;
            __.push("loading");
            __.line = 7, __.col = 5;
            __.push("<i" + ' class="icon-refresh icon-spin"' + ">" + "</i>" + "</div>" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
},'track.list':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/node_modules/wu/templates/track.list.blade";
    try {
        with (__.locals) {
            __.line = 1, __.col = 1;
            var docs = collection.toJSON();
            __.line = 3, __.col = 1;
            __.push("<div" + ' class="track-list"' + ">");
            __.line = 4, __.col = 3;
            __.push("<ul" + ">");
            __.line = 5, __.col = 5;
            __.r.foreach(__, docs, function(item) {
                __.line = 6, __.col = 7;
                __.push("<li");
                __.r.attrs({
                    id: {
                        v: item._id,
                        e: 1
                    },
                    position: {
                        v: item.position,
                        e: 1
                    }
                }, __);
                __.push(">");
                __.line = 7, __.col = 9;
                __.push("<div" + ' class="swipeEl"' + ">");
                __.line = 8, __.col = 11;
                __.push("<div" + ' class="track-info"' + ">");
                __.line = 9, __.col = 13;
                __.push("<div" + ' class="track-title"' + ">" + __.r.escape(item.Title) + "</div>");
                __.line = 10, __.col = 13;
                __.push("<div" + ' class="more"' + ">");
                __.line = 11, __.col = 15;
                __.push(__.r.escape(item.Artist + " - " + item.Album) + "</div>" + "</div>");
                __.line = 12, __.col = 11;
                __.push("<div" + ' class="swipeCover"' + ">");
                __.line = 13, __.col = 13;
                __.push("<h1" + ">" + "Undo" + "</h1>" + "</div>" + "</div>" + "</li>");
            });
            __.push("</ul>" + "</div>");
        }
    } catch (e) {
        return cb(__.r.rethrow(e, __));
    }
    if (!__.inc) __.r.done(__);
    cb(null, __.join(""), __);
}};Wu = {
  Views: {},
  Models: {},
  Collections: {},
  Cache: {
    Models: {},
    Views: {},
    Collections: {}
  },
  Routers: {},
  init: function(){
    window.Socket = io.connect('/controller');
    this.Cache.Models.category = new Wu.Models.category();
    this.Cache.Models.directory  = new Wu.Models.directory();
    this.Cache.Models.player = new Wu.Models.player();
    this.Cache.Collections.renderers = new Wu.Collections.renderers();
    Wu.Cache.Categories = new Wu.Routers.Categories();
    Wu.Cache.Collections.playlists = new Wu.Collections.playlists();
    Wu.Cache.Collections.servers  = new Wu.Collections.servers();

    Wu.Cache.Views.toastMaster = new Wu.Views.toastMaster();
    
    this.Cache.Collections.servers.reset(bootstrapServers);
    this.Cache.Collections.renderers.reset(bootstrapRenderers);
    this.Cache.Collections.playlists.reset(bootstrapPlaylists);

    $(document).on("click","a:not(.data-bypass)",function(e){
      e.preventDefault();
      Backbone.history.navigate($(e.target).attr('href'),{trigger:true});
    })

    $(document).on("swipeRight",".category",function(){
      window.history.back();
    })

    Wu.Layout.init();
    Backbone.history.start({pushState: true});

  }
}


window.addEventListener('load', function() {
    FastClick.attach(document.body);
}, false);

$(document).ready(function(){
  window.Wu = Wu;
  Wu.init();
});var Drawer = (function(){
  var options = {
      maxTime: 1000,
      maxDistance: 20,
      scopeEl: $("html"),
      xPadding: 0,
      yPadding: 0,
      drag:"horizontal"
      //must supply an options.el 
    },
    startPos = 0,
    startTime = 0,
    preventScroll = false,
    scrollLock = false,
    touch = "ontouchend" in document,
    startEvent = (touch) ? 'touchstart' : 'mousedown',
    moveEvent = (touch) ? 'touchmove' : 'mousemove',
    endEvent = (touch) ? 'touchend' : 'mouseup',
    yCutOff,
    xCutOff,
    yPad,
    xPad,
    $el,
    position,
    enabled = true;

  function yPos(e){
    return e.touches ? e.touches[0].pageY : e.pageY;
  }
  function xPos(e){
    return e.touches ? e.touches[0].pageX : e.pageX
  }

  function start(e){        
    var x = e.touches ? e.touches[0].pageX : e.pageX,
        y = e.touches ? e.touches[0].pageY : e.pageY,
        xDif = x - $el.offset().left,
        yDif = y - $el.offset().top;
    if(!enabled)
      return;

    if( yDif > yPad && yDif < yCutOff  && xDif < xCutOff && xDif > xPad){
      //e.preventDefault();
      startTime = e.timeStamp;
      if(options.drag == "horizontal")
        startPos = x;
      else
        startPos = y;
      preventScroll = true;
    }
  };
  function move(e){
    if(preventScroll){
      e.preventDefault();
      var currentPos = position(e),
          currentDistance = (startPos === 0) ? 0 : Math.abs(currentPos - startPos),
          maxTime = options.maxTime,
          maxDistance = options.maxDistance;
          // allow if movement < 1 sec
          currentTime = e.timeStamp;
      
      if (startTime !== 0 && currentTime - startTime < maxTime && currentDistance > maxDistance) {
        if (currentPos < startPos) {
          var dir = (options.drag == 'horizontal') ? 'left' : 'up';
          $el.trigger(dir);
          //swipe up
        }
        if (currentPos > startPos) {
          var dir = (options.drag == 'horizontal') ? 'right' : 'down';
          $el.trigger(dir);
          preventScroll = false;

          //swipe down
        }
        startTime = 0;
        startPos = 0;   
      }
    }else if(scrollLock == 'full'){
      e.preventDefault();
    }else if(scrollLock == 'partial'){
      if(!e.overide){
        e.preventDefault();
      }
    }
  }
  function end(e){
    startTime = 0;
    startPos = 0;
    preventScroll = false;
  }
  return{
    init: function(settings){
      $.extend(options,settings);
      $el = $(options.el);
      if(!$el || $el.length < 1)
        throw "Error: Need to supply a valid target element";
      yPad = options.yPadding;
      xPad = options.xPadding;
      xCutOff = $el.width() + xPad;
      yCutOff = $el.height() + yPad;
      options.scopeEl.on(startEvent,start)
        .on(moveEvent,move)
        .on(endEvent,end);
      position = (options.drag == 'horizontal') ? xPos : yPos;
      $(".nots").bind(moveEvent,function(e){
        e.xyz = true;
      });
      $el.on("toggleDrag",function(e,set){
        enabled = (set === undefined) ? !enabled : set;
      });
    },
    //open = true: open
    //open = false: close
    toggle: function(open){
      preventScroll = open;
    },
    lockScroll: function(lock){
      scrollLock = lock;
    }
  };
})();;Wu.Layout = {
  init: function(){
    this.header = new Wu.Views.header({
      el: $("#header")
    });

    this.menu = new Wu.Views.menu({
      collection: Wu.Cache.Collections.renderers,
      el: $("#menu")
    }).render();
    this.menu.trigger('inserted');

    this.footer = new Wu.Views.playerTab({
      model: Wu.Cache.Models.player,
      el:$("#pullTab")
    }).render();
    this.footer.trigger("inserted");

  },
  setSubHeader : function(view){
    this.header.setSubHeader(view);
    this.header.render();
  },
  removeSubHeader : function(){
    this.header.removeSubHeader();
  },
  setPage: function(view){
    this.page && this.page.unrender();
    this.menu.hide();
    $("#mask").hide();
    $("#page").html(view.render().$el);
    view.trigger('inserted');
    this.page = view;
  }
};/** Blade Run-time helper functions
	(c) Copyright 2012-2013. Blake Miner. All rights reserved.	
	https://github.com/bminer/node-blade
	http://www.blakeminer.com/
	
	See the full license here:
		https://raw.github.com/bminer/node-blade/master/LICENSE.txt
*/
(function(triggerFunction) {
	var runtime = typeof exports == "object" ? exports : {},
		cachedViews = {},
		eventHandlers = {},
		/* Add blade.LiveUpdate no-op functions */
		htmlNoOp = function(arg1, html) {return html;},
		funcNoOp = function(func) {return func();},
		funcNoOp2 = function(arg1, func) {return func();},
		liveUpdate = {
			"attachEvents": htmlNoOp,
			"setDataContext": htmlNoOp,
			"isolate": funcNoOp,
			"render": funcNoOp,
			"list": function(cursor, itemFunc, elseFunc) {
				var itemList = [];
				//cursor must have an observe method
				//Let's go ahead and observe it...
				cursor.observe({
					"added": function(item) {
						//added must be called once per element before the
						//`observe` call completes
						itemList.push(item);
					}
				}).stop(); //and then stop observing it.
				if(!itemList.length) //If itemList.length is null, zero, etc.
					return elseFunc();
				//Otherwise, call itemFunc for each item in itemList array
				var html = "";
				for(var i = 0; i < itemList.length; i++)
					html += itemFunc(itemList[i]);
				return html;
			},
			"labelBranch": funcNoOp2,
			"createLandmark": funcNoOp2,
			"finalize": htmlNoOp //should do nothing and return nothing meaningful
		};
	/* blade.Runtime.mount is the URL where the Blade middleware is mounted (or where
		compiled templates can be downloaded)
	*/
	runtime.options = {
		'mount': '/views/', 'loadTimeout': 15000
	};
	/* Expose Blade runtime via window.blade, if we are running on the browser
		blade.Runtime is the Blade runtime
		blade.runtime was kept for backward compatibility (but is now deprecated)
		blade._cachedViews is an Object of cached views, indexed by filename
		blade._cb contains a callback function to be called when a view is
			loaded, indexed by filename. The callback function also has a 'cb'
			property that contains an array of callbacks to be called once all
			of the view's dependencies have been loaded.
	*/
	if(runtime.client = typeof window != "undefined")
		window.blade = {'Runtime': runtime, 'LiveUpdate': liveUpdate,
			'_cachedViews': cachedViews, '_cb': {}, 'runtime': runtime};
	
	/* Convert special characters to HTML entities.
		This function performs replacements similar to PHP's ubiquitous
		htmlspecialchars function. The main difference here is that HTML
		entities are not re-escaped; for example, "<Copyright &copy; 2012>"
		will be escaped to: "&lt;Copyright &copy; 2012&gt;" instead of
		"&lt;Copyright &amp;copy; 2012&gt;"
		
		See: http://php.net/manual/en/function.htmlspecialchars.php
	*/
	runtime.escape = function(str) {
		return str == null ? "" : new String(str)
			/* The regular expression below will match &, except when & is
				followed by a named entity and semicolon. This is included
				below to help understand how the next regular expression
				works. */
			//.replace(/&(?![a-zA-Z]+;)/g, '&amp;')
			
			/* The following regular expression will match &, except when & is
				followed by a named entity, a decimal-encoded numeric entity,
				or a hexidecimal-encoded entity. */
			.replace(/&(?!([a-zA-Z]+|(#[0-9]+)|(#[xX][0-9a-fA-F]+));)/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
	
	/* This is a helper function that generates tag attributes and adds	them
		to the buffer.
		
		attrs is an object of the following format:
		{
			"v": attribute_value,
			"e": escape_flag,
			"a": additional_classes_to_be_appended
		}
	*/
	runtime.attrs = function(attrs, buf) {
		for(var i in attrs)
		{
			var attr = attrs[i];
			//If the attribute value is null...
			if(attr.v == null || attr.v === false)
			{
				if(attr.a == null)
					continue; //Typically, we ignore attributes with null values
				else
				{
					//If we need to append stuff, just swap value and append
					attr.v = attr.a;
					delete attr.a;
				}
			}
			if(attr.v === true)
				attr.v = i;
			//Class attributes may be passed an Array or have classes that need to be appended
			if(i == "class")
			{
				if(attr.v instanceof Array)
					attr.v = attr.v.join(" ");
				if(attr.a)
					attr.v = (attr.v.length > 0 ? attr.v + " " : "") + attr.a;
			}
			//Add the attribute to the buffer
			if(attr.e)
				buf.push(" " + i + "=\"" + runtime.escape(attr.v) + "\"");
			else
				buf.push(" " + i + "=\"" + attr.v + "\"");
		}
	}
	
	runtime.ueid = runtime.client ? 1000 : 0; //unique element ID
	/* Injects the event handler into the view as a comment and also stores
		it in eventHandlers.  When done() is called, the eventHandlers will
		be moved to buf.eventHandlers, so they can be accessed from the
		render callback function.
		
		- events - a space-delimited string of event types (i.e. "click change")
		- elementID - the "id" attribute of the element to which an event handler is to
			be bound
		- eventHandler - the event handler
		- buf - the Blade template buffer
		- commentExists - false if and only if this is the first call to runtime.bind
			for this element
	*/
	runtime.bind = function(events, elementID, eventHandler, buf, commentExists) {
		/* Place event map into `eventHandlers` global.
			Examples of event maps:
				// Fires when any element is clicked
				"click": function (event) { ... }
				//Fires when an element with class "accept" is clicked, or when a key is pressed
				"keydown, click .accept": function (event) { ... }
				//Fires when an element with class "accept" is either clicked or changed
				"click .accept, change .accept": function (event) { ... }
			
			See http://docs.meteor.com/#eventmaps for more information
		*/
		var eventMapKey = "";
		var eventTypes = events.split(" ");
		for(var i = 0; i < eventTypes.length; i++)
			eventMapKey = "," + eventTypes[i] + " #" + elementID;
		eventHandlers[eventMapKey.substr(1)] = eventHandler;
		var comment = "i[" + JSON.stringify(events) + "]=" + eventHandler.toString();
		//If other event handlers were already declared for this element,
		//merge this one with the existing comment
		if(commentExists)
		{
			var i = buf.length - 1;
			buf[i] = buf[i].substr(0, buf[i].length-3) + ";" + comment + "-->";
		}
		else
			buf.push("<!--" + comment + "-->");
	};
	//runtime.trigger is defined below because it contains an eval()
	runtime.trigger = triggerFunction;
	
	/* Load a compiled template, synchronously, if possible.
	
		loadTemplate(baseDir, filename, [compileOptions,] cb)
		or
		loadTemplate(filename, [compileOptions,] cb)
		
		Returns true if the file was loaded synchronously; false, if it could not be
		loaded synchronously.
		
		The .blade file extension is appended to the filename automatically if no
		file extension is provided.
	
		Default behavior in Node.JS is to synchronously compile the file using Blade.
		Default behavior in the browser is to load from the browser's cache, if
		possible; otherwise, the template is loaded asynchronously via a script tag.
	*/
	runtime.loadTemplate = function(baseDir, filename, compileOptions, cb) {
		//Reorganize arguments
		if(typeof compileOptions == "function")
		{
			cb = compileOptions;
			if(typeof filename == "object")
				compileOptions = filename, filename = baseDir, baseDir = "";
			else
				compileOptions = null;
		}
		if(typeof filename == "function")
			cb = filename, filename = baseDir, compileOptions = null, baseDir = "";
		//Arguments are now in the right place
		//Append .blade for filenames without an extension
		if(filename.split("/").pop().indexOf(".") < 0)
			filename += ".blade";
		//Now, load the template
		if(runtime.client)
		{
			filename = runtime.resolve(filename);
			if(cachedViews[filename])
			{
				cb(null, cachedViews[filename]);
				return true;
			}
			var blade = window.blade;
			//If the file is already loading...
			if(blade._cb[filename])
				blade._cb[filename].cb.push(cb); //push to the array of callbacks
			else
			{
				//Otherwise, start loading it by creating a script tag
				var st = document.createElement('script');
				st.type = 'text/javascript'; //use text/javascript because of IE
				st.async = true;
				st.src = runtime.options.mount + filename;
				//Add compile options to the query string of the URL, if given
				//(this functionality is disabled for now since the middleware ignores it anyway)
				/*if(compileOptions)
				{
					var opts = "";
					for(var key in compileOptions)
						opts += "&" + key + "=" + encodeURIComponent(compileOptions[key]);
					st.src += "?" + opts.substr(1);
				}*/
				/* Helper function for runtime.loadTemplate that calls all of the callbacks
					in the specified array
					- cbArray contains all of the callbacks that need to be called
					- err is the error to be passed to the callbacks
				*/
				function callCallbacks(cbArray, err) {
					//call all callbacks
					for(var i = 0; i < cbArray.length; i++)
					{
						if(err)
							cbArray[i](err);
						else
							cbArray[i](null, cachedViews[filename]);
					}
				}
				//Function to be called if the template could not be loaded
				function errorFunction(reason) {
					var cb = blade._cb[filename].cb; //array of callbacks
					delete blade._cb[filename];
					st.parentNode.removeChild(st);
					callCallbacks(cb, new Error("Blade Template [" + filename +
						"] could not be loaded: " + (reason ? reason : "Request timed out") ) );
				}
				//Set a timer to return an Error after a timeout expires.
				var timer = setTimeout(errorFunction, runtime.options.loadTimeout);
				//Setup a callback to be called if the template is loaded successfully
				var tmp = blade._cb[filename] = function(dependenciesReldir, dependencies, unknownDependencies) {
					clearTimeout(timer);
					delete blade._cb[filename];
					st.parentNode.removeChild(st);
					//Load all dependencies, too
					if(dependencies.length > 0)
					{
						var done = 0;
						for(var i = 0; i < dependencies.length; i++)
							runtime.loadTemplate(baseDir, dependenciesReldir + "/" + dependencies[i], compileOptions, function(err, tmpl) {
								if(err) return callCallbacks(tmp.cb, err);
								if(++done == dependencies.length)
									callCallbacks(tmp.cb);
							});
					}
					else
						callCallbacks(tmp.cb);
				};
				tmp.cb = [cb];
				//Insert script tag into the DOM
				var s = document.getElementsByTagName('script')[0];
				s.parentNode.insertBefore(st, s);
				//Also setup onload, onreadystatechange, and onerror callbacks to detect errors earlier than the timeout
				st.onload = st.onreadystatechange = st.onerror = function() {
					var x = this.readyState;
					if((!x || x == "loaded" || x == "complete") && blade._cb[filename])
					{
						clearTimeout(timer);
						errorFunction("Request failed");
					}
				};
			}
			return false;
		}
		else
		{
			compileOptions.synchronous = true;
			require('./blade').compileFile(baseDir + "/" + filename,
				compileOptions, function(err, wrapper) {
					if(err) return cb(err);
					cb(null, wrapper.template);
				}
			);
			return true;
		}
	}
	
	/* This function is a hack to get the resolved URL, so that caching works
		okay with relative URLs.
		This function does not work properly if `filename` contains too many "../"
		For example, passing "alpha/beta/../../filename.blade" is acceptable; whereas, 
		"alpha/beta/../../../filename.blade" is unacceptable input.
	*/
	runtime.resolve = function(filename) {
		if(runtime.client) {
			//Use the browser's ability to resolve relative URLs
			var x = document.createElement('div');
			x.innerHTML = '<a href="' + runtime.escape("./" + filename) + '"></a>';
			x = x.firstChild.href;
			/* suppose `window.location.href` is "http://www.example.com/foo/bar/document.html"
				and `filename` is "alpha/./beta/../charlie.blade", then
				`x` will be something like "http://www.example.com/foo/bar//alpha/charlie.blade" */
			var prefix = window.location.href.split("#")[0];
			x = x.substr(prefix.substr(0, prefix.lastIndexOf("/") ).length).replace(/\/[\/]+/g, '/');
			if(x.charAt(0) == '/') x = x.substr(1);
			return x;
		}
	};
	
	runtime.include = function(relFilename, info) {
		//Save template-specific information
		var pInc = info.inc,
			pBase = info.base,
			pRel = info.rel,
			pFilename = info.filename,
			pLine = info.line,
			pCol = info.col,
			pSource = info.source,
			pLocals = info.locals;
		info.inc = true;
		//If exposing locals, the included view gets its own set of locals
		if(arguments.length > 2)
		{
			info.locals = {};
			for(var i = 2; i < arguments.length; i += 2)
				info.locals[arguments[i]] = arguments[i+1];
		}
		//Now load the template and render it
		var sync = runtime.loadTemplate(info.base, info.rel + "/" + relFilename,
			runtime.compileOptions, function(err, tmpl) {
				if(err) throw err;
				var len = info.length;
				tmpl(info.locals, function(err, html) {
					//This is run after the template has been rendered
					if(err) throw err;
					//Now, restore template-specific information
					info.inc = pInc;
					info.base = pBase;
					info.rel = pRel;
					info.filename = pFilename;
					info.line = pLine;
					info.col = pCol;
					info.source = pSource;
					info.locals = pLocals;
					//If the file did not declare any blocks, capture output as HTML and add a branch label
					if(!info.bd)
					{
						html = runtime.capture(info, len);
						info.push(liveUpdate.labelBranch(info.filename + ":" + info.line + ":inc:" + relFilename,
							function() {return html;}) );
					}
				}, info);
		});
		if(!sync) throw new Error("Included file [" + info.rel + "/" + relFilename +
			"] could not be loaded synchronously!");
	};
	
	/* Defines a function, storing it in __.func */
	runtime.func = function(funcName, func, info) {
		var x = info.func[funcName] = func;
		x.filename = info.filename;
		x.source = info.source;
	};
	
	/* Calls a function, setting the buffer's filename property, as appropriate
		for proper error reporting */
	runtime.call = function(funcName, idClass, info) {
		//Get remaining arguments to be passed to the function
		var func = info.func[funcName],
			args = [info];
		if(func == null)
			throw new Error("Function '" + funcName + "' is undefined.");
		for(var i = 3; i < arguments.length; i++)
			args[i-2] = arguments[i];
		var oldFilename = info.filename,
			oldSource = info.source;
		info.filename = func.filename;
		info.source = func.source;
		func.apply(idClass, args); //Call the function
		info.filename = oldFilename;
		info.source = oldSource;
	};
	
	/* Capture the output of a function
		and delete all blocks defined within the function.
		The third (undocumented) parameter to runtime.capture is the return
		value from the function or chunk.
	*/
	runtime.capture = function(buf, start) {
		//Delete all blocks defined within the function
		for(var i in buf.blocks)
		{
			var x = buf.blocks[i];
			if(x.pos >= start && (!buf.block || x.parent == buf.block) )
			{
				//Insert the buffer contents where it belongs
				if(x.parent == null)
					buf[x.pos] = x.buf.join("");
				else
				{
					x.parent.buf[x.pos] = x.buf.join("");
					x.parent.numChildren--;
				}
				//Delete the block
				delete buf.blocks[i];
			}
		}
		/* Now remove the content generated by the function from the buffer
			and return it as a string */
		return buf.splice(start, buf.length - start).join("");
	};
	
	/* Define a chunk, a function that returns HTML. */
	runtime.chunk = function(name, func, info) {
		info.chunk[name] = function() {
			//This function needs to accept params and return HTML
			/* Note: This following line is the same as:
				var len = info.length;
				func.apply(this, arguments);
				return runtime.capture(info, len);
			*/
			return runtime.capture(info, info.length, func.apply(this, arguments) );
		};
	};
	
	/* isolateWrapper is a helper function
		- func - a function to be called anytime its data dependencies change
		- buf - the template buffer
		Returns HTML generated by liveUpdate.isolate(...)
	*/
	function isolateWrapper(func, buf, disableReactivity) {
		function wrapper() {
			//Temporarily make blocks inaccessible to func()
			var blocks = buf.blocks;
			buf.blocks = {};
			/* Note: This following line is the same as:
				var len = buf.length;
				func();
				return runtime.capture(buf, len);
			*/
			var html = runtime.capture(buf, buf.length, func() );
			//Restore blocks
			buf.blocks = blocks;
			return html;
		}
		return disableReactivity ? wrapper() : liveUpdate.isolate(wrapper);
	}
	/* Define an isolate block */
	runtime.isolate = function(func, buf) {
		buf.push(isolateWrapper(func, buf) );
	};
	
	/* Define a constant block */
	runtime.constant = function(label, func, buf) {
		buf.push(liveUpdate.labelBranch(buf.filename + ":" + label, function () {
			return liveUpdate.createLandmark({"constant": true}, function(landmark) {
				/* Note: This following line is the same as:
					var len = buf.length;
					func();
					return runtime.capture(buf, len);
				*/
				return runtime.capture(buf, buf.length, func() );
			});
		}) );
	};
	
	/* Define a preserve block */
	runtime.preserve = function(label, preserved, func, buf) {
		buf.push(liveUpdate.labelBranch(buf.filename + ":" + label, function () {
			return liveUpdate.createLandmark({"preserve": preserved}, function(landmark) {
				/* Note: This following line is the same as:
					var len = buf.length;
					func();
					return runtime.capture(buf, len);
				*/
				return runtime.capture(buf, buf.length, func() );
			});
		}) );
	};
	
	/* Foreach/else block */
	runtime.foreach = function(buf, cursor, itemFunc, elseFunc) {
		var disableReactivity = false;
		//Define wrapper functions for itemFunc and elseFunc
		function itemFuncWrapper(item) {
			var label = item._id || (typeof item === "string" ? item : null) ||
				liveUpdate.UNIQUE_LABEL;
			return liveUpdate.labelBranch(label, function() {
				return isolateWrapper(function() {
					return itemFunc.call(item, item);
				}, buf, disableReactivity);
			});
		}
		function elseFuncWrapper() {
			return liveUpdate.labelBranch("else", function() {
				return elseFunc ? isolateWrapper(elseFunc, buf, disableReactivity) : "";
			});
		}
		//Call liveUpdate.list for Cursor Objects
		if(cursor && "observe" in cursor)
			buf.push(liveUpdate.list(cursor, itemFuncWrapper, elseFuncWrapper) );
		else
		{
			disableReactivity = true;
			//Allow non-Cursor Objects or Arrays to work, as well
			var html = "", empty = 1;
			for(var i in cursor)
			{
				empty = 0;
				html += itemFuncWrapper(cursor[i]);
			}
			buf.push(empty ? elseFuncWrapper() : html);
		}
	};
	
	/* Copies error reporting information from a block's buffer to the main
		buffer */
	function blockError(buf, blockBuf, copyFilename) {
		if(copyFilename)
		{
			buf.filename = blockBuf.filename;
			buf.source = blockBuf.source;
		}
		buf.line = blockBuf.line;
		buf.col = blockBuf.col;
	}
	
	/* Defines a block */
	runtime.blockDef = function(blockName, buf, childFunc) {
		var block = buf.blocks[blockName] = {
			'parent': buf.block || null, //set parent block
			'buf': [], //block get its own buffer
			'pos': buf.length, //block knows where it goes in the main buffer
			'numChildren': 0 //number of child blocks
		};
		//Copy some properties from buf into block.buf
		var copy = ['r', 'blocks', 'func', 'locals', 'cb', 'base', 'rel', 'filename', 'source'];
		for(var i in copy)
			block.buf[copy[i]] = buf[copy[i]];
		/* Set the block property of the buffer so that child blocks know
		this is their parent */
		block.buf.block = block;
		//Update numChildren in parent block
		if(block.parent)
			block.parent.numChildren++;
		//Leave a spot in the buffer for this block
		buf.push('');
		//If parameterized block
		if(childFunc.length > 1)
			block.paramBlock = childFunc;
		else
		{
			try {childFunc(block.buf); }
			catch(e) {blockError(buf, block.buf); throw e;}
		}
	};
	
	/* Render a parameterized block
		type can be one of:
			"a" ==> append (the default)
			"p" ==> prepend
			"r" ==> replace
	*/
	runtime.blockRender = function(type, blockName, buf) {
		var block = buf.blocks[blockName];
		if(block == null)
			throw new Error("Block '" + blockName + "' is undefined.");
		if(block.paramBlock == null)
			throw new Error("Block '" + blockName +
				"' is a regular, non-parameterized block, which cannot be rendered.");
		//Extract arguments
		var args = [block.buf];
		for(var i = 3; i < arguments.length; i++)
			args[i-2] = arguments[i];
		if(type == "r") //replace
			block.buf.length = 0; //an acceptable way to empty the array
		var start = block.buf.length;
		//Render the block
		try{block.paramBlock.apply(this, args);}
		catch(e) {blockError(buf, block.buf, 1); throw e;}
		if(type == "p")
			prepend(block, buf, start);
	}
	
	/* Take recently appended content and prepend it to the block, fixing any
		defined block positions, as well. */
	function prepend(block, buf, start) {
		var prepended = block.buf.splice(start, block.buf.length - start);
		Array.prototype.unshift.apply(block.buf, prepended);
		//Fix all the defined blocks, too
		for(var i in buf.blocks)
			if(buf.blocks[i].parent == block && buf.blocks[i].pos >= start)
				buf.blocks[i].pos -= start;
	}
	
	/* Append to, prepend to, or replace a defined block.
		type can be one of:
			"a" ==> append
			"p" ==> prepend
			"r" ==> replace
	*/
	runtime.blockMod = function(type, blockName, buf, childFunc) {
		var block = buf.blocks[blockName];
		if(block == null)
			throw new Error("Block '" + blockName + "' is undefined.");
		if(type == "r") //replace
		{
			//Empty buffer and delete parameterized block function
			delete block.paramBlock;
			block.buf.length = 0; //empty the array (this is an accepted approach, btw)
		}
		var start = block.buf.length;
		//If parameterized block (only works for type == "r")
		if(childFunc.length > 1)
			block.paramBlock = childFunc;
		else
		{
			try {
				//Copy buf.rel and buf.base to block.buf
				block.buf.rel = buf.rel;
				block.buf.base = buf.base;
				childFunc(block.buf);
			}
			catch(e) {blockError(buf, block.buf); throw e;}
		}
		if(type == "p") //prepend
			prepend(block, buf, start);
	};
	
	/* Inject all blocks into the appropriate spots in the main buffer.
		This function is to be run when the template is done rendering.
		Although runtime.done looks like a O(n^2) operation, I think it is
		O(n * max_block_depth) where n is the number of blocks. */
	runtime.done = function(buf) {
		//Iterate through each block until done
		var done = false;
		while(!done)
		{
			done = true; //We are done unless we find work to do
			for(var i in buf.blocks)
			{
				var x = buf.blocks[i];
				if(!x.done && x.numChildren == 0)
				{
					//We found work to do
					done = false;
					//Insert the buffer contents where it belongs
					if(x.parent == null)
						buf[x.pos] = x.buf.join("");
					else
					{
						x.parent.buf[x.pos] = x.buf.join("");
						x.parent.numChildren--;
					}
					x.done = true;
				}
			}
		}
		//Move event handlers to the buffer Object
		buf.eventHandlers = eventHandlers;
		eventHandlers = {};
		if(!runtime.client) runtime.ueid = 0;
	};
	
	/* Adds error information to the error Object and returns it */
	runtime.rethrow = function(err, info) {
		if(info == null)
			info = err;
		//prevent the same error from appearing twice
		if(err.lastFilename == info.filename && err.lastFilename != null)
			return err;
		info.column = info.column || info.col;
		//Generate error message
		var msg = err.message + "\n    at " +
			(info.filename == null ? "<anonymous>" : info.filename) + 
			(info.line == null ? "" : ":" + info.line +
				(info.column == null ? "" : ":" + info.column) );
		if(info.source != null)
		{
			var LINES_ABOVE_AND_BELOW = 3;
			var lines = info.source.split("\n"),
				start = Math.max(info.line - LINES_ABOVE_AND_BELOW, 0),
				end = Math.min(info.line + LINES_ABOVE_AND_BELOW, lines.length),
				digits = new String(end).length;
			lines = lines.slice(start, end);
			msg += "\n\n";
			for(var i = 0; i < lines.length; i++)
				msg += pad(i + start + 1, digits) +
					(i + start + 1 == info.line ? ">\t" : "|\t") +
					lines[i] + "\n";
		}
		err.message = msg;
		err.lastFilename = info.filename;
		//Only set these properties once
		if(err.filename == null && err.line == null)
		{
			err.filename = info.filename;
			err.line = info.line;
			err.column = info.column;
		}
		return err;
	};
	
	//A rather lame implementation, but it works
	function pad(number, count) {
		var str = number + " ";
		for(var i = 0; i < count - str.length + 1; i++)
			str = " " + str;
		return str;
	}
})(
/* runtime.trigger function - I pass it into the function here because
	eval() screws up Uglify JS's name mangling, making the runtime much
	larger. By doing it this way, none of the other variables are in scope.

	Retrieves the proper event handler, which is encoded in a comment right
	before the element, runs it through eval(), and installs it as the event
	handler. Finally, the event is handled.
	This function is more minified because UglifyJS won't completely minify
	a function that contains an eval().
	-e refers to the DOM element that triggered the event
	-t refers to the arguments passed to the event handler
	-t[0] refers to the first argument (the browser's event Object)
*/
function(e, t) {
	//I apologize in advance for the lack of readability here... :/
	var r = e.previousSibling, //refers to the comment element
		i = {}, //refers to the event Object map
		h, //array holding each event type in the Object map
		n; //index into h.  h[n] refers to a event type
	eval(r.textContent); //populates i with event Object map
	e.parentNode.removeChild(r);
	/* now i is an Object like: {
			"click": function() {...},
			"change keyup": function() {...},
			...
		}
		where keys are space-delimited event types and values are event handler functions
	*/
	//now r refers to the properties populated in the event Object map
	for(r in i)
	{
		//i[r] refers to the event handler
		h = r.split(" "); //h is now ["change", "keyup", ...]
		//h[n] now refers to the event type
		for(n = 0; n < h.length; n++)
			e["on" + h[n]] = i[r];
	}
	return e["on" + t[0].type].apply(e, t);
});
;//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout,
    longTapDelay = 750, longTapTimeout

  function parentIfText(node) {
    return 'tagName' in node ? node : node.parentNode
  }

  function swipeDirection(x1, x2, y1, y2) {
    var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
    return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  function longTap() {
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  $(document).ready(function(){
    var now, delta

    $(document.body)
      .bind('touchstart', function(e){
        now = Date.now()
        delta = now - (touch.last || now)
        touch.el = $(parentIfText(e.touches[0].target))
        touchTimeout && clearTimeout(touchTimeout)
        touch.x1 = e.touches[0].pageX
        touch.y1 = e.touches[0].pageY
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true
        touch.last = now
        longTapTimeout = setTimeout(longTap, longTapDelay)
      })
      .bind('touchmove', function(e){
        cancelLongTap()
        touch.x2 = e.touches[0].pageX
        touch.y2 = e.touches[0].pageY
        if (Math.abs(touch.x1 - touch.x2) > 10)
          e.preventDefault()
      })
      .bind('touchend', function(e){
         cancelLongTap()

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

          swipeTimeout = setTimeout(function() {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
            touch = {}
          }, 0)

        // normal tap
        else if ('last' in touch)

          // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
          // ('tap' fires before 'scroll')
          tapTimeout = setTimeout(function() {

            // trigger universal 'tap' with the option to cancelTouch()
            // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
            var event = $.Event('tap')
            event.cancelTouch = cancelAll
            touch.el.trigger(event)

            // trigger double tap immediately
            if (touch.isDoubleTap) {
              touch.el.trigger('doubleTap')
              touch = {}
            }

            // trigger single tap after 250ms of inactivity
            else {
              touchTimeout = setTimeout(function(){
                touchTimeout = null
                touch.el.trigger('singleTap')
                touch = {}
              }, 250)
            }

          }, 0)

      })
      .bind('touchcancel', cancelAll)

    $(window).bind('scroll', cancelAll)
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
    $.fn[m] = function(callback){ return this.bind(m, callback) }
  })
})(Zepto)
;Wu.Views.list = Backbone.View.extend({

  template: JST['category.show'],

  initialize: function(params){
    if(!params || !params.noJumper){
      this.jumper = new Wu.Views.listJumper({
        list: this.$el,
        el: $("#alphabet")
      });
      this.$el.on("click",".jumper",$.proxy(this.jumper.show,this.jumper));
    }
    if(params && params.loader){
      var self =this;
      JST['loader']({},function(err,html){
        self.loaderHTML = html;
      })
      this.listenTo(this.model,"request",function(){
        this.$(".loader").show();
        $("#mask").show();
      });
    }
  },

  render: function(){
    var self = this;
    this.template({model: this.model,jumper:this.jumper},function(err,html){
      $("#mask").hide();
      self.$el.html(html);
      self.jumper && self.jumper.render();
      self.loaderHTML && self.$el.append(self.loaderHTML);
      var topEl = self.$(".title")[0] || self.$("li")[0];
      topEl && topEl.scrollIntoView();
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
    this.jumper && this.jumper.unrender();
  }

});;Wu.Views.categories = Backbone.View.extend({
  template: JST['category.container'],

  initialize: function(){
    this.list =  new Wu.Views.categoryList({
      model: this.model,
      className: 'category',
      parent: this
    })

    this.popup = new Wu.Views.categoryPopup({
      collection: Wu.Cache.Collections.playlists,
      model: this.model,
      className:'popup'
    })
    this.listenTo(this.model,"change:id",function(){
      this.model.fetch();
    });

    this.listenTo(this.list,"showPopup",function(){
      this.popup.show();
    })
    this.listenTo(this.list,"rendered",function(){
      this.popup.hide();
    })

    this.listenTo(this,"tracksInserted", this.tracksInserted);
  },
  render: function(){
    var self = this;

    this.template({},function(err,html){
      self.$el.html(html)
      .append(self.popup.render().$el);

      self.$("#category-container").html(self.list.render().$el);
    }); 

    return this;
  },
  unrender: function(){
    this.stopListening();
    this.list.unrender();
  },
  tracksInserted: function(){
    this.model.fetch();
  },

});;Wu.Views.categoryList = Wu.Views.list.extend({

  ORDER: ["Artist","Album","Title"],
  infoTemplate: JST['category.info'],

  events: {
    "click .category-list li:not(.jumper)" : "select",
    "click .title"          : "showPopup"
  },

  initialize:function(params){
    Wu.Views.list.prototype.initialize.call(this,params);
    if(params.url){
      this.url = params.url
    }else{
      this.url = "category/";
      this.isCategory = true;
    }

    this.listenTo(this.model,"change:docs",this.render);
    if(this.isCategory){
      this.listenTo(Wu.Cache.Collections.servers, "add remove", function(){
        if(this.isCategory && !Wu.Cache.Collections.servers.tracksInserted){
          this.render();
        }
      })
      this.listenTo(Wu.Cache.Collections.servers, "change:tracksInserted",this.render);
    }
  },

  render:function(){
    var self = this,
        docs = this.model.get("docs");

    if(!this.isCategory || Wu.Cache.Collections.servers.tracksInserted){
      Wu.Views.list.prototype.render.call(this);
      $("#mask").hide();
      this.trigger("rendered");
    }else{
      this.infoTemplate({servers: Wu.Cache.Collections.servers},function(err,html){
        self.$el.html(html);
        $("#mask").show();
      })
    }
    return this;
  },

  unrender:function(){
    Wu.Views.list.prototype.unrender.call(this);
    this.$el.off();
    this.stopListening();
  },
  select: function(e){
    var category = this.model.filter($(e.target).text(),e.target.id);
    if(category)
      Backbone.history.navigate(this.url+category,{trigger:true});
    else
      this.trigger("showPopup")
  },
  showPopup:function(e){
    e.preventDefault();
    this.trigger("showPopup")
  }

});;Wu.Views.categoriesNav = Backbone.View.extend({

  template: JST['category.nav'],

  initialize: function(){
    this.listenTo(this.model,"change:id",this.updateActive);
  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
      self.updateActive({},self.model.get('id'));
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  updateActive: function(model,category){
    this.$(".active").removeClass('active');
    this.$("."+category).addClass("active");
  }

});;Wu.Views.categoryPopup = Backbone.View.extend({

  template: JST['category.popup'],

  events: {
    "click h1.play i"             : "playNow",
    "click h1.play .next"         : "playNext",
    "click h1.add"                : "showAddTo",
    "click h1.new"                : "showCreate",
    "click span.new"              : "showCreate",
    "click .cancel"               : "back",
    "submit .bottom-box.new form" : "createList",
    "click .bottom-box.add li"    : "addToList"
  },
  
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
      self.setHeight();
    });
    return this;
  },

  unrender: function(){
    var filter = this.model.get("filter");
    filter && delete filter._id;
    $("#mask").off("click",$.proxy(this.hide,this));
  },

  setHeight: function(){
    var height = $(window).height() - (Math.round($(window).height() * .11)) - 100;

    height = Math.min(500,height);
    this.$(".bottom-box").css("max-height",height);
  },

  generateList: function(){
    if(this.collection.length){
      var result = "<ul>";
      this.collection.each(function(el){

        result += "<li listId='"+el.get('_id')+"'>"+el.get('name')+"</li>";
      });
      result += "</ul>"
    }else{
      var result = "No exisiting playlists, <span class='new'>create one</span> to continue"
    }
    return result;
  },

  showAddTo:function(){
    this.$el.addClass("add expand");
    this.collection.fetch({
      success: $.proxy(function(){
        this.$(".bottom-box.add").html(this.generateList());
      },this)
    }) 
  },

  showCreate:function(){
    this.$el.removeClass("add")
    .addClass("new expand");

    this.$("input.name").val("");
  },

  back:function(){
    if(this.$el.hasClass('expand')){
      this.$el.removeClass("new add expand");
    }else{
      this.hide();
    }
  },

  show:function(){
    $("#mask").show();
    $("#mask").on("click",$.proxy(this.hide,this));
    this.$el.show();
  },

  hide:function(){
    $("#mask").hide();
    $("#mask").off("click",$.proxy(this.hide,this));
    this.$el.hide();
    this.$el.removeClass("new add expand");
    var filter = this.model.get("filter");
    filter && delete filter._id;
  },

  createList:function(e){
    e.preventDefault();
    var name = this.$(".bottom-box.new .name")[0].value;
    if(name == ""){
      alert("please enter a name")
    }else{
      var list = new Wu.Models.playlist({name:name}),
          filter = this.model.get("filter");

      list.set("filter",filter);
      list.save(null,{
        success:$.proxy(function(model){
          var message = 'Playlist "'+name+'" created with '+model.get("added")+' tracks';
          this.collection.add(model);
          Wu.Cache.Views.toastMaster.message(message);
        },this),
        error:function(model,xhr){
          var message = xhr.responseText;
          Wu.Cache.Views.toastMaster.error(message);
        }
      });
      list.set('filter',false);
      this.hide();
    }
  },
  playNow:function(){
    var id = Wu.Cache.Models.player.get("quickList"),
        list = this.collection.get(id);

    if(!list){
      Wu.Cache.Views.toastMaster.error("Must select a media renderer first");
      return;
    }

    list.set("clearAfter",0);
    this._add(list,function(){
      Socket.emit("playPlaylist",id);
    });
  },
  playNext:function(){
    var player = Wu.Cache.Models.player,
        id = player.get("quickList"),
        list = this.collection.get(id),
        currentTrack = player.get('currentPlayingTrack'),
        currentListId = player.get('playlist'),
        position = (currentTrack) ? currentTrack.position : 0;

    if(!list){
      Wu.Cache.Views.toastMaster.error("Must select a media renderer first");
      return;
    }

    list.set("clearAfter",position);
    this._add(list);
  },
  addToList:function(e){
    var id = $(e.target).attr('listId'),
        list = this.collection.get(id);
    this._add(list);
  },

  _add: function(list,cb){
    var filter = this.model.get("filter");

    list.set("filter",filter);
    list.save(null,{
      success:function(model){
        var message = model.get("added")+' tracks added to "'+list.get('name')+'" playlist';
        Wu.Cache.Views.toastMaster.message(message);
        typeof(cb) === 'function' && cb();
       },
      error:function(model,xhr){
        var message = xhr.responseText;
        Wu.Cache.Views.toastMaster.error(message);
      }
    });
    list.unset('filter');
    list.unset('clearAfter');
    this.hide();
  }

});;Wu.Views.directories = Backbone.View.extend({
  template: JST['directory.container'],

  events: {
    "click .popup .ok"     : "chooseDirectory",
    "click .popup .cancel" : "hidePrompt"
  },

  initialize: function(){
    this.list =  new Wu.Views.categoryList({
      model: this.model,
      className: 'category directory',
      url:"directory/",
      noJumper:true,
      loader:true,
      parent: this
    })

    this.listenTo(this.model,"change:id",function(){
      this.model.fetch({
        error:function(model,xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
          window.history.back();
        }
      });
    });

    this.listenTo(this.list,"showPopup",this.showPrompt);
  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html)
      self.$("#category-container").html(self.list.render().$el);
    });
    return this;
  },
  unrender: function(){
    this.stopListening();
    this.list.unrender();
  },
  showPrompt: function(){
    $("#mask").show();
    this.$(".popup").show();
  },
  hidePrompt: function(){
    $("#mask").hide();
    this.$(".popup").hide();
  },
  chooseDirectory: function(){
    var uuid = this.model.get("uuid"),
        dirId = this.model.get("id"),
        server = Wu.Cache.Collections.servers.get(uuid),
        title = this.model.getTitle(),
        name;

    if(server){
      name = server.get("name");
      server.save({path: dirId},{
        success: function(){
          Wu.Cache.Views.toastMaster.message('Adding tracks in "'+title+'" from "'+name+'"');
        },
        error: function(xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      });
      Backbone.history.navigate("/",{trigger:true});
    }
  }

});;Wu.Views.directoryMenu = Backbone.View.extend({

  template: JST['server.menu'],

  events: {
    "click .refresh"  : "reloadTracks"
  },

  initialize: function(){
    this.changeServer();
    this.listenTo(this.model,"change:uuid",this.changeServer);
    this.listenTo(Wu.Cache.Collections.servers,"change:status",this.updateButtons);
  },

  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },

  changeServer: function(){
    var uuid = this.model.get("uuid");
    this.server = Wu.Cache.Collections.servers.get(uuid);
    this.updateButtons();
  },

  updateButtons: function(){
    var status = this.server && this.server.get("status");
    if(!status){
      this.$el.hide();
    }else if(status === 'loading'){
      this.$el.show();
      this.$(".refresh").addClass("loading");
    }else if(status === 'inserted'){
      this.$el.show();
      this.$(".refresh").removeClass("loading");
    }
  },

  reloadTracks: function(){
    if(this.server){
      var name = this.server.get('name');
      this.server.save({},{
        success: function(){
          Wu.Cache.Views.toastMaster.message('Refreshing track from '+name);
          
        },
        error: function(xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      })
    };
  }
});;Wu.Views.header = Backbone.View.extend({

  template: JST['header'],

  events: {
    "click .menuLink" : "toggleMenu"
  },

  initialize: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
    });
  },
  render: function(){
    this.subHeader && this.subHeader.render();
    return this;
  },
  unrender:function(){
    this.subHeader && this.subHeader.unrender();
  },
  setSubHeader: function(view){
    this.subHeader && this.subHeader.unrender();
    this.subHeader = view;
    this.$("#subnav").html(this.subHeader.render().$el);
  },
  removeSubHeader: function(){
    if(this.subHeader){
      this.subHeader.unrender();
      this.subHeader.remove();
    }
  },
  toggleMenu: function(){
    this.trigger("menuClick");
  } 

});;Wu.Views.listJumper = Backbone.View.extend({

  events: {
    "click .back"       : "hide",
    "click span.active" : "jump"
  },

  initialize: function(params){
    this.$listEl = $(params.list);
    this.secret = Math.random();
  },

  render: function(){
    this.$el.html(this.setupJumper());
    return this;
  },
  unrender:function(){
    this.$el.off();
    $("#mask").off("click",$.proxy(this.hide,this));
  },
  setupJumper:function(){
    var current,
        html = "<div class='back icon-chevron-left'></div>";
    for(var i=65; i<91; i++){
      current = String.fromCharCode(i)
      if(this.$listEl.find('#jumper'+current).length > 0){
        html += '<span class="active">'+ current +'</span>';
      }else{
        html += '<span class="greyed">'+ current +'</span>';
      }
    }
    return html;
  },
  jump:function(e){
    console.log(this.secret);
    var letter = $(e.target).html();
    this.$listEl.find("#jumper"+letter)[0].scrollIntoView();
    this.hide();
  },
  show: function(){
    this.$el.addClass('flipOut');
    $("#mask").on("click",$.proxy(this.hide,this));
    $("#mask").show();
  },
  hide: function(){
    this.$el.removeClass('flipOut');
    $("#mask").off("click",$.proxy(this.hide,this));
    $("#mask").hide();
  }

});;Wu.Views.menu = Backbone.View.extend({

  template: JST['menu'],

  events:{
    "click .renderers li"               : "setRenderer",
    "click .musicLink"                  : "gotoMusic",
    "click .playlists li .icon-trash"   : "deleteList"
  },

  initialize: function(){
    this.listenTo(Wu.Layout.header,"menuClick",this.show);
    this.listenTo(this.collection,"add remove reset",this.render);
    this.listenTo(Wu.Cache.Collections.servers,"add remove reset",this.render);
    this.listenTo(Wu.Cache.Collections.playlists,"add remove reset",this.render);
    this.listenTo(this,"hideMusic",this.hideMusic);
    this.listenTo(this,"showMusic",this.showMusic);
    this.listenTo(Wu.Cache.Models.player,"change:id",this.setActive);
    this.listenTo(Wu.Cache.Models.player,"change:playlist",this.setActive);
    this.listenTo(Wu.Cache.Models.player,"change:TransportState",this.setActive);
    this.listenTo(Wu.Cache.Collections.servers,"change:status",this.setStatus);
    this.$el.on("click","a",$.proxy(this.hide,this));
  },
  render: function(){
    var self = this;
    this.template({
      playlists: Wu.Cache.Collections.playlists, 
      renderers: this.collection,
      servers: Wu.Cache.Collections.servers
    },function(err,html){
      self.$el.html(html);
      if(self.showMusicLink)
        self.showMusic();
      self.setActive();
    });
    return this;
  },
  unrender: function(){
    $("#mask").off("click",$.proxy(this.hide,this));
    this.stopListening();
  },
  deleteList: function(e){
    var id = $(e.currentTarget).parent().attr("id"),
        lists = Wu.Cache.Collections.playlists,
        playlist = lists.get(id);

    playlist && playlist.destroy();
  },
  show: function(){
    this.$el.removeClass("hide");
    $("#mask").show()
    .on("click",$.proxy(this.hide,this));
  },
  hide: function(){
    this.$el.addClass('hide');
    $("#mask").hide()
    .off("click",$.proxy(this.hide,this));
  },
  setRenderer: function(e){
    var uuid = $(e.currentTarget).attr("id");
    Wu.Cache.Models.player.setRenderer(uuid);
    this.hide();
  },
  hideMusic: function(){
    this.$(".musicLink").hide();
    this.showMusicLink = false;
  },
  showMusic:function(){
    this.$(".musicLink").show();
    this.showMusicLink = true;
  },
  gotoMusic:function(){
    var category = Wu.Cache.Models.category.get("id") || "Artist";
    this.hide();
    Backbone.history.navigate("/category/"+category,{trigger:true});
  },
  setStatus: function(model,value){
    $("#ms"+model.id).removeClass('loading').addClass(value);
  },
  setActive:function(){
    var renderer = Wu.Cache.Models.player.id,
        playlist = Wu.Cache.Models.player.get('playlist'),
        isPlaying = Wu.Cache.Models.player.get("TransportState") === "PLAYING";

    this.$("li").removeClass("active");
    playlist && $("#"+playlist)[isPlaying ? "addClass" : "removeClass"]("active");
    renderer && $("#"+renderer).addClass("active");
 }

});;Wu.Views.playerTab = Backbone.View.extend({

  template: JST['player.tab'],

  events:{
    "click .icon-play"  : "play",
    "click .icon-pause" : "pause",
    "click .next"       : "next",
    "mousedown .ball"   : "dragStart",
    "touchstart .ball"  : "dragStart"
  },
  initialize: function(){
    this.listenTo(this.model,"change:currentPlayingTrack",this.changeTrack);
    this.listenTo(this.model,"change:TransportState",this.changePlayState);
    this.listenTo(this,"inserted",this.setupDrag);
    this.lastTime = Date.now();
    this.animator = this.animateProgress.bind(this);
    
    this.animateProgress();

    this.listenTo($(document),"mousemove touchmove",$.proxy(this.drag,this));
    this.listenTo($(document),"mouseup touchend",$.proxy(this.dragEnd,this));

    //prevent highlighting on desktop
    this.listenTo(this.$el,"mousedown",function(e){
      e.preventDefault();
    });
    this.listenTo($(window),"resize",$.proxy(function(){
      this.width = this.$el.width() - 50;    
    },this));
    this.animate = true;
  },

  render: function(){
    var self = this;
    this.template({model: this.model},function(err,html){
      self.$el.html(html);
      self.changeTrack(self.model,self.model.get("currentPlayingTrack"));
      self.changePlayState(self.model,self.model.get("TransportState"));
      self.setPosition(self.model.get('trackPosition'));
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  animateProgress: function(){
    if(this.animate && !this.dragging && this.model.get("TransportState") === "PLAYING"){
      var position = this.model.get('trackPosition')
      this.setPosition(position);
      this.model.set("trackPosition",position + Date.now() - this.lastTime ); 
    }
    this.lastTime = Date.now();
    window.requestAnimationFrame(this.animator);
  },
  setPosition: function(position){
    var left = this.width * (position/ this.model.get("duration"));
    this.$(".ball").css("-webkit-transform","translate3d("+left+"px,0,0)");
  },
  dragStart: function(e){
    this.dragging = true;
    e.preventDefault();
  },
  drag:function(e){
    if(this.dragging){
      var x = e.pageX || e.touches[0].pageX;
      this.lastX = x;
      this.$(".ball").css("-webkit-transform","translateZ(0) translateX("+x+"px)");
    }
  },  
  dragEnd: function(){
    if(this.dragging){
      var position = (this.lastX / this.width) * this.model.get("duration");  
      Socket.emit("setPosition",position);
    }
    this.dragging = false;
    this.animate = false;
    var self = this;
    //Hack, wait some time so that our set position will get fed back to us
    setTimeout(function(){
      self.animate = true; 
    },1000)
    
  },
  setupDrag: function(){
    var self = this;
    this.width = this.$el.width() - 50;
    Drawer.init({el:this.$el});
    this.$el.on("left",function(){
      self.$el.css("left","0%");
    });
    this.$el.on("right",function(){
      if(!self.dragging){
        self.$el.css("left","100%");
      }
    });
  },
  play: function(){
    Socket.emit("play");
  },
  pause: function(){
    Socket.emit("pause");
  },
  next: function(){
    Socket.emit("next");
  },
  changeTrack:function(model,track){
    var title = (track && track.Title) ? track.Title : "Unknown";
    this.$(".title").html(title)
    .attr("href","/playlist/"+model.get("playlist"));


    /*    
    if(track){
      var parser=new DOMParser();
      var xmlDoc = parser.parseFromString(track.Didl,"text/xml");
      var artNode = xmlDoc.getElementsByTagName("albumArtURI")[0]
      if(artNode){
        var artURI = artNode.childNodes[0].nodeValue;
        if(artURI != this.albumArt){
          $("body").css("background-image","url("+artURI+")");
          this.albumArt = artURI;
        }
      }
    }*/

  },
  changePlayState:function(model,value){
    if(value === "PLAYING"){
      this.$(".ball").show();
      this.$(".play").removeClass("icon-play").addClass("icon-pause");
    }else{
      this.$(".ball")[value === "PAUSED_PLAYBACK" ? "show" : "hide" ](); 
      this.$(".play").removeClass("icon-pause").addClass("icon-play");
    }
  }

});;Wu.Views.playlistDropdown = Backbone.View.extend({

  template: JST['playlist.dropdown'],

  events:{
    "click .opened .current"  : "hide",
    "click .current"          : "show"
    
    
  },

  render: function(){
    var self = this;
    this.template({currentList: this.model, playlists: Wu.Cache.Collections.playlists},function(err,html){
      self.$el.html(html);
    });
    return this;
  },
  unrender:function(){
    $("#mask").off("click",$.proxy(this.hide,this));
    this.stopListening();
  },
  show: function(e){
    $("#mask").show();
    $("#mask").on("click",$.proxy(this.hide,this));
    this.$(".dropDown").addClass("opened");
    this.$(".down").removeClass("icon-angle-down").addClass("icon-angle-up");
    e.stopImmediatePropagation()
  },
  hide:function(e){
    $("#mask").hide();
    $("#mask").off("click",$.proxy(this.hide,this));
    this.$(".dropDown").removeClass("opened");
    this.$(".down").removeClass("icon-angle-up").addClass("icon-angle-down");
    e.stopImmediatePropagation()
  }

});;Wu.Views.toastMaster = Backbone.View.extend({


  initialize: function(){
    this.listenTo(Wu.Cache.Collections.renderers,"add",function(model){
      this.message('New media renderer "'+model.get("name")+'" detected');
    },this);
    this.listenTo(Wu.Cache.Collections.renderers,"remove",function(model){
      this.message('Media renderer "'+model.get("name")+'" removed');
    },this);
    this.listenTo(Wu.Cache.Collections.servers,"add",function(model){
      this.message('New media server "'+model.get("name")+'" detected');
    },this);
    this.listenTo(Wu.Cache.Collections.servers,"remove",function(model){
      this.message('Media server "'+model.get("name")+'" removed');
    },this);
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",function(model,value){
      value && this.title(value.Title);
    },this);
    this.listenTo(Wu.Cache.Models.player,"change:uuid",function(model,value){
      var renderer = Wu.Cache.Collections.renderers.get(value);
      if(renderer)
        this.message('Now playing to "'+renderer.get('name')+'" renderer');
      else
        this.message("No media renderer selected");
    },this);

    Socket.on("error",$.proxy(function(err){
      this.error(err);
    },this));

    Socket.on("tracksInserted",$.proxy(function(){
      this.message("New tracks inserted");
    },this));

    this.messageStack = [];
  },
  title: function(text){
    window.clearTimeout(this.titleTimeout);
    $("title").html(text);
    this.titleTimeout = window.setTimeout(function(){
      $("title").html("Wu");
    },4000)
  },
  message: function(text){
    this.messageStack.push({text:text,type:'message'});
    this._show()
  },
  error: function(text){
    this.messageStack.push({text:text,type:'error'});
    this._show()
  },
  _add: function(text){
    this.messageStack.push(text);
    $(".toast").html(text)
    $(".toast-wrap").show();
    window.setTimeout(function(){
      $(".toast-wrap").hide();
    },4000);
  },
  _show: function(){
    if($(".toast-wrap").css("display") === "none" && this.messageStack.length){
      var toast = this.messageStack.shift();
      $(".toast-wrap")[toast.type === 'error' ? 'addClass' : 'removeClass']("error")
      .show();
      
      $(".toast").html(toast.text)

      window.setTimeout($.proxy(function(){
        $(".toast-wrap").hide();
        this._show();
      },this),4000);
    }
  }

});;Wu.Views.trackList = Backbone.View.extend({

  template: JST['track.list'],

  events: {
    "click .track-info"           : "play"
  },

  initialize: function(params){
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",this.highlight);
    this.listenTo(this,"inserted",this.highlight);
    this.listenTo(this,"swipeAway",this.delete);
    Wu.Mixin.mix(this,Wu.Mixin.swipeAway)
  },

  render: function(){
    var self = this;
    this.template({collection: this.collection},function(err,html){
      self.$el.html(html);
      self.$("li").length && self.$("li")[0].scrollIntoView();
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  highlight:function(){
    var track = Wu.Cache.Models.player.get("currentPlayingTrack"),
        id = (track) ? track._id : false;
    this.$("li").removeClass("active");
    $("#"+id).addClass('active');
  },
  play: function(e){
    if($(e.currentTarget).parent().hasClass("transition")){
      return;
    }else{
      var position = $(e.currentTarget).parent().parent().attr('position');
      Wu.Cache.Models.player.playByPosition(position,this.model.get("_id"));
    }
  },
  delete:function($li){
    var track = this.collection.get($li.attr("position"));
    if(track){
      track.destroy({
        error:function(model,xhr){
          var message = xhr.responseText;
          Wu.Cache.Views.toastMaster.error(message);
        }
      })
    }
  }

});;Wu.Models.category = Backbone.Model.extend({

  ORDER: ["Artist","Album","Title"],

  urlRoot: '/api/categories',

  initialize: function(){
    Socket.on("tracksInserted",function(){
      Wu.Layout.page.trigger("tracksInserted");
    })
  },

  fetch: function(options){
    var filter = this.get('filter');
    options = options || {};
    options.data = _.extend({},options.data,{'filter':filter})
    Backbone.Model.prototype.fetch.call(this,options);

  },

  filter: function(value,_id){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        index = _.indexOf(this.ORDER,id);
        
    index++;
    if(index < this.ORDER.length){
      filter[id] = value;
      this.set("filter",filter)
    }else if(id === "Title"){
      filter._id = _id;
    }
    return this.ORDER[index];
  },
  setCategory: function(category){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        currentIndex = _.indexOf(this.ORDER,id);
        newIndex = _.indexOf(this.ORDER,category);
    
    while(newIndex <= currentIndex){
      filter[this.ORDER[currentIndex]] && delete filter[this.ORDER[currentIndex]];
      currentIndex--;
    }
    filter._id &&  delete filter._id;
    this.set("filter",filter);
    this.set("id",category);
  },
  getTitle: function(){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        index = _.indexOf(this.ORDER,id);

    while(--index >= 0){
      if(filter[this.ORDER[index]])
        return filter[this.ORDER[index]];
    }
    return false;
  }

});;Wu.Models.directory = Backbone.Model.extend({

  urlRoot: function(){
    return "/api/directory/"+this.get("uuid")+"/";
  },
  initialize:function(){
    this.titleMap = {};
  },
  filter:function(title,id){
    if(id){
      this.titleMap[id] = title;
      return this.get("uuid")+"/"+id;
    }else{
      return false;
    }
  },
  getTitle: function(){
    return this.titleMap[this.get("id")];
  }

});;Wu.Models.player = Backbone.Model.extend({
  urlRoot: '/api/renderers',
  idAttribute: 'uuid',

  initialize: function(){
    var self = this;
    Socket.on("stateChange",function(event){
      self.set(event.name,event.value);
    });
    Socket.on("setRendererResult",function(err,uuid){
      if(err){
        Wu.Cache.Views.toastMaster.error(err);
        self.clear();
      }else{
        self.set('uuid',uuid);
        self.fetch();
      }
    }),
    Socket.on("rendererRemoved",function(renderer){
      if(self.get('uuid') === renderer.uuid){
        self.clear();
      }
    });
  },
  playByPosition: function(id,playlistId){
    Socket.emit("playByPosition",id,playlistId);
  },
  setRenderer: function(uuid){
    Socket.emit("setRenderer",uuid);
  }
});;Wu.Models.playlist = Backbone.Model.extend({
  urlRoot: '/api/playlists',
  idAttribute: "_id"

});;Wu.Models.renderer = Backbone.Model.extend({

  idAttribute: "uuid",
  urlRoot: '/api/renderers'

});;Wu.Models.server = Backbone.Model.extend({

  idAttribute: "uuid",
  urlRoot: '/api/servers'

});;Wu.Models.tracks = Backbone.Model.extend({

  idAttribute: "position",

});;Wu.Collections.playlists = Backbone.Collection.extend({

  initialize: function(){
    Socket.on("rendererAdded",$.proxy(function(){
      this.fetch();
    },this));
    Socket.on("rendererRemoved",$.proxy(function(){
      this.fetch();
    },this));
  },
  model: Wu.Models.playlist,
  url: '/api/playlists'

});
;Wu.Collections.renderers = Backbone.Collection.extend({

  model: Wu.Models.renderer,
  url: '/api/renderers',

  initialize:function(){
    var self = this;
    Socket.on("rendererAdded",function(renderer){
      self.add(renderer);
    })
    Socket.on("rendererRemoved",function(event){
      var renderer = self.get(event.uuid);
      self.remove(renderer);
    })
  }
});;Wu.Collections.servers = Backbone.Collection.extend({

  model: Wu.Models.server,
  url: '/api/servers',

  setTracks: function(value){
    if(this.tracksInserted != value){
      this.tracksInserted = value;
      this.trigger("change:tracksInserted");
    }
  },

  initialize:function(){
    var self = this;
    Socket.on("serverAdded",function(server){
      if(server.status === 'inserted')
        self.setTracks(true);
      self.add(server);
    })
    Socket.on("serverRemoved",function(server){
      self.remove(this.get(server.uuid));
    })

    this.on("reset",function(){
      self.each(function(server){
        if(server.get('status') === 'inserted')
          self.setTracks(true);
      })
    })

    Socket.on("tracksInserted",function(uuid){
      console.log("tracksInserted",uuid )
      var server = self.get(uuid);
      server && server.set("status","inserted"); 
      self.setTracks(true);
    })

    this.hasTracks = false;
  }
});;Wu.Collections.tracks = Backbone.Collection.extend({
  model: Wu.Models.tracks,
  initialize: function(params){
    this._id = params.id;
  },
  url: function(){
    return '/api/playlists/'+this._id;
  }
});
;Wu.Routers.Categories = Backbone.Router.extend({
  routes: {
    ''                    : 'index',
    'category/:id'        : 'show',
    'playlist/:id'        : 'showList',
    'directory/:uuid/:id' : 'showDir'
  },

  index: function(){
    this.show('Artist');
  },

  show: function(id){
    var category = Wu.Cache.Models.category;
    category.setCategory(id);

    if(Wu.Layout.state != 'categories'){
      var nav = new Wu.Views.categoriesNav({
        model: category
      });
      var page = new Wu.Views.categories({
        model: category
      });
      Wu.Layout.menu.trigger("hideMusic");
      category.fetch({
        success:function(){
          Wu.Layout.setSubHeader(nav);
          Wu.Layout.setPage(page);
          Wu.Layout.state = 'categories';
        },
        error:function(){
          Wu.Cache.Views.toastMaster.error("failed to get category");
        }
      });
    }    
  },

  showList: function(id){
    var playlist = Wu.Cache.Collections.playlists.get(id),
        tracks;
    if(playlist){
      tracks = playlist.get("tracks") || playlist.set('tracks',new Wu.Collections.tracks({id:id})).get("tracks");
      Wu.Layout.state = 'playlist';
      Wu.Layout.menu.trigger("showMusic");
      tracks.fetch({
        success:function(){
          var dropDown = new Wu.Views.playlistDropdown({
            model: playlist
          });
          var view = new Wu.Views.trackList({
            model: playlist,
            collection:tracks,
            className: "category"
          });
          Wu.Layout.setSubHeader(dropDown);
          Wu.Layout.setPage(view);
        },
        error:function(model,xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      })
    }else{
      Wu.Cache.Views.toastMaster.error("Playlist not found");
    }
  },
  showDir: function(uuid,dirID){
    var oldID = Wu.Cache.Models.directory.get("uuid");
    if(Wu.Layout.state != 'directory'){
      var nav = new Wu.Views.directoryMenu({
        model: Wu.Cache.Models.directory
      });
      var view = new Wu.Views.directories({
        model:Wu.Cache.Models.directory
      });
      Wu.Layout.setSubHeader(nav);
      Wu.Layout.setPage(view);
      Wu.Layout.state = 'directory';
    }
    Wu.Layout.menu.trigger("showMusic");
    Wu.Cache.Models.directory.set("uuid",uuid);
    if(oldID != uuid){
      Wu.Cache.Models.directory.set({id:dirID},{silent:true});
      //trigger this ourselves, might be same id, but uuid has changed so is different directory
      Wu.Cache.Models.directory.trigger("change:id");
    }else{
      Wu.Cache.Models.directory.set({id:dirID});
    }
  }
});;(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());Wu.Mixin = {

  mix: function(view,mixin){
    var mixID = "_mixin",
        instance = 0,
        events,
        newEvents = [];
    while(view[mixID+instance]){
      instance++;
    }
    mixin.mixID = mixID + instance;

    view[mixID] = mixin;
    mixin.view = view;

    //namespace our events to our mixin
    events = _.isFunction(mixin.events) ? mixin.events() : mixin.events || {};
    _.each(events,function(value,key){
      if(!_.isFunction(mixin[value])){
        console.log(value + " is not a function");
        return;
      }
      var target = key.split(/\b/);
      view.$el.on(target[0],target.slice(1).join(""),$.proxy(mixin[value],mixin));
    })
    _.extend(view.events,{},newEvents);
  }

};Wu.Mixin.swipeAway = {
  touchable: 'ontouchstart' in document.documentElement,
  events: function(){
    map = {};
    if(this.touchable){
      map = {
        'touchstart .swipeEl' : 'start', 
        'touchmove  .swipeEl' : 'move',
        'touchend   .swipeEl' : 'end'
      }
    }else{
      map = {
        'mousedown .swipeEl'  : 'start', 
        'mousemove .swipeEl'  : 'move',
        'mouseout  .swipeEl'  : 'end',
        'mouseup   .swipeEl'  : 'end'
      }
    }
    map['webkitTransitionEnd .swipeEl'] = 'transitionEnd';
    map['transitionend .swipeEl'] = 'transitionEnd';
    map["click .swipeEl h1"] = "undo";

    return map;
  },
  position: function(e){
    return (e.touches) ? e.touches[0].pageX : e.pageX;
  },

  start: function(e){
    this.cover = $(e.currentTarget).find(".swipeCover");
    if($(e.currentTarget).hasClass('transition'))
      return;

    this.active = true;
    this.startX = this.position(e);
    this.pos = 0;
  
    if(!this.touchable)
      e.preventDefault();
  },
  move: function(e){
    if(this.active){
      var x = this.position(e);
      
      this.pos = Math.min(0,x - this.startX);
      if(this.pos < -5 || this.started){
        this.cover.css("-webkit-transform","translate3d("+this.pos+"px,0,0)");
        this.started = true;
      }
    } 
  },
  end: function(){
    if(this.active && this.started){
      if(this.pos < -40){
        this.cover.parent().addClass("transition");
        this.cover.css("-webkit-transform","translate3d(-"+this.cover.width()+"px,0,0)");
      }else if(this.pos < 0){
        this.cover.parent().addClass("transition");
        this.cover.css("-webkit-transform","translate3d(0,0,0)");
      }    
    }
    this.active = false;
    this.started = false;
  },
  transitionEnd: function(e){
    if(e.propertyName.indexOf('transform') != -1){
      if($(e.target).css(e.propertyName) === "translate3d(0px, 0px, 0px)"){
        $(e.currentTarget).removeClass("transition");
      }else{
        $(e.currentTarget).css("opacity",0);        
      }
    }else if(e.propertyName == 'opacity'){
      $(e.currentTarget).parent().hide();
      this.view.trigger("swipeAway",$(e.currentTarget).parent());
    }
  },
  undo:function(e){
    e.preventDefault();
    $(e.currentTarget).parent().css("-webkit-transform","translate3d(0,0,0)")
    .parent().removeClass("transition")
    .css("opacity",1);
  }

}