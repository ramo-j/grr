import * as apiInterfaces from '../api/api_interfaces';
import {CellComponent, CellData, ColumnDescriptor, PayloadTranslation, PayloadType} from '../models/result';

import {translateExecuteBinaryResponse, translateHashToHex} from './flow';
import {getHuntResultKey} from './hunt';
import {createOptionalBigInt, createOptionalDate, createOptionalDateSeconds} from './primitive';

/** HUNT_RESULT_COLUMNS describes how to render HuntResultRow. */
export const HUNT_RESULT_COLUMNS = {
  'clientId': {title: 'Client ID'},
  'collectedAt': {title: 'Collected At', component: CellComponent.TIMESTAMP},
  'payloadType': {title: 'Result Type'},
  'detailsLink': {title: '', component: CellComponent.DRAWER_LINK},
} as const;

/**
 * orderApiHuntResultColumns orders the column keys used for rendering a hunt
 * result table. We want to guarantee the order of the "common columns" (defined
 * by `HUNT_RESULT_COLUMNS` above), so we have this function to insert the extra
 * columns (based on payload type) in the middle of the displayedColumns
 * slice.
 */
export function orderApiHuntResultColumns(
    cols: {[key: string]: ColumnDescriptor}): string[] {
  // It would be better to refer to
  // `PAYLOAD_TYPE_TRANSLATION['ApiHuntResult'].columns` instead of
  // `HUNT_RESULT_COLUMNS` here, however Types become complex so I think
  // this compromise is ok for now.
  const first: ReadonlyArray<keyof typeof HUNT_RESULT_COLUMNS> =
      ['clientId', 'collectedAt', 'payloadType'];
  const last: ReadonlyArray<keyof typeof HUNT_RESULT_COLUMNS> = ['detailsLink'];
  const reservedNames = new Set<string>([...first, ...last]);

  let unreserved: string[] = [];
  for (const [k, ] of Object.entries(cols)) {
    // `first` and `last` are "reserved names" we don't want to duplicate.
    if (!reservedNames.has(k) && !unreserved.includes(k)) {
      unreserved = unreserved.concat(k);
    }
  }

  return [...first, ...unreserved, ...last];
}

/** Constructs a HuntResultsRow from an ApiHuntResult. */
export function toHuntResultRow(
    hr: apiInterfaces.ApiHuntResult,
    huntId: string): CellData<typeof HUNT_RESULT_COLUMNS> {
  const key = getHuntResultKey(hr, huntId);
  return {
    'clientId': hr.clientId,
    'payloadType': hr.payloadType,
    'collectedAt': createOptionalDate(hr.timestamp),
    'detailsLink': ['result-details', key ?? ''],
  };
}

/** CLIENT_INFO_COLUMNS describes how to render ClientInfoRow. */
export const CLIENT_INFO_COLUMNS = {
  'os': {title: 'OS'},
  'fqdn': {title: 'FQDN'},
  'userNum': {title: 'User #'},
  'usernames': {title: 'Usernames'},
} as const;

/** Constructs a ClientRow from a ClientSummary. */
export function toClientInfoRowFromClientSummary(
    cs: apiInterfaces.ClientSummary): CellData<typeof CLIENT_INFO_COLUMNS> {
  return {
    'os': cs?.systemInfo?.system,
    'fqdn': cs?.systemInfo?.fqdn,
    'userNum': cs?.users?.length,
    'usernames': cs?.users?.map(u => u.username).join(', ') ?? '',
  };
}

/** Constructs a ClientRow from a ClientSummary. */
export function toClientInfoRowFromKnowledgeBase(
    kb: apiInterfaces.KnowledgeBase): CellData<typeof CLIENT_INFO_COLUMNS> {
  return {
    'os': kb?.os,
    'fqdn': kb?.fqdn,
    'userNum': kb?.users?.length,
    'usernames': kb?.users?.map(u => u.username).join(', ') ?? '',
  };
}

/** ANOMALY_COLUMNS describes how to render ClientInfoRow. */
export const ANOMALY_COLUMNS = {
  'type': {title: 'Type'},
  'severity': {title: 'Severity'},
  'confidence': {title: 'Confidence'},
  'generatedBy': {title: 'Generated by'},
} as const;

