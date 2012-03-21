#!/usr/bin/env python
#
# Copyright 2010 Google Inc.
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


"""This plugin renders the client search page."""
import re
import time

from grr.gui import renderers
from grr.lib import aff4
from grr.lib import registry
from grr.lib import stats


class SearchHostInit(registry.InitHook):
  def __init__(self):
    # Counters used here
    stats.STATS.RegisterMap("grr_gui_search_host_time", "times", precision=0)


class ContentView(renderers.Renderer):
  """Manage the main content pane."""

  template = renderers.Template("""
<div id="navigator" class="sidebarHolder grr-content-sidebar
  grr-sidebar-search"></div>
<div id="main" class="rightPane"></div>
<script>
  $("#{{id|escapejs}}").splitter({
    minAsize: 100,
    maxAsize: 3000,
    splitVertical: true,
    A: $('#navigator'),
    B: $('#main'),
    animSpeed: 10,
    closeableto: 0})
  .bind("resize", function (event) {
    grr.publish("DelayedResize", "navigator");
    grr.publish("DelayedResize", "main");
    grr.fixWidth($("#main"));
    event.stopPropagation();
  }).resize();

  if (grr.hash.c) {
    grr.state.client_id = grr.hash.c;
  };

  // Update main's state from the hash
  if (grr.hash.main) {
    grr.layout(grr.hash.main, "main");
  } else {
    grr.layout("FrontPage", "main");
  };

  // Reload the navigator when a new client is selected.
  grr.subscribe("client_selection", function () {
    grr.layout("Navigator", "navigator");
  }, "{{id|escapejs}}");

  grr.layout("Navigator", "navigator");
</script>
""")

  def Layout(self, request, response):
    """Manage content pane depending on passed in query parameter."""
    response = super(ContentView, self).Layout(request, response)

    return self.RenderFromTemplate(
        self.template, response, id=self.id)


