/* Copyright 2011 Google Inc.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

*/

/**
 * @fileoverview Base functions for GRR frontend.
 */

/**
 * Namespace for all GRR javascript code.
 */
var grr = window.grr || {};

/**
 * All AJAX calls must be in POST for CSRF protection. This is here so when
 *  debugging its possible to switch to GET mode for easier debugging.
 */
grr.ajax_method = 'POST';

/**
 *  Flag to indicate if debugging messages go to the console.
 */
grr.debug = false;

/**
 * Wrapper for console.log in case it does not exist.
 */
grr.log = function() {
  var published_arguments = arguments;
  /* Suppress debugging. */
  if (grr.debug) {
    try {
      console.log.apply(arguments);
    } catch (e) {}
  }
};

/**
 * Initializer for the grr object. Clears all message queues and state.
 */
grr.init = function() {
  /**
   * This is the grr publisher/subscriber queue.
   * @type {Object.<function(Object)>}
   */
  if (!grr.queue_) {
    grr.queue_ = {};
  }

  //Update the hash location from this message queue.
  grr.subscribe('hash_state', function(key, value) {
    if (value != undefined) {
      grr.hash[key] = value;
    } else {
      delete(grr.hash[key]);
    }

    window.location.hash = $.param(grr.hash);
  }, 'body');

  grr.subscribe('grr_messages', function(message) {
    if (message) {
      $('#footer_message').text(message).show().delay(5000).fadeOut('fast');
      $('#footer #backtrace').text('');
      $('#show_backtrace').hide();
    }
  }, 'footer');

  grr.subscribe('grr_traceback', function(message) {
    if (message) {
      $('#footer #backtrace').text(message);
      $('#show_backtrace').show();
    }
  }, 'footer');

  $('#show_backtrace').unbind('click').click(function() {
    var node = $('<div><h3/><pre/></div>');

    node.find('h3').text($('#footer_message').text());
    node.find('pre').text($('#backtrace').text());
    node.dialog({
      width: $('html').width() * 0.7,
      modal: true,
      buttons: {
        Ok: function() {
          $(this).dialog('close');
          // Clear the backtrace.
          grr.publish('grr_messages', ' ');
        }
      }
    });
  });

  /**
   * This is a global state object. The state is a collection of query
   * parameters which are passed to the server in each request.
   */
  if (!grr.state) {
    grr.state = {};
  }

  /**
   * This holds timers for delayedSubscribe
   * @type {Object.<number>}
   */
  grr.timers = {};

  /**
   * Installs global XSSI protection. This has to be done exactly once. It
   * basically patches the jQuery.ajax method to remove the XSSI preamble.
   */
  if (grr.installXssiProtection) {
    grr.installXssiProtection();
    grr.installXssiProtection = false;

    /* This is required to send the csrf token as per
     https://docs.djangoproject.com/en/1.1/ref/contrib/csrf/
     */
    $('html').ajaxSend(function(event, xhr, settings) {
      // Only send the token to relative URLs i.e. locally.
      if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
        xhr.setRequestHeader('X-CSRFToken', $('#csrfmiddlewaretoken').val());
      }
    });
  }

  /**
   * This object holds the current url location hash state.
   */
  grr.hash = grr.parseHashState();

  /* Initialize the reason from the hash. */
  grr.state.reason = grr.hash.reason;

  /**
   * We create a DelayedResize queue for debouncing resize events (e.g. from
   * window resize).
   */
  grr.subscribe('DelayedResize', function(id) {
    var timer = grr.timers[id];

    if (!timer) {
      grr.timers[id] = window.setTimeout(function() {
        grr.publish('GeometryChange', id);
        grr.timers[id] = null;
      }, 100);
    }
  }, 'body');
};

/**
 * Create a new tree on the domId provided.
 *
 * @param {string} renderer The name of the RenderTree responsible for this
 *     tree.
 * @param {string} domId The domId of the div element that will contain the
 *     tree.
 * @param {string=} opt_publishEvent The name of the GRR event queue where
 *     select events will be published. DEFAULT: "tree_select".
 * @param {Object=} opt_state An optional state object to pass to the
 *     server. DEFAULT: global state.
 * @param {Function=} opt_success_cb an optional function to handle ajax stream.
 */
