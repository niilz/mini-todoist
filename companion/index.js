import * as msg from 'messaging';
import {
  fetchProjects,
  fetchTasksByProjectId,
  closeTaskById,
} from '../companion/todoist.js';

// msg.peerSocket.onopen = () => console.log("COMP: Messaging-Connection opened");
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
  if (!evt.data) {
    return;
  }
  if (evt.data.command === 'loadAllProjects') {
    fetchProjects().then(parsedProjects => sendProjectsToApp(parsedProjects));
  } else if (evt.data.command === 'loadProjectListById') {
    fetchTasksByProjectId(evt.data.id).then(parsedList =>
      sendItemsToApp(parsedList, evt.data.projectName)
    );
  } else if (evt.data.command === 'closeTasks') {
    const closePromises = evt.data.ids.map(closeTaskById);
    Promise.all(closePromises).then(closeResponses =>
      console.log('closedMsgs', closeResponses)
    );
  }
};

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

  if (msg.peerSocket.readyState === msg.peerSocket.OPEN) {
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

  if (msg.peerSocket.readyState === msg.peerSocket.OPEN) {
    msg.peerSocket.send({ listType: 'item-list', items: viewItems });
  }
}

msg.peerSocket.onerror = e =>
  console.log(`COMP: Connection-Error: ${e.code} - ${e.message}`);
