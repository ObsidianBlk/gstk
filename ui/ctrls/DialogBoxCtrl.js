
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'ui/common/Emitter',
      'ui/ctrls/HoverPanelCtrl'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('d3'),
	require('../common/Emitter'),
	require('./HoverPanelCtrl')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.$sys) === 'undefined'){
      throw new Error("Missing $sys initilization.");
    }

    if (root.$sys.exists(root, [
      'd3',
      'ui.common.Emitter',
      'ui.ctrls.HoverPanelCtrl'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.ctrls.DialogBoxCtrl", factory(
      root.d3,
      root.ui.common.Emitter,
      root.ui.ctrls.HoverPanelCtrl
    ));
  }
})(this, function (d3, Emitter, HoverPanelCtrl) {

  function DialogBoxCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;
    var msgspan = dom.select(".heading");
    var btndefault = "BTN_OK";

    var Show = this.show.bind(this);
    this.show = function(enable, msg, btns, x, y){
      btns = (typeof(btns) !== 'string') ? btndefault : btns;
      
      msg = (typeof(msg) === 'string') ? msg : null;
      if (msg !== null){
	msgspan.text((enable === true) ? msg : "");
      }
      if (["BTN_OK", "BTN_OKCANCEL"].indexOf(btns) != -1){
	this.showSection(btns, true);
      }
      Show(enable, x, y);
    };

    this.events.forEach(function(evt){
      self.on(evt, function(){
	self.show(false);
      });
    });
  }
  DialogBoxCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  DialogBoxCtrl.prototype.constructor = DialogBoxCtrl;

  return DialogBoxCtrl;
});