grr.grrTree = function(renderer, domId, opt_publishEvent, opt_state,
                       opt_success_cb) {
  var state = opt_state || grr.state;
  var publishEvent = opt_publishEvent || 'tree_select';

  state.path = '/';
  state.reason = state.reason || grr.state.reason;
  state.client_id = state.client_id || grr.state.client_id;

  /* Build the tree navigator */
  var container = $('#' + domId);
  var unique_id = (new Date()).getTime();

  /* We attach the tree to a unique dom node so that when the tree is removed,
   * subscribed events will also disappear. */
  container.append("<div class='grr_default' id='" + unique_id + "'></div>");
  var tree = $('#' + unique_id);

  tree.jstree({
    'json_data' : {
      'ajax' : {
        'url' : 'render/RenderAjax/' + renderer,
        'type': grr.ajax_method,
        beforeSend: function(xhr) {
          xhr.setRequestHeader('X-CSRFToken', $('#csrfmiddlewaretoken').val());
        },
        'data' : function(n) {
          var new_state = $.extend({}, state);

          if (n.attr) {
            new_state.path = '/' + this.get_path(n).join('/');
            new_state.id = n.attr('id');
          }

          return new_state;
        },

        'success': function(data, textStatus, jqXHR) {
          var tree = this;

          if (opt_success_cb) {
            opt_success_cb(data, textStatus, jqXHR);
          }

          return data.data;
        }
      },

      'correct_state': false
     },
     'plugins' : ['themes', 'json_data', 'ui']
  });

  /* Bind the select event to the publish queue */
  tree.bind('select_node.jstree', function(event, data) {
    var path = data.inst.get_path(data.rslt.obj).join('/');
    var selected_id = $(data.rslt.obj).attr('id');
    var update_hash = data.args[1];

    // Publish the full AFF4 path of the object the user clicked on.
    var root = (state.aff4_root || '');

    // TODO(user): We really need a proper path normalization function.
    if (root.charAt(root.length - 1) != '/') {
      root += '/';
    }
    grr.publish(publishEvent, root + path, selected_id, update_hash);

    // Selecting a node automatically opens it
    $(this).jstree('open_node', '#' + selected_id);
    return true;
  });

  /* Open the tree if the hash says to. */
  tree.bind('loaded.jstree', function() {
    if (grr.hash.t) {
      grr.openTree(tree, grr.hash.t);
    }
  });

  /* Each node that is opened will update the hash */
  tree.bind('select_node.jstree', function(e, data) {
    var selected_id = $(data.args[0]).parent().attr('id');
    grr.publish('hash_state', 't', selected_id);
  });

  /* We do not want jstree to cache the leafs when a tree is closed. */
  tree.bind('close_node.jstree', function(e, data) {
    $(data.args[0]).children('ul').html('');
  });

  grr.subscribe('client_selection', function(message) {
    // Kill the tree
    container.html('');
    // Make a new one
    grr.grrTree(renderer, domId, opt_publishEvent, opt_state,
      opt_success_cb);
    grr.publish(publishEvent, '/');
  }, unique_id);
};


/**
 * This function recursively opens a tree to reveal a specified node. Node id
 * must be of the form path components encoded in hex separated by -.
 *
 * @param {Object} tree A jQuery selected object representing the tree.
 * @param {string} nodeId id for the node to open.
 **/
grr.openTree = function(tree, nodeId) {
  var parts = nodeId.split('-');
  var i = 1;

  var cb = function(i) {
    var id_to_open = parts.slice(0, i + 1).join('-');
    var node = $('#' + id_to_open);

    if (node.length && parts[i + 1]) {
      tree.jstree('open_node', node, function() { cb(i + 1);}, 'no_hash');
    } else {
      // Ultimate node, when its done we want to select it
      tree.jstree('select_node', node, 'no_hash');
      grr.publish('hash_state', 't', node.attr('id'));
    }
  };

  cb(0);
};


/**
 * Subscribes for a grr event.
 *
 * @param {string} name The name of the queue to subscribe to.
 * @param {Function} handle a function that will be called when an
 *                 event is published on that queue.
 * @param {string} domId of the widget which is subscribed to this event.
*/
grr.subscribe = function(name, handle, domId) {
  var queue_name = 'queue_' + name;
  var queue = grr.queue_[queue_name] || [];
  var new_queue = [];

  if (domId == null) {
    alert('Programming error: subscribed function must depend on a dom node.');
  }

  // Clean up the queue from events that no longer apply
  for (var i = 0; i < queue.length; i++) {
    var old_handler = queue[i];
    var activeDomId = old_handler.activeDomId;

    if ($('#' + activeDomId).length) {
      new_queue.push(old_handler);
    }
  }

  handle.activeDomId = domId;
  new_queue.push(handle);

  grr.queue_[queue_name] = new_queue;
};

/**
 * Subscribes for a grr event with a timer.
 *
 * When an event is published on the queue we start a timer and only call the
 * handle after timer expiration. If another event is published to the queue
 * before the timer fires we cancel the first timer and start a new one. This is
 * mainly used for debouncing incremental search.
 *
 * @param {string} name The name of the queue to subscribe to.
 * @param {number} delay The delay for the timer (in secs).
 * @param {string} domId A unique ID to store the timer object.
 * @param {Function} handle a function that will be called when an
 *     event is published on that queue.
 */
grr.delayedSubscribe = function(name, delay, domId, handle) {
  grr.subscribe(name, function() {
    // These are the args that were published
    var published_arguments = arguments;

    // Cancel the previous timer.
    if (grr.timers['timer_' + domId]) {
      window.clearTimeout(grr.timers['timer_' + domId]);
    }

    // Set a future timer to call the handle with the
    // original_arguments. But this only happens if the
    grr.timers['timer_' + domId] = window.setTimeout(function() {
      if ($('#' + domId)) {
        handle.apply(this, published_arguments);
      } else {
        grr.timers['timer_' + domId] = undefined;
      }
    }, delay * 1000);
  }, 'body');
};


/**
 * Publish to a grr event.
 *
 * Note that event and data can be obtained from a standard JS event handler
 * (e.g. onclick).
 *
 * @param {string} name The name of the queue to publish to.
 * @param {string} value A value to publish.
 * @param {Event=} event an optional JS event object.
 * @param {Object=} data The data object passed in the event.
 */
