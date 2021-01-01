import * as msg from 'messaging';
import {
  fetchProjects,
  fetchTasksByProjectId,
  closeTaskById,
} from '../companion/todoist.js';
import { initTokenSettings } from '../companion/auth';

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
// Todoist taskItem-json-structure example:
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

const MAX_BYTE_SIZE = 1024;
const HORIZONTAL_CENTER = 150;
let encoder = new TextEncoder();

const headerStyles = {
  fill: 'white',
};
const headerProps = {
  textAnchor: 'middle',
  x: HORIZONTAL_CENTER,
};
const projectStyles = {
  fill: 'blue',
};
const projectProps = {
  textAnchor: 'middle',
  x: HORIZONTAL_CENTER,
};
const taskStyles = {
  fill: 'red',
};
const taskProps = {
  textAnchor: 'start',
  x: 15,
};
const saveButtonStyles = {
  fill: 'green',
};
const saveButtonProps = {
  textAnchor: 'middle',
  x: HORIZONTAL_CENTER,
};

initTokenSettings();

msg.peerSocket.onmessage = evt => {
  if (!evt || !evt.data) {
    return;
  }
  if (evt.data.command === 'loadAllProjects') {
    _fetchProjects(evt.data.apiToken);
  } else if (evt.data.command === 'loadTasksForProjectId') {
    fetchTasksByProjectId(evt.data.apiToken, evt.data.id).then(parsedList =>
      sendTasksToApp(parsedList, evt.data.projectName)
    );
  } else if (evt.data.command === 'closeTasks') {
    const closePromises = evt.data.ids.map(id =>
      closeTaskById(evt.data.apiToken, id)
    );
    Promise.all(closePromises).catch(e =>
      console.log(`Could not delete all selected tasks: ${e}`)
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
    return { id, name, styles: projectStyles, props: projectProps };
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

function sendTasksToApp(tasks, project) {
  let viewTasks = tasks.map(({ id, content }) => {
    return { id, name: content, styles: taskStyles, props: taskProps };
  });
  viewTasks = [
    { id: 'header', name: project, styles: headerStyles, props: headerProps },
    ...viewTasks,
    {
      id: 'save-button',
      name: 'speichern',
      styles: saveButtonStyles,
      props: saveButtonProps,
    },
  ];

  if (isSocketReady()) {
    let toSend = [];
    while (viewTasks.length > 0) {
      if (canAddNextItem(toSend, viewTasks[0])) {
        toSend.push(viewTasks.shift());
      } else {
        msg.peerSocket.send({
          listType: 'task-list',
          tasks: toSend,
          done: false,
        });
        toSend = [];
      }
    }
    msg.peerSocket.send({
      listType: 'task-list',
      tasks: toSend,
      done: true,
    });
  }
}

function canAddNextItem(currentData, nextItem) {
  const nextByteSize = getByteSize(currentData) + getByteSize(nextItem);
  return nextByteSize < MAX_BYTE_SIZE;
}

function getByteSize(element) {
  if (encoder === undefined) {
    encoder = new TextEncoder();
  }
  let elementAsUint8Array = encoder.encode(JSON.stringify(element));
  return elementAsUint8Array.length;
}

msg.peerSocket.onerror = e =>
  console.log(`COMP: Connection-Error: ${e.code} - ${e.message}`);
