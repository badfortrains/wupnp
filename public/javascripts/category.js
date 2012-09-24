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

  set playlist(id){
    this.attributes.id = id;
  },
  get playlist(){
    return this.attributes.id;
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
    var filterString = (this.attributes.filter.length > 0) ? "/"+JSON.stringify(this.attributes.filter) : "";
    var idString = (this.attributes.id) ? "/"+this.attributes.id : "";
    return "/"+this.attributes.category + idString + filterString;
  },
  baseRequest: function(){
    var request = {}
    if(this.attributes.id){
      request.id = this.attributes.id;
    }
    if(this.attributes.filter.length > 0)
      request.filter = JSON.stringify(this.attributes.filter)
    return request;
  },
  getCategoryHTML: function(cb){
    var request = this.baseRequest();
    if(this.attributes.category == "Title"){
      request.type = 'track'
    }else{
      request.type = 'category'
      request.category = this.attributes.category;
    }
    this._doAjax(request,cb);
  }
}

var Lists = {
  _doAjax: function(request,cb){
    $.ajax({
      url:'/lists',
      data:request,
      success:cb,
      dataType:'json',
      error: function(xhr, type){
        alert('Ajax error!')
      } 
    });
  },
  attributes: {
    sort: {}
  },
  getLists: function(cb){
    request = {
      sort: this.attributes.sort,
      action: "list"
    }
    this._doAjax(request,cb);
  },
  addList: function(name,cb){
    request = {
      action: "add",
      name:name
    }
    this._doAjax(request,cb);
  }
}

var Playlist = {
  _doAjax: function(request,cb){
    $.ajax({
      url:'/playlist',
      data:request,
      success:cb,
      dataType:'json',
      error: function(xhr, type){
        alert('Ajax error!')
      } 
    });
  },
  addTracks: function(options){
    var request = $.extend(this.tracks.baseRequest(),{action:"add"},options);
    this._doAjax(request,function(result){
      alert(result.toast);
    })
  }
}

var ListsView = {
  lists: Object.create(Lists),
  init:function(el,playlist_model){
    this.playlist = playlist_model;
    this.$el = el;
    this.$el.on("click",".cancel",function(e){
      if(this.$el.find(".bottom-box").html())
        history.go(-2);
      else
        history.go(-1);
      this.cancel();
    }.bind(this));
    $(document).on("category:popstate",this.cancel.bind(this));
    $(document).on("lists:popstate",this.render.bind(this));
    this.$el.on("click",".addTo",this.renderLists.bind(this));
    this.$el.on("click",".create",this.renderNew);
    this.$el.on("click","li",function(e){
      this.addTo(e,-2);
    }.bind(this));
    this.$el.on("click",".play",this.addTo.bind(this));
    this.$el.on("submit","form",this.create.bind(this));
  },
  create: function(e){
    e.preventDefault();
    var name = this.$el.find("input.name").val();
    this.playlist.addTracks({action:"create",name:name});
    history.go(-2);
    this.cancel();
  },
  addTo: function(e,back){
    var backNum = (back) ? back : -1;
    this.playlist.addTracks({dest_id:$(e.target).attr("list_id")});
    history.go(backNum);
    this.cancel();
  },
  cancel:function(){
    $('.mask').hide();
    this.$el.hide();
  },
  render:function(){
    $('.mask').show();
    this.$el.html('<div class="top-box"><h1 class="play">Play now</h1><h1 class="addTo">Add to playlist</h1><h1 class="create">Create new playlist</h1><div class="bottom-box"></div><span class="cancel">cancel</span></div>');
    this.$el.show();
  },

  renderLists:function(){
    HistoryManager.pushState(null,"lists","");
    var el = this.$el;
    var container = el.find(".bottom-box");
    this.lists.getLists(function(playlists){
      el.find("h1").not(".addTo").hide();
      var html = "<ul>";
      playlists.forEach(function(item){
        html += '<li list_id="'+item._id+'">'+item.name+"</li>"
      });
      html += "</ul>"
      container.html(html);
    })
  },
  renderNew: function(container){
    HistoryManager.pushState(null,"lists","");
    var el = $(".popup");
    var container = el.find(".bottom-box");
    el.find("h1").not(".create").hide();
    container.html('<form><input class="name" type="text"></input><input type="submit" class="submit" /></form>');
  }
}