grr.publish = function(name, value, event, data) {
  var queue_name = 'queue_' + name;
  var queue = grr.queue_[queue_name];

  grr.log(name + ':' + value);
  if (queue) {
    var new_queue = [];

    for (var i = 0; i < queue.length; i++) {
      var handler = queue[i];

      // Make sure the activeDomId still exits
      if ($('#' + handler.activeDomId).length) {
        queue[i](value, event, data);
        new_queue.push(handler);
      }
    }

    grr.queue_[queue_name] = new_queue;
  }
};


/**
 * Lays out a GRR object by rendering the object into a div.
 *
 * @param {string} renderer The rernderer name to call via ajax.
 * @param {string} domId The element which will host the html.
 * @param {Object=} opt_state A data object which will be serialiased into
 *     the AJAX request (as query parameters).
 * @param {Function=} on_success If provided this function will be called on
 *     completion.
 */
grr.layout = function(renderer, domId, opt_state, on_success) {
  // Use global state by default
  var state = $.extend({}, opt_state || grr.state);

  state.id = domId;
  state.reason = state.reason || grr.state.reason;
  state.client_id = state.client_id || grr.state.client_id;

  $.ajax({
    dataType: 'html',
    data: state,
    type: grr.ajax_method,
    url: 'render/Layout/' + renderer,
    error: function(jqXHR) {
      $('#error_action').html(jqXHR.response);
    },
    success: function(data) {
      // Load the new table DOM
      var node = $('#' + domId);

      if (node) {
        node.html(data);
        grr.publish('GeometryChange', domId);

        if (on_success) {
          on_success(domId);
        }
      }
    }
  });
};

/**
 * Refreshes an element.

 * @param {string} domId The element which will host the html.
 * @param {Object=} opt_state A data object which will be serialiased into
 *         the AJAX request (as query parameters).
*/
grr.refresh = function(domId, opt_state) {
  // Use global state by default
  var state = opt_state || grr.state;
  var renderer = $('#' + domId).data().renderer;

  if (renderer) {
    grr.layout(renderer, domId, state);
  }
};

/**
 * This is an implementation of a table widget for GRR.
 */
grr.table = {};

/**
 * Sync the header widths with the table content widths.
 *
 * @param {Object} jtable - a jquery object of the table.
 */
grr.table.setHeaderWidths = function(jtable) {
  // Account for the scrollbar.
  var our_width = jtable.innerWidth();
  var remaining_width = our_width;
  var header_widths = (jtable.attr('header_widths') || '').split(',');
  var th_elements = jtable.find('th');
  var actual_widths = [];

  th_elements.each(function(i) {
    // Set the width as requested, or as an even proportion of the width.
    var ratio = $(this).attr('header_width');
    var width;

    if (!ratio) {
      width = remaining_width / (th_elements.length - i);
    } else {
      width = ratio * our_width / 100;
    }

    actual_widths.push(width);
    remaining_width -= width;
  });

  // Set the width of each td element in all the following rows the same as the
  // headers.
  th_elements.each(function(i) {
    $(this).width(actual_widths[i]);
  });

  th_elements.each(function(i) {
    actual_widths[i] = $(this).width();
  });

  jtable.find('tr').each(function() {
    $(this).find('td').each(function(i) {
      $(this).width(actual_widths[i] || 0);
    });
  });

  jtable.find('tbody tr:first').find('td').each(function(i) {
    if (!$(this).hasClass('table_loading')) {
      actual_widths[i] = $(this).width();
    }
  });

  jtable.find('thead tr th').each(function(i) {
    $(this).width(actual_widths[i]);
  });
};

/**
 * Adjust the alternate colored rows in the table.
 *
 * @param {Object} jtable is a jqueried table node.
 */
grr.table.colorTable = function(jtable) {
  // Color the rows nicely.
  jtable.find('tr:even').addClass('even');
  jtable.find('tr:odd').addClass('odd');
};

/**
 * Create a dialog for allowing the table to be sorted and filtered.
 *
 * @this is the icon which takes the click event. This icon must be inside the
 *       relevant th element.
 */
grr.table.sortableDialog = function() {
  var header = $(this).parent();
  var node = $('<div class="sort-dialog">' +
               '<div class="asc">Sort A &rarr; Z</div>' +
               '<div class="desc">Sort Z &rarr; A</div>' +
               '<div class="filter">' +
               '<form>Filter <input type=text><input type=submit ' +
               'style="display: none;">' +
               '</form></div>');

  node.find('input[type=text]').val(header.attr('filter') || '');

  var refresh = function() {
    var tbody = header.parents('table').find('tbody');
    var filter = header.attr('filter');

    tbody.html('<tr><td class="table_loading">Loading...</td></tr>');
    tbody.scroll();
    if (filter != null) {
      header.attr('title', 'Filter: ' + filter);
    }

    node.dialog('close');
    $('.sort-dialog').remove();
  };

  node.find('.asc').click(function() {
    header.attr('sort', 'asc');
    refresh();
  });

  node.find('.desc').click(function() {
    header.attr('sort', 'desc');
    refresh();
  });

  node.find('form').submit(function(event) {
    header.attr('filter', $(this).find('input').val());
    refresh();
    event.stopPropagation();
    return false;
  });

  node.dialog();
};

