window.JST = {'category.info':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/category.info.blade";
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
},'category.popup':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/category.popup.blade";
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
},'category.nav':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/category.nav.blade";
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
},'category.show':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/category.show.blade";
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
},'loader':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/loader.blade";
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
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/menu.blade";
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
},'directory.container':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/directory.container.blade";
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
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/header.blade";
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
},'player.tab':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/player.tab.blade";
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
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/playlist.dropdown.blade";
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
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/popup.blade";
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
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/server.menu.blade";
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
},'category.container':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/category.container.blade";
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
},'track.list':function(locals, cb, __) {
    __ = __ || [];
    __.r = __.r || blade.Runtime;
    if (!__.func) __.func = {}, __.blocks = {}, __.chunk = {};
    __.locals = locals || {};
    __.filename = "/Users/spurcell/code/fun/test/wupnp/templates/track.list.blade";
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
}}