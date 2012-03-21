# Generated by the protocol buffer compiler.  DO NOT EDIT!

from google.protobuf import descriptor
from google.protobuf import message
from google.protobuf import reflection
from google.protobuf import descriptor_pb2
# @@protoc_insertion_point(imports)



DESCRIPTOR = descriptor.FileDescriptor(
  name='grr/proto/sysinfo.proto',
  package='',
  serialized_pb='\n\x17grr/proto/sysinfo.proto\"_\n\x07Process\x12\x0b\n\x03\x65xe\x18\x01 \x01(\t\x12\x0f\n\x07\x63mdline\x18\x02 \x01(\t\x12\x0b\n\x03pid\x18\x03 \x01(\r\x12\x0c\n\x04ppid\x18\x04 \x01(\r\x12\r\n\x05\x63time\x18\x05 \x01(\x04\x12\x0c\n\x04user\x18\x06 \x01(\t\"N\n\nFilesystem\x12\x0e\n\x06\x64\x65vice\x18\x01 \x01(\t\x12\x13\n\x0bmount_point\x18\x02 \x01(\t\x12\x0c\n\x04type\x18\x03 \x01(\t\x12\r\n\x05label\x18\x04 \x01(\t\"\xcd\x03\n\nConnection\x12)\n\x05state\x18\x01 \x01(\x0e\x32\x11.Connection.State:\x07UNKNOWN\x12\x34\n\x04type\x18\x02 \x01(\x0e\x32\x16.Connection.SocketType:\x0eUNKNOWN_SOCKET\x12\x12\n\nlocal_addr\x18\x03 \x01(\r\x12\x12\n\nlocal_port\x18\x04 \x01(\r\x12\x13\n\x0bremote_addr\x18\x05 \x01(\r\x12\x13\n\x0bremote_port\x18\x06 \x01(\r\x12\x0b\n\x03pid\x18\x07 \x01(\r\x12\r\n\x05\x63time\x18\x08 \x01(\x04\"\xbb\x01\n\x05State\x12\x0b\n\x07UNKNOWN\x10\x00\x12\n\n\x06\x43LOSED\x10\x01\x12\n\n\x06LISTEN\x10\x02\x12\x0c\n\x08SYN_SENT\x10\x03\x12\x0c\n\x08SYN_RCVD\x10\x04\x12\t\n\x05\x45STAB\x10\x05\x12\r\n\tFIN_WAIT1\x10\x06\x12\r\n\tFIN_WAIT2\x10\x07\x12\x0e\n\nCLOSE_WAIT\x10\x08\x12\x0b\n\x07\x43LOSING\x10\t\x12\x0c\n\x08LAST_ACK\x10\n\x12\r\n\tTIME_WAIT\x10\x0b\x12\x0e\n\nDELETE_TCB\x10\x0c\"2\n\nSocketType\x12\x12\n\x0eUNKNOWN_SOCKET\x10\x00\x12\x07\n\x03TCP\x10\x01\x12\x07\n\x03UDP\x10\x02\"1\n\x07MRUFile\x12\x10\n\x08\x66ilename\x18\x01 \x01(\t\x12\x14\n\ttimestamp\x18\x02 \x01(\x04:\x01\x30')



_CONNECTION_STATE = descriptor.EnumDescriptor(
  name='State',
  full_name='Connection.State',
  filename=None,
  file=DESCRIPTOR,
  values=[
    descriptor.EnumValueDescriptor(
      name='UNKNOWN', index=0, number=0,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='CLOSED', index=1, number=1,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='LISTEN', index=2, number=2,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='SYN_SENT', index=3, number=3,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='SYN_RCVD', index=4, number=4,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='ESTAB', index=5, number=5,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='FIN_WAIT1', index=6, number=6,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='FIN_WAIT2', index=7, number=7,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='CLOSE_WAIT', index=8, number=8,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='CLOSING', index=9, number=9,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='LAST_ACK', index=10, number=10,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='TIME_WAIT', index=11, number=11,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='DELETE_TCB', index=12, number=12,
      options=None,
      type=None),
  ],
  containing_type=None,
  options=None,
  serialized_start=427,
  serialized_end=614,
)