/**
 * An event handler for scrolling.
 *
 * If we notice an uncovered "Loading ..." element appear within the view port,
 * we launch an ajax call to replace it with data.
 *
 * @param {string} renderer is the renderer which will be used to fill the ajax
 * call.
 *
 * @param {Object} tbody is the jqueried object corresponding to the tbody
 * element.
 *
 * @param {Object=} opt_state A data object which will be serialiased into the
 *     AJAX request (as query parameters).
 */
grr.table.scrollHandler = function(renderer, tbody, opt_state) {
  var loading = tbody.find('.table_loading');
  var bottom = tbody.scrollTop() + tbody[0].offsetHeight;
  var loading_id = loading.attr('id');

  // Fire when the table loading element is visible.
  if (loading && (bottom > loading.attr('offsetTop') -
      loading.attr('offsetHeight'))) {
    var previous_row_id = (tbody.find('tr[row_id]').last().attr('row_id') ||
        -1);
    var next_row = parseInt(previous_row_id) + 1;
    var state = $.extend({start_row: next_row}, grr.state, opt_state);
    var filter = tbody.parent().find('th[filter]');
    var sort = tbody.parent().find('th[sort]');

    if (filter && filter.attr('filter')) {
      state.filter = filter.text() + ':' + filter.attr('filter');
    }

    if (sort && sort.attr('sort')) {
      state.sort = sort.text() + ':' + sort.attr('sort');
    }

    // Insert the new data after the table loading message, and wipe it.
    grr.update(renderer, loading_id, state,
      function(data) {
        // Make sure to insert this data only after its corresponding
        // loading placer.
        var table_loading;

        if (loading_id) {
          table_loading = tbody.find('#' + loading_id);
        } else {
          table_loading = tbody.find('.table_loading');
        }

        var loading_row = table_loading.parent('tr');

        // Prevent a possible race: a scroll event can fire here after
        // inserting the data, but before being able to remove the loading
        // row. We remove the loading td first to prevent this.
        loading_row.find('.table_loading').remove();

        loading_row.after(data);
        loading_row.remove();
        grr.table.colorTable(tbody);
        grr.table.setHeaderWidths(tbody.parent());

        tbody.scroll();
      }, loading_id + previous_row_id);
  }
};

/**
 * Hides the table rows below the current row which have a depth attribute
 * greater than this one.
 *
 * @param {Object} node is a dom node somewhere inside the parent row.
 */
grr.table.hideChildRows = function(node) {
  var item = $(node);
  var row = item.parents('tr');
  var row_id = parseInt(row.attr('row_id')) || 0;
  var depth = parseInt(item.attr('depth')) || 0;
  var end = false;

  // If the tree is not closed, we close it.
  if (!item.hasClass('tree_closed')) {
    // Find all the children of this element and hide them.
    row.parents('tbody').find('tr').each(function() {
      var row = $(this);
      var our_row_id = row.attr('row_id');
      var our_depth = row.find('span').attr('depth');

      if (our_row_id > row_id) {
        if (our_depth > depth && !end) {
          row.hide();
        } else {
          end = true;
        }
      }
    });

    item.addClass('tree_closed');
    item.removeClass('tree_opened');
  } else {
    // Only open one level
    row.parents('tbody').find('tr').each(function() {
      var row = $(this);
      var our_row_id = row.attr('row_id');
      var our_depth = row.find('span').attr('depth');

      if (our_row_id > row_id) {
        if (our_depth == depth + 1 && !end) {
          var spans = row.find('span[depth]');
          row.show();

          // By default mark the children as closed.
          spans.addClass('tree_closed');
          spans.removeClass('tree_opened');
          row.removeClass('tree_hidden');
        } else if (our_depth <= depth) {
          end = true;
        }
      }
    });

    item.addClass('tree_opened');
    item.removeClass('tree_closed');
  }
};


/**
 * Create a new table on the specified domId.
 *
 * @param {string} renderer is the name of the renderer we use.
 * @param {string} domId is the id of the table element.
 * @param {string} unique is a unique id for this element.
 * @param {Object=} opt_state A data object which will be serialiased into the
 *     AJAX request (as query parameters).
 */
grr.table.newTable = function(renderer, domId, unique, opt_state) {
  var me = $('#' + domId);

  // Click handler.
  $('#' + unique).click(function(event) {
    /* Find the next TR above the clicked point */
    var node = $(event.target).closest('tr');
    var row_id = node.attr('row_id');
    if (row_id) {
      // Clear all the selected rows
      $(this).find('tr').each(function() {
        $(this).removeClass('row_selected');
      });

      node.addClass('row_selected');

      // Publish the selected node
      grr.publish('select_' + domId, node);
    }
    event.stopPropagation();
  });

  // Add search buttons for columns.
  me.find('th').each(function(i) {
    var jthis = $(this);
    if (jthis.attr('sortable')) {
      var image = $('<img src="/static/images/forward_enabled.jpg"' +
          'style="float: right">');
      jthis.append(image);
      image.click(grr.table.sortableDialog);
    }
  });

  grr.subscribe('GeometryChange', function(id) {
    var us = $('#' + id + ' div.tableContainer').first();
    if (us.length == 0) return;

    // Fix the height of the tbody area.
    grr.fixHeight(us);
    us.find('tbody').height(us.innerHeight() -
        us.find('thead').innerHeight());

    // Fix the width of the tbody area
    us.width(us.parent().innerWidth());
    grr.table.setHeaderWidths(us);

    // Fill in the table if needed.
    us.find('tbody').scroll();
  }, unique);

  me.find('tbody').scroll(function() {
    grr.table.scrollHandler(renderer, $(this), opt_state);
  }).scroll();
};

