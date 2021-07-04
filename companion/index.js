import * as msg from 'messaging';
import {
  fetchProjects,
  fetchTasksByProjectId,
  closeTaskById,
} from '../companion/todoist.js';
import { initTokenSettings } from '../companion/auth';
import {
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  BG_COLOR,
  TILE_HEIGHT,
  DEVICE_WIDTH,
  MAX_BYTE_SIZE,
} from '../resources/constants.js';

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

const percentOf = (percentage, relativeMax) => (percentage * relativeMax) / 100;
let encoder = new TextEncoder();

const projectHeaderStyles = {
  fill: PRIMARY_COLOR,
  fontFamily: 'Fabrikat-Black',
};
const taskHeaderStyles = {
  fill: SECONDARY_COLOR,
  fontFamily: 'Fabrikat-Black',
};
const headerProps = {
  textAnchor: 'middle',
  x: percentOf(50, DEVICE_WIDTH),
};
const projectStyles = {
  fill: SECONDARY_COLOR,
  fontFamily: 'Seville-Regular',
};
const projectProps = {
  textAnchor: 'middle',
  x: percentOf(50, DEVICE_WIDTH),
};
const taskStyles = {
  fill: PRIMARY_COLOR,
  fontFamily: 'Seville-Condensed',
};
const taskProps = {
  textAnchor: 'start',
  x: percentOf(15, DEVICE_WIDTH),
};
const doneButtonStyles = {
  fill: BG_COLOR,
  fontFamily: 'Tungsten-Medium',
};
const doneButtonProps = {
  textAnchor: 'middle',
  x: percentOf(50, DEVICE_WIDTH),
};
const bgStyles = {
  fill: BG_COLOR,
};
const bgProps = {
  x: 0,
  y: 0,
  width: DEVICE_WIDTH,
  height: TILE_HEIGHT,
};
const buttonBgStyles = {
  fill: SECONDARY_COLOR,
};
const buttonBgProps = {
  x: percentOf(25, DEVICE_WIDTH),
  y: percentOf(15, TILE_HEIGHT),
  width: percentOf(50, DEVICE_WIDTH),
  height: percentOf(85, TILE_HEIGHT),
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
  fetchProjects(apiToken).then(parsedProjects => {
    sendProjectsToApp(parsedProjects);
  });
}

function sendProjectsToApp(projects) {
  let viewProjects = projects.map(({ id, name }) => {
    return {
      id,
      name,
      styles: projectStyles,
      props: projectProps,
      bgStyles: bgStyles,
      bgProps: bgProps,
    };
  });
  viewProjects = [
    {
      id: 'header',
      name: 'Wähle ein Projekt',
      styles: projectHeaderStyles,
      props: headerProps,
      bgStyles: bgStyles,
      bgProps: bgProps,
    },
    ...viewProjects,
  ];

  if (isSocketReady()) {
    sendItemsInChunks(viewProjects, 'project-list');
  }
}

function sendTasksToApp(tasks, project) {
  let viewTasks = tasks.map(({ id, content }) => {
    return {
      id,
      name: content,
      styles: taskStyles,
      props: taskProps,
      bgStyles: bgStyles,
      bgProps: bgProps,
    };
  });
  viewTasks = [
    {
      id: 'header',
      name: project,
      styles: taskHeaderStyles,
      props: headerProps,
      bgStyles: bgStyles,
      bgProps: bgProps,
    },
    ...viewTasks,
    {
      id: 'done-button',
      name: 'fertig',
      styles: doneButtonStyles,
      props: doneButtonProps,
      bgStyles: buttonBgStyles,
      bgProps: buttonBgProps,
    },
  ];

  if (isSocketReady()) {
    sendItemsInChunks(viewTasks, 'task-list');
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

function sendItemsInChunks(viewItems, listType) {
  let toSend = [];
  while (viewItems.length > 0) {
    if (canAddNextItem(toSend, viewItems[0])) {
      toSend.push(viewItems.shift());
    } else {
      msg.peerSocket.send({
        listType,
        items: toSend,
        done: false,
      });
      toSend = [];
    }
  }
  msg.peerSocket.send({
    listType,
    items: toSend,
    done: true,
  });
}
