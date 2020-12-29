import * as msg from 'messaging';
import { settingsStorage } from 'settings';
import { me as companion } from 'companion';
import {
  fetchProjects,
  fetchTasksByProjectId,
  closeTaskById,
} from '../companion/todoist.js';

// Todoist projects-json-structure example:
/*
  {
    id: 2243678069,
    color: 48,
    name: 'Inbox',
    comment_count: 0,
    shared: false,
    favorite: false,
    sync_id: 0,
    inbox_project: true
  },
// Todoist listItem-json-structure example:
  {
    "assignee": 1
    "comment_count": 10,
    "completed": true,
    "content": "My task",
    "due": {
        "date": "2016-09-01",
        "recurring": true,
        "datetime": "2016-09-01T09:00:00Z",
        "string": "tomorrow at 12",
        "timezone": "Europe/Moscow"
    },
    "id": 1234,
    "label_ids": [
        124,
        125,
        128
    ],
    "order": 123,
    "priority": 1,
    "project_id": 2345,
    "section_id": 6789,
    "parent_id": 3456,
    "url": "https://todoist.com/showTask?id=12345&sync_id=56789"
  }
*/

let apiToken;
const setApiToken = token => {
  console.log('Setting token');
  apiToken = token;
  if (isSocketReady()) {
    _fetchProjects(token);
  }
  console.log('stored in Settings', settingsStorage.getItem(KEY_API_TOKEN));
};
const KEY_API_TOKEN = 'api-token';
settingsStorage.onchange = e => {
  console.log('Settings changed', e.key, JSON.parse(e.newValue).name);
  if (e.key === KEY_API_TOKEN) {
    setApiToken(JSON.parse(e.newValue).name);
  }
};
if (companion.launchReasons.settingsChanged) {
  console.log(
    'Settings changed while offline',
    settingsStorage.getItem(KEY_API_TOKEN)
  );
  setApiToken(settingsStorage.getItem(KEY_API_TOKEN));
}

const HORIZONTAL_CENTER = 150;
const headerStyles = {
  fill: 'white',
};
const headerProps = {
  textAnchor: 'middle',
  x: HORIZONTAL_CENTER,
};
const defaultStyles = {
  fill: 'blue',
};
const saveButtonStyles = {
  fill: 'green',
};
const saveButtonProps = {
  textAnchor: 'middle',
  x: HORIZONTAL_CENTER,
};

msg.peerSocket.onmessage = evt => {
  console.log('COMP: Got request to fetch Data', evt.data);
  if (!evt || !evt.data) {
    return;
  }
  if (apiToken === undefined) {
    console.log('No API_TOKEN set');
    return;
  }
  if (evt.data.command === 'loadAllProjects') {
    _fetchProjects(apiToken);
  } else if (evt.data.command === 'loadProjectListById') {
    fetchTasksByProjectId(apiToken, evt.data.id).then(parsedList =>
      sendItemsToApp(parsedList, evt.data.projectName)
    );
  } else if (evt.data.command === 'closeTasks') {
    const closePromises = evt.data.ids.map(id => closeTaskById(apiToken, id));
    Promise.all(closePromises).then(closeResponses =>
      console.log('closedMsgs', closeResponses)
    );
  }
};

const isSocketReady = () => msg.peerSocket.readyState === msg.peerSocket.OPEN;

function _fetchProjects(apiToken) {
  fetchProjects(apiToken).then(parsedProjects =>
    sendProjectsToApp(parsedProjects)
  );
}

function sendProjectsToApp(projects) {
  let viewProjects = projects.map(({ id, name }) => {
    return { id, name, styles: defaultStyles, props: {} };
  });
  viewProjects = [
    {
      id: 'header',
      name: 'Wähle ein Projekt',
      styles: headerStyles,
      props: headerProps,
    },
    ...viewProjects,
  ];

  if (isSocketReady()) {
    msg.peerSocket.send({ listType: 'project-list', projects: viewProjects });
  }
}

function sendItemsToApp(items, project) {
  const styles = {
    fill: 'red',
  };
  let viewItems = items.map(({ id, content }) => {
    return { id, name: content, styles, props: {} };
  });
  viewItems = [
    { id: 'header', name: project, styles: headerStyles, props: headerProps },
    ...viewItems,
    {
      id: 'save-button',
      name: 'speichern',
      styles: saveButtonStyles,
      props: saveButtonProps,
    },
  ];

  if (isSocketReady()) {
    msg.peerSocket.send({ listType: 'item-list', items: viewItems });
  }
}

msg.peerSocket.onerror = e =>
  console.log(`COMP: Connection-Error: ${e.code} - ${e.message}`);