/**
 * Creates a periodic polling clock for updating certain elements on
 * the page.
 * @param {string} renderer - The rernderer name to call via ajax.
 * @param {string} domId - This callback will be called as long as domId exists.
 * @param {Function} callback will be called each time with the data returned.
 * @param {number} timeout number of milliseconds between polls.
 * @param {Object} state the state to pass to the server.
 * @param {string=} opt_datatype Expected data type "html" (default),
 *          "json", "xml".
*/
grr.poll = function(renderer, domId, callback, timeout, state, opt_datatype) {
  /* Enforce a minimum timeout */
  if (!timeout || timeout < 1000) {
    timeout = 1000;
  }

  state.reason = state.reason || grr.state.reason;
  state.client_id = state.client_id || grr.state.client_id;

  /** We deliberately not call window.setInterval to avoid overrunning
     the server if its too slow.
   */
  function update() {
    $.ajax({
      url: 'render/RenderAjax/' + renderer,
      data: state,
      type: grr.ajax_method,
      dataType: opt_datatype || 'html',
      success: function(data) {
        // Load the new table DOM
        var result = callback(data);

        // Schedule another update
        if (result && $('#' + domId).html()) {
          window.setTimeout(update, timeout);
        }
      },

      // In case of error just keep trying
      error: function(event) {
        window.setTimeout(update, timeout);
      }
    });
  };

  // First one to kick off
  update();
  window.setTimeout(update, timeout);
};

/**
 * Function to update a dom node via an AJAX call to a renderer.
 *
 * This is similar to the grr.layout() method but it calls the RenderAjax method
 * and is suitable to repeatadely being applied to the same element.
 *
 * @param {string} renderer The rernderer name to call via ajax.
 * @param {string} domId The element which will host the html.
 * @param {Object=} opt_state A data object which will be serialiased into the
 *     AJAX request (as query parameters).
 * @param {Function=} on_success If provided this function will be called on
 *     completion.
 * @param {string} inflight_key The key to use for the inflight queue. If null,
 *     we use the domId.
 */
grr.update = function(renderer, domId, opt_state, on_success, inflight_key) {
  var state = opt_state || grr.state;
  var inflight_key = inflight_key || domId;

  if (!on_success) {
    on_success = function(data) {
      $('#' + domId).html(data);
    };
  }

  state.id = domId;
  state.reason = state.reason || grr.state.reason;
  state.client_id = state.client_id || grr.state.client_id;

  // If there is already an in flight request for this domId, drop this one.
  if (grr.inFlightQueue[inflight_key]) {
    return;
  }

  // Create a lock on this domId to prevent another ajax call while
  // this one is inflight.
  grr.inFlightQueue[inflight_key] = renderer;
  $.ajax({
    dataType: 'html',
    data: (state || grr.state),
    type: grr.ajax_method,
    url: 'render/RenderAjax/' + renderer,
    complete: function() {
      // Remove the lock for this domId
      grr.inFlightQueue[inflight_key] = null;
    },
    error: function(jqXHR) {
      $('#error_action').html(jqXHR.response);
    },
    success: function(data) {
      // Remove the lock for this domId
      grr.inFlightQueue[inflight_key] = null;

      // Load the new table DOM
      on_success(data);
    }
  });
};

/**
 * Function sets up event handlers on text elements.
 *
 * @param {string} domId The element we attach the events to.
 * @param {string} queue The name of the queue to send key down
 *     events to.
*/
grr.installEventsForText = function(domId, queue) {
  var node = $('#' + domId);

  // Stops event bubbling
  var blocker = function(event) {
    event.stopPropagation();
    node.focus();
  };

  // Install events on this node.
  node.keyup(function(event) {
    grr.publish(queue, this.value);
    blocker(event);
  });

  // Block bubbling of these events.
  node.mousedown(blocker);
  node.click(blocker);
};

/**
 * Override the jQuery parser to remove XSSI protections.
 *
 * @return {?Object} JSON object or null if parsing failed.
 */
grr.installXssiProtection = function() {
  var oldParseJSON = jQuery.parseJSON;

  jQuery.parseJSON = function(data) {
    if (typeof data !== 'string' || !data) {
      return null;
    }

    if (data.substring(0, 4) != ')]}\n') {
      return jQuery.error('JSON object not properly protected.');
    }

    return oldParseJSON(data.substring(4, data.length));
  };

  return null;
};

/**
 * Create the popup menu dialog.
 *
 * @param {string} renderer The renderer used to render the element.
 * @param {string} domId The element we attach the events to.
 * @param {string} openerId The id of the element acting as an opener.
 * @param {Object=} opt_options dialog options.
 */
grr.dialog = function(renderer, domId, openerId, opt_options) {
  // Create the dialog
  $('#' + domId).dialog($.extend(
    { autoOpen: false,
      width: parseInt($('body').css('width')) * 0.90,
      maxHeight: parseInt($('body').css('height')) * 0.90,
      minHeight: 400
    }, opt_options));

  $('#' + openerId).click(function() {
    var dialog = $('#' + domId);

    if (dialog.dialog('isOpen')) {
       dialog.dialog('close');
    } else {
      grr.layout(renderer, domId);
      dialog.dialog('open');
    }

    return false;
  });
};