/** Constructs an AnomalyRow from an Anomaly. */
export function toAnomalyRow(a: apiInterfaces.Anomaly):
    CellData<typeof ANOMALY_COLUMNS> {
  return {
    'type': a?.type ?? '',
    'severity': a?.severity ?? '',
    'confidence': a?.confidence ?? '',
    'generatedBy': a?.generatedBy ?? '',
  };
}

/** USER_COLUMNS describes how to render ClientInfoRow. */
export const USER_COLUMNS = {
  'uid': {title: 'UID'},
  'username': {title: 'Username', component: CellComponent.USERNAME},
  'lastLogon': {title: 'Last Logon', component: CellComponent.TIMESTAMP},
} as const;

/** Constructs a ClientRow from a ClientSummary. */
export function toUserRow(u: apiInterfaces.User):
    CellData<typeof USER_COLUMNS> {
  return {
    'uid': u?.uid ?? '',
    'username': u?.username ?? '',
    'lastLogon': createOptionalDate(u?.lastLogon),
  };
}

/** FILE_COLUMNS describes how to render FileRow. */
export const FILE_COLUMNS = {
  'path': {title: 'Path'},
  'mode': {title: 'Mode', component: CellComponent.FILE_MODE},
  'hash': {title: 'Hashes', component: CellComponent.HASH},
  'size': {title: 'Size', component: CellComponent.HUMAN_READABLE_SIZE},
  'atime': {title: 'A-time', component: CellComponent.TIMESTAMP},
  'mtime': {title: 'M-time', component: CellComponent.TIMESTAMP},
  'ctime': {title: 'C-time', component: CellComponent.TIMESTAMP},
  'btime': {title: 'B-time', component: CellComponent.TIMESTAMP},
} as const;

/** Constructs a FileRow from a CollectFilesByKnownPathResult. */
export function toFileRowFromCollectFilesByKnownPathResult(
    r: apiInterfaces.CollectFilesByKnownPathResult):
    CellData<typeof FILE_COLUMNS> {
  return {
    ...toFileRowFromStatEntry(r.stat ?? {}),
    'hash': translateHashToHex(r.hash ?? {}),
  };
}

/** Constructs a FileRow from a FileFinderResult. */
export function toFileRowFromFileFinderResult(
    ffr: apiInterfaces.FileFinderResult): CellData<typeof FILE_COLUMNS> {
  return {
    ...toFileRowFromStatEntry(ffr.statEntry ?? {}),
    'hash': translateHashToHex(ffr.hashEntry ?? {}),
  };
}

/** Constructs a FileRow from a StatEntry. */
export function toFileRowFromStatEntry(se: apiInterfaces.StatEntry):
    CellData<typeof FILE_COLUMNS> {
  return {
    'path': se.pathspec?.path ?? '',
    'hash': undefined,
    'mode': createOptionalBigInt(se.stMode),
    'size': createOptionalBigInt(se.stSize),
    'atime': createOptionalDateSeconds(se.stAtime),
    'mtime': createOptionalDateSeconds(se.stMtime),
    'ctime': createOptionalDateSeconds(se.stCtime),
    'btime': createOptionalDateSeconds(se.stBtime),
  };
}

/** ERROR_COLUMNS describes how to render a HuntErrorRow. */
export const ERROR_COLUMNS = {
  ...HUNT_RESULT_COLUMNS,
  'logMessage': {title: 'Log'},
  'backtrace': {title: 'Backtrace'},
} as const;

/** Constructs a HuntErrorRow from an ApiHuntError. */
export function toHuntErrorRow(err: apiInterfaces.ApiHuntError, huntId: string):
    CellData<typeof ERROR_COLUMNS> {
  const key = getHuntResultKey(err, huntId);
  return {
    'clientId': err.clientId,
    'payloadType': PayloadType.API_HUNT_ERROR,
    'collectedAt': createOptionalDate(err.timestamp),
    'detailsLink': ['result-details', key ?? ''],
    'logMessage': err.logMessage,
    'backtrace': err.backtrace,
  };
}

/** EXECUTE_BINARY_COLUMNS describes how to render an ExecuteBinaryRow. */
export const EXECUTE_BINARY_COLUMNS = {
  'exitStatus': {title: 'Exit status'},
  'stdout': {title: 'Standard output', component: CellComponent.TRACE},
  'stderr': {title: 'Error output', component: CellComponent.TRACE},
} as const;

