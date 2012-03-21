#!/usr/bin/env python
# -*- mode: python; encoding: utf-8 -*-

# Copyright 2012 Google Inc.
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

"""Test the utilities related flows."""

from grr.client import vfs
from grr.lib import aff4
from grr.lib import test_lib
from grr.proto import jobs_pb2


class TestDownloadDirectory(test_lib.FlowTestsBaseclass):
  """Test the DownloadDirectory flow."""

  def testDownloadDirectory(self):
    """Test a DownloadDirectory flow with depth=1."""
    vfs.VFS_HANDLERS[jobs_pb2.Path.OS] = test_lib.ClientVFSHandlerFixture

    # Mock the client actions DownloadDirectory uses
    client_mock = test_lib.ActionMock("HashFile",
                                      "ReadBuffer",
                                      "ListDirectory",
                                      "StatFile",
                                      "TransferBuffer")

    for _ in test_lib.TestFlowHelper(
        "DownloadDirectory", client_mock, client_id=self.client_id,
        path="/c/Downloads", pathtype=jobs_pb2.Path.OS, depth=1,
        ignore_errors=False, token=self.token):
      pass

    # Check if the base path was created
    output_path = "aff4:/{0}/fs/os/c/Downloads".format(self.client_id)

    output_fd = aff4.FACTORY.Open(output_path, token=self.token)

    children = list(output_fd.OpenChildren())

    # There should be 4 children: a.txt, b.txt, c.txt, d.txt
    self.assertEqual(len(children), 4)

    self.assertEqual("a.txt b.txt c.txt d.txt".split(),
                     sorted([child.urn.Basename() for child in children]))

    # Find the child named: a.txt
    for child in children:
      if child.urn.Basename() == "a.txt":
        break

    # Check the AFF4 type of the child, it should have changed
    # from VFSFile to HashImage
    self.assertEqual(child.__class__.__name__, "HashImage")

  def testDownloadDirectorySub(self):
    """Test a DownloadDirectory flow with depth=5."""
    vfs.VFS_HANDLERS[jobs_pb2.Path.OS] = test_lib.ClientVFSHandlerFixture

    # Mock the client actions DownloadDirectory uses
    client_mock = test_lib.ActionMock("HashFile",
                                      "ReadBuffer",
                                      "ListDirectory",
                                      "StatFile",
                                      "TransferBuffer")

    for _ in test_lib.TestFlowHelper(
        "DownloadDirectory", client_mock, client_id=self.client_id,
        path="/c/Downloads", pathtype=jobs_pb2.Path.OS, depth=5,
        ignore_errors=False, token=self.token):
      pass

    # Check if the base path was created
    output_path = "aff4:/{0}/fs/os/c/Downloads".format(self.client_id)

    output_fd = aff4.FACTORY.Open(output_path, token=self.token)

    children = list(output_fd.OpenChildren())

    # There should be 5 children: a.txt, b.txt, c.txt, d.txt, sub1
    self.assertEqual(len(children), 5)

    self.assertEqual("a.txt b.txt c.txt d.txt sub1".split(),
                     sorted([child.urn.Basename() for child in children]))

    # Find the child named: sub1
    for child in children:
      if child.urn.Basename() == "sub1":
        break

    children = list(child.OpenChildren())

    # There should be 4 children: a.txt, b.txt, c.txt, d.txt
    self.assertEqual(len(children), 4)

    self.assertEqual("a.txt b.txt c.txt d.txt".split(),
                     sorted([child.urn.Basename() for child in children]))