class StatusRenderer(renderers.TemplateRenderer):
  """A renderer for the online status line."""

  # Update time in ms.
  poll_time = 30000

  layout_template = renderers.Template("""
<div class="infoline" id="infoline_{{unique|escape}}">
Status: {{this.icon|safe}}
{{this.last_seen_msg|escape}} ago.

<script>
window.setTimeout(function () {
  grr.layout("StatusRenderer", "infoline_{{unique|escapejs}}")},
  {{this.poll_time|escapejs}});
</script>
</div>
""")

  def Layout(self, request, response):
    """Manage content pane depending on passed in query parameter."""

    client_id = request.REQ.get("client_id")
    if client_id:
      client = aff4.FACTORY.Open(client_id, token=request.token)
      clock = client.Get(client.Schema.CLOCK)
      if clock:
        age = clock.age
      else:
        age = 0

      # Also check for proper access.
      aff4.FACTORY.Open(client.urn.Add("fs"), token=request.token)

      time_last_seen = (client.Schema.CLOCK() - int(age)) / 1e6
      self.icon = OnlineStateIcon(age).RawHTML()

      if time_last_seen < 60:
        self.last_seen_msg = "%d seconds" % int(time_last_seen)
      elif time_last_seen < 60 * 60:
        self.last_seen_msg = "%d minutes" % int(time_last_seen // 60)
      elif time_last_seen < 60 * 60 * 24:
        self.last_seen_msg = "%d hours" % int(time_last_seen // (60 * 60))
      else:
        self.last_seen_msg = "%d days" % int(time_last_seen // (60 * 60 * 24))

    return super(StatusRenderer, self).Layout(request, response)


class Navigator(StatusRenderer):
  """A Renderer to show all menu options in an extruder."""

  layout_template = renderers.Template("""
<div id="nav_{{unique|escape}}"></div>
{% for client_id, host in this.hosts %}
<div class="headline">
{{host|escape}}</div>

{% if this.reason %}
<div class="ACL_reason">
 Access reason: {{this.reason|escape}}
</div>
{% endif %} """ + str(StatusRenderer.layout_template) + """
 <ul class="iconlist">
  {% for heading, renderer in this.host_headings %}
   <li>
     <a grrtarget="{{renderer|escape}}"
      href="#c={{client_id|escape}}&main={{renderer|escape}}">
       {{ heading|escape }}</a>
   </li>
  {% endfor %}
</ul>
{% endfor %}
<div class="headline">GRR Management</div>
<ul class="iconlist">
  {% for heading, renderer in this.general_headings %}
   <li>
     <a grrtarget="{{renderer|escapejs}}"
      href="#c={{client_id|escapejs}}&main={{renderer|escapejs}}">
       {{ heading|escape }}</a>
   </li>
  {% endfor %}
</ul></li>
<script>

 grr.installNavigationActions("nav_{{unique|escapejs}}");
 if(!grr.hash.main) {
   $('a[grrtarget=HostInformation]').click();
 } else {
   $('a[grrtarget=' + grr.hash.main + ']').click();
 };
</script>
""")

  def Layout(self, request, response):
    """Manage content pane depending on passed in query parameter."""
    self.reason = request.REQ.get("reason")

    # Introspect all the categories
    self.host_headings = []
    self.general_headings = []

    for cls in self.classes.values():
      if "Host" in cls.behaviours:
        self.host_headings.append((cls.description, cls.__name__))
      elif "General" in cls.behaviours:
        self.general_headings.append((cls.description, cls.__name__))

    self.hosts = []
    client_id = request.REQ.get("client_id")
    if client_id:
      client = aff4.FACTORY.Open(client_id, token=request.token)

      # Also check for proper access.
      aff4.FACTORY.Open(client.urn.Add("acl_check"), token=request.token)

      self.hosts.append((client_id, client.Get(client.Schema.HOSTNAME)))

    return super(Navigator, self).Layout(request, response)


class OnlineStateIcon(renderers.RDFValueRenderer):
  """Render the online state by using an icon."""

  cls = "vertical_aligned"

  layout_template = renderers.Template("""
<img class="grr-icon-small {{this.cls|escape}}"
     src="/static/images/{{this.icon|escape}}"/>""")

  # Maps the flow states to icons we can show
  state_map = {"15m": "online.png",
               "1d": "online-1d.png",
               "offline": "offline.png"}

  def Layout(self, request, response):
    time_last_seen = time.time() - (self.proxy / 1e6)
    if time_last_seen < 60 * 15:
      self.icon = self.state_map["15m"]
    elif time_last_seen < 60 * 60 * 24:
      self.icon = self.state_map["1d"]
    else:
      self.icon = self.state_map["offline"]

    return super(OnlineStateIcon, self).Layout(request, response)


class CenteredOnlineStateIcon(OnlineStateIcon):
  """Render the online state by using a centered icon."""

  layout_template = ("<div class=\"centered\">" +
                     OnlineStateIcon.layout_template +
                     "</div>")


class HostTable(renderers.TableRenderer):
  """Render a table for searching hosts."""

  # Update the table if any messages appear in these queues:
  vfs_table_template = renderers.Template("""<script>
     //Receive the selection event and emit a client_id
     grr.subscribe("select_table_{{ id|escapejs }}", function(node) {
          var spans = node.find("span[type=subject]");
          var cn = $(spans[0]).text().replace("aff4:/", "");
          var hostname = $(spans[1]).text();
          grr.state.client_id = cn;
          grr.publish("hash_state", "c", cn);
          // Clear the authorization for new clients.
          grr.publish("hash_state", "reason", "");
          grr.state.reason = "";

          grr.publish("hash_state", "main", null);
          grr.publish("client_selection", cn, hostname);
     }, "{{ unique|escapejs }}");
 </script>""")

  def __init__(self):
    renderers.TableRenderer.__init__(self)
    self.AddColumn(renderers.RDFValueColumn("Online", width=0,
                                            renderer=CenteredOnlineStateIcon))
    self.AddColumn(renderers.AttributeColumn("subject"))
    self.AddColumn(renderers.AttributeColumn(
        "Host", renderer=renderers.SubjectRenderer))
    self.AddColumn(renderers.AttributeColumn("Version"))
    self.AddColumn(renderers.AttributeColumn("MAC"))
    self.AddColumn(renderers.AttributeColumn("Usernames"))
    self.AddColumn(renderers.AttributeColumn("Install"))
    self.AddColumn(renderers.AttributeColumn("Clock"))

  @renderers.ErrorHandler()
  def Layout(self, request, response):
    response = super(HostTable, self).Layout(request, response)

    return self.RenderFromTemplate(
        self.vfs_table_template,
        response,
        event_queue=self.event_queue,
        unique=self.unique, id=self.id)

  def QueryWithDataStore(self, query_string, token, start, length):
    """Query using the data store Query mechanism."""
    for (pattern,
         replacement) in [("host:([^\ ]+)", "Host contains '\\1'"),
                          ("id:([^\ ]+)", "( subject contains '\\1' and "
                           "type = VFSGRRClient )"),
                          ("version:([^\ ]+)", "Version contains '\\1'"),
                          ("mac:([^\ ]+)", "MAC contains '\\1'"),
                          ("user:([^\ ]+)", "Usernames contains '\\1'")]:
      query_string = re.sub(pattern, replacement, query_string)

    root = aff4.FACTORY.Create(aff4.ROOT_URN, "AFF4Volume", "r",
                               token=token)
    return root.Query(query_string, limit=(start, length))

  @stats.Timed("grr_gui_search_host_time")
  def BuildTable(self, start, end, request):
    """Draw table cells."""
    length = end - start
    row_count = 0

    query_string = request.REQ.get("q", "")
    if not query_string:
      raise RuntimeError("A query string must be provided.")

    # More complex searches are done through the data_store.Query()
    if ":" in query_string:
      result_set = self.QueryWithDataStore(query_string, request.token,
                                           start, length)

    # Default to searching host names through the index which is much faster.
    else:
      client_schema = aff4.AFF4Object.classes["VFSGRRClient"].SchemaCls
      index_urn = client_schema.client_index
      index = aff4.FACTORY.Create(index_urn, "AFF4Index", mode="r",
                                  token=request.token)

      result_set = index.Query(
          [client_schema.HOSTNAME, client_schema.USERNAMES],
          query_string.lower(), limit=(start, end))

    self.message = "Searched for %s" % query_string

    for child in result_set:
      # Add the fd to all the columns
      for column in self.columns:
        try:
          column.AddRowFromFd(row_count + start, child)
        except AttributeError:
          pass

      # Also update the online status.
      clock = child.Get(child.Schema.CLOCK) or 0
      self.columns[0].AddElement(row_count + start, long(clock))

      row_count += 1

    return row_count


class SearchHostView(renderers.Renderer):
  """Show a search screen for the host."""

  title = "Search Client"

  template = renderers.Template("""
<form id='search_host' method='POST'>
<input type=text name='q' class="grr-searchfield" />
<input type="submit" id="grr-searchbutton" title="Search"
  value="Search" class="grr-button grr-button-submit">
  Search
</input>
</form>
<script>
 $("#search_host").submit(function () {
   grr.layout("HostTable", "main");
   grr.state.q = $('input[name="q"]').val()
   return false;
 }).find("input[name=q]").focus();
</script>
""")

  def Layout(self, request, response):
    """Display a search screen for the host."""
    response = super(SearchHostView, self).Layout(request, response)

    return self.RenderFromTemplate(
        self.template, response, title=self.title,
        id=self.id)


class FrontPage(renderers.Renderer):
  """The front page of the GRR application."""

  layout_template = renderers.Template("""
<div id='front'><h1>Welcome to GRR</h1></div>
Query for a system to view in the search box above.

<div>
A bare search term searches for a hostname. Prefix the term with "version:" to
search for the OS version, "mac:" to search for a mac address. Terms may also be
combined by using and, or and parenthesis.
</div>

<script>
 $("#content").resize();
</script>
""")

  def Layout(self, request, response):
    """Manage content pane depending on passed in query parameter."""
    response = super(FrontPage, self).Layout(request, response)

    return self.RenderFromTemplate(
        self.layout_template, response)
