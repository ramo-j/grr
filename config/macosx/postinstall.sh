#!/bin/sh
#
# Post installation script for GRR client MacOS-X package

LAUNCHCTL_PLIST="/System/Library/LaunchDaemons/com.google.code.grrd.plist";

if [ -f ${LAUNCHCTL_PLIST} ];
then
  sudo launchctl load ${LAUNCHCTL_PLIST};
fi

