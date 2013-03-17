Wu.Mixin = {

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

}