
var Tracks  = {
  init: function(options){
    this.attributes = $.extend({
      filter: [],
      category: "Artist"
    },options);
  },
  _doAjax: function(request,cb){
    $.ajax({
      url:'/tracklist',
      data:request,
      success:cb,
      dataType:'json',
      error: function(xhr, type){
        alert('Ajax error!')
      } 
    });
  },

  set filter(filter_obj){
    if(typeof(filter_obj) == 'object')
      this.attributes.filter.push(filter_obj);
  },

  set category(category){
    var filter = this.attributes.filter;
    var stateNum = filter.length;
    $.each(filter,function(index,item){
      if(Object.keys(item)[0] == category){
        stateNum = index;
      }
    });
    this.attributes.filter = filter.slice(0,stateNum);
    this.attributes.category = category;
    $(document).triggerHandler("tracks:category_changed",category);
  },
  get category(){
    return this.attributes.category;
  },
  get state(){
    return this.attributes;
  },
  set state(state){
    if(this.attributes.category != state.category)
      $(document).triggerHandler("tracks:category_changed",state.category);
    this.attributes = state;

  },
  get URL(){
    if(this.attributes.filter.legnth > 0){
      return "/"+this.attributes.category+"/"+JSON.stringify(this.attributes.filter);
    }else
      return "/"+this.attributes.category;
  },
  getCategoryHTML: function(cb){
    var request = {}
    if(this.attributes.filter.length > 0)
      request.filter = JSON.stringify(this.attributes.filter)
    if(this.attributes.category == "Title"){
      request.type = 'track'
    }else{
      request.type = 'category'
      request.category = this.attributes.category;
    }
    this._doAjax(request,cb);
  }
}

var Playlist = {

}


//category view
var Category = (function(){
  var ORDER = {
      Artist: "Album",
      Album: "Title"
    },
    tracks,
    $el;

  function handlePop(e){
    if(e.state){
      tracks.state = e.state;
      Category.render();
      /*
      if(e.state.type == 'category')
        tracks.category = e.state.category;
      else
        tracks.category = 'Title'
      Category.render();*/
    }
  }

  return{
    init: function(el,filter,startCategory){
      $el = $(el);
      tracks = Object.create(Tracks);
      tracks.init({filter:filter,category:startCategory})
      history.replaceState(tracks.state, "title", tracks.URL);
      window.addEventListener("popstate", handlePop);
      Category.render();
    },
    render: function(){
      tracks.getCategoryHTML(function(data){
        $el.html(data.content);
      })
    },
    itemClick: function(e){
      var category = tracks.category;
      var nextCat = ORDER[category];

      tracks.category = nextCat;
      var filter_obj = {};
      filter_obj[category] = $(this).html();
      tracks.filter = filter_obj;
      

      history.pushState(tracks.state, "title", tracks.URL);
      Category.render();
    },
    changeCategory: function(newCategory){
      tracks.category = newCategory;
      history.pushState(tracks.state, "title", tracks.URL);
      Category.render();

    }
  }
})();

$(document).ready(function(){
  var $el = $("#category");
  Category.init($("#category"),[],"Artist");
  $el.on("click","li",Category.itemClick);
  $("nav a").on("click",function(e){
    var category = $(this).attr('cat');
    Category.changeCategory(category);
    e.preventDefault();
  });
  $(document).on("tracks:category_changed",function(e,category){
    var selector = "nav ."+category;
    $("nav a").removeClass("active");
    $(selector).addClass("active");
  });
})