/**
 * Sumbits a form to a renderer.
 *
 * @param {string} renderer The renderer to submit to.
 * @param {string} formId The form to submit.
 * @param {string} resultId The renderer will render to this div.
 * @param {string=} opt_state Optional state to merge with the form (default
 *     grr.state).
 * @param {Function=} opt_refreshMethod Optional method for refresh (default
 *     grr.layout).
 * @return {boolean} false.
 */
grr.submit = function(renderer, formId, resultId, opt_state,
    opt_refreshMethod) {
  var new_state = {};
  var method = opt_refreshMethod || grr.layout;
  var state = opt_state || grr.state;

  /* Also support any select tags */
  $('#' + formId + ' input, select').each(function() {
    var name = this.name;
    var value = $(this).val();

    if (name && value) {
      new_state[name] = value;
    }
  });

  /* Merge the global state into the form. */
  $.extend(new_state, state || grr.state);

  // Now send this to the renderer and put the result on result_id
  method(renderer, resultId, new_state);

  return false;
};

/**
 * Updates the form from an object.
 *
 * @param {string} formId The form to update.
 * @param {object=} state Optional state to merge with the form (default
 *     grr.state).
 */
grr.update_form = function(formId, state) {
  $('#' + formId + ' input, select').each(function() {
    if (state[this.name]) {
      // Make sure the change event is fired after the value changed.
      $(this).val(state[this.name]).change();
    }
  });
};

/**
 * Updates the height of the element so it and all its siblings fit within their
 * parent.
 *
 * @param {Object} element A JQuery selected object for the element to fix.
 *
 */
grr.fixHeight = function(element) {
  var height = element.parent().height();
  var calculate_height = function() {
    var tag_name = this.tagName;

    // Dialog boxes need to be excluded since the are absolutely positioned
    if ($(this).attr('role') == 'dialog') return;

    // For some reason script tags report a non zero height in chrome.
    if (tag_name != 'SCRIPT') {
      height -= $(this).outerHeight();
    }
  };

  element.prevAll(':visible').each(calculate_height);
  element.nextAll(':visible').each(calculate_height);

  height -= parseInt(element.css('padding-top'));
  height -= parseInt(element.css('padding-bottom'));

  element.height(height + 'px');
};

/**
 * Updates the width of the element so it and all its siblings fit within their
 * parent.
 *
 * @param {Object} element A JQuery selected object for the element to fix.
 *
 */
grr.fixWidth = function(element) {
  var width = element.parent().width();
  var calculate_width = function() {
    var tag_name = this.tagName;

    // For some reason script tags report a non zero height in chrome.
    if (tag_name != 'SCRIPT') {
      width -= $(this).outerWidth();
    }
  };

  element.prevAll(':visible').each(calculate_width);
  element.nextAll(':visible').each(calculate_width);

  width -= parseInt(element.css('padding-top'));
  width -= parseInt(element.css('padding-bottom'));

  element.width(width + 'px');
};

/**
 * Parses the location bar's #hash value into an object.
 *
 * @return {Object} an associative array of encoded values.
 */
grr.parseHashState = function() {
  var result = {};
  var parts = window.location.hash.substr(1).split('&');

  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split('=');
    if (kv[0]) {
      result[kv[0]] = decodeURIComponent(kv[1].replace(/\+/g, ' ') || '');
    }
  }

  return result;
};

/**
 * Install the navigation actions on all items in the navigator.
 */
grr.installNavigationActions = function() {
  $('#navigator ul.iconlist li a').each(function() {
  var renderer = $(this).attr('grrtarget');

  $(this).click(function() {
    grr.layout(renderer, 'main');
    grr.publish('hash_state', 'main', renderer);

    // Clear all the other selected links
    $('#navigator li').removeClass('selected');

    // Make this element selected
    $(this).parent().addClass('selected');

    grr.publish('GeometryChange', 'navigator');
    return false;
  });
 });
};

/**
 * Load the main content pane from the hash provided.
 *
 * @param {string} hash to load from. If null, use the current window hash.
 */
grr.loadFromHash = function(hash) {
  /* Close the notification dialog. */
  $('#notification_dialog').dialog('close');

  if (hash) {
    window.location.hash = hash;
  }

  grr.hash = grr.parseHashState(hash);
  $.extend(grr.state, grr.hash);

  grr.layout('ContentView', 'content');
};

/**
 * Store the state of the foreman form.
 *
 * @param {Object} state of the foreman form.
 *
 */
grr.foreman = {regex_rules: 0, action_rules: 0};

/**
 * Adds another condition stanza to the Foreman rule form.
 *
 * @param {Object} defaults value filled in from the server filling in the js
 *  template.
 */
grr.foreman.add_condition = function(defaults) {
  defaults.rule_number = grr.foreman.regex_rules;
  $('#addRuleTemplate').tmpl(defaults).appendTo('#ForemanFormRuleBody');
  grr.foreman.regex_rules += 1;
};

/**
 * Adds another action stansa to the Foreman rule form.
 *
 * @param {Object} defaults value filled in from the server filling in the js
 *  template.
 */