_CONNECTION_SOCKETTYPE = descriptor.EnumDescriptor(
  name='SocketType',
  full_name='Connection.SocketType',
  filename=None,
  file=DESCRIPTOR,
  values=[
    descriptor.EnumValueDescriptor(
      name='UNKNOWN_SOCKET', index=0, number=0,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='TCP', index=1, number=1,
      options=None,
      type=None),
    descriptor.EnumValueDescriptor(
      name='UDP', index=2, number=2,
      options=None,
      type=None),
  ],
  containing_type=None,
  options=None,
  serialized_start=616,
  serialized_end=666,
)


_PROCESS = descriptor.Descriptor(
  name='Process',
  full_name='Process',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='exe', full_name='Process.exe', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='cmdline', full_name='Process.cmdline', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='pid', full_name='Process.pid', index=2,
      number=3, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='ppid', full_name='Process.ppid', index=3,
      number=4, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='ctime', full_name='Process.ctime', index=4,
      number=5, type=4, cpp_type=4, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='user', full_name='Process.user', index=5,
      number=6, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=27,
  serialized_end=122,
)


_FILESYSTEM = descriptor.Descriptor(
  name='Filesystem',
  full_name='Filesystem',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='device', full_name='Filesystem.device', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='mount_point', full_name='Filesystem.mount_point', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='type', full_name='Filesystem.type', index=2,
      number=3, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='label', full_name='Filesystem.label', index=3,
      number=4, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=124,
  serialized_end=202,
)


_CONNECTION = descriptor.Descriptor(
  name='Connection',
  full_name='Connection',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='state', full_name='Connection.state', index=0,
      number=1, type=14, cpp_type=8, label=1,
      has_default_value=True, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='type', full_name='Connection.type', index=1,
      number=2, type=14, cpp_type=8, label=1,
      has_default_value=True, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='local_addr', full_name='Connection.local_addr', index=2,
      number=3, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='local_port', full_name='Connection.local_port', index=3,
      number=4, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='remote_addr', full_name='Connection.remote_addr', index=4,
      number=5, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='remote_port', full_name='Connection.remote_port', index=5,
      number=6, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='pid', full_name='Connection.pid', index=6,
      number=7, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='ctime', full_name='Connection.ctime', index=7,
      number=8, type=4, cpp_type=4, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
    _CONNECTION_STATE,
    _CONNECTION_SOCKETTYPE,
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=205,
  serialized_end=666,
)


_MRUFILE = descriptor.Descriptor(
  name='MRUFile',
  full_name='MRUFile',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    descriptor.FieldDescriptor(
      name='filename', full_name='MRUFile.filename', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=unicode("", "utf-8"),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    descriptor.FieldDescriptor(
      name='timestamp', full_name='MRUFile.timestamp', index=1,
      number=2, type=4, cpp_type=4, label=1,
      has_default_value=True, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  extension_ranges=[],
  serialized_start=668,
  serialized_end=717,
)

_CONNECTION.fields_by_name['state'].enum_type = _CONNECTION_STATE
_CONNECTION.fields_by_name['type'].enum_type = _CONNECTION_SOCKETTYPE
_CONNECTION_STATE.containing_type = _CONNECTION;
_CONNECTION_SOCKETTYPE.containing_type = _CONNECTION;
DESCRIPTOR.message_types_by_name['Process'] = _PROCESS
DESCRIPTOR.message_types_by_name['Filesystem'] = _FILESYSTEM
DESCRIPTOR.message_types_by_name['Connection'] = _CONNECTION
DESCRIPTOR.message_types_by_name['MRUFile'] = _MRUFILE

class Process(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _PROCESS
  
  # @@protoc_insertion_point(class_scope:Process)

class Filesystem(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _FILESYSTEM
  
  # @@protoc_insertion_point(class_scope:Filesystem)

class Connection(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _CONNECTION
  
  # @@protoc_insertion_point(class_scope:Connection)

class MRUFile(message.Message):
  __metaclass__ = reflection.GeneratedProtocolMessageType
  DESCRIPTOR = _MRUFILE
  
  # @@protoc_insertion_point(class_scope:MRUFile)

# @@protoc_insertion_point(module_scope)
