

var Category = (function(){
  var ORDER = {
      Artist: "Album",
      Album: "Title"
    },
    nextRequest={},
    filter = new Array(),
    $el;

  function handlePop(e){
    if(e.state){
      nextRequest = e.state;
      try{
        filter = JSON.parse(nextRequest.filter)
      }catch(err){
        filter = new Array();
      }
      doAjax();
    }
  }
  function gotCategory(data){
    $el.html(data.content);
  }

  function makeRequest(filter,category,replace){
    if(filter.length > 0)
      nextRequest.filter = JSON.stringify(filter);
    if(category === "Title"){
      nextRequest.type = "track";
      delete nextRequest.category;
    }else{
      nextRequest.type = 'category';
      nextRequest.category = category; 
    }

    if(replace)
      history.replaceState(nextRequest, "title", "/"+category);
    else
      history.pushState(nextRequest, "title", "/"+category+"/"+nextRequest.filter);
    doAjax(nextRequest);
  }

  function doAjax(){
    $.ajax({
      url:'/tracklist',
      data:nextRequest,
      success:gotCategory,
      dataType:'json',
      error: function(xhr, type){
        alert('Ajax error!')
      } 
    });
  }

  return{
    init: function(el,filter,startCategory){
      $el = $(el);
      makeRequest(filter,startCategory,true);
      window.addEventListener("popstate", handlePop);
    },
    itemClick: function(e){
      var category = nextRequest.category;
      var nextCat = ORDER[category];

      var filter_obj = {};
      filter_obj[category] = $(this).html();
      filter.push(filter_obj);

      makeRequest(filter,nextCat)
    },
    changeList: function(id){
      nextRequest.id = id;
    },
    changeCategory: function(newCategory){
      var stateNum = 0;
      $.each(filter,function(index,item){
        if(Object.keys(item)[0] == newCategory){
          stateNum = index;
        }
      });
      filter = filter.slice(0,stateNum);
      makeRequest(filter,newCategory);
    }
  }
})();

$(document).ready(function(){
  var $el = $("#category");
  Category.init($("#category"),{},"Artist");
  $el.on("click","li",Category.itemClick);
  $("nav a").on("click",function(e){
    var category = $(this).attr('cat');
    Category.changeCategory(category);
  });
})