/** Constructs an ExecuteBinaryRow from an ExecuteBinaryResponse. */
export function toExecuteBinaryRow(e: apiInterfaces.ExecuteBinaryResponse):
    CellData<typeof EXECUTE_BINARY_COLUMNS> {
  return translateExecuteBinaryResponse(e);
}

/** EXECUTE_PYTHON_HACK_COLUMNS describes how to render an ExecuteBinaryRow. */
export const EXECUTE_PYTHON_HACK_COLUMNS = {
  'result': {title: 'Result', component: CellComponent.TRACE},
} as const;

/** Constructs an ExecutePythonHackRow from an ExecutePythonHackResult. */
export function toExecutePythonHackRow(
    e: apiInterfaces.ExecutePythonHackResult):
    CellData<typeof EXECUTE_PYTHON_HACK_COLUMNS> {
  return {'result': e.resultString};
}

/** ERROR_TAB is used to identify error results tab. */
export const ERROR_TAB = 'Errors';

/** Maps PayloadType to corresponding translation information. */
export const PAYLOAD_TYPE_TRANSLATION: {
  // Note: Not every PayloadType has a translation definition:
  [key in PayloadType]?: PayloadTranslation<{[key: string]: ColumnDescriptor}>
} = {
  [PayloadType.ANOMALY]: {
    translateFn: toAnomalyRow,
    columns: ANOMALY_COLUMNS,
  } as PayloadTranslation<typeof ANOMALY_COLUMNS>,
  [PayloadType.API_HUNT_RESULT]: {
    tabName: 'N/A',
    translateFn: toHuntResultRow,
    columns: HUNT_RESULT_COLUMNS
  } as PayloadTranslation<typeof HUNT_RESULT_COLUMNS>,
  [PayloadType.CLIENT_SUMMARY]: {
    tabName: 'Client Info',
    translateFn: toClientInfoRowFromClientSummary,
    columns: CLIENT_INFO_COLUMNS,
  } as PayloadTranslation<typeof CLIENT_INFO_COLUMNS>,
  [PayloadType.COLLECT_FILES_BY_KNOWN_PATH_RESULT]: {
    tabName: 'Files By Known Path',
    translateFn: toFileRowFromCollectFilesByKnownPathResult,
    columns: FILE_COLUMNS,
  } as PayloadTranslation<typeof FILE_COLUMNS>,
  [PayloadType.FILE_FINDER_RESULT]: {
    tabName: 'File Finder',
    translateFn: toFileRowFromFileFinderResult,
    columns: FILE_COLUMNS,
  } as PayloadTranslation<typeof FILE_COLUMNS>,
  [PayloadType.KNOWLEDGE_BASE]: {
    tabName: 'Knowledge Base',
    translateFn: toClientInfoRowFromKnowledgeBase,
    columns: CLIENT_INFO_COLUMNS,
  } as PayloadTranslation<typeof CLIENT_INFO_COLUMNS>,
  [PayloadType.STAT_ENTRY]: {
    tabName: 'Stat Entry',
    translateFn: toFileRowFromStatEntry,
    columns: FILE_COLUMNS,
  } as PayloadTranslation<typeof FILE_COLUMNS>,
  [PayloadType.USER]: {
    tabName: 'Users',
    translateFn: toUserRow,
    columns: USER_COLUMNS,
  } as PayloadTranslation<typeof USER_COLUMNS>,
  [PayloadType.API_HUNT_ERROR]: {
    tabName: ERROR_TAB,
    translateFn: toHuntErrorRow,
    columns: ERROR_COLUMNS,
  } as PayloadTranslation<typeof ERROR_COLUMNS>,
  [PayloadType.EXECUTE_BINARY_RESPONSE]: {
    tabName: 'Binary execution',
    translateFn: toExecuteBinaryRow,
    columns: EXECUTE_BINARY_COLUMNS,
  } as PayloadTranslation<typeof EXECUTE_BINARY_COLUMNS>,
  [PayloadType.EXECUTE_PYTHON_HACK_RESULT]: {
    tabName: 'Python execution',
    translateFn: toExecutePythonHackRow,
    columns: EXECUTE_PYTHON_HACK_COLUMNS,
  } as PayloadTranslation<typeof EXECUTE_PYTHON_HACK_COLUMNS>,
} as const;