grr.foreman.add_action = function(defaults) {
  defaults.rule_number = grr.foreman.action_rules;
  $('#addActionTemplate').tmpl(defaults).appendTo('#ForemanFormActionBody');
  grr.foreman.action_rules += 1;
};

/**
 * This is the hexview object.
 */
grr.hexview = {};

/**
 * Builds the hexview HTML inside the dom.
 *
 * @param {String} domId the id of the node to build this inside.
 * @param {Integer} width The number of columns to have in the hexview.
 * @param {Integer} height The number of rows to have in the hexview.
 *
 */
grr.hexview.BuildTable = function(domId, width, height) {
  var table = $($('#HexTableTemplate').text());

  // Insert the offset headers
  var layout = '';
  for (var i = 0; i < width; i++) {
    layout += ('<th class="monospace column' + i % 4 + '">' +
        grr.hexview.ZeroPad(i.toString(16), 2) + '</th>');
  }

  $(layout).insertAfter(table.find('#offset'));

  // Insert the offset column
  var layout = '';
  for (var i = 0; i < height; i++) {
    layout += ('<tr><td id="offset_value_' + i + '" class="offset monospace">' +
      '0x00000000</td></tr>');
  }

  $(layout).appendTo(table.find('#offset_area table'));

  // Insert the cells
  var layout = '';
  var count = 0;
  for (var i = 0; i < height; i++) {
    layout += '<tr>';
    for (var j = 0; j < width; j++) {
      layout += ('<td class="monospace column' + j % 4 + '" id="cell_' +
          count + '">&nbsp;&nbsp;</td>');
      count += 1;
    }
    layout += '/<tr>';
  }

  table.find('#hex_area').attr('colspan', width);
  $(layout).insertAfter(table.find('#hex_area table'));

  // Insert printable data
  var layout = '';
  var count = 0;
  for (var i = 0; i < height; i++) {
    layout += '<tr>';
    for (var j = 0; j < width; j++) {
      layout += ('<td class="monospace" id="data_value_' +
          count + '">&nbsp;</td>');
      count += 1;
    }
    layout += '/<tr>';
  }

  $(layout).insertAfter(table.find('#data_area table'));

  $('#' + domId).html(table);
};

/**
 * A utility function to zero pad strings.
 * @param {String} string_value the string to interpolate.
 * @param {Integer} limit is the total width of the string.
 * @return {String} An interporlated string.
 */
grr.hexview.ZeroPad = function(string_value, limit) {
  while (string_value.length < limit) {
    string_value = '0' + string_value;
  }
  return string_value;
};

/**
 * Populate the hexviewer table with data.
 * @param {Integer} offset is the initial offset of the array.
 * @param {Integer} width is the number of cells in each row.
 * @param {Array} values is an array of values to go into each cell of the view.
 */
grr.hexview._Populate = function(offset, width, values) {
  // Update the offsets.
  $('[id^=offset_value_]').each(function(index, element) {
    var string_value = (offset + index * width).toString(16);
    $(element).text('0x' + grr.hexview.ZeroPad(string_value, 8));
  });

  // Clear cells
  $('[id^=cell_]').html('&nbsp;&nbsp;');

  // Update the cells
  for (var i = 0; i < values.length; i++) {
    var value = parseInt(values[i]);
    var string_value = value.toString(16);

    $('#cell_' + i).text(grr.hexview.ZeroPad(string_value, 2));
  }

  // Clear data
  $('[id^=data_value_]').html('&nbsp;');

  // Update the data
  for (var i = 0; i < values.length; i++) {
    var value = parseInt(values[i]);
    var string_value = '.';

    if (value > 31 && value < 128) {
      string_value = String.fromCharCode(value);
    }

    $('#data_value_' + i).text(string_value);
  }

};

/**
 * A helper function to create the slider.
 * @param {String} renderer The renderer which will be used to interact with the
 * hexview.
 * @param {String} domId will receive the new widget.
 * @param {Integer} total_size is the total size of the file (for maximum
 * slider).
 * @param {Integer} width is the number of bytes in each row. (The height is
 * auto detected).
 * @param {Integer} height The total number of rows in this hex viewer.
 * @param {object} state The state that will be passed to our renderer.
 */
grr.hexview._makeSlider = function(renderer, domId, total_size, width, height,
                            state) {
  // Make the slider
  var slider = $('#slider');

  // Round the total size to the next row
  var total_size = Math.floor(total_size / width + 1) * width;

  slider.parent('td').attr('rowspan', height);
  slider.slider({
    orientation: 'vertical',
    min: 0,
    step: width,
    value: total_size,
    max: total_size,
    change: function(event, ui) {
      state.offset = total_size - ui.value;
      state.hex_row_count = height;

      grr.update(renderer, domId, state, function(data) {
        data = jQuery.parseJSON(data);

        // Fill in the table with the data that came back.
        grr.hexview._Populate(data.offset, width, data.values);
      });
    }
  }).slider('option', 'value', total_size);

  // Make the slider take up the full height.
  slider.height(slider.parent('td').height());

  // Bind the mouse wheel on the actual table.
  $('#hex_area').bind('mousewheel DOMMouseScroll', function(e) {
    var delta = 0;
    var element = $('#slider');
    var value;

    value = element.slider('option', 'value');
    step = total_size / 100;

    if (e.wheelDelta) {
      delta = -e.wheelDelta;
    }
    if (e.detail) {
      delta = e.detail * 40;
    }

    value -= delta / 8 * step;
    if (value > total_size) {
      value = total_size;
    }
    if (value < 0) {
      value = 0;
    }

    element.slider('option', 'value', value);

    return false;
  });
};