var MenuView = {
  _doAjax: function(cb){
    $.ajax({
      url:'/menu',
      success:cb,
      error: function(xhr, type){
        alert('Ajax error!')
      } 
    });
  },
  init: function(options){
    this.$el = $(options.el);
    this.$el.on("click",".menu li.music",function(e){
      $(document).trigger("menu:music");
    })
    this.$el.on("click",".menu .playlists li", function(e){
      var id = $(e.currentTarget).attr("item_id");
      $(document).trigger("menu:playlist",id);
    });
    $(document).on("menu:popstate",function(){
      this.render();
    }.bind(this));
  },
  render: function(){
    this._doAjax(function(data){
      $("nav").hide();
      this.$el.html(data);
    }.bind(this));
  }

}

//category view
var Category = (function(){
  var ORDER = {
      Artist: "Album",
      Album: "Title"
    },
    tracks,
    playlist,
    $el,
    lastScroll = 0;

  function handlePop(e,state){
    tracks.state = state;
    Category.render();
    window.setTimeout(function(){
      $el[0].scrollTop = lastScroll;
      lastScroll = 0;
    },50)
  }

  return{
    init: function(el,tracks_model){
      $el = $(el);
      tracks = tracks_model;
      HistoryManager.replaceState(tracks.state, "category", tracks.URL);
      $(document).on("category:popstate", handlePop);
      $el.on("click","ul.category li",Category.itemClick);
    },
    render: function(){
      tracks.getCategoryHTML(function(data){
        $("nav").show();
        $el.html(data.content);
        $el[0].scrollTop = 0;
      })
    },
    itemClick: function(e){
      var category = tracks.category;
      var nextCat = ORDER[category];

      tracks.category = nextCat;
      var filter_obj = {};
      filter_obj[category] = $(this).html();
      tracks.filter = filter_obj;
      
      HistoryManager.pushState(tracks.state, "category", tracks.URL);
      lastScroll = $el[0].scrollTop;
      Category.render();
    },
    changeCategory: function(newCategory){
      tracks.category = newCategory;
      HistoryManager.pushState(tracks.state, "category", tracks.URL);
      lastScroll = $el[0].scrollTop;
      Category.render();
    }
  }
})();

var HistoryManager = {
  pushState: function(state,channel,URL){
    var history_state = {
      state: state,
      channel: channel
    }
    history.pushState(history_state,"title",URL);
  },
  replaceState: function(state,channel,URL){
    var history_state = {
      state: state,
      channel: channel
    }
    history.replaceState(history_state,"title",URL);
  },
  popState: function(e){
    if(e.state){
      $(document).trigger(e.state.channel+":popstate",e.state.state);
    }
  }
}

$(document).ready(function(){
  var $el = $("#category");
      menu = Object.create(MenuView),
      tracks = Object.create(Tracks),
      playlist = Object.create(Playlist);

  playlist.tracks = tracks;
  tracks.init({filter:[],category:"Artist"})
  Category.init($("#category"),tracks);
  ListsView.init($(".popup"),playlist);
  Category.render();
  menu.init({el:$("#category")});

  $(".menuLink").on("click",function(){
    menu.render();
    HistoryManager.pushState({},"menu","/menu");
    $("nav").hide();
  });
  

  $(document).on("menu:music",function(){
    $("nav").show();
    tracks.init();
    Category.changeCategory("Artist");
  });
  $(document).on("menu:playlist",function(e,id){
    $("nav").show();
    tracks.init({id:id});
    Category.changeCategory("Title");
  });

  $("nav").on("click","a.active",function(e){
    e.preventDefault();
    $("#category")[0].scrollTop = 0;
  })

  $("nav").on("click","a:not(.active)",function(e){
    var category = $(this).attr('cat');
    Category.changeCategory(category);
    e.preventDefault();
  });

  $el.on("click",".add",function(e){
    HistoryManager.pushState(null,"lists","");
    ListsView.render();
    e.preventDefault();
  });

  $(document).on("tracks:category_changed",function(e,category){
    var selector = "nav ."+category;
    $("nav a").removeClass("active");
    $(selector).addClass("active")
    $("nav")[0].scrollLeft = $(selector)[0].offsetLeft + $(selector).width() - $(".nav-wrap").width() + 20;
  });

  window.addEventListener("popstate",HistoryManager.popState);
  Drawer.init({el:"#pullTab"});
  $("#pullTab").on("left",function(){
    $("#pullTab").css("left","0%");
  });
  $("#pullTab").on("right",function(){
    $("#pullTab").css("left","100%");
  });


})