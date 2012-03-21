#!/usr/bin/env python

# Copyright 2011 Google Inc.
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

"""AFF4 Timeline object tests."""

import random
import time

from grr.lib import aff4
from grr.lib import test_lib
from grr.proto import analysis_pb2


class TimelineTest(test_lib.AFF4ObjectTest):
  """Test the timeline implementation."""

  def testTimeSeries(self):
    """Check that timeseries sort events by timestamps."""
    path = "/C.1/time series 1"

    fd = aff4.FACTORY.Create(path, "GRRTimeSeries", token=self.token)

    # Make up some random events in random time order.
    now = int(time.time() * 1000000)
    times = [random.randint(0, 1000) * 1000000 + now for _ in range(100)]

    for t in times:
      event = analysis_pb2.Event(timestamp=t)
      event.stat.st_mtime = t / 1000000
      event.stat.pathspec.path = time.ctime(t/1000000)
      fd.AddEvent(event)

    fd.Close()

    # Now read back the events and make sure they are in time order.
    times.sort()
    fd = aff4.FACTORY.Open(path, token=self.token)
    count = 0

    for t, event in zip(times, fd):
      self.assertEqual(event.timestamp, t)
      count += 1

    self.assert_(fd.Get(fd.Schema.SIZE) > 0)
    self.assertEqual(count, len(times))

  def testTimeSeriesQuery(self):
    """Check that we can filter by query string."""
    path = "/C.1/time series 2"

    fd = aff4.FACTORY.Create(path, "GRRTimeSeries", token=self.token)
    times = [1321533293629468, 1321633293629468, 1321733293629468]
    for t in times:
      event = analysis_pb2.Event(timestamp=t)
      event.stat.st_mtime = t / 1000000
      event.stat.pathspec.path = time.ctime(t/1000000)
      fd.AddEvent(event)

    fd.Close()

    fd = aff4.FACTORY.Open(path, token=self.token)

    # Check that we can filter the events
    results = list(fd.Query("timestamp > 2000"))
    self.assertEqual(len(results), 3)

    # Match by timestamp
    results = list(fd.Query(
        "timestamp >= 2011/11/18 and timestamp < 2011/11/19"))
    self.assertEqual(len(results), 1)
    self.assertEqual(results[0].event.timestamp, 1321633293629468)

    # Test if <= works as expected.
    results = list(fd.Query(
        "timestamp >= 2011/11/18 and timestamp <= 2011/11/19"))
    self.assertEqual(len(results), 2)

    # Match within the embedded stat protobuf
    results = list(fd.Query(
        "event.stat.st_mtime >= 2011/11/18 and event.stat.st_mtime < 2011/11/19"
        ))
    self.assertEqual(len(results), 1)
    self.assertEqual(results[0].event.timestamp, 1321633293629468)

    # Match a string deeply nested in protobufs
    results = list(fd.Query("event.stat.pathspec.path contains Fri"))
    self.assertEqual(len(results), 1)
    self.assertEqual(results[0].event.timestamp, 1321633293629468)