/**
 * Builds a hex viewer widget inside the specified domId.
 * @param {String} renderer The renderer which will be used to interact with the
 * hexview.
 * @param {String} domId will receive the new widget.
 * @param {Integer} width is the number of bytes in each row. (The height is
 *    auto detected).
 * @param {object} state is the state we use for send to our renderer.
 */
grr.hexview.HexViewer = function(renderer, domId, width, state) {
  var header_height = $('#hex_header').outerHeight();

  if (!header_height) {
    // First build a small table to see how many rows we can fit.
    grr.hexview.BuildTable(domId, width, 0);
    header_height = $('#hex_header').outerHeight();
  }

  var view_port_height = $('#' + domId).parents('.ui-tabs-panel').height();

  // Ensure a minimum of 2 rows.
  var height = Math.max(Math.floor(view_port_height / header_height) - 2,
    2);

  state.hex_row_count = height;

  // Ask for these many rows from the server.
  grr.update(renderer, domId, state, function(data) {
    data = jQuery.parseJSON(data);

    // Now fill as many rows as we can in the view port.
    grr.hexview.BuildTable(domId, width, state.hex_row_count);

    //Fill in the table with the data that came back.
    grr.hexview._Populate(data.offset, width, data.values);

    grr.hexview._makeSlider(renderer, domId, data.total_size, width, height,
      state);
  });
};


/**
 * This is the textview object.
 */
grr.textview = {};

/**
 * A helper function to create the slider.
 * @param {String} renderer The renderer which will be used to interact with the
 * textview.
 * @param {String} domId will receive the new widget.
 * @param {Integer} total_size is the total size of the file (for maximum
 *    slider).
 * @param {object} state is the state we use for send to our renderer.
 */
grr.textview._makeSlider = function(renderer, domId, total_size, state) {
  // Make the slider
  var slider = $('#text_viewer_slider');
  slider.slider({
    orientation: 'horizontal',
    min: 0,
    range: true,
    max: total_size,
    change: function(event, ui) {
      grr.textview.Update(renderer, domId, state);
    },
    slide: function(event, ui) {
      var offset = $(this).slider('values', 0);
      var size = $(this).slider('values', 1) - offset;
      $('#text_viewer_offset').val(offset);
      $('#text_viewer_data_size').val(size);
    }
  }).slider('option', 'values', [0, 20000]);
};


/**
 * Issue a request to update content based on current state.
 * @param {String} renderer The renderer which will be used to interact with the
 * textview.
 * @param {String} domId will receive the new widget.
 * @param {object} state is the state we use for send to our renderer.
 */
grr.textview.Update = function(renderer, domId, state) {
  var state = $.extend({
                offset: $('#text_viewer_offset').val(),
                text_encoding: $('#text_encoding').val(),
                data_size: $('#text_viewer_data_size').val()
                       }, state);

  grr.update(renderer, domId, state, function(data) {
    $('#text_viewer_data').html(data);
    total_size = parseInt($('#text_viewer_data_content').attr('total_size'));
    $('#text_viewer_slider').slider('option', 'max', total_size);
  });
};

/**
 * Builds a text viewer widget inside the specified domId.
 * @param {String} renderer The renderer which will be used to interact with the
 * textview.
 * @param {String} domId will receive the new widget.
 * @param {String} default_codec codec to set as default for the widget.
 * @param {object} state is the state we use for send to our renderer.
 */
grr.textview.TextViewer = function(renderer, domId, default_codec, state) {
  // Create a slider, we don't know how big it should be yet.
  var default_size = 20000;
  $('#text_viewer_data_size').val(default_size);
  $('#text_viewer_offset').val(0);
  $('#text_encoding option[value=' + default_codec + ']').attr(
      'selected', 'selected');
  grr.update(renderer, domId, state, function(data) {
    $('#text_viewer_data').html(data);
    var total_size = $('#text_viewer_data_content').attr('total_size');
    total_size = parseInt(total_size);
    grr.textview._makeSlider(renderer, domId, total_size, state);
    var new_size = Math.min(default_size, total_size);
    $('#text_viewer_data_size').val(new_size);

    // Add handlers for if someone updates the values manually.
    $('#text_encoding').change(function() {
      grr.textview.Update(renderer, domId);
    });
    $('#text_viewer_offset').change(function() {
      $('#text_viewer_slider').slider('values', 0, $(this).val());
    });
    $('#text_viewer_data_size').change(function() {
      var offset = $('#text_viewer_slider').slider('values', 0);
      $('#text_viewer_slider').slider('values', 1, $(this).val() + offset);
    });

   $('#text_viewer_slider').slider('values', 1, new_size);
  });
};


/**
 *
 * This is the queue of ajax requests which are currently in flight. If another
 * query occurs for this same domId, it is canceled until the first request
 * returns. This makes it safe to fire off ajax requests based on events, since
 * there can be many requests in flight for the same element.
 *
 */
grr.inFlightQueue = {};


/** Initialize the grr object */
grr.init();
