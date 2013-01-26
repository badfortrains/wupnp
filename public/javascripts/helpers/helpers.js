Wu.Helpers = {
  Toast: {
    message: function(text){
      $(".toast").removeClass('error');
      this._show(text);
    },
    error: function(text){
      $(".toast").addClass('error');
      this._show(text);
    },
    _show: function(text){
      $(".toast").html(text).show();
      window.setTimeout(function(){
        $(".toast").hide();
      },4000);
    }
  }
}