'use strict';

// A wrapper for the tooltip element, for modularizing the code and additional convenience.

// TODO: Strip out unneeded sections and consider simplification points.

module.exports = function() {
  return {
    el: function() {
      const _el = document.createElement('div');
      _el.classList.add('request-button');

      return _el;
    }(),

    // Utility Functions
    // Remove the tooltip.
    remove: function() {
      this.el.parentNode.removeChild(this.el);
    },

    // Add a class to the tooltip.
    addClass: function(className) {
      this.el.classList.add(className);
      return this;
    },

    // Remove a class from the tooltip.
    removeClass: function(className) {
      this.el.classList.remove(className);
      return this;
    },

    // Check if the tooltip contains the class.
    hasClass: function(className) {
      return this.el.classList.contains(className);
    },

    // Get the tooltip's width.
    width: function() {
      return this.el.offsetWidth;
    },

    // Get the tooltip's height.
    height: function( ){
      return this.el.offsetHeight;
    },

    // Set the tooltip's height.
    setHeight: function(height) {
      this.el.style.height = `${height}px`;
    },

    // Determine if the tooltip has a child element or not.
    hasChild: function(child) {
      if (child) {
        let _parent = child.parentNode;

        if (child === this.el) {
          return true;
        } else {
          return this.hasChild(_parent);
        }
      }

      return false;
    },

    // Determine if the tooltip is open or closed.
    isOpen: function() {
      return this.hasClass('is--open');
    },

    // Open the tooltip.
    open: function() {
      this.addClass('is--open');
    },

    // Close the tooltip.
    close: function() {
      this.removeClass('is--open');
    },

    // Determine if the tooltip is flipped or not. TODO Remove?
    isFlipped: function() {
      return this.hasClass('is--flipped');
    },

    // Flip and un-flip the tooltip. TODO: Remove?
    flip: function() {
      return this.addClass('is--flipped');
    },
    unflip: function() {
      return this.removeClass('is--flipped');
    },
    // Set tooltip position
    // - x {Number}
    // - y {Number}
    setPosition: function(x, y) {
      let a = atom.views.getView(atom.workspace).querySelector('.vertical');
      let b = a.offsetWidth - 60;
      y = y-60;
      this.el.style.left = `${b}px`;
      this.el.style.top = `${y}px`;
      return this;
    },

    setContextBoxPosition: function(x, y) {
      let a = atom.views.getView(atom.workspace).querySelector('.vertical');
      let b = a.offsetWidth - 1060;
      y = y-10;
      this.el.style.left = `${b}px`;
      this.el.style.top = `${y}px`;
      return this;
    },

    // Add a child on the tooltip element
    add: function(element) {
      this.el.appendChild(element);
      return this;
    },
  };
